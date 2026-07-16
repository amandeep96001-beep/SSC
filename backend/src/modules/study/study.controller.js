import subjectRepository from './subject.repository.js';
import topicRepository from './topic.repository.js';
import questionRepository from './question.repository.js';
import vocabRepository from './vocab.repository.js';
import { Vocab } from './vocab.model.js';
import TopicDto from './topic.dto.js';
import VocabDto from './vocab.dto.js';
import { shuffle } from '../../shared/utils/shuffle.js';

function parseSource(req) {
  const source = String(req.query.source || 'global').toLowerCase();
  return source === 'mine' ? 'mine' : 'global';
}

function ownerScope(req) {
  const source = parseSource(req);
  return source === 'mine' ? req.user.id : null;
}

function isUserOwned(doc, userId) {
  return Boolean(doc?.ownerId && doc.ownerId === userId);
}

export const getSubjects = async (req, res, next) => {
  try {
    const source = parseSource(req);
    const subjects = source === 'mine'
      ? await subjectRepository.findByOwner(req.user.id, 'name ownerId')
      : await subjectRepository.findGlobal('name ownerId');

    res.json({
      status: 'success',
      data: subjects.map(s => ({
        name: s.name,
        isOwned: Boolean(s.ownerId),
        ownerId: s.ownerId || null
      })),
      meta: { source }
    });
  } catch (error) {
    next(error);
  }
};

export const addSubject = async (req, res, next) => {
  try {
    const name = String(req.body?.name || '').trim();
    if (!name) {
      return res.status(400).json({ status: 'error', message: 'Subject name is required.' });
    }

    const wantGlobal = String(req.body?.scope || '').toLowerCase() === 'global';
    if (wantGlobal) {
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ status: 'error', message: 'Admin access required to create official subjects.' });
      }

      const existing = await subjectRepository.findByName(name, true, null);
      if (existing) {
        return res.json({
          status: 'success',
          data: { name: existing.name, isOwned: false, ownerId: null, alreadyExisted: true }
        });
      }

      const created = await subjectRepository.create({ name, ownerId: null });
      return res.status(201).json({
        status: 'success',
        data: { name: created.name, isOwned: false, ownerId: null }
      });
    }

    const existing = await subjectRepository.findByName(name, true, req.user.id);
    if (existing) {
      return res.status(400).json({ status: 'error', message: 'You already have a subject with this name.' });
    }

    const created = await subjectRepository.create({
      name,
      ownerId: req.user.id
    });

    res.status(201).json({
      status: 'success',
      data: { name: created.name, isOwned: true, ownerId: created.ownerId }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ status: 'error', message: 'You already have a subject with this name.' });
    }
    next(error);
  }
};

export const deleteSubject = async (req, res, next) => {
  try {
    const { subjectName } = req.params;
    const deleted = await subjectRepository.deleteByNameAndOwner(subjectName, req.user.id);
    if (!deleted) {
      return res.status(404).json({ status: 'error', message: 'Subject not found or not owned by you.' });
    }

    const topicDocs = await topicRepository.findIdsBySubjectAndOwner(subjectName, req.user.id);
    const topicIds = topicDocs.map(t => t.id);
    await questionRepository.deleteByTopicIds(topicIds);
    await topicRepository.deleteBySubjectAndOwner(subjectName, req.user.id);

    res.json({ status: 'success', message: 'Subject and related topics deleted.' });
  } catch (error) {
    next(error);
  }
};

export const getTopics = async (req, res, next) => {
  try {
    const { subjectName } = req.params;
    const ownerId = ownerScope(req);
    const subject = await subjectRepository.findByName(subjectName, true, ownerId);
    if (!subject) {
      return res.json({ status: 'success', data: [], meta: { source: parseSource(req) } });
    }

    const topics = await topicRepository.findBySubjectName(subjectName, ownerId);

    const mappedTopics = topics.map(t => ({
      id: t.id,
      name: t.name,
      syllabus: t.syllabus,
      isOwned: isUserOwned(t, req.user.id)
    }));

    res.json({ status: 'success', data: mappedTopics, meta: { source: parseSource(req) } });
  } catch (error) {
    next(error);
  }
};

