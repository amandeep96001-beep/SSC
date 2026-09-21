import { asyncHandler } from '../../shared/utils/async-handler.js';
import { ok, created } from '../../shared/utils/api-response.js';
import * as studyService from './study.service.js';
import * as vocabService from './vocab.service.js';

export const getSubjects = asyncHandler(async (req, res) => {
  const result = await studyService.getSubjects(req);
  return ok(res, result);
});

export const addSubject = asyncHandler(async (req, res) => {
  const result = await studyService.addSubject(req);
  if (result.statusCode === 201) return created(res, { data: result.data });
  return ok(res, { data: result.data });
});

export const deleteSubject = asyncHandler(async (req, res) => {
  const result = await studyService.deleteSubject(req);
  return ok(res, { message: result.message });
});

export const getTopics = asyncHandler(async (req, res) => {
  const result = await studyService.getTopics(req);
  return ok(res, result);
});

export const getTopicNotes = asyncHandler(async (req, res) => {
  const result = await studyService.getTopicNotes(req);
  return ok(res, result);
});

export const getTopicTest = asyncHandler(async (req, res) => {
  const result = await studyService.getTopicTest(req);
  return ok(res, result);
});

export const addTopic = asyncHandler(async (req, res) => {
  const result = await studyService.addTopic(req);
  return created(res, { data: result.data });
});

export const updateTopic = asyncHandler(async (req, res) => {
  const result = await studyService.updateTopic(req);
  return ok(res, { message: result.message, data: result.data });
});

export const deleteTopic = asyncHandler(async (req, res) => {
  const result = await studyService.deleteTopic(req);
  return ok(res, { message: result.message });
});

export const getVocab = asyncHandler(async (req, res) => {
  const result = await vocabService.getVocab(req);
  return ok(res, result);
});

export const addVocab = asyncHandler(async (req, res) => {
  const result = await vocabService.addVocab(req);
  return created(res, { data: result.data });
});

export const updateVocab = asyncHandler(async (req, res) => {
  const result = await vocabService.updateVocab(req);
  return ok(res, { data: result.data });
});

export const addVocabBulk = asyncHandler(async (req, res) => {
  const result = await vocabService.addVocabBulk(req);
  return ok(res, { message: result.message, data: result.data }, result.statusCode);
});
