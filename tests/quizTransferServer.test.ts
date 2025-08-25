/// ////////////////////////////////////////////////////////////////////////////
//                             FUNCTION IMPORTS                               //
/// ////////////////////////////////////////////////////////////////////////////
import {
  adminAuthRegister,
  adminQuizCreate,
  adminQuizList,
  adminQuizTransfer,
  clear,
  adminQuizQuestionCreate,
  adminQuizGameStateUpdate
} from './wrapperFunctions';

import { Action } from './interfaces';

/// /////////////////////////////////////////////////////////////////////////////
//                             INITIALISATION                                 //
/// /////////////////////////////////////////////////////////////////////////////
const validFirstName = 'Hayden';
const validLastName = 'Smith';
const validEmail = 'hayden.smith@unsw.edu.au';
const validPassword = 'Password6';

const secondValidFirstName = 'Abhi';
const secondValidLastName = 'Lum';
const secondValidEmail = 'abhi.lum@gmail.com';
const secondValidPassword = 'Password7';

const validName = 'quizName';
const validDescription = 'quizDescription';

const name = 'Quiz 1';
const description = 'Test Quiz';
const invalidEmail = 'random.person@gmail.com';

const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  INVALID_GAMEID: 400,
  INVALID_PLAYERNAME: 400,
  INVALID_EMAIL: 400,
  EMPTY_SESSION: 401,
  INVALID_SESSION: 401,
  UNAUTHORISED: 403,
  INVALID_QUIZ: 403,
  FORBIDDEN: 403,
};

/// /////////////////////////////////////////////////////////////////////////////
//                                 TESTING                                    //
/// /////////////////////////////////////////////////////////////////////////////
describe('adminQuizTransfer', () => {
  let sessionId: string;
  let response: Record<string, never> | number;
  let quizId: number;
  let nonOwnerSessionId: string;
  let responseId: { quizId: number } | number;
  let secondQuizId: number;
  let gameId: number;

  beforeEach(() => {
    clear();
    const registeredResponse = adminAuthRegister(
      validEmail,
      validPassword,
      validFirstName,
      validLastName
    );
    sessionId = (registeredResponse as { session: string }).session;

    const nonOwnerId = adminAuthRegister(
      secondValidEmail,
      secondValidPassword,
      secondValidFirstName,
      secondValidLastName
    );

    nonOwnerSessionId = (nonOwnerId as { session: string }).session;

    const createResponse = adminQuizCreate(sessionId, name, description) as {
      quizId: number;
    };
    quizId = createResponse.quizId;

    adminQuizQuestionCreate(quizId, sessionId, {
      question: 'What is the capital of France?',
      timeLimit: 30,
      points: 10,
      answerOptions: [
        { answer: 'Paris', correct: true },
        { answer: 'London', correct: false },
        { answer: 'Berlin', correct: false },
        { answer: 'Madrid', correct: false },
      ],
    }) as { questionId: number };
  });

  afterEach(() => {
    clear();
  });

  describe('adminQuizTransfer - Error Cases', () => {
    test('Fails for invalid session', () => {
      response = adminQuizTransfer(
        quizId,
        sessionId + 'error',
        secondValidEmail
      );
      expect(response).toEqual(HTTP_STATUS.INVALID_SESSION);
    });

    test('Fails when user does not own the quiz', () => {
      responseId = adminQuizCreate(nonOwnerSessionId, validName, validDescription) as {
        quizId: number;
      };
      secondQuizId = responseId.quizId;

      const result = adminQuizTransfer(
        secondQuizId,
        sessionId,
        secondValidEmail
      );

      expect(result).toStrictEqual(HTTP_STATUS.UNAUTHORISED);
    });

    test('Fails for invalid Email', () => {
      response = adminQuizTransfer(quizId, sessionId, invalidEmail);
      expect(response).toEqual(HTTP_STATUS.INVALID_EMAIL);
    });

    test('Fails for invalid Email that matches sessionId user', () => {
      response = adminQuizTransfer(quizId, sessionId, validEmail);
      expect(response).toEqual(HTTP_STATUS.BAD_REQUEST);
    });

    test('Fails for using name of already created quiz owned by logged in user', () => {
      adminQuizCreate(nonOwnerSessionId, name, description);

      response = adminQuizTransfer(quizId, sessionId, secondValidEmail);
      expect(response).toEqual(HTTP_STATUS.BAD_REQUEST);
    });
  });

  describe('adminQuizTransfer - Success Cases', () => {
    test('Successfully transfers quiz for one quiz', () => {
      adminQuizGameStateUpdate(quizId, gameId, sessionId, Action.END);
      response = adminQuizTransfer(quizId, sessionId, secondValidEmail);
      expect(response).toStrictEqual({});

      const newOwnerQuizList = adminQuizList(nonOwnerSessionId);

      expect(newOwnerQuizList).toEqual({
        quizzes: [{ quizId: quizId, name: name }],
      });
    });

    test('Successfully returns quizId for multiple quizzes', () => {
      adminQuizGameStateUpdate(quizId, gameId, sessionId, Action.END);
      adminQuizGameStateUpdate(secondQuizId, gameId, sessionId, Action.END);
      responseId = adminQuizCreate(sessionId, validName, validDescription) as {
        quizId: number;
      };
      secondQuizId = responseId.quizId;

      response = adminQuizTransfer(quizId, sessionId, secondValidEmail);
      expect(response).toStrictEqual({});

      response = adminQuizTransfer(secondQuizId, sessionId, secondValidEmail);
      expect(response).toStrictEqual({});

      const newOwnerQuizList = adminQuizList(nonOwnerSessionId);

      expect(newOwnerQuizList).toEqual({
        quizzes: [
          { quizId: quizId, name: name },
          { quizId: secondQuizId, name: validName },
        ],
      });
    });
  });
});
