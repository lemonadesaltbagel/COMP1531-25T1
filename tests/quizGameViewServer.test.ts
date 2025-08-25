/// /////////////////////////////////////////////////////////////////////////////
//                             FUNCTION IMPORTS                               //
/// /////////////////////////////////////////////////////////////////////////////
import {
  adminAuthRegister,
  adminQuizCreate,
  adminQuizQuestionCreate,
  adminQuizGameStart,
  adminQuizGameStateUpdate,
  adminQuizGameView,
  clear,
} from './wrapperFunctions';

/// /////////////////////////////////////////////////////////////////////////////
//                                 CONSTANTS                                  //
/// /////////////////////////////////////////////////////////////////////////////
const HTTP_STATUS = {
  OK: 200,
  INVALID_GAMEID: 400,
  EMPTY_SESSION: 401,
  INVALID_SESSION: 401,
  UNAUTHORIZED: 403,
  INVALID_QUIZ: 403,
};

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
describe('adminQuizGameView', () => {
  let session: string;
  let quizId: number;
  let gameId: number;

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
    adminQuizQuestionCreate(quizId, session, {
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

  describe('adminQuizGameView - Success Cases', () => {
    test('adminQuizGameView - Valid Case', () => {
      const startResult = adminQuizGameStart(
        session,
        quizId,
        VALID_AUTO_START_NUM
      ) as { gameId: number };
      gameId = startResult.gameId;

      const gameViewResult = adminQuizGameView(session, quizId) as {
        activeGames: number[];
        inactiveGames: number[];
      };

      expect(gameViewResult).toStrictEqual({
        activeGames: [gameId],
        inactiveGames: [],
      });
    });
    test('adminQuizGameView - Valid Case with no active games', () => {
      const gameViewResult = adminQuizGameView(session, quizId) as {
        activeGames: number[];
        inactiveGames: number[];
      };

      expect(gameViewResult).toStrictEqual({
        activeGames: [],
        inactiveGames: [],
      });
    });
    test('adminQuizGameView - Valid Case with inactive games', () => {
      const startResult = adminQuizGameStart(
        session,
        quizId,
        VALID_AUTO_START_NUM
      ) as { gameId: number };
      gameId = startResult.gameId;

      adminQuizGameStateUpdate(quizId, gameId, session, 'END');
      const gameViewResult = adminQuizGameView(session, quizId) as {
        activeGames: number[];
        inactiveGames: number[];
      };

      expect(gameViewResult).toStrictEqual({
        activeGames: [],
        inactiveGames: [gameId],
      });
    });
    test('adminQuizGameView - Multiple Games', () => {
      const startResult = adminQuizGameStart(
        session,
        quizId,
        VALID_AUTO_START_NUM
      ) as { gameId: number };
      gameId = startResult.gameId;

      adminQuizGameStateUpdate(quizId, gameId, session, 'END');
      const anotherStartResult = adminQuizGameStart(
        session,
        quizId,
        VALID_AUTO_START_NUM
      ) as { gameId: number };
      const anotherGameId = anotherStartResult.gameId;
      adminQuizGameStateUpdate(quizId, anotherGameId, session, 'END');

      const anotherStartResult2 = adminQuizGameStart(
        session,
        quizId,
        VALID_AUTO_START_NUM
      ) as { gameId: number };
      const anotherGameId2 = anotherStartResult2.gameId;

      const anotherStartResult3 = adminQuizGameStart(
        session,
        quizId,
        VALID_AUTO_START_NUM
      ) as { gameId: number };
      const anotherGameId3 = anotherStartResult3.gameId;
      const gameViewResult = adminQuizGameView(session, quizId) as {
        activeGames: number[];
        inactiveGames: number[];
      };

      expect(gameViewResult).toStrictEqual({
        activeGames: [anotherGameId2, anotherGameId3],
        inactiveGames: [gameId, anotherGameId],
      });
    });
  });

  describe('adminQuizGameView - Failure Cases', () => {
    test('adminQuizGameView - Invalid session', () => {
      const response = adminQuizGameView(session + 'invalid', quizId) as number;
      expect(response).toBe(HTTP_STATUS.EMPTY_SESSION);
    });

    test('adminQuizGameView - Invalid quizId', () => {
      const response = adminQuizGameView(session, quizId + 1) as number;
      expect(response).toBe(HTTP_STATUS.INVALID_QUIZ);
    });

    test('adminQuizGameView - Empty session', () => {
      const response = adminQuizGameView('', quizId) as number;
      expect(response).toBe(HTTP_STATUS.EMPTY_SESSION);
    });
    test('adminQuizGameView - unauthorized', () => {
      const registerResponse = adminAuthRegister(
        anotherEmail,
        anotherPassword,
        anotherFirstName,
        anotherLastName
      ) as { session: string };
      const anotherSession = registerResponse.session;
      const response = adminQuizGameView(anotherSession, quizId) as number;
      expect(response).toBe(HTTP_STATUS.UNAUTHORIZED);
    });
  });
});
