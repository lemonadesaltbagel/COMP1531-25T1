/// /////////////////////////////////////////////////////////////////////////////
//                             FUNCTION IMPORTS                               //
/// /////////////////////////////////////////////////////////////////////////////
import { writeFileSync } from 'fs';
import {
  adminAuthRegister,
  adminQuizCreate,
  quizOpenFile,
  adminQuizQuestionAttachment,
  adminQuizQuestionAttachmentRemove,
  adminQuizQuestionCreate,
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

/// /////////////////////////////////////////////////////////////////////////////
//                               INITIALISATION                                //
/// /////////////////////////////////////////////////////////////////////////////
let sessionId: string;
let quizId: number;
let questionId: number;

describe('adminQuizQuestionAttachment Remove', () => {
  beforeEach(() => {
    clear();
    const registerResponse = adminAuthRegister(
      'dylan.nguyen@student.unsw.edu.au',
      'password6',
      'Dylan',
      'Nguyen'
    ) as { session: string };
    sessionId = registerResponse.session;
    const quizResponse = adminQuizCreate(
      sessionId,
      'Quiz 1',
      'Test Quiz'
    ) as { quizId: number };
    quizId = quizResponse.quizId;
    const addQuestionResult = adminQuizQuestionCreate(quizId, sessionId, {
      question: 'Who is the Monarch of England?',
      timeLimit: 4,
      points: 5,
      answerOptions: [
        { answer: 'Prince Charles', correct: true },
        { answer: 'Prince Harry', correct: false },
      ],
    }) as { questionId: number };
    questionId = addQuestionResult.questionId;
    writeFileSync('uploads/example.txt', 'Hello from uploads!', 'utf8');
    writeFileSync('uploads/example2.txt', 'Hello from uploads2!', 'utf8');
    adminQuizQuestionAttachment(
      sessionId,
      quizId,
      questionId,
      'uploads/example.txt'
    );
  });

  describe('Successful case', () => {
    test('Correct return value', () => {
      const result = adminQuizQuestionAttachmentRemove(
        sessionId,
        quizId,
        questionId,
        'example.txt'
      );
      expect(result).toEqual({});
    }
    );

    test('File is removed from the quiz', () => {
      adminQuizQuestionAttachmentRemove(
        sessionId,
        quizId,
        questionId,
        'example.txt'
      );
      const result = quizOpenFile(
        sessionId,
        'example.txt');
      expect(result).toEqual(HTTP_STATUS.BAD_REQUEST);
    });
  });

  describe('Invalid cases', () => {
    test('Non existent file', () => {
      const result = adminQuizQuestionAttachmentRemove(
        sessionId,
        quizId,
        questionId,
        'DOESNTEXIST.txt'
      );
      expect(result).toStrictEqual(HTTP_STATUS.BAD_REQUEST);
    });

    test('Question does not exist', () => {
      const result = adminQuizQuestionAttachmentRemove(
        sessionId,
        quizId,
        questionId + 1000,
        'example.txt'
      );
      expect(result).toStrictEqual(HTTP_STATUS.BAD_REQUEST);
    });

    test('Quiz does not exist', () => {
      const result = adminQuizQuestionAttachmentRemove(
        sessionId,
        quizId + 1000,
        questionId,
        'example.txt'
      );
      expect(result).toStrictEqual(HTTP_STATUS.FORBIDDEN);
    });

    test('Invalid session', () => {
      const result = adminQuizQuestionAttachmentRemove(
        sessionId + 'invalid',
        quizId,
        questionId,
        'example.txt'
      );
      expect(result).toStrictEqual(HTTP_STATUS.UNAUTHORIZED);
    });

    test('Unauthorized user', () => {
      const anotherRegisterResult = adminAuthRegister(
        'jarrod.choi@unsw.edu.au',
        'password6',
        'Jarrod',
        'Choi'
      ) as { session: string };
      const anotherSessionId = anotherRegisterResult.session;
      adminQuizQuestionAttachment(
        anotherSessionId,
        quizId,
        questionId,
        'uploads/example2.txt'
      );
      const result = adminQuizQuestionAttachmentRemove(
        anotherSessionId,
        quizId,
        questionId,
        'example45.txt'
      );
      expect(result).toStrictEqual(HTTP_STATUS.FORBIDDEN);
    });

    test('Empty file name', () => {
      const result = adminQuizQuestionAttachmentRemove(
        sessionId,
        quizId,
        questionId,
        ''
      );
      expect(result).toStrictEqual(HTTP_STATUS.BAD_REQUEST);
    });
    test('File name does directory traversal', () => {
      const result = adminQuizQuestionAttachmentRemove(
        sessionId,
        quizId,
        questionId,
        '../deleteWindows32.txt'
      );
      expect(result).toStrictEqual(HTTP_STATUS.FORBIDDEN);
    });

    test('No file attached to this question', () => {
      const addQuestionResult = adminQuizQuestionCreate(
        quizId,
        sessionId,
        {
          question: 'What is the capital of France?',
          timeLimit: 30,
          points: 10,
          answerOptions: [
            { answer: 'Paris', correct: true },
            { answer: 'London', correct: false },
          ],
        }
      ) as { questionId: number };
      const anotherQuestionId = addQuestionResult.questionId;
      const result = adminQuizQuestionAttachmentRemove(
        sessionId,
        quizId,
        anotherQuestionId,
        'example.txt'
      );
      expect(result).toStrictEqual(HTTP_STATUS.BAD_REQUEST);
    });
  });
});
