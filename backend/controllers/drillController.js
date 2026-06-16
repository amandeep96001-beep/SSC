import vocabRepository from '../repositories/vocabRepository.js';
import TCSQuestionRepository from '../repositories/tcsQuestionRepository.js';

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

      case 'square': {
        const maxBase = Math.max(2, parseInt(req.query.maxBase, 10) || 30);
        const num = Math.floor(Math.random() * maxBase) + 1;
        drillData = {
          type,
          question: `What is the square of ${num}? (${num}²)`,
          correctAnswer: (num * num).toString(),
          placeholder: 'Enter square...'
        };
        break;
      }

      case 'cube': {
        const maxBase = Math.max(2, parseInt(req.query.maxBase, 10) || 20);
        const num = Math.floor(Math.random() * maxBase) + 1;
        drillData = {
          type,
          question: `What is the cube of ${num}? (${num}³)`,
          correctAnswer: (num * num * num).toString(),
          placeholder: 'Enter cube...'
        };
        break;
      }

      case 'vocab': {
        const wordData = await vocabRepository.getRandomWord();
        const isIdiom = wordData.category === 'Idioms & Phrases';

        let question, correctAnswer, wrongPool;

        if (isIdiom) {
          question = `What is the meaning of the idiom: "${wordData.word}"?`;
          correctAnswer = wordData.definition;
          wrongPool = [
            ...(wordData.synonyms || []).slice(0, 2),
            ...(wordData.antonyms || []).slice(0, 2),
          ];
        } else {
          const hasSynonyms = wordData.synonyms && wordData.synonyms.length > 0;
          const hasAntonyms = wordData.antonyms && wordData.antonyms.length > 0;
          
          const types = ['meaning'];
          if (hasSynonyms) types.push('synonym');
          if (hasAntonyms) types.push('antonym');
          
          const qType = types[Math.floor(Math.random() * types.length)];
          
          if (qType === 'synonym') {
            question = `What is the SYNONYM of "${wordData.word}"?`;
            correctAnswer = wordData.synonyms[Math.floor(Math.random() * wordData.synonyms.length)];
            wrongPool = [
              ...(wordData.antonyms || []),
              ...(wordData.options || [])
            ];
            wrongPool = wrongPool.filter(w => !wordData.synonyms.includes(w) && w !== correctAnswer);
          } else if (qType === 'antonym') {
            question = `What is the ANTONYM of "${wordData.word}"?`;
            correctAnswer = wordData.antonyms[Math.floor(Math.random() * wordData.antonyms.length)];
            wrongPool = [
              ...(wordData.synonyms || []),
              ...(wordData.options || [])
            ];
            wrongPool = wrongPool.filter(w => !wordData.antonyms.includes(w) && w !== correctAnswer);
          } else {
            question = `What is the meaning of "${wordData.word}"?`;
            correctAnswer = (wordData.synonyms || [])[0] || wordData.definition;
            wrongPool = [
              ...(wordData.antonyms || []),
              ...(wordData.options || [])
            ];
            wrongPool = wrongPool.filter(w => !(wordData.synonyms || []).includes(w) && w !== wordData.definition && w !== correctAnswer);
          }
        }

        // Filter out correct answer from wrongPool just in case
        wrongPool = wrongPool.filter(w => w !== correctAnswer && w != null);
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
          revealSynonyms: wordData.synonyms,
          revealAntonyms: wordData.antonyms,
          pos: wordData.pos,
          category: wordData.category,
          options: optionsList,
          correctAnswer
        };
        break;
      }


      case 'gk':
      case 'english-mcq':
      case 'maths-mcq':
      case 'reasoning-mcq': {
        let subject = 'GK';
        if (type === 'english-mcq') subject = 'English';
        else if (type === 'maths-mcq') subject = 'Maths';
        else if (type === 'reasoning-mcq') subject = 'Reasoning';

        const tcsQ = await TCSQuestionRepository.getRandomBySubject(subject);
        if (!tcsQ) {
          return res.status(404).json({ status: 'error', message: `No ${subject} questions found in database.` });
        }
        drillData = {
          type,
          question: tcsQ.question,
          options: tcsQ.options,
          correctAnswer: tcsQ.options[tcsQ.correctAnswer],
          explanation: tcsQ.explanation,
          category: tcsQ.category,
          year: tcsQ.year,
          isImportant: tcsQ.isImportant || false
        };
        break;
      }

      default:
        return res.status(400).json({
          status: 'error',
          message: `Unknown drill type: ${type}.`
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
