/// /////////////////////////////////////////////////////////////////////////////
//                             FUNCTION IMPORTS                               //
/// /////////////////////////////////////////////////////////////////////////////
import {
  adminAuthRegister,
  adminQuizCreate,
  adminQuizQuestionCreateV2,
  adminQuizGameStart,
  adminQuizGameStatus,
  clear,
} from './wrapperFunctions';

import { GameStatus, GameState } from './interfaces';
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
describe('adminQuizGameStatus', () => {
  let session: string;
  let quizId: number;
  let questionId: number;
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
    const questionCreateResponse = adminQuizQuestionCreateV2(quizId, session, {
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
    const startResult = adminQuizGameStart(
      session,
      quizId,
      VALID_AUTO_START_NUM
    ) as { gameId: number };
    gameId = startResult.gameId;
  });

  afterEach(() => {
    clear();
  });

  describe('adminQuizGameStatus - Success Cases', () => {
    test('adminQuizGameStatus - Valid Case', () => {
      const gameStatusResult = adminQuizGameStatus(
        session,
        quizId,
        gameId
      ) as GameStatus;
      expect(gameStatusResult).toStrictEqual({
        state: GameState.LOBBY,
        atQuestion: 0,
        players: [],
        metadata: {
          quizId: quizId,
          name: name,
          timeCreated: expect.any(Number),
          timeLastEdited: expect.any(Number),
          description: description,
          numQuestions: 1,
          questions: [
            {
              questionId: questionId,
              question: 'What is the capital of France?',
              timeLimit: 30,
              thumbnailUrl: '',
              points: 10,
              answerOptions: [
                {
                  answerId: expect.any(Number),
                  answer: 'Paris',
                  colour: expect.any(String),
                  correct: true,
                },
                {
                  answerId: expect.any(Number),
                  answer: 'London',
                  colour: expect.any(String),
                  correct: false,
                },
                {
                  answerId: expect.any(Number),
                  answer: 'Berlin',
                  colour: expect.any(String),
                  correct: false,
                },
                {
                  answerId: expect.any(Number),
                  answer: 'Madrid',
                  colour: expect.any(String),
                  correct: false,
                },
              ],
            },
          ],
          timeLimit: 30,
          thumbnailUrl: '',
        },
      });
    });
  });

  describe('adminQuizGameStatus - Error Cases', () => {
    test('adminQuizGameStatus - unauthorised session', () => {
      const createResponse = adminAuthRegister(
        anotherEmail,
        anotherPassword,
        anotherFirstName,
        anotherLastName
      ) as { session: string };
      const anotherSession = createResponse.session;
      const statusResult = adminQuizGameStatus(anotherSession, quizId, gameId);
      expect(statusResult).toBe(HTTP_STATUS.UNAUTHORIZED);
    });

    test('adminQuizGameStatus - invalid session', () => {
      const statusResult = adminQuizGameStatus(
        session + 'invalid',
        quizId,
        gameId
      );
      expect(statusResult).toBe(HTTP_STATUS.INVALID_SESSION);
    });

    test('adminQuizGameStatus - empty session', () => {
      const statusResult = adminQuizGameStatus('', quizId, gameId);
      expect(statusResult).toBe(HTTP_STATUS.EMPTY_SESSION);
    });

    test('adminQuizGameStatus - invalid quizId', () => {
      const statusResult = adminQuizGameStatus(session, quizId + 1, gameId);
      expect(statusResult).toBe(HTTP_STATUS.INVALID_QUIZ);
    });

    test('adminQuizGameStatus - invalid gameId', () => {
      const statusResult = adminQuizGameStatus(session, quizId, gameId + 1);
      expect(statusResult).toBe(HTTP_STATUS.INVALID_GAMEID);
    });
  });
});
