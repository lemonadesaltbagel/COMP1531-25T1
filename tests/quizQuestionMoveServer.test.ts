/// /////////////////////////////////////////////////////////////////////////////
//                             FUNCTION IMPORTS                               //
/// /////////////////////////////////////////////////////////////////////////////
import {
  adminAuthRegister,
  adminQuizCreate,
  adminQuizInfo,
  adminQuizQuestionCreate,
  adminQuizQuestionMove,
  clear,
} from './wrapperFunctions';

import { QuizInfo } from './interfaces';
/// /////////////////////////////////////////////////////////////////////////////
//                             INITIALISATION                                 //
/// /////////////////////////////////////////////////////////////////////////////
const SECOND_POSITION = 1;
const THIRD_POSITION = 2;
const NEGATIVE_POSITION = -1;
const OUT_OF_BOUNDS_POSITION = 100;
const EMPTY_SESSION = '';
/// /////////////////////////////////////////////////////////////////////////////
//                                 TESTING                                    //
/// /////////////////////////////////////////////////////////////////////////////

describe('PUT /v1/admin/quiz/{quizid}/question/{questionid}/move', () => {
  let sessionId: string;
  let quizId: number;
  let questionId: number;

  beforeEach(() => {
    clear();
    const registerResult = adminAuthRegister(
      'testuser@gmail.com',
      'Password123',
      'Test',
      'User'
    );
    sessionId = (registerResult as { session: string }).session;

    const createQuizResult = adminQuizCreate(
      sessionId,
      'Sample Quiz',
      'A test quiz'
    );
    quizId = (createQuizResult as { quizId: number }).quizId;

    const addQuestionResult = adminQuizQuestionCreate(quizId, sessionId, {
      question: 'Who is the Monarch of England?',
      timeLimit: 4,
      points: 5,
      answerOptions: [
        { answer: 'Prince Charles', correct: true },
        { answer: 'Prince Harry', correct: false },
      ],
    });
    questionId = (addQuestionResult as { questionId: number }).questionId;
  });

  afterEach(() => {
    clear();
  });

  describe('Success Cases', () => {
    test('Move a question has the correct return type', () => {
      adminQuizQuestionCreate(quizId, sessionId, {
        question: 'What is the best CS course?',
        timeLimit: 4,
        points: 5,
        answerOptions: [
          { answer: 'COMP1531', correct: true },
          { answer: 'COMP6991', correct: false },
          { answer: 'COMP1511', correct: false },
        ],
      });
      const result = adminQuizQuestionMove(quizId, questionId, sessionId, SECOND_POSITION);
      expect(result).toStrictEqual({});
    });

    test('Move a question to a valid new position', () => {
      adminQuizQuestionCreate(quizId, sessionId, {
        question: 'What is the best CS course?',
        timeLimit: 4,
        points: 5,
        answerOptions: [
          { answer: 'COMP1531', correct: true },
          { answer: 'COMP6991', correct: false },
          { answer: 'COMP1511', correct: false },
        ],
      });
      const result = adminQuizQuestionMove(quizId, questionId, sessionId, SECOND_POSITION);
      const quizInfo = adminQuizInfo(sessionId, quizId) as QuizInfo;
      expect(quizInfo.questions[SECOND_POSITION].questionId).toBe(questionId);
      expect(result).toStrictEqual({});
    });

    test('Move a question to the end of the list', () => {
      adminQuizQuestionCreate(quizId, sessionId, {
        question: 'What is the best CS course?',
        timeLimit: 4,
        points: 5,
        answerOptions: [
          { answer: 'COMP1531', correct: true },
          { answer: 'COMP6991', correct: false },
          { answer: 'COMP1511', correct: false },
        ],
      });
      adminQuizQuestionCreate(quizId, sessionId, {
        question: 'Who is the best COMP1531 tutor?',
        timeLimit: 4,
        points: 5,
        answerOptions: [
          { answer: 'Sandeep Das', correct: true },
          { answer: 'Not Ansh Nimbalkar', correct: false },
        ],
      });

      const result = adminQuizQuestionMove(quizId, questionId, sessionId, THIRD_POSITION);
      const quizInfo = adminQuizInfo(sessionId, quizId) as QuizInfo;
      expect(quizInfo.questions[THIRD_POSITION].questionId).toBe(questionId);
      expect(result).toStrictEqual({});
    });
  });

  describe('Failure Cases', () => {
    test('Move a question to an invalid position (negative index)', () => {
      const quizInfoBefore = adminQuizInfo(sessionId, quizId);

      const result = adminQuizQuestionMove(quizId, questionId, sessionId, NEGATIVE_POSITION);
      const quizInfoAfter = adminQuizInfo(sessionId, quizId);

      expect(result).toStrictEqual(400);
      expect(quizInfoAfter).toStrictEqual(quizInfoBefore);
    });

    test('Move a question to an invalid position (beyond questions array)', () => {
      const quizInfoBefore = adminQuizInfo(sessionId, quizId);

      const result = adminQuizQuestionMove(quizId, questionId, sessionId, OUT_OF_BOUNDS_POSITION);
      const quizInfoAfter = adminQuizInfo(sessionId, quizId);

      expect(result).toStrictEqual(400);
      expect(quizInfoAfter).toStrictEqual(quizInfoBefore);
    });

    test('Move a question in a non-existent quiz', () => {
      const result = adminQuizQuestionMove(
        quizId + 1,
        questionId,
        sessionId,
        1
      );
      expect(result).toStrictEqual(403);
    });

    test('Move a non-existent question', () => {
      const result = adminQuizQuestionMove(
        quizId,
        questionId + 1,
        sessionId,
        1
      );
      expect(result).toStrictEqual(400);
    });

    test('Move with an empty session', () => {
      const result = adminQuizQuestionMove(
        quizId,
        questionId,
        EMPTY_SESSION,
        1
      );
      expect(result).toStrictEqual(401);
    });

    test('Move with an invalid session', () => {
      const result = adminQuizQuestionMove(
        quizId,
        questionId,
        sessionId + 'invalid',
        1
      );
      expect(result).toStrictEqual(401);
    });

    test('Move with an unauthorised session', () => {
      const anotherRegisterResult = adminAuthRegister(
        'anothertestuser@gmail.com',
        'Password123',
        'Test',
        'User'
      );
      const anotherSessionId = (anotherRegisterResult as { session: string }).session;
      const result = adminQuizQuestionMove(
        quizId,
        questionId,
        anotherSessionId,
        1
      );
      expect(result).toStrictEqual(403);
    });
  });
});
