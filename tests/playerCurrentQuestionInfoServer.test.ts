/// /////////////////////////////////////////////////////////////////////////////
//                             FUNCTION IMPORTS                               //
/// /////////////////////////////////////////////////////////////////////////////
import {
  adminAuthRegister,
  adminQuizCreate,
  adminQuizQuestionCreate,
  adminQuizGameStart,
  playerJoinGame,
  clear,
  adminQuizGameStateUpdate,
  gamePlayerQuestionInfo,
} from './wrapperFunctions';

/// /////////////////////////////////////////////////////////////////////////////
//                                 INTERFACES                                 //
/// /////////////////////////////////////////////////////////////////////////////
export enum Action {
  NEXT_QUESTION,
  SKIP_COUNTDOWN,
  GO_TO_ANSWER,
  GO_TO_FINAL_RESULTS,
  END,
}

/// /////////////////////////////////////////////////////////////////////////////
//                                 CONSTANTS                                  //
/// /////////////////////////////////////////////////////////////////////////////
const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  INVALID_gameId: 400,
  INVALID_PLAYERNAME: 400,
  INVALID_playerId: 400,
  EMPTY_SESSION: 401,
  INVALID_SESSION: 401,
  UNAUTHORIZED: 403,
  INVALID_QUIZ: 403,
  FORBIDDEN: 403,
};

const VALID_AUTO_START_NUM = 5;

/// /////////////////////////////////////////////////////////////////////////////
//                             INITIALISATION                                 //
/// /////////////////////////////////////////////////////////////////////////////
const validFirstName = 'Hayden';
const validLastName = 'Smith';
const validEmail = 'hayden.smith@unsw.edu.au';
const validPassword = 'password6';
const name = 'Quiz 1';
const description = 'Valid Quiz Description';

let session: string;
let quizId: number;
let questionId1: number;
let questionId2: number;
let questionId3: number;
let gameId: number;
let validPlayerName: string;
let playerId: number;
let questionPosition: number;

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
  const questionCreateResponse = adminQuizQuestionCreate(
    quizId,
    session,
    {
      question: 'What is the capital of France?',
      timeLimit: 30,
      points: 10,
      answerOptions: [
        { answer: 'Paris', correct: true },
        { answer: 'London', correct: false },
        { answer: 'Berlin', correct: false },
        { answer: 'Madrid', correct: false },
      ],
    }
  ) as { questionId: number };
  const questionCreateResponse2 = adminQuizQuestionCreate(
    quizId,
    session,
    {
      question: 'What is the capital of England?',
      timeLimit: 30,
      points: 10,
      answerOptions: [
        { answer: 'Paris', correct: false },
        { answer: 'London', correct: true },
        { answer: 'Berlin', correct: false },
        { answer: 'Madrid', correct: false },
      ],
    }
  ) as { questionId: number };
  const questionCreateResponse3 = adminQuizQuestionCreate(
    quizId,
    session,
    {
      question: 'What is the capital of India?',
      timeLimit: 30,
      points: 10,
      answerOptions: [
        { answer: 'Paris', correct: false },
        { answer: 'New Delhi', correct: true },
        { answer: 'Berlin', correct: false },
        { answer: 'Madrid', correct: false },
      ],
    }
  ) as { questionId: number };
  questionId1 = questionCreateResponse.questionId;
  questionId2 = questionCreateResponse2.questionId;
  questionId3 = questionCreateResponse3.questionId;
  const gameStartResponse = adminQuizGameStart(
    session,
    quizId,
    VALID_AUTO_START_NUM
  ) as { gameId: number };
  gameId = gameStartResponse.gameId;
  validPlayerName = 'Yuchao Jiang';
  const playerJoinresponse = playerJoinGame(gameId, validPlayerName) as { playerId: number };
  playerId = playerJoinresponse.playerId;
  questionPosition = 1;
});

afterEach(() => {
  clear();
});

