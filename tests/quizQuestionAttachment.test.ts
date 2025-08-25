/// /////////////////////////////////////////////////////////////////////////////
//                             FUNCTION IMPORTS                               //
/// /////////////////////////////////////////////////////////////////////////////
import { QuizInfoV2 } from './interfaces';
import {
  adminAuthRegister,
  adminQuizCreate,
  adminQuizInfoV2,
  adminQuizQuestionAttachment,
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

describe('adminQuizQuestionAttachment', () => {
  beforeEach(() => {
    clear();
    const registerResponse = adminAuthRegister(
      'dylan.nguyen@unsw.edu.au',
      'password6',
      'Dylan',
      'Nguyen'
    );
    sessionId = (registerResponse as { session: string }).session;
    const quizResponse = adminQuizCreate(
      sessionId,
      'Quiz 1',
      'Test Quiz'
    );
    quizId = (quizResponse as { quizId: number }).quizId;
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
  afterAll(() => {
    clear();
  });

  describe('Success Cases', () => {
    test('Correct return type', () => {
      const result = adminQuizQuestionAttachment(
        sessionId,
        quizId,
        questionId,
        './tests/uploads/valid.txt'
      );
      expect(result).toStrictEqual({});
    });

    test('File is attached to quiz', () => {
      adminQuizQuestionAttachment(
        sessionId,
        quizId,
        questionId,
        './tests/uploads/valid.txt'
      );
      const quizInfo = adminQuizInfoV2(sessionId, quizId) as QuizInfoV2;
      const question = quizInfo.questions[0];
      expect(question.fileAttachments).toStrictEqual(['/uploads/valid.txt']);
    });

    test('Multiple files are attached to quiz', () => {
      adminQuizQuestionAttachment(
        sessionId,
        quizId,
        questionId,
        './tests/uploads/valid.txt'
      );
      adminQuizQuestionAttachment(
        sessionId,
        quizId,
        questionId,
        './tests/uploads/testing.txt'
      );
      const quizInfo = adminQuizInfoV2(sessionId, quizId) as QuizInfoV2;
      const question = quizInfo.questions[0];
      expect(question.fileAttachments).toStrictEqual([
        '/uploads/valid.txt',
        '/uploads/testing.txt',
      ]);
    });
  });

  describe('Failure Cases', () => {
    test('File is already attached to quiz', () => {
      adminQuizQuestionAttachment(
        sessionId,
        quizId,
        questionId,
        './tests/uploads/valid.txt'
      );
      const result = adminQuizQuestionAttachment(
        sessionId,
        quizId,
        questionId,
        './tests/uploads/valid.txt'
      );
      expect(result).toBe(HTTP_STATUS.BAD_REQUEST);
    });

    test('Invalid session', () => {
      const result = adminQuizQuestionAttachment(
        sessionId + 'invalidSession',
        quizId,
        questionId,
        './tests/uploads/valid.txt'
      );
      expect(result).toBe(HTTP_STATUS.UNAUTHORIZED);
    });

    test('Empty session', () => {
      const result = adminQuizQuestionAttachment(
        '',
        quizId,
        questionId,
        './tests/uploads/valid.txt'
      );
      expect(result).toBe(HTTP_STATUS.UNAUTHORIZED);
    });

    test('Unauthorised session', () => {
      const registerResponse = adminAuthRegister(
        'sandeep.das@unsw.edu.au',
        'password6',
        'Sandeep',
        'Das'
      );
      const unauthorisedSessionId = (registerResponse as { session: string }).session;
      const result = adminQuizQuestionAttachment(
        unauthorisedSessionId,
        quizId,
        questionId,
        './tests/uploads/valid.txt'
      );
      expect(result).toBe(HTTP_STATUS.FORBIDDEN);
    });

    test('Invalid quizId', () => {
      const result = adminQuizQuestionAttachment(
        sessionId,
        quizId + 1,
        questionId,
        './tests/uploads/valid.txt'
      );
      expect(result).toBe(HTTP_STATUS.FORBIDDEN);
    });

    test('Invalid questionId', () => {
      const result = adminQuizQuestionAttachment(
        sessionId,
        quizId,
        questionId + 1,
        './tests/uploads/valid.txt'
      );
      expect(result).toBe(HTTP_STATUS.BAD_REQUEST);
    });

    test('Invalid file path', () => {
      const result = adminQuizQuestionAttachment(
        sessionId,
        quizId,
        questionId,
        './tests/uploads/invalid.txt'
      );
      expect(result).toBe(HTTP_STATUS.BAD_REQUEST);
    });
    test('Empty file', () => {
      const result = adminQuizQuestionAttachment(
        sessionId,
        quizId,
        questionId,
        ''
      );
      expect(result).toBe(HTTP_STATUS.BAD_REQUEST);
    });
  });
});
