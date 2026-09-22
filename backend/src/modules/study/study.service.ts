import type { Request } from 'express';
import subjectRepository from './subject.repository.js';
import topicRepository from './topic.repository.js';
import questionRepository from './question.repository.js';
import TopicDto from './topic.dto.js';
import { shuffle } from '../../utils/shuffle.js';
import { filterNewTopicQuestions } from './questionDedupe.js';
import type { TopicQuestionInsert } from './study.interface.js';
import { appendSubjectToExamConfigs } from '../exam-config/exam-config.sync.js';
import { mongoErrorCode } from '../../types/domain.js';
import {
  badRequest,
  conflict,
  forbidden,
  notFound,
  unauthorized,
} from '../../utils/app-errors.js';

function parseSource(req: Request): 'mine' | 'global' {
  const source = String(req.query.source || 'global').toLowerCase();
  return source === 'mine' ? 'mine' : 'global';
}

function ownerScope(req: Request): string | null {
  if (parseSource(req) !== 'mine') return null;
  if (!req.user?.id) throw unauthorized('Sign in to view your notes.');
  return req.user.id;
}

function isUserOwned(doc: { ownerId?: string | null } | null | undefined, userId: string) {
  return Boolean(doc?.ownerId && doc.ownerId === userId);
}

function isAdmin(req: Request) {
  return req.user?.role === 'admin';
}

function canManageTopic(topic: { ownerId?: string | null } | null | undefined, req: Request) {
  if (isUserOwned(topic, req.user!.id)) return true;
  if (isAdmin(req) && !topic?.ownerId) return true;
  return false;
}

