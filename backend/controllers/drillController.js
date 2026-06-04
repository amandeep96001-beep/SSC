import vocabRepository from '../repositories/vocabRepository.js';

function shuffleArray(arr) {
  const newArr = [...arr];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

export const getNextDrill = async (req, res, next) => {
  try {
    const type = req.query.type || 'table';

    let drillData = {};

    switch (type) {
      case 'table': {
        const maxBase = Math.max(12, parseInt(req.query.maxBase, 10) || 20);
        let tableBase;
        do {
          tableBase = Math.floor(Math.random() * (maxBase - 12 + 1)) + 12;
        } while (tableBase % 10 === 0);

        const multiplier = Math.floor(Math.random() * 8) + 2;
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
        const conversion = await vocabRepository.getRandomConversion();
        drillData = {
          type,
          question: `Convert fraction: ${conversion.fraction}`,
          correctAnswer: conversion.percentage,
          placeholder: 'e.g. 12.5%'
        };
        break;
      }

      case 'percentage': {
        const conversion = await vocabRepository.getRandomConversion();
        drillData = {
          type,
          question: `Convert percentage: ${conversion.percentage}`,
          correctAnswer: conversion.fraction,
          placeholder: 'e.g. 1/8'
        };
        break;
      }

      case 'vocab': {
        const wordData = await vocabRepository.getRandomWord();
        const isIdiom = wordData.category === 'Idioms & Phrases';

        let question, correctAnswer, wrongPool;

        if (isIdiom) {
          question = `What does this expression mean?\n"${wordData.word}"`;
          correctAnswer = wordData.definition;
          wrongPool = [
            ...(wordData.synonyms || []).slice(0, 2),
            ...(wordData.antonyms || []).slice(0, 2),
          ];
        } else {
          question = `"${wordData.word}" means:`;
          correctAnswer = (wordData.synonyms || [])[0] || wordData.definition;
          wrongPool = [
            ...(wordData.antonyms || []),
            ...(wordData.synonyms || []).slice(1),
          ];
        }

        const shuffledWrong = shuffleArray(wrongPool).slice(0, 3);
        while (shuffledWrong.length < 3) {
          shuffledWrong.push(`None of these ${shuffledWrong.length + 1}`);
        }
        const optionsList = shuffleArray([correctAnswer, ...shuffledWrong]);

        drillData = {
          type,
          question,
          isIdiom,
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

    res.json({ status: 'success', data: drillData });
  } catch (error) {
    next(error);
  }
};

export const verifyDrill = async (req, res, next) => {
  try {
    const { type, question, userAnswer, correctAnswer } = req.body;

    if (userAnswer === undefined || correctAnswer === undefined) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide userAnswer and correctAnswer variables.'
      });
    }

    const cleanUser = userAnswer.toString().trim().toLowerCase().replace('%', '');
    const cleanCorrect = correctAnswer.toString().trim().toLowerCase().replace('%', '');

    const isCorrect = cleanUser === cleanCorrect;

    res.json({
      status: 'success',
      data: { isCorrect, correctAnswer }
    });
  } catch (error) {
    next(error);
  }
};
