/// /////////////////////////////////////////////////////////////////////////////
//                             FUNCTION IMPORTS                               //
/// /////////////////////////////////////////////////////////////////////////////
import { QuizInfo } from './interfaces';
import fs from 'fs';
import path from 'path';
import {
  adminAuthRegister,
  adminQuizCreate,
  adminQuizExport,
  adminQuizImport,
  adminQuizQuestionCreate,
  adminQuizRemove,
  adminQuizInfo,
  clear,
} from './wrapperFunctions';

/// /////////////////////////////////////////////////////////////////////////////
//                                 CONSTANTS                                  //
/// /////////////////////////////////////////////////////////////////////////////
const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
};

const dirPath = path.join(__dirname, 'exports');
const filePath = path.join(dirPath, 'invalid.json');

describe('Import Export', () => {
  let sessionId: string;
  let quizId: number;

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

    adminQuizQuestionCreate(quizId, sessionId, {
      question: 'Who is the Monarch of England?',
      timeLimit: 4,
      points: 5,
      answerOptions: [
        { answer: 'Prince Charles', correct: true },
        { answer: 'Prince Harry', correct: false },
      ],
    });
    fs.writeFileSync(filePath, 'hello', 'utf8');
  });
  afterAll(() => {
    clear();
  });
  describe('Successful exports', () => {
    test('Correct return value', () => {
      const result = adminQuizExport(sessionId, quizId, './tests/exports/quiz.json');
      expect(result).toEqual(200);
    });
  });

  describe('Invalid export', () => {
    test('Invalid quizId', () => {
      const result = adminQuizExport(sessionId, quizId + 1, './tests/exports/quiz.json');
      expect(result).toEqual(HTTP_STATUS.FORBIDDEN);
    });

    test('Invalid sessionId', () => {
      const result = adminQuizExport(sessionId + 'invalid', quizId, './tests/exports/quiz.json');
      expect(result).toEqual(HTTP_STATUS.UNAUTHORIZED);
    });
    test('Unauthorized user', () => {
      const registerResult = adminAuthRegister(
        'dylan.nguyen@student.unsw.edu.au',
        'password6',
        'Dylan',
        'Nguyen'
      );
      const anotherSessionId = (registerResult as { session: string }).session;
      const result = adminQuizExport(anotherSessionId, quizId, './tests/exports/quiz.json');
      expect(result).toEqual(HTTP_STATUS.FORBIDDEN);
    });
  });

  describe('Successful import', () => {
    test('Correct return value', () => {
      const result = adminQuizExport(sessionId, quizId, './tests/exports/quiz.json');
      expect(result).toEqual(200);
      adminQuizRemove(quizId, sessionId);
      const importResult = adminQuizImport(
        sessionId,
        './tests/exports/quiz.json'
      ) as { quizId: number };
      expect(importResult).toStrictEqual({ quizId: expect.any(Number) });
    });
    test('Correct file format', () => {
      const result = adminQuizExport(sessionId, quizId, './tests/exports/quiz.json');
      expect(result).toEqual(200);
      adminQuizRemove(quizId, sessionId);
      const importResult = adminQuizImport(
        sessionId,
        './tests/exports/quiz.json'
      ) as { quizId: number };
      expect(importResult).toStrictEqual({ quizId: expect.any(Number) });
      const importedQuizId = importResult.quizId;
      const quizInfo = adminQuizInfo(sessionId, importedQuizId) as QuizInfo;
      expect(quizInfo).toEqual({
        quizId: importedQuizId,
        name: 'Sample Quiz',
        timeCreated: expect.any(Number),
        timeLastEdited: expect.any(Number),
        description: 'A test quiz',
        numQuestions: 1,
        questions: [
          {
            questionId: expect.any(Number),
            question: 'Who is the Monarch of England?',
            timeLimit: 4,
            points: 5,
            answerOptions: [
              {
                answerId: expect.any(Number),
                answer: 'Prince Charles',
                colour: expect.any(String),
                correct: true,
              },
              {
                answerId: expect.any(Number),
                answer: 'Prince Harry',
                colour: expect.any(String),
                correct: false,
              },
            ],
          },
        ],
        timeLimit: 4,
      });
    });
  });

  describe('Invalid import', () => {
    test('Invalid file', () => {
      const result = adminQuizExport(sessionId, quizId, './tests/exports/quiz.json');
      expect(result).toEqual(200);
      adminQuizRemove(quizId, sessionId);
      const importResult = adminQuizImport(
        sessionId,
        '/exports/invalid_quiz.txt'
      );
      expect(importResult).toEqual(HTTP_STATUS.BAD_REQUEST);
    });
    test('Invalid file format', () => {
      const importResult = adminQuizImport(
        sessionId,
        '/exports/invalid.json'
      );
      expect(importResult).toEqual(HTTP_STATUS.BAD_REQUEST);
    });
    test('Invalid session', () => {
      const result = adminQuizExport(sessionId, quizId, './tests/exports/quiz.json');
      expect(result).toEqual(200);
      adminQuizRemove(quizId, sessionId);
      const importResult = adminQuizImport(
        sessionId + 'invalid',
        './tests/exports/quiz.json'
      ) as { quizId: number };
      expect(importResult).toStrictEqual(HTTP_STATUS.UNAUTHORIZED);
    });
  });
});
