/// /////////////////////////////////////////////////////////////////////////////
//                             FUNCTION IMPORTS                               //
/// /////////////////////////////////////////////////////////////////////////////

import {
  adminAuthRegister,
  adminQuizCreate,
  adminQuizGameStart,
  adminQuizGameStateUpdate,
  playerJoinGame,
  playerQuestionResults,
  clear,
  playerAnswerSubmission,
  gamePlayerQuestionInfo,
  QuestionInfo,
  adminQuizGameStatus,
  adminQuizQuestionCreateV2
} from './wrapperFunctions';

import { GameStatus } from './interfaces';

function wait(seconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

/// /////////////////////////////////////////////////////////////////////////////
//                                 CONSTANTS                                  //
/// /////////////////////////////////////////////////////////////////////////////

const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  INVALID_QUESTION_POSITION: 400,
  INVALID_QUESTION_STATE: 400,
  INVALID_GAMEID: 400,
  INVALID_PLAYERID: 400,
  EMPTY_SESSION: 401,
  INVALID_SESSION: 401,
  UNAUTHORIZED: 403,
  INVALID_QUIZ: 403,
  FORBIDDEN: 403,
};

const VALID_AUTO_START_NUM = 5;
const COUNTDOWN_WAIT_TIME = 2;
const SHORTER_COUNTDOWN_WAIT_TIME = 1;

/// /////////////////////////////////////////////////////////////////////////////
//                             INITIALISATION                                 //
/// /////////////////////////////////////////////////////////////////////////////

const validFirstName = 'Hayden';
const validLastName = 'Smith';
const validEmail = 'hayden.smith@unsw.edu.au';
const validPassword = 'password6';
const name = 'Quiz 1';
const description = 'Valid Quiz Description';
const validPlayerName = 'Yuchao Jiang';
const secondValidPlayerName = 'Alex Lum';

const question1 = {
  question: 'What are the colours of the rainbow',
  timeLimit: 30,
  points: 10,
  answerOptions: [
    { answer: 'Red', correct: true },
    { answer: 'Orange', correct: true },
    { answer: 'Black', correct: false },
    { answer: 'Blue', correct: true },
  ],
};

const question2 = {
  question: 'What is the capital of France?',
  timeLimit: 30,
  points: 10,
  answerOptions: [
    { answer: 'Paris', correct: true },
    { answer: 'London', correct: false },
    { answer: 'Berlin', correct: false },
    { answer: 'Madrid', correct: false },
  ],
};

let session: string;
let quizId: number;
let questionId: number;
let secondQuestionId: number;
let gameId: number;
let playerId: number;
let secondPlayerId: number;
let questionOneAnswerIds: number[];
let questionTwoAnswerIds: number[];
let questionPosition: number;
let secondQuestionPosition: number;

beforeEach(() => {
  clear();
  // register user
  const registerResponse = adminAuthRegister(
    validEmail,
    validPassword,
    validFirstName,
    validLastName
  ) as { session: string };
  session = registerResponse.session;

  // create quiz
  const createResponse = adminQuizCreate(session, name, description) as {
    quizId: number;
  };
  quizId = createResponse.quizId;

  // create question 1
  const questionCreateResponse = adminQuizQuestionCreateV2(
    quizId,
    session,
    question1
  ) as { questionId: number };
  questionId = questionCreateResponse.questionId;

  // create Question 2
  const questionCreateResponse2 = adminQuizQuestionCreateV2(
    quizId,
    session,
    question2
  ) as { questionId: number };
  secondQuestionId = questionCreateResponse2.questionId;

  // start the game
  const gameStartResponse = adminQuizGameStart(
    session,
    quizId,
    VALID_AUTO_START_NUM
  ) as { gameId: number };
  gameId = gameStartResponse.gameId;

  const playerJoinResponse = playerJoinGame(gameId, validPlayerName) as { playerId: number };
  playerId = playerJoinResponse.playerId;

  const playerJoinResponse2 = playerJoinGame(
    gameId,
    secondValidPlayerName
  ) as { playerId: number };

  secondPlayerId = playerJoinResponse2.playerId;

  // Get game state to QUESTION_OPEN
  // From LOBBY to QUESTION_COUNTDOWN
  adminQuizGameStateUpdate(quizId, gameId, session, 'NEXT_QUESTION');

  // From QUESTION_COUNTDOWN to QUESTION_OPEN
  adminQuizGameStateUpdate(quizId, gameId, session, 'SKIP_COUNTDOWN');
  // Check gameStatusResponse
  const gameStatusResponse = adminQuizGameStatus(session, quizId, gameId) as GameStatus;
  questionPosition = gameStatusResponse.atQuestion;

  // retrieve answerIds
  const firstQuestionInfoResponse = gamePlayerQuestionInfo(
    playerId,
    questionPosition
  ) as QuestionInfo;
  questionOneAnswerIds = firstQuestionInfoResponse.answerOptions.map(option => option.answerId);
});

