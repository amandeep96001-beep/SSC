import VocabModel from '../models/vocabModel.js';

/**
 * Helper to shuffle an array
 */
function shuffleArray(arr) {
  const newArr = [...arr];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

/**
 * @desc    Generate the next drill question based on type
 * @route   GET /api/prep/drills/next
 */
export const getNextDrill = async (req, res, next) => {
  try {
    const type = req.query.type || 'table'; // table, fraction, percentage, vocab

    let drillData = {};

    switch (type) {
      case 'table': {
        // Jumping tables: Math drills with base 12 to maxBase (excluding multiples of 10), and multiplier 2 to 9
        const maxBase = Math.max(12, parseInt(req.query.maxBase, 10) || 20);
        
        let tableBase;
        do {
          tableBase = Math.floor(Math.random() * (maxBase - 12 + 1)) + 12;
        } while (tableBase % 10 === 0);

        const multiplier = Math.floor(Math.random() * 8) + 2; // Locked multiplier 2-9
        const answer = (tableBase * multiplier).toString();

        drillData = {
          type,
          question: `${tableBase} × ${multiplier}`,
          correctAnswer: answer,
          placeholder: 'Enter calculations result...'
        };
        break;
      }

      case 'fraction': {
        // Fraction to Percentage: e.g. "5/8" -> "62.5%"
        const conversion = await VocabModel.getRandomConversion();
        drillData = {
          type,
          question: `Convert fraction: ${conversion.fraction}`,
          correctAnswer: conversion.percentage,
          placeholder: 'e.g. 12.5%'
        };
        break;
      }

      case 'percentage': {
        // Percentage to Fraction: e.g. "87.5%" -> "7/8"
        const conversion = await VocabModel.getRandomConversion();
        drillData = {
          type,
          question: `Convert percentage: ${conversion.percentage}`,
          correctAnswer: conversion.fraction,
          placeholder: 'e.g. 1/8'
        };
        break;
      }

      case 'vocab': {
        const wordData = await VocabModel.getRandomWord();
        const isIdiom = wordData.category === 'Idioms & Phrases';

        let question, correctAnswer, wrongPool;

        if (isIdiom) {
          // For idioms: the correct answer is the DEFINITION (i.e. meaning of the phrase)
          // Wrong options: pull synonyms/antonyms as distractors
          question = `What does this expression mean?\n"${wordData.word}"`;
          correctAnswer = wordData.definition;
          // Build wrong options from synonyms/antonyms as short distractors
          wrongPool = [
            ...(wordData.synonyms || []).slice(0, 2),
            ...(wordData.antonyms || []).slice(0, 2),
          ];
        } else {
          // For Word Power, OWS, Spelling:
          // Ask meaning directly — correct answer is first synonym
          question = `"${wordData.word}" means:`;
          correctAnswer = (wordData.synonyms || [])[0] || wordData.definition;
          // Wrong options: antonyms first, then spare synonyms as distractors
          wrongPool = [
            ...(wordData.antonyms || []),
            ...(wordData.synonyms || []).slice(1),
          ];
        }

        // Build 4 MCQ options
        const shuffledWrong = shuffleArray(wrongPool).slice(0, 3);
        while (shuffledWrong.length < 3) {
          shuffledWrong.push(`None of these ${shuffledWrong.length + 1}`);
        }
        const optionsList = shuffleArray([correctAnswer, ...shuffledWrong]);

        drillData = {
          type,
          question,
          isIdiom,
          // Send definition separately — frontend shows it ONLY after answer is revealed
          revealDefinition: wordData.definition,
          pos: wordData.pos,
          category: wordData.category,
          options: optionsList,
          correctAnswer
        };
        break;
      }

      default:
        return res.status(400).json({
          status: 'error',
          message: `Unknown drill type: ${type}. Choose from 'table', 'fraction', 'percentage', or 'vocab'`
        });
    }

    res.json({
      status: 'success',
      data: drillData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify user response
 * @route   POST /api/prep/drills/verify
 */
export const verifyDrill = async (req, res, next) => {
  try {
    const { type, question, userAnswer, correctAnswer } = req.body;

    if (userAnswer === undefined || correctAnswer === undefined) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide userAnswer and correctAnswer variables.'
      });
    }

    // Normalized matching logic
    const cleanUser = userAnswer.toString().trim().toLowerCase().replace('%', '');
    const cleanCorrect = correctAnswer.toString().trim().toLowerCase().replace('%', '');

    const isCorrect = cleanUser === cleanCorrect;

    res.json({
      status: 'success',
      data: {
        isCorrect,
        correctAnswer
      }
    });
  } catch (error) {
    next(error);
  }
};
