import subjectRepository from '../repositories/subjectRepository.js';
import topicRepository from '../repositories/topicRepository.js';
import questionRepository from '../repositories/questionRepository.js';
import vocabRepository from '../repositories/vocabRepository.js';
import TopicDto from '../dtos/topicDto.js';
import VocabDto from '../dtos/vocabDto.js';

/**
 * Helper to shuffle an array
 */
function shuffle(arr) {
  const newArr = [...arr];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

export const getSubjects = async (req, res, next) => {
  try {
    const subjects = await subjectRepository.findAll('name');
    res.json({
      status: 'success',
      data: subjects.map(s => s.name)
    });
  } catch (error) {
    next(error);
  }
};

export const getTopics = async (req, res, next) => {
  try {
    const { subjectName } = req.params;
    const subject = await subjectRepository.findByName(subjectName, true);
    if (!subject) {
      return res.json({ status: 'success', data: [] });
    }

    const topics = await topicRepository.findBySubjectName(subjectName);
    
    const mappedTopics = topics.map(t => ({
      id: t.id,
      name: t.name,
      syllabus: t.syllabus
    }));

    res.json({ status: 'success', data: mappedTopics });
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

    const questions = await questionRepository.findByTopicId(topicId);
    
    res.json({
      status: 'success',
      data: {
        id: topic.id,
        name: topic.name,
        notes: topic.notes,
        questions: questions
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
    
    const dto = new TopicDto(req.body);
    const errors = dto.validate();
    if (errors.length > 0) {
      return res.status(400).json({ status: 'error', message: errors.join(' ') });
    }

    const subject = await subjectRepository.findByName(subjectName);
    if (!subject) {
      return res.status(404).json({ status: 'error', message: 'Subject not found.' });
    }

    const existingTopics = await topicRepository.findBySubjectName(subjectName);
    const rawId = `${subjectName}-${dto.name}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const finalId = existingTopics.some(t => t.id === rawId) 
      ? `${rawId}-${Date.now()}`
      : rawId;

    const newTopic = {
      id: finalId,
      subjectName,
      name: dto.name,
      syllabus: dto.syllabus || 'Custom added user revision topic.',
      notes: dto.notes
    };

    await topicRepository.create(newTopic);

    await questionRepository.create({
      topicId: finalId,
      q: `Syllabus Check: Have you reviewed all the study notes for '${dto.name}'?`,
      o: ["Yes, completely", "No, need review", "Will study again", "Passed"],
      a: 0,
      e: "This is a custom-seeded question to verify study progress for custom notes."
    });

    res.status(201).json({
      status: 'success',
      data: { id: finalId, name: dto.name, syllabus: newTopic.syllabus }
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
      data: { id: topicId, name: dto.name, syllabus: updateData.syllabus }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTopic = async (req, res, next) => {
  try {
    const { topicId } = req.params;
    const deletedTopic = await topicRepository.deleteById(topicId);
    
    if (!deletedTopic) {
      return res.status(404).json({ status: 'error', message: 'Topic not found.' });
    }

    await questionRepository.deleteByTopicId(topicId);

    res.json({ status: 'success', message: 'Topic deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

export const getVocab = async (req, res, next) => {
  try {
    const { category } = req.query;
    const query = category ? { category } : {};
    const vocabList = await vocabRepository.findAll(query);
    res.json({ status: 'success', data: vocabList });
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