export const getTopicNotes = async (req, res, next) => {
  try {
    const { topicId } = req.params;
    const topic = await topicRepository.findById(topicId);
    if (!topic) {
      return res.status(404).json({ status: 'error', message: 'Topic not found.' });
    }

    // Personal topics are private to the owner
    if (topic.ownerId && topic.ownerId !== req.user.id) {
      return res.status(403).json({ status: 'error', message: 'You do not have access to this topic.' });
    }

    const questions = await questionRepository.findByTopicId(topicId);

    res.json({
      status: 'success',
      data: {
        id: topic.id,
        name: topic.name,
        notes: topic.notes,
        questions,
        isOwned: isUserOwned(topic, req.user.id),
        ownerId: topic.ownerId || null
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getTopicTest = async (req, res, next) => {
  try {
    const { topicId } = req.params;
    const topic = await topicRepository.findById(topicId);
    if (!topic) {
      return res.status(404).json({ status: 'error', message: 'Topic not found.' });
    }

    if (topic.ownerId && topic.ownerId !== req.user.id) {
      return res.status(403).json({ status: 'error', message: 'You do not have access to this topic.' });
    }

    const questions = await questionRepository.findByTopicId(topicId);

    let testQuestions = questions.map(q => ({
      q: q.q,
      o: q.o,
      a: q.a,
      e: q.e,
      state: q.state
    }));

    testQuestions = shuffle(testQuestions);
    if (testQuestions.length > 25) {
      testQuestions = testQuestions.slice(0, 25);
    }

    res.json({ status: 'success', data: testQuestions });
  } catch (error) {
    next(error);
  }
};

export const addTopic = async (req, res, next) => {
  try {
    const { subjectName } = req.params;
    const userId = req.user.id;

    const dto = new TopicDto(req.body);
    const errors = dto.validate();
    if (errors.length > 0) {
      return res.status(400).json({ status: 'error', message: errors.join(' ') });
    }

    // Custom topics only under the user's own subjects
    const subject = await subjectRepository.findByName(subjectName, true, userId);
    if (!subject) {
      return res.status(404).json({
        status: 'error',
        message: 'Subject not found in your notes. Switch to My Notes and create a subject first.'
      });
    }

    const existingTopics = await topicRepository.findBySubjectName(subjectName, userId);
    const rawId = `u-${userId.slice(-6)}-${subjectName}-${dto.name}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const finalId = existingTopics.some(t => t.id === rawId)
      ? `${rawId}-${Date.now()}`
      : rawId;

    const newTopic = {
      id: finalId,
      subjectName,
      name: dto.name,
      syllabus: dto.syllabus || 'Custom added user revision topic.',
      notes: dto.notes,
      ownerId: userId
    };

    await topicRepository.create(newTopic);

    const seedQuestions = Array.isArray(dto.questions) && dto.questions.length > 0
      ? dto.questions.map(q => ({ ...q, topicId: finalId }))
      : [{
          topicId: finalId,
          q: `Syllabus Check: Have you reviewed all the study notes for '${dto.name}'?`,
          o: ['Yes, completely', 'No, need review', 'Will study again', 'Passed'],
          a: 0,
          e: 'This is a custom-seeded question to verify study progress for custom notes.'
        }];

    await questionRepository.insertMany(seedQuestions);

    res.status(201).json({
      status: 'success',
      data: {
        id: finalId,
        name: dto.name,
        syllabus: newTopic.syllabus,
        isOwned: true
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateTopic = async (req, res, next) => {
  try {
    const { topicId } = req.params;

    const dto = new TopicDto(req.body);
    const errors = dto.validate();
    if (errors.length > 0) {
      return res.status(400).json({ status: 'error', message: errors.join(' ') });
    }

    const topic = await topicRepository.findById(topicId);
    if (!topic) {
      return res.status(404).json({ status: 'error', message: 'Topic not found.' });
    }

    if (!isUserOwned(topic, req.user.id)) {
      return res.status(403).json({
        status: 'error',
        message: 'Official syllabus topics are read-only. Switch to My Notes to edit your own content.'
      });
    }

    const updateData = {
      name: dto.name,
      syllabus: dto.syllabus || topic.syllabus,
      notes: dto.notes
    };

    await topicRepository.update(topicId, updateData);

    if (dto.questions.length > 0) {
      const qsToInsert = dto.questions.map(q => ({ ...q, topicId }));
      await questionRepository.insertMany(qsToInsert);
    }

    res.json({
      status: 'success',
      data: { id: topicId, name: dto.name, syllabus: updateData.syllabus, isOwned: true }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTopic = async (req, res, next) => {
  try {
    const { topicId } = req.params;
    const topic = await topicRepository.findById(topicId);

    if (!topic) {
      return res.status(404).json({ status: 'error', message: 'Topic not found.' });
    }

    if (!isUserOwned(topic, req.user.id)) {
      return res.status(403).json({
        status: 'error',
        message: 'Official syllabus topics cannot be deleted.'
      });
    }

    await topicRepository.deleteById(topicId);
    await questionRepository.deleteByTopicId(topicId);

    res.json({ status: 'success', message: 'Topic deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

export const getVocab = async (req, res, next) => {
  try {
    const { category, search, page = 1, limit = 30 } = req.query;

    const query = {};
    if (category && category !== 'All') {
      query.category = category;
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { word: searchRegex },
        { definition: searchRegex },
        { synonyms: searchRegex },
        { antonyms: searchRegex }
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const result = await vocabRepository.findAll(query, skip, parseInt(limit, 10));

    res.json({
      status: 'success',
      data: result.data,
      meta: {
        total: result.total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(result.total / parseInt(limit, 10))
      }
    });
  } catch (error) {
    next(error);
  }
};

export const addVocab = async (req, res, next) => {
  try {
    const dto = new VocabDto(req.body);
    const errors = dto.validate();
    if (errors.length > 0) {
      return res.status(400).json({ status: 'error', message: errors.join(' ') });
    }

    const newVocab = await vocabRepository.create(dto);
    res.status(201).json({ status: 'success', data: newVocab });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        status: 'error',
        message: `Word "${req.body.word}" already exists in the vocabulary deck.`
      });
    }
    next(error);
  }
};

export const updateVocab = async (req, res, next) => {
  try {
    const { vocabId } = req.params;
    const dto = new VocabDto(req.body);
    const errors = dto.validate();
    if (errors.length > 0) {
      return res.status(400).json({ status: 'error', message: errors.join(' ') });
    }

    const updated = await vocabRepository.update(vocabId, dto);
    if (!updated) {
      return res.status(404).json({ status: 'error', message: 'Vocab entry not found.' });
    }

    res.json({ status: 'success', data: updated });
  } catch (error) {
    next(error);
  }
};

export const addVocabBulk = async (req, res, next) => {
  try {
    const vocabArray = req.body;
    if (!Array.isArray(vocabArray)) {
      return res.status(400).json({ status: 'error', message: 'Expected a JSON array of vocabulary objects.' });
    }

    const processedArray = vocabArray.map(item => {
      const dto = new VocabDto(item);
      const errors = dto.validate();
      if (errors.length > 0) {
        throw new Error(`Validation failed for word "${item.word}": ` + errors.join(' '));
      }
      return dto;
    });

    const incomingWords = processedArray.map(item => item.word);
    const existingItems = await Vocab.find({ word: { $in: incomingWords } }).select('word').lean();
    const existingWordsSet = new Set(existingItems.map(item => item.word.toLowerCase()));

    let newVocabsToInsert = processedArray.filter(item => !existingWordsSet.has(item.word.toLowerCase()));

    const uniqueMap = new Map();
    newVocabsToInsert.forEach(item => {
      if (!uniqueMap.has(item.word.toLowerCase())) {
        uniqueMap.set(item.word.toLowerCase(), item);
      }
    });
    const finalArrayToInsert = Array.from(uniqueMap.values());

    if (finalArrayToInsert.length === 0) {
      return res.status(200).json({
        status: 'success',
        message: 'No new words added. All words in the JSON already exist in the database.',
        data: []
      });
    }

    const result = await vocabRepository.insertMany(finalArrayToInsert);
    res.status(201).json({
      status: 'success',
      message: `Successfully inserted ${result.length} new words. (${processedArray.length - result.length} duplicates ignored)`,
      data: result
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(207).json({ status: 'partial_success', message: 'Bulk insert finished, but some duplicate words were skipped.' });
    }
    return res.status(400).json({ status: 'error', message: error.message });
  }
};
