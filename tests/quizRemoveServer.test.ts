/// /////////////////////////////////////////////////////////////////////////////
//                             FUNCTION IMPORTS                               //
/// /////////////////////////////////////////////////////////////////////////////
import {
  adminAuthRegister,
  adminQuizCreate,
  adminQuizInfo,
  adminQuizRemove,
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
const validPassword = 'password6';

const anotherFirstName = 'Alice';
const anotherLastName = 'Brown';
const anotherEmail = 'alice.brown@unsw.edu.au';
const anotherPassword = 'password6';

const name = 'Quiz 1';
const description = 'Test Quiz';

const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  INVALID_GAMEID: 400,
  INVALID_PLAYERNAME: 400,
  EMPTY_SESSION: 401,
  INVALID_SESSION: 401,
  UNAUTHORISED: 403,
  INVALID_QUIZ: 403,
  FORBIDDEN: 403,
};

/// /////////////////////////////////////////////////////////////////////////////
//                                 TESTING                                    //
/// /////////////////////////////////////////////////////////////////////////////
describe('adminQuizRemove', () => {
  let quizId: number;
  let sessionId: string;
  let nonOwnerSessionId: string;
  let gameId: number;

  beforeEach(() => {
    clear();
    const user = adminAuthRegister(
      validEmail,
      validPassword,
      validFirstName,
      validLastName
    ) as { session: string };
    sessionId = user.session;
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

  describe('adminQuizRemoveV2 - Success Cases', () => {
    test('Successfully removes Quiz', () => {
      adminQuizGameStateUpdate(quizId, gameId, sessionId, Action.END);
      const result = adminQuizRemove(quizId, sessionId);

      expect(result).toEqual({});

      const infoResult = adminQuizInfo(sessionId, quizId);
      expect(infoResult).toStrictEqual(403);
    });
  });

  describe('adminQuizRemoveV2 - Failure Cases', () => {
    test('Fails for invalid session', () => {
      const result = adminQuizRemove(quizId, sessionId + '1234');

      expect(result).toStrictEqual(HTTP_STATUS.INVALID_SESSION);
    });

    test('Fails for invalid quizId', () => {
      const result = adminQuizRemove(quizId + 1, sessionId);
      expect(result).toStrictEqual(HTTP_STATUS.INVALID_QUIZ);
    });

    test('Fails when user does not own the quiz', () => {
      const nonOwnerId = adminAuthRegister(
        anotherEmail,
        anotherPassword,
        anotherFirstName,
        anotherLastName
      );

      nonOwnerSessionId = (nonOwnerId as { session: string }).session;
      const result1 = adminQuizRemove(quizId, nonOwnerSessionId);

      expect(result1).toStrictEqual(HTTP_STATUS.UNAUTHORISED);
    });
  });
});
