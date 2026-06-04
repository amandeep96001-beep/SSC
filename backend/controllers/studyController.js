import Subject from '../models/subjectModel.js';
import { Vocab } from '../models/vocabModel.js';
import Question from '../models/questionModel.js';

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

/**
 * @desc    Get all study subjects (Optimized with lean())
 * @route   GET /api/study/subjects
 */
export const getSubjects = async (req, res, next) => {
  try {
    const subjects = await Subject.find({}, 'name').lean();
    res.json({
      status: 'success',
      data: subjects.map(s => s.name)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get topics by subject name (Optimized with lean())
 * @route   GET /api/study/subjects/:subjectName/topics
 */
export const getTopics = async (req, res, next) => {
  try {
    const { subjectName } = req.params;
    const subject = await Subject.findOne({ name: subjectName }).lean();
    if (!subject) {
      return res.json({
        status: 'success',
        data: []
      });
    }

    const topics = subject.topics.map(t => ({
      id: t.id,
      name: t.name,
      syllabus: t.syllabus
    }));

    res.json({
      status: 'success',
      data: topics
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get detailed notes for a topic (Optimized with lean())
 * @route   GET /api/study/topics/:topicId/notes
 */
export const getTopicNotes = async (req, res, next) => {
  try {
    const { topicId } = req.params;
    const subject = await Subject.findOne({ 'topics.id': topicId }).lean();
    if (!subject) {
      return res.status(404).json({
        status: 'error',
        message: 'Topic not found.'
      });
    }

    const topic = subject.topics.find(t => t.id === topicId);
    const questions = await Question.find({ topicId }).lean();
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

/**
 * @desc    Get 25-question test for a topic (Optimized with lean())
 * @route   GET /api/study/topics/:topicId/test
 */
export const getTopicTest = async (req, res, next) => {
  try {
    const { topicId } = req.params;
    const subject = await Subject.findOne({ 'topics.id': topicId }).lean();
    if (!subject) {
      return res.status(404).json({
        status: 'error',
        message: 'Topic not found.'
      });
    }

    const topic = subject.topics.find(t => t.id === topicId);
    const questions = await Question.find({ topicId }).lean();
    
    // Map questions to simple JS objects and shuffle
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

    res.json({
      status: 'success',
      data: testQuestions
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add a custom user topic and notes to a subject
 * @route   POST /api/study/subjects/:subjectName/topics
 */
export const addTopic = async (req, res, next) => {
  try {
    const { subjectName } = req.params;
    const { name, syllabus, notes } = req.body;

    if (!name || !notes) {
      return res.status(400).json({
        status: 'error',
        message: 'Topic name and notes are required fields.'
      });
    }

    const subject = await Subject.findOne({ name: subjectName });
    if (!subject) {
      return res.status(404).json({
        status: 'error',
        message: 'Subject not found.'
      });
    }

    // Generate topic ID from lowercase string
    const rawId = `${subjectName}-${name}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const finalId = subject.topics.some(t => t.id === rawId) 
      ? `${rawId}-${Date.now()}`
      : rawId;

    const newTopic = {
      id: finalId,
      name,
      syllabus: syllabus || 'Custom added user revision topic.',
      notes
    };

    subject.topics.push(newTopic);
    await subject.save();

    const initialQuestion = new Question({
      topicId: finalId,
      q: `Syllabus Check: Have you reviewed all the study notes for '${name}'?`,
      o: ["Yes, completely", "No, need review", "Will study again", "Passed"],
      a: 0,
      e: "This is a custom-seeded question to verify study progress for custom notes."
    });
    await initialQuestion.save();

    res.status(201).json({
      status: 'success',
      data: {
        id: finalId,
        name,
        syllabus: newTopic.syllabus
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a custom user topic and notes
 * @route   PUT /api/study/topics/:topicId
 */
export const updateTopic = async (req, res, next) => {
  try {
    const { topicId } = req.params;
    const { name, syllabus, notes, questions } = req.body;

    if (!name || !notes) {
      return res.status(400).json({
        status: 'error',
        message: 'Topic name and notes are required fields.'
      });
    }

    const subject = await Subject.findOne({ 'topics.id': topicId });
    if (!subject) {
      return res.status(404).json({
        status: 'error',
        message: 'Topic not found.'
      });
    }

    const topic = subject.topics.find(t => t.id === topicId);
    topic.name = name;
    topic.syllabus = syllabus || topic.syllabus;
    topic.notes = notes;

    if (questions && Array.isArray(questions) && questions.length > 0) {
      const qsToInsert = questions.map(q => ({ ...q, topicId }));
      await Question.insertMany(qsToInsert);
    }

    subject.markModified('topics');
    await subject.save();

    res.json({
      status: 'success',
      data: {
        id: topicId,
        name,
        syllabus: topic.syllabus
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a topic from a subject
 * @route   DELETE /api/study/topics/:topicId
 */
export const deleteTopic = async (req, res, next) => {
  try {
    const { topicId } = req.params;
    const subject = await Subject.findOne({ 'topics.id': topicId });
    if (!subject) {
      return res.status(404).json({
        status: 'error',
        message: 'Topic not found.'
      });
    }

    subject.topics = subject.topics.filter(t => t.id !== topicId);
    await subject.save();

    await Question.deleteMany({ topicId });

    res.json({
      status: 'success',
      message: 'Topic deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all vocabulary items, sorted alphabetically
 * @route   GET /api/study/vocab
 */
export const getVocab = async (req, res, next) => {
  try {
    const { category } = req.query;
    const query = {};
    if (category) {
      query.category = category;
    }
    const vocabList = await Vocab.find(query).sort({ word: 1 }).lean();
    res.json({
      status: 'success',
      data: vocabList
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add a new vocabulary item
 * @route   POST /api/study/vocab
 */
export const addVocab = async (req, res, next) => {
  try {
    const { word, pos, definition, synonyms, antonyms, category, createdBy } = req.body;
    if (!word || !definition || !category) {
      return res.status(400).json({
        status: 'error',
        message: 'Word, definition, and category are required.'
      });
    }

    const cleanSynonyms = Array.isArray(synonyms) ? synonyms : (synonyms ? synonyms.split(',').map(s => s.trim()) : []);
    const cleanAntonyms = Array.isArray(antonyms) ? antonyms : (antonyms ? antonyms.split(',').map(a => a.trim()) : []);

    const newVocab = new Vocab({
      word: word.trim(),
      pos: pos ? pos.trim() : 'Noun',
      definition: definition.trim(),
      synonyms: cleanSynonyms,
      antonyms: cleanAntonyms,
      category,
      createdBy: createdBy || 'user'
    });

    await newVocab.save();

    res.status(201).json({
      status: 'success',
      data: newVocab
    });
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


/**
 * @desc    Update an existing vocabulary item
 * @route   PUT /api/study/vocab/:vocabId
 */
export const updateVocab = async (req, res, next) => {
  try {
    const { vocabId } = req.params;
    const { word, pos, definition, synonyms, antonyms, category } = req.body;

    const cleanSynonyms = Array.isArray(synonyms) ? synonyms : (synonyms ? synonyms.split(',').map(s => s.trim()) : []);
    const cleanAntonyms = Array.isArray(antonyms) ? antonyms : (antonyms ? antonyms.split(',').map(a => a.trim()) : []);

    const updated = await Vocab.findByIdAndUpdate(
      vocabId,
      { word, pos, definition, synonyms: cleanSynonyms, antonyms: cleanAntonyms, category },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ status: 'error', message: 'Vocab entry not found.' });
    }

    res.json({ status: 'success', data: updated });
  } catch (error) {
    next(error);
  }
};