describe('Success cases', () => {
  test('Getting correct return type when requesting questionInfo at position 1', () => {
    adminQuizGameStateUpdate(quizId, gameId, session, 'NEXT_QUESTION');
    adminQuizGameStateUpdate(quizId, gameId, session, 'SKIP_COUNTDOWN');
    const result = gamePlayerQuestionInfo(playerId, questionPosition);
    expect(result).toStrictEqual({
      questionId: questionId1,
      question: 'What is the capital of France?',
      timeLimit: 30,
      points: 10,
      thumbnailUrl: expect.any(String),
      answerOptions: expect.arrayContaining([
        expect.objectContaining({
          answerId: expect.any(Number),
          answer: expect.any(String),
          colour: expect.any(String),
        }),
      ]),
    });
  });

  test('Getting questionInfo for a question at position 2', () => {
    adminQuizGameStateUpdate(quizId, gameId, session, 'NEXT_QUESTION');
    adminQuizGameStateUpdate(quizId, gameId, session, 'SKIP_COUNTDOWN');
    adminQuizGameStateUpdate(quizId, gameId, session, 'GO_TO_ANSWER');
    adminQuizGameStateUpdate(quizId, gameId, session, 'NEXT_QUESTION');
    adminQuizGameStateUpdate(quizId, gameId, session, 'SKIP_COUNTDOWN');
    const actualQuestionPosition = questionPosition + 1;
    expect(gamePlayerQuestionInfo(playerId, actualQuestionPosition)).toStrictEqual({
      questionId: questionId2,
      question: 'What is the capital of England?',
      timeLimit: 30,
      points: 10,
      thumbnailUrl: expect.any(String),
      answerOptions: expect.arrayContaining([
        expect.objectContaining({
          answerId: expect.any(Number),
          answer: expect.any(String),
          colour: expect.any(String),
        }),
      ]),
    });
  });

  test('Getting questionInfo for final quesiton of a quiz', () => {
    adminQuizGameStateUpdate(quizId, gameId, session, 'NEXT_QUESTION');
    adminQuizGameStateUpdate(quizId, gameId, session, 'SKIP_COUNTDOWN');
    adminQuizGameStateUpdate(quizId, gameId, session, 'GO_TO_ANSWER');
    adminQuizGameStateUpdate(quizId, gameId, session, 'NEXT_QUESTION');
    adminQuizGameStateUpdate(quizId, gameId, session, 'SKIP_COUNTDOWN');
    adminQuizGameStateUpdate(quizId, gameId, session, 'GO_TO_ANSWER');
    adminQuizGameStateUpdate(quizId, gameId, session, 'NEXT_QUESTION');
    adminQuizGameStateUpdate(quizId, gameId, session, 'SKIP_COUNTDOWN');
    adminQuizGameStateUpdate(quizId, gameId, session, 'GO_TO_ANSWER');
    const actualQuestionPosition = questionPosition + 2;
    const result = gamePlayerQuestionInfo(playerId, actualQuestionPosition);
    expect(result).toStrictEqual({
      questionId: questionId3,
      question: 'What is the capital of India?',
      timeLimit: 30,
      points: 10,
      thumbnailUrl: expect.any(String),
      answerOptions: expect.arrayContaining([
        expect.objectContaining({
          answerId: expect.any(Number),
          answer: expect.any(String),
          colour: expect.any(String),
        }),
      ]),
    });
  });
});

describe('Error cases', () => {
  test('Trying to retrieve questionInfo when game is in the lobby', () => {
    expect(gamePlayerQuestionInfo(playerId, 0)).toBe(HTTP_STATUS.BAD_REQUEST);
  });
  test('Trying to retrieve questionInfo when game is in the QUESTION_COUNTDOWN', () => {
    adminQuizGameStateUpdate(quizId, gameId, session, 'NEXT_QUESTION');
    // should put the game in the countdown stage
    expect(gamePlayerQuestionInfo(playerId, 1)).toBe(HTTP_STATUS.BAD_REQUEST);
  });
  test('Trying to retrieve questionInfo when game is in the FINAL_RESULTS', () => {
    adminQuizGameStateUpdate(quizId, gameId, session, 'NEXT_QUESTION');
    adminQuizGameStateUpdate(quizId, gameId, session, 'GO_TO_FINAL_RESULTS');
    expect(gamePlayerQuestionInfo(playerId, 0)).toBe(HTTP_STATUS.BAD_REQUEST);
  });
  test('Trying to retrieve questionInfo when game is in the END', () => {
    adminQuizGameStateUpdate(quizId, gameId, session, 'END');
    expect(gamePlayerQuestionInfo(playerId, 0)).toBe(HTTP_STATUS.BAD_REQUEST);
  });
  test('Trying to retreive quizInfo when playerId does not exist', () => {
    const invalidplayerId = playerId + 123124;
    adminQuizGameStateUpdate(quizId, gameId, session, 'NEXT_QUESTION');
    adminQuizGameStateUpdate(quizId, gameId, session, 'SKIP_COUNTDOWN');
    expect(gamePlayerQuestionInfo(invalidplayerId, 1)).toBe(HTTP_STATUS.BAD_REQUEST);
  });
  test('Trying to retrieve quizInfo for an invalid question position', () => {
    const invalidQuestionPosition = -1;
    adminQuizGameStateUpdate(quizId, gameId, session, 'NEXT_QUESTION');
    adminQuizGameStateUpdate(quizId, gameId, session, 'SKIP_COUNTDOWN');
    expect(gamePlayerQuestionInfo(
      playerId,
      invalidQuestionPosition
    )).toBe(HTTP_STATUS.BAD_REQUEST);
  });
  test('Trying to retrieve quizInfo when game is not currently at question', () => {
    const wrongQuestionPosition = 3;
    adminQuizGameStateUpdate(quizId, gameId, session, 'NEXT_QUESTION');
    adminQuizGameStateUpdate(quizId, gameId, session, 'SKIP_COUNTDOWN');
    expect(gamePlayerQuestionInfo(
      playerId,
      wrongQuestionPosition
    )).toBe(HTTP_STATUS.BAD_REQUEST);
  });
});