afterEach(() => {
  clear();
});

describe('questionResultsServer tests', () => {
  describe('Success Cases 1st question active with multiple correct answers', () => {
    test('One player submission of multiple correct answer with average wait time', async () => {
      // Wait for response to question
      await wait(COUNTDOWN_WAIT_TIME);

      playerAnswerSubmission([
        questionOneAnswerIds[0],
        questionOneAnswerIds[1],
        questionOneAnswerIds[3]
      ], playerId, questionPosition);
      adminQuizGameStateUpdate(quizId, gameId, session, 'GO_TO_ANSWER');

      expect(playerQuestionResults(playerId, questionPosition)).toStrictEqual({
        questionId: questionId,
        playersCorrect: ['Yuchao Jiang'],
        averageAnswerTime: 1,
        percentCorrect: 50,
      });
    });

    test('One person submission of 1 incorrect answer, (not enough options selected)', () => {
      playerAnswerSubmission([questionOneAnswerIds[1]], playerId, questionPosition);
      adminQuizGameStateUpdate(quizId, gameId, session, 'GO_TO_ANSWER');
      expect(playerQuestionResults(playerId, questionPosition)).toStrictEqual({
        questionId: questionId,
        playersCorrect: [],
        averageAnswerTime: 0,
        percentCorrect: 0,
      });
    });

    test(
      'One person submission of 1 incorrect answer (wrong option selected) with average time',
      async () => {
        // Wait for response to question
        await wait(COUNTDOWN_WAIT_TIME);
        playerAnswerSubmission([
          questionOneAnswerIds[1],
          questionOneAnswerIds[2],
          questionOneAnswerIds[3]
        ], playerId, questionPosition);

        adminQuizGameStateUpdate(quizId, gameId, session, 'GO_TO_ANSWER');
        expect(playerQuestionResults(playerId, questionPosition)).toStrictEqual({
          questionId: questionId,
          playersCorrect: [],
          averageAnswerTime: 1,
          percentCorrect: 0,
        });
      });

    test(
      'Two person submission of incorrect answers with answer time following each other',
      async () => {
        // Wait for response to question
        await wait(COUNTDOWN_WAIT_TIME);
        playerAnswerSubmission([questionOneAnswerIds[1]], playerId, questionPosition);

        // Wait for next response to question + wait time for first response
        await wait(COUNTDOWN_WAIT_TIME);
        playerAnswerSubmission([questionOneAnswerIds[2]], secondPlayerId, questionPosition);

        adminQuizGameStateUpdate(quizId, gameId, session, 'GO_TO_ANSWER');
        expect(playerQuestionResults(playerId, questionPosition)).toStrictEqual({
          questionId: questionId,
          playersCorrect: [],
          averageAnswerTime: 3,
          percentCorrect: 0,
        });
      });

    test('Two person submission of two correct answers at the same time', async () => {
      // Wait for response to question
      await wait(COUNTDOWN_WAIT_TIME);
      playerAnswerSubmission([
        questionOneAnswerIds[0],
        questionOneAnswerIds[1],
        questionOneAnswerIds[3]
      ], playerId, questionPosition);

      playerAnswerSubmission([
        questionOneAnswerIds[0],
        questionOneAnswerIds[1],
        questionOneAnswerIds[3]
      ], secondPlayerId, questionPosition);

      adminQuizGameStateUpdate(quizId, gameId, session, 'GO_TO_ANSWER');

      expect(playerQuestionResults(playerId, questionPosition)).toStrictEqual({
        questionId: questionId,
        playersCorrect: ['Yuchao Jiang', 'Alex Lum'],
        averageAnswerTime: 2,
        percentCorrect: 100,
      });
    });

    test(
      'Two submissions of incorrect answer and correct answer with varied answer time',
      async () => {
        // Wait for response to question
        await wait(COUNTDOWN_WAIT_TIME);
        playerAnswerSubmission([
          questionOneAnswerIds[0],
          questionOneAnswerIds[1],
          questionOneAnswerIds[3]
        ], playerId, questionPosition);

        // Wait for response to question + first response time
        await wait(SHORTER_COUNTDOWN_WAIT_TIME);
        playerAnswerSubmission([questionOneAnswerIds[1]], secondPlayerId, questionPosition);

        adminQuizGameStateUpdate(quizId, gameId, session, 'GO_TO_ANSWER');
        expect(playerQuestionResults(playerId, questionPosition)).toStrictEqual({
          questionId: questionId,
          playersCorrect: ['Yuchao Jiang'],
          averageAnswerTime: 2.5,
          percentCorrect: 50,
        });
      });
  });

  describe('Success Cases 2nd Question Active with one correct answer', () => {
    beforeEach(() => {
      // reset last question
      playerAnswerSubmission([
        questionOneAnswerIds[0],
        questionOneAnswerIds[1],
        questionOneAnswerIds[3]
      ], playerId, questionPosition);

      adminQuizGameStateUpdate(quizId, gameId, session, 'GO_TO_ANSWER');

      // move onto secnod question
      adminQuizGameStateUpdate(quizId, gameId, session, 'NEXT_QUESTION');

      // From QUESTION_COUNTDOWN to QUESTION_OPEN
      adminQuizGameStateUpdate(quizId, gameId, session, 'SKIP_COUNTDOWN');
      // Check gameStatusResponse
      const gameStatusResponse2 = adminQuizGameStatus(session, quizId, gameId) as GameStatus;

      // expect(gameStatusResponse.state).toStrictEqual(GameState.QUESTION_OPEN);
      secondQuestionPosition = gameStatusResponse2.atQuestion;

      const questionTwoInfoResponse = gamePlayerQuestionInfo(
        playerId,
        secondQuestionPosition
      ) as QuestionInfo;
      questionTwoAnswerIds = questionTwoInfoResponse.answerOptions.map(option => option.answerId);
    });

    test('1 player submission of 1 correct answer', () => {
      playerAnswerSubmission(
        [questionTwoAnswerIds[0]],
        playerId,
        secondQuestionPosition
      );

      adminQuizGameStateUpdate(quizId, gameId, session, 'GO_TO_ANSWER');
      expect(playerQuestionResults(playerId, secondQuestionPosition)).toStrictEqual({
        questionId: secondQuestionId,
        playersCorrect: ['Yuchao Jiang'],
        averageAnswerTime: expect.any(Number),
        percentCorrect: 50,
      });
    });

    test('Submission of 1 correct answers by multiple people', () => {
      playerAnswerSubmission(
        [questionTwoAnswerIds[0]],
        playerId,
        secondQuestionPosition
      );
      playerAnswerSubmission(
        [questionTwoAnswerIds[0]],
        secondPlayerId,
        secondQuestionPosition
      );
      adminQuizGameStateUpdate(quizId, gameId, session, 'GO_TO_ANSWER');
      expect(playerQuestionResults(playerId, secondQuestionPosition)).toStrictEqual({
        questionId: secondQuestionId,
        playersCorrect: ['Yuchao Jiang', 'Alex Lum'],
        averageAnswerTime: expect.any(Number),
        percentCorrect: 100,
      });
    });

    test('One player submission of multiple incorrect answer question', () => {
      playerAnswerSubmission(
        [questionTwoAnswerIds[2]], // wrong answer
        playerId,
        questionPosition
      );
      adminQuizGameStateUpdate(quizId, gameId, session, 'GO_TO_ANSWER');
      expect(playerQuestionResults(playerId, secondQuestionPosition)).toStrictEqual({
        questionId: secondQuestionId,
        playersCorrect: [],
        averageAnswerTime: expect.any(Number),
        percentCorrect: 0,
      });
    });

    test('Multiple submissions of incorrect answers for multiple answer question', () => {
      playerAnswerSubmission(
        [questionTwoAnswerIds[0],
          questionTwoAnswerIds[1],
          questionTwoAnswerIds[2], // wrong answer (incorrect length)
          questionTwoAnswerIds[3]],
        playerId,
        secondQuestionPosition
      );

      playerAnswerSubmission(
        [questionTwoAnswerIds[0],
          questionTwoAnswerIds[2], // wrong answer
          questionTwoAnswerIds[3]],
        secondPlayerId,
        secondQuestionPosition
      );
      adminQuizGameStateUpdate(quizId, gameId, session, 'GO_TO_ANSWER');
      expect(playerQuestionResults(playerId, secondQuestionPosition)).toStrictEqual({
        questionId: secondQuestionId,
        playersCorrect: [],
        averageAnswerTime: expect.any(Number),
        percentCorrect: 0,
      });
    });
  });

  describe('Error Cases', () => {
    test('player ID does not exist', () => {
      playerAnswerSubmission([
        questionTwoAnswerIds[0],
        questionTwoAnswerIds[1],
        questionTwoAnswerIds[3]],
      playerId,
      questionPosition);
      adminQuizGameStateUpdate(quizId, gameId, session, 'GO_TO_ANSWER');
      const result = playerQuestionResults(9999, questionPosition);
      expect(result).toStrictEqual(HTTP_STATUS.INVALID_PLAYERID);
    });

    test('question position does not exist (too large)', () => {
      playerAnswerSubmission([questionTwoAnswerIds[0],
        questionTwoAnswerIds[1],
        questionTwoAnswerIds[3]],
      playerId,
      questionPosition);
      adminQuizGameStateUpdate(quizId, gameId, session, 'GO_TO_ANSWER');
      const result = playerQuestionResults(playerId, 9999);
      expect(result).toStrictEqual(HTTP_STATUS.INVALID_QUESTION_POSITION);
    });

    test('question position does not exist (less than 1)', () => {
      playerAnswerSubmission([
        questionTwoAnswerIds[0],
        questionTwoAnswerIds[1],
        questionTwoAnswerIds[3]],
      playerId,
      questionPosition
      );
      adminQuizGameStateUpdate(quizId, gameId, session, 'GO_TO_ANSWER');
      const result = playerQuestionResults(playerId, 0);
      expect(result).toStrictEqual(HTTP_STATUS.INVALID_QUESTION_POSITION);
    });

    test('Game is not currently on this question', () => {
      playerAnswerSubmission([
        questionTwoAnswerIds[0],
        questionTwoAnswerIds[1],
        questionTwoAnswerIds[3]],
      playerId,
      questionPosition);
      adminQuizGameStateUpdate(quizId, gameId, session, 'GO_TO_ANSWER');
      const result = playerQuestionResults(playerId, questionPosition + 1);
      expect(result).toStrictEqual(HTTP_STATUS.INVALID_QUESTION_POSITION);
    });

    test('Game is not in answer show state', () => {
      playerAnswerSubmission([questionOneAnswerIds[0]], playerId, questionPosition);
      adminQuizGameStateUpdate(quizId, gameId, session, 'END');
      expect(playerQuestionResults(playerId, 1)).toStrictEqual(HTTP_STATUS.INVALID_QUESTION_STATE);
    });
  });
});
