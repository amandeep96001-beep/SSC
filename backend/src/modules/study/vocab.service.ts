import type { Request } from 'express';
import vocabRepository from './vocab.repository.js';
import VocabDto from './vocab.dto.js';
import type { VocabLean } from './vocab.mcq.js';
import { errorMessage, mongoErrorCode } from '../../types/domain.js';
import { badRequest, conflict, HttpError, notFound } from '../../shared/errors/http-error.js';

function paramStr(value: string | string[] | undefined): string {
  return Array.isArray(value) ? String(value[0] ?? '') : String(value ?? '');
}

function isRecordish(value: unknown): value is object {
  return Boolean(value) && typeof value === 'object';
}

export async function getVocab(req: Request) {
  const { category, search, page = 1, limit = 30 } = req.query;

  const query: { category?: string; $or?: Array<Record<string, RegExp>> } = {};
  if (category && category !== 'All') {
    query.category = String(category);
  }

  const searchRaw = String(search || '').trim().slice(0, 80);
  if (searchRaw) {
    const escaped = searchRaw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchRegex = new RegExp(escaped, 'i');
    query.$or = [
      { word: searchRegex },
      { definition: searchRegex },
      { synonyms: searchRegex },
      { antonyms: searchRegex },
    ];
  }

  const pageN = Math.max(1, parseInt(String(page), 10) || 1);
  const limitN = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 30));
  const skip = (pageN - 1) * limitN;
  const result = await vocabRepository.findAll(query, skip, limitN);

  const data = [];
  for (const row of result.data) {
    const options = (row.options || []).map((o: string) => String(o || '').trim()).filter(Boolean);
    if (row.category !== 'Spelling Rules' && options.length < 3 && row._id) {
      data.push(await vocabRepository.attachDistractors(row as VocabLean));
    } else {
      data.push(row);
    }
  }

  return {
    data,
    meta: {
      total: result.total,
      page: pageN,
      limit: limitN,
      totalPages: Math.ceil(result.total / limitN),
    },
  };
}

export async function addVocab(req: Request) {
  const dto = new VocabDto(req.body);
  dto.createdBy = req.user?.username || 'user';
  const errors = dto.validate();
  if (errors.length > 0) throw badRequest(errors.join(' '));

  try {
    let newVocab = await vocabRepository.create(dto);
    if (newVocab && (!newVocab.options || newVocab.options.length < 3)) {
      newVocab = await vocabRepository.attachDistractors(newVocab.toObject() as VocabLean) as typeof newVocab;
    }
    return { statusCode: 201 as const, data: newVocab };
  } catch (error) {
    if (mongoErrorCode(error) === 11000) {
      throw conflict(`Word "${req.body.word}" already exists in the vocabulary deck.`);
    }
    throw error;
  }
}

export async function updateVocab(req: Request) {
  const vocabId = paramStr(req.params.vocabId);
  const dto = new VocabDto(req.body);
  const errors = dto.validate();
  if (errors.length > 0) throw badRequest(errors.join(' '));

  const updateData: Record<string, unknown> = {
    word: dto.word,
    pos: dto.pos,
    definition: dto.definition,
    synonyms: dto.synonyms,
    antonyms: dto.antonyms,
    category: dto.category,
  };
  if (dto.options.length >= 3) updateData.options = dto.options;

  let updated = await vocabRepository.update(vocabId, updateData);
  if (!updated) throw notFound('Vocab entry not found.');
  if (!updated.options || updated.options.length < 3) {
    updated = await vocabRepository.attachDistractors(updated.toObject() as VocabLean) as typeof updated;
  }

  return { data: updated };
}

export async function addVocabBulk(req: Request) {
  const vocabArray = req.body;
  if (!Array.isArray(vocabArray)) {
    throw badRequest('Expected a JSON array of vocabulary objects.');
  }
  if (vocabArray.length > 200) {
    throw badRequest('Bulk import is limited to 200 words at a time.');
  }

  let processedArray: VocabDto[];
  try {
    processedArray = vocabArray.map((item: unknown) => {
      const dto = new VocabDto(item as ConstructorParameters<typeof VocabDto>[0]);
      const errors = dto.validate();
      if (errors.length > 0) {
        const word = isRecordish(item) && 'word' in item ? String((item as { word?: unknown }).word) : '';
        throw badRequest(`Validation failed for word "${word}": ${errors.join(' ')}`);
      }
      return dto;
    });
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw badRequest(errorMessage(error));
  }

  const incomingWords = processedArray.map((item) => item.word);
  const existingItems = await vocabRepository.findWordsByList(incomingWords);
  const existingWordsSet = new Set(existingItems.map((item) => item.word.toLowerCase()));

  const newVocabsToInsert = processedArray.filter(
    (item) => !existingWordsSet.has(item.word.toLowerCase()),
  );

  const uniqueMap = new Map<string, VocabDto>();
  newVocabsToInsert.forEach((item) => {
    if (!uniqueMap.has(item.word.toLowerCase())) {
      uniqueMap.set(item.word.toLowerCase(), item);
    }
  });
  const finalArrayToInsert = Array.from(uniqueMap.values());

  if (finalArrayToInsert.length === 0) {
    return {
      statusCode: 200 as const,
      message: 'No new words added. All words in the JSON already exist in the database.',
      data: [],
    };
  }

  try {
    const result = await vocabRepository.insertMany(finalArrayToInsert);
    const withOptions = [];
    for (const row of result) {
      const plain = typeof row.toObject === 'function' ? row.toObject() : row;
      withOptions.push(await vocabRepository.attachDistractors(plain as VocabLean));
    }
    return {
      statusCode: 201 as const,
      message: `Successfully inserted ${result.length} new words. (${processedArray.length - result.length} duplicates ignored)`,
      data: withOptions,
    };
  } catch (error) {
    if (mongoErrorCode(error) === 11000) {
      throw new HttpError(207, 'Bulk insert finished, but some duplicate words were skipped.');
    }
    throw badRequest(errorMessage(error));
  }
}