function slugifyId(parts: unknown): string {
  return String(parts)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function paramStr(value: string | string[] | undefined): string {
  return Array.isArray(value) ? String(value[0] ?? '') : String(value ?? '');
}

function placeholderQuestion(topicId: string, topicName: string, official: boolean): TopicQuestionInsert {
  return {
    topicId,
    q: `Syllabus Check: Have you reviewed all the study notes for '${topicName}'?`,
    o: ['Yes, completely', 'No, need review', 'Will study again', 'Passed'],
    a: 0,
    e: official
      ? 'Seeded question to verify study progress for this official topic.'
      : 'This is a custom-seeded question to verify study progress for custom notes.',
  };
}

function buildSeedQuestions(dto: TopicDto, topicId: string, topicName: string, official: boolean) {
  if (Array.isArray(dto.questions) && dto.questions.length > 0) {
    const { toInsert } = filterNewTopicQuestions(dto.questions, topicId);
    if (toInsert.length > 0) return toInsert;
  }
  return [placeholderQuestion(topicId, topicName, official)];
}

export class StudyService {
  async getSubjects(req: Request) {
  const source = parseSource(req);
  if (source === 'mine' && !req.user?.id) {
    throw unauthorized('Sign in to view your notes.');
  }
  const subjects = source === 'mine'
    ? await subjectRepository.findByOwner(req.user!.id, 'name ownerId')
    : await subjectRepository.findGlobal('name ownerId');

  return {
    data: subjects.map((s) => ({
      name: s.name,
      isOwned: Boolean(s.ownerId),
      ownerId: s.ownerId || null,
    })),
    meta: { source },
  };
}

  async addSubject(req: Request) {
  const name = String(req.body?.name || '').trim();
  if (!name) throw badRequest('Subject name is required.');

  const wantGlobal = String(req.body?.scope || '').toLowerCase() === 'global';
  if (wantGlobal) {
    if (req.user?.role !== 'admin') {
      throw forbidden('Admin access required to create official subjects.');
    }

    const existing = await subjectRepository.findByName(name, true, null);
    if (existing) {
      return {
        statusCode: 200 as const,
        data: { name: existing.name, isOwned: false, ownerId: null, alreadyExisted: true },
      };
    }

    try {
      const created = await subjectRepository.create({ name, ownerId: null });
      await appendSubjectToExamConfigs(created.name);
      return {
        statusCode: 201 as const,
        data: { name: created.name, isOwned: false, ownerId: null },
      };
    } catch (error) {
      if (mongoErrorCode(error) === 11000) {
        throw conflict('An official subject with this name already exists.');
      }
      throw error;
    }
  }

  const existing = await subjectRepository.findByName(name, true, req.user!.id);
  if (existing) {
    throw badRequest('You already have a subject with this name.');
  }

  try {
    const created = await subjectRepository.create({
      name,
      ownerId: req.user!.id,
    });
    return {
      statusCode: 201 as const,
      data: { name: created.name, isOwned: true, ownerId: created.ownerId },
    };
  } catch (error) {
    if (mongoErrorCode(error) === 11000) {
      throw badRequest('You already have a subject with this name.');
    }
    throw error;
  }
}

  async deleteSubject(req: Request) {
  const subjectName = paramStr(req.params.subjectName);
  const scope = String(req.query.scope || req.body?.scope || req.query.source || '').toLowerCase();

  if (scope === 'global') {
    if (!isAdmin(req)) {
      throw forbidden('Admin access required to delete official subjects.');
    }
    const deleted = await subjectRepository.deleteGlobalByName(subjectName);
    if (!deleted) throw notFound('Official subject not found.');
    const topicDocs = await topicRepository.findIdsBySubjectAndOwner(subjectName, null);
    const topicIds = topicDocs.map((t) => t.id);
    await questionRepository.deleteByTopicIds(topicIds);
    await topicRepository.deleteBySubjectAndOwner(subjectName, null);
    return { message: 'Official subject and related topics deleted.' };
  }

  const deleted = await subjectRepository.deleteByNameAndOwner(subjectName, req.user!.id);
  if (!deleted) throw notFound('Subject not found or not owned by you.');

  const topicDocs = await topicRepository.findIdsBySubjectAndOwner(subjectName, req.user!.id);
  const topicIds = topicDocs.map((t) => t.id);
  await questionRepository.deleteByTopicIds(topicIds);
  await topicRepository.deleteBySubjectAndOwner(subjectName, req.user!.id);

  return { message: 'Subject and related topics deleted.' };
}

  async getTopics(req: Request) {
  const subjectName = paramStr(req.params.subjectName);
  const ownerId = ownerScope(req);
  const subject = await subjectRepository.resolveByName(subjectName, ownerId);
  if (!subject) {
    return { data: [], meta: { source: parseSource(req) } };
  }

  const topics = await topicRepository.findBySubjectName(subject.name, ownerId);
  return {
    data: topics.map((t) => ({
      id: t.id,
      name: t.name,
      syllabus: t.syllabus,
      isOwned: isUserOwned(t, req.user!.id),
    })),
    meta: { source: parseSource(req) },
  };
}

  async getTopicNotes(req: Request) {
  const topicId = paramStr(req.params.topicId);
  const topic = await topicRepository.findById(topicId);
  if (!topic) throw notFound('Topic not found.');

  if (topic.ownerId && topic.ownerId !== req.user!.id) {
    throw forbidden('You do not have access to this topic.');
  }

  const questions = await questionRepository.findByTopicId(topicId);
  return {
    data: {
      id: topic.id,
      name: topic.name,
      notes: topic.notes,
      questions,
      isOwned: isUserOwned(topic, req.user!.id),
      ownerId: topic.ownerId || null,
    },
  };
}

  async getTopicTest(req: Request) {
  const topicId = paramStr(req.params.topicId);
  const topic = await topicRepository.findById(topicId);
  if (!topic) throw notFound('Topic not found.');

  if (topic.ownerId && topic.ownerId !== req.user!.id) {
    throw forbidden('You do not have access to this topic.');
  }

  const questions = await questionRepository.findByTopicId(topicId);
  let pool = questions.map((q) => ({
    q: q.q,
    o: q.o,
    a: q.a,
    e: q.e,
    state: q.state,
  }));

  const rawCount = parseInt(String(req.query.count ?? ''), 10);
  const requestedCount = !Number.isNaN(rawCount) && rawCount > 0
    ? Math.min(rawCount, 500)
    : 25;

  pool = shuffle(pool);

  let testQuestions: typeof pool;
  if (pool.length === 0) {
    testQuestions = [];
  } else if (requestedCount <= pool.length) {
    testQuestions = pool.slice(0, requestedCount);
  } else {
    testQuestions = [];
    let remaining = requestedCount;
    while (remaining > 0) {
      const pass = shuffle([...pool]);
      testQuestions = testQuestions.concat(pass.slice(0, remaining));
      remaining -= pass.length;
    }
  }

  return { data: testQuestions };
}

  async addTopic(req: Request) {
  const subjectName = paramStr(req.params.subjectName);
  const userId = req.user!.id;
  const wantGlobal = String(req.body?.scope || '').toLowerCase() === 'global';

  const dto = new TopicDto(req.body);
  const errors = dto.validate();
  if (errors.length > 0) throw badRequest(errors.join(' '));

  const topicName = String(dto.name);
  const topicNotes = String(dto.notes);
  const topicSyllabus = dto.syllabus != null ? String(dto.syllabus) : '';

  if (wantGlobal) {
    if (!isAdmin(req)) {
      throw forbidden('Admin access required to create official topics.');
    }

    const subject = await subjectRepository.resolveByName(subjectName, null);
    if (!subject) {
      throw notFound('Official subject not found. Create the official subject first.');
    }

    const resolvedName = subject.name;
    const existingTopics = await topicRepository.findBySubjectName(resolvedName, null);
    const rawId = slugifyId(`${resolvedName}-${topicName}`);
    const finalId = existingTopics.some((t) => t.id === rawId)
      ? `${rawId}-${Date.now()}`
      : rawId;

    const newTopic = {
      id: finalId,
      subjectName: resolvedName,
      name: topicName,
      syllabus: topicSyllabus || 'Official syllabus topic.',
      notes: topicNotes,
      ownerId: null,
    };

    await topicRepository.create(newTopic);
    await questionRepository.insertMany(buildSeedQuestions(dto, finalId, topicName, true));

    return {
      statusCode: 201 as const,
      data: {
        id: finalId,
        name: topicName,
        syllabus: newTopic.syllabus,
        isOwned: false,
      },
    };
  }

  const subject = await subjectRepository.resolveByName(subjectName, userId);
  if (!subject) {
    throw notFound('Subject not found in your notes. Switch to My Notes and create a subject first.');
  }

  const resolvedName = subject.name;
  const existingTopics = await topicRepository.findBySubjectName(resolvedName, userId);
  const rawId = `u-${userId.slice(-6)}-${resolvedName}-${topicName}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const finalId = existingTopics.some((t) => t.id === rawId)
    ? `${rawId}-${Date.now()}`
    : rawId;

  const newTopic = {
    id: finalId,
    subjectName: resolvedName,
    name: topicName,
    syllabus: topicSyllabus || 'Custom added user revision topic.',
    notes: topicNotes,
    ownerId: userId,
  };

  await topicRepository.create(newTopic);
  await questionRepository.insertMany(buildSeedQuestions(dto, finalId, topicName, false));

  return {
    statusCode: 201 as const,
    data: {
      id: finalId,
      name: topicName,
      syllabus: newTopic.syllabus,
      isOwned: true,
    },
  };
}

  async updateTopic(req: Request) {
  const topicId = paramStr(req.params.topicId);
  const dto = new TopicDto(req.body);
  const errors = dto.validate();
  if (errors.length > 0) throw badRequest(errors.join(' '));

  const topic = await topicRepository.findById(topicId);
  if (!topic) throw notFound('Topic not found.');

  if (!canManageTopic(topic, req)) {
    throw forbidden('Official syllabus topics are read-only. Switch to My Notes to edit your own content.');
  }

  const topicName = String(dto.name);
  const topicNotes = String(dto.notes);
  const updateData = {
    name: topicName,
    syllabus: dto.syllabus ? String(dto.syllabus) : topic.syllabus,
    notes: topicNotes,
  };

  await topicRepository.update(topicId, updateData);

  let questionsReport: {
    received: number;
    inserted: number;
    duplicates: number;
    invalid: number;
  } | null = null;

  if (Array.isArray(dto.questions) && dto.questions.length > 0) {
    const existing = await questionRepository.findByTopicId(topicId);
    const { toInsert, duplicates, invalid, received } = filterNewTopicQuestions(
      dto.questions,
      topicId,
      existing.map((q) => q.q),
    );
    if (toInsert.length > 0) {
      await questionRepository.insertMany(toInsert);
    }
    questionsReport = {
      received,
      inserted: toInsert.length,
      duplicates,
      invalid,
    };
  }

  return {
    message: questionsReport
      ? `Topic updated. ${questionsReport.inserted} MCQ(s) added, ${questionsReport.duplicates} duplicate(s) skipped${questionsReport.invalid ? `, ${questionsReport.invalid} invalid` : ''}.`
      : 'Topic updated successfully.',
    data: {
      id: topicId,
      name: topicName,
      syllabus: updateData.syllabus,
      isOwned: isUserOwned(topic, req.user!.id),
      questionsReport,
    },
  };
}

  async deleteTopic(req: Request) {
  const topicId = paramStr(req.params.topicId);
  const topic = await topicRepository.findById(topicId);
  if (!topic) throw notFound('Topic not found.');

  if (!canManageTopic(topic, req)) {
    throw forbidden('Official syllabus topics cannot be deleted.');
  }

  await topicRepository.deleteById(topicId);
  await questionRepository.deleteByTopicId(topicId);
  return { message: 'Topic deleted successfully.' };
}
}

export const studyService = new StudyService();
