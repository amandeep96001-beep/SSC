import { asyncHandler } from '../../utils/async-handler.js';
import { ok, created } from '../../utils/api-response.js';
import { StudyService } from './study.service.js';
import { VocabService } from './vocab.service.js';

export class StudyController {
  constructor(
    private readonly studyService = new StudyService(),
    private readonly vocabService = new VocabService(),
  ) {}

  getSubjects = asyncHandler(async (req, res) => {
    const result = await this.studyService.getSubjects(req);
    return ok(res, result);
  });

  addSubject = asyncHandler(async (req, res) => {
    const result = await this.studyService.addSubject(req);
    if (result.statusCode === 201) return created(res, { data: result.data });
    return ok(res, { data: result.data });
  });

  deleteSubject = asyncHandler(async (req, res) => {
    const result = await this.studyService.deleteSubject(req);
    return ok(res, { message: result.message });
  });

  getTopics = asyncHandler(async (req, res) => {
    const result = await this.studyService.getTopics(req);
    return ok(res, result);
  });

  getTopicNotes = asyncHandler(async (req, res) => {
    const result = await this.studyService.getTopicNotes(req);
    return ok(res, result);
  });

  getTopicTest = asyncHandler(async (req, res) => {
    const result = await this.studyService.getTopicTest(req);
    return ok(res, result);
  });

  addTopic = asyncHandler(async (req, res) => {
    const result = await this.studyService.addTopic(req);
    return created(res, { data: result.data });
  });

  updateTopic = asyncHandler(async (req, res) => {
    const result = await this.studyService.updateTopic(req);
    return ok(res, { message: result.message, data: result.data });
  });

  deleteTopic = asyncHandler(async (req, res) => {
    const result = await this.studyService.deleteTopic(req);
    return ok(res, { message: result.message });
  });

  getVocab = asyncHandler(async (req, res) => {
    const result = await this.vocabService.getVocab(req);
    return ok(res, result);
  });

  addVocab = asyncHandler(async (req, res) => {
    const result = await this.vocabService.addVocab(req);
    return created(res, { data: result.data });
  });

  updateVocab = asyncHandler(async (req, res) => {
    const result = await this.vocabService.updateVocab(req);
    return ok(res, { data: result.data });
  });

  addVocabBulk = asyncHandler(async (req, res) => {
    const result = await this.vocabService.addVocabBulk(req);
    return ok(res, { message: result.message, data: result.data }, result.statusCode);
  });
}

export const studyController = new StudyController();
