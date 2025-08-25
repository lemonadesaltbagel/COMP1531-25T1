/// /////////////////////////////////////////////////////////////////////////////
//                             FUNCTION IMPORTS                               //
/// /////////////////////////////////////////////////////////////////////////////
import {
  adminAuthRegister,
  adminQuizCreate,
  adminQuizQuestionCreate,
  adminQuizGameStart,
  adminQuizQuestionRemove,
  clear,
} from './wrapperFunctions';

/// /////////////////////////////////////////////////////////////////////////////
//                                 CONSTANTS                                  //
/// /////////////////////////////////////////////////////////////////////////////
const HTTP_STATUS = {
  OK: 200,
  INVALID_AUTO_START_NUM: 400,
  TOO_MANY_GAMES: 400,
  EMPTY_QUIZ: 400,
  INVALID_SESSION: 401,
  UNAUTHORIZED: 403,
  INVALID_QUIZ: 403,
};

const MAX_AUTO_START_NUM = 50;
const MIN_AUTO_START_NUM = 0;
const INVALID_AUTO_START_NUM = 51;
const VALID_AUTO_START_NUM = 5;

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

/// /////////////////////////////////////////////////////////////////////////////
//                                 TESTING                                    //
/// /////////////////////////////////////////////////////////////////////////////
describe('adminQuizGameStart', () => {
  let session: string;
  let quizId: number;
  let questionId: number;

  beforeEach(() => {
    clear();
    const registerResponse = adminAuthRegister(
      validEmail,
      validPassword,
      validFirstName,
      validLastName
    ) as { session: string };
    session = registerResponse.session;
    const createResponse = adminQuizCreate(session, name, description) as {
      quizId: number;
    };
    quizId = createResponse.quizId;
    const questionCreateResponse = adminQuizQuestionCreate(quizId, session, {
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

    questionId = questionCreateResponse.questionId;
  });

  afterEach(() => {
    clear();
  });

  describe('adminQuizGameStart - Success Cases', () => {
    test.each([
      { autoStartNum: VALID_AUTO_START_NUM, description: 'Valid Case' },
      {
        autoStartNum: MIN_AUTO_START_NUM,
        description: 'Valid Case with zero autoStartNum',
      },
      {
        autoStartNum: MAX_AUTO_START_NUM,
        description: 'Valid Case with maximum autoStartNum of 50',
      },
    ])('adminQuizGameStart - $description', ({ autoStartNum }) => {
      const response = adminQuizGameStart(session, quizId, autoStartNum) as {
        gameId: number;
      };
      expect(response).toStrictEqual({ gameId: expect.any(Number) });
    });
  });

  describe('adminQuizGameStart - Failure Cases', () => {
    test('adminQuizGameStart - Invalid session', () => {
      const response = adminQuizGameStart(
        session + 'invalid',
        quizId,
        VALID_AUTO_START_NUM
      );
      expect(response).toBe(HTTP_STATUS.INVALID_SESSION);
    });
    test('adminQuizGameStart - Empty session', () => {
      const response = adminQuizGameStart('', quizId, VALID_AUTO_START_NUM);
      expect(response).toBe(HTTP_STATUS.INVALID_SESSION);
    });
    test('adminQuizGameStart - no questions in quiz', () => {
      adminQuizQuestionRemove(quizId, questionId, session);
      const response = adminQuizGameStart(
        session,
        quizId,
        VALID_AUTO_START_NUM
      );
      expect(response).toBe(HTTP_STATUS.EMPTY_QUIZ);
    });
    test('adminQuizGameStart - autoStartNum is greater than 50', () => {
      const response = adminQuizGameStart(
        session,
        quizId,
        INVALID_AUTO_START_NUM
      );
      expect(response).toBe(HTTP_STATUS.INVALID_AUTO_START_NUM);
    });
    test('adminQuizGameStart - Unauthorised user', () => {
      const registerResponse = adminAuthRegister(
        anotherEmail,
        anotherPassword,
        anotherFirstName,
        anotherLastName
      ) as { session: string };
      const anotherSession = registerResponse.session;
      const response = adminQuizGameStart(
        anotherSession,
        quizId,
        VALID_AUTO_START_NUM
      );
      expect(response).toBe(HTTP_STATUS.UNAUTHORIZED);
    });
    test('adminQuizGameStart - More than 10 games not in END state', () => {
      for (let i = 0; i < 10; i++) {
        adminQuizGameStart(session, quizId, VALID_AUTO_START_NUM);
      }
      const response = adminQuizGameStart(
        session,
        quizId,
        VALID_AUTO_START_NUM
      );
      expect(response).toBe(HTTP_STATUS.TOO_MANY_GAMES);
    });
  });
});
