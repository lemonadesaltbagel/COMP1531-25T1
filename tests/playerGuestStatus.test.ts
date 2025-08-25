/// ////////////////////////////////////////////////////////////////////////////
//                             FUNCTION IMPORTS                               //
/// ////////////////////////////////////////////////////////////////////////////
import {
  adminAuthRegister,
  adminQuizCreate,
  adminQuizQuestionCreate,
  adminQuizGameStart,
  adminQuizGameStateUpdate,
  playerJoinGame,
  playerGuestStatus,
  clear,
} from './wrapperFunctions';

import { GameState } from './interfaces';
/// ////////////////////////////////////////////////////////////////////////////
//                                 CONSTANTS                                  //
/// ////////////////////////////////////////////////////////////////////////////
const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  INVALID_gameid: 400,
  INVALID_PLAYERNAME: 400,
  INVALID_PLAYERID: 400,
  EMPTY_SESSION: 401,
  INVALID_SESSION: 401,
  UNAUTHORIZED: 403,
  INVALID_QUIZ: 403,
  FORBIDDEN: 403,
};

const VALID_AUTO_START_NUM = 5;

/// ////////////////////////////////////////////////////////////////////////////
//                             INITIALISATION                                 //
/// ////////////////////////////////////////////////////////////////////////////
const validFirstName = 'Hayden';
const validLastName = 'Smith';
const validEmail = 'hayden.smith@unsw.edu.au';
const validPassword = 'password6';
const name = 'Quiz 1';
const description = 'Valid Quiz Description';

let session: string;
let quizId: number;
let gameId: number;
let validPlayerName: string;
let playerId: number;

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
  adminQuizQuestionCreate(quizId, session, {
    question: 'What is the capital of England?',
    timeLimit: 30,
    points: 10,
    answerOptions: [
      { answer: 'Paris', correct: false },
      { answer: 'London', correct: true },
      { answer: 'Berlin', correct: false },
      { answer: 'Madrid', correct: false },
    ],
  });
  adminQuizQuestionCreate(quizId, session, {
    question: 'What is the capital of India?',
    timeLimit: 30,
    points: 10,
    answerOptions: [
      { answer: 'Paris', correct: false },
      { answer: 'New Delhi', correct: true },
      { answer: 'Berlin', correct: false },
      { answer: 'Madrid', correct: false },
    ],
  });
  adminQuizQuestionCreate(quizId, session, {
    question: 'What is the capital of Spain?',
    timeLimit: 30,
    points: 10,
    answerOptions: [
      { answer: 'Paris', correct: false },
      { answer: 'New Delhi', correct: false },
      { answer: 'Berlin', correct: false },
      { answer: 'Madrid', correct: true },
    ],
  });
  const gameStartResponse = adminQuizGameStart(
    session,
    quizId,
    VALID_AUTO_START_NUM
  ) as { gameId: number };
  gameId = gameStartResponse.gameId;
  validPlayerName = 'Yuchao Jiang';
  const playerJoinresponse = playerJoinGame(gameId, validPlayerName) as {
    playerId: number;
  };
  playerId = playerJoinresponse.playerId;
});

afterEach(() => {
  clear();
});

describe('Success cases', () => {
  test('Get status when players in Lobby before game starts', () => {
    expect(playerGuestStatus(playerId)).toStrictEqual({
      state: GameState.LOBBY,
      numQuestions: 4,
      atQuestion: 0,
    });
  });

  test('Getting status of player before answering first question', () => {
    adminQuizGameStateUpdate(quizId, gameId, session, 'NEXT_QUESTION');
    expect(playerGuestStatus(playerId)).toStrictEqual({
      state: GameState.QUESTION_COUNTDOWN,
      numQuestions: 4,
      atQuestion: 1,
    });
  });

  test('Getting status of the player after going to next question multiple times', () => {
    adminQuizGameStateUpdate(quizId, gameId, session, 'NEXT_QUESTION');
    adminQuizGameStateUpdate(quizId, gameId, session, 'SKIP_COUNTDOWN');
    adminQuizGameStateUpdate(quizId, gameId, session, 'GO_TO_ANSWER');
    adminQuizGameStateUpdate(quizId, gameId, session, 'NEXT_QUESTION');
    expect(playerGuestStatus(playerId)).toStrictEqual({
      state: GameState.QUESTION_COUNTDOWN,
      numQuestions: 4,
      atQuestion: 2,
    });
  });

  test('Getting status of the player after skipping countdown', () => {
    adminQuizGameStateUpdate(quizId, gameId, session, 'NEXT_QUESTION');
    adminQuizGameStateUpdate(quizId, gameId, session, 'SKIP_COUNTDOWN');
    expect(playerGuestStatus(playerId)).toStrictEqual({
      state: GameState.QUESTION_OPEN,
      numQuestions: 4,
      atQuestion: 1,
    });
  });

  test('Getting status of the guest at the answer show state', () => {
    adminQuizGameStateUpdate(quizId, gameId, session, 'NEXT_QUESTION');
    adminQuizGameStateUpdate(quizId, gameId, session, 'SKIP_COUNTDOWN');
    adminQuizGameStateUpdate(quizId, gameId, session, 'GO_TO_ANSWER');
    expect(playerGuestStatus(playerId)).toStrictEqual({
      state: GameState.ANSWER_SHOW,
      numQuestions: 4,
      atQuestion: 1,
    });
  });

  test('Getting status of the guest at the answer show state', () => {
    adminQuizGameStateUpdate(quizId, gameId, session, 'NEXT_QUESTION');
    adminQuizGameStateUpdate(quizId, gameId, session, 'SKIP_COUNTDOWN');
    adminQuizGameStateUpdate(quizId, gameId, session, 'GO_TO_ANSWER');
    adminQuizGameStateUpdate(
      quizId,
      gameId,
      session,
      'GO_TO_FINAL_RESULTS'
    );
    expect(playerGuestStatus(playerId)).toStrictEqual({
      state: GameState.FINAL_RESULTS,
      numQuestions: 4,
      atQuestion: 1,
    });
  });

  test('Getting status of the player after calling for the end of the game', () => {
    adminQuizGameStateUpdate(quizId, gameId, session, 'END');
    expect(playerGuestStatus(playerId)).toStrictEqual({
      state: GameState.END,
      numQuestions: 4,
      atQuestion: 0,
    });
  });
});

describe('Error cases', () => {
  test('PlayerID does not exist', () => {
    const invalidPlayerId = playerId + 12312341241;
    expect(playerGuestStatus(invalidPlayerId)).toBe(
      HTTP_STATUS.INVALID_PLAYERID
    );
  });
});
