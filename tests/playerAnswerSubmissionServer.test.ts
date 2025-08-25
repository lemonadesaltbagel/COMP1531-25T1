/// /////////////////////////////////////////////////////////////////////////////
//                             FUNCTION IMPORTS                               //
/// /////////////////////////////////////////////////////////////////////////////
import { GameState, GameStatus } from './interfaces';
import {
  adminAuthRegister,
  adminQuizCreate,
  adminQuizQuestionCreate,
  adminQuizGameStart,
  clear,
  adminQuizGameStatus,
  adminQuizGameStateUpdate,
  gamePlayerQuestionInfo,
  playerJoinGame,
  playerAnswerSubmission,
  QuestionInfo,
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

const VALID_AUTO_START_NUM = 5;
/// /////////////////////////////////////////////////////////////////////////////
//                             INITIALISATION                                  //
/// /////////////////////////////////////////////////////////////////////////////
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
let questionPosition: number;
let answerIds: Array<number>;

const question = {
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

const question2 = {
  question: 'What is the capital of Australia?',
  timeLimit: 30,
  points: 10,
  answerOptions: [
    { answer: 'Sydney', correct: true },
    { answer: 'London', correct: false },
    { answer: 'Berlin', correct: false },
    { answer: 'Madrid', correct: false },
  ],
};

/// /////////////////////////////////////////////////////////////////////////////
//                                TESTING                                      //
/// /////////////////////////////////////////////////////////////////////////////

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
  adminQuizQuestionCreate(
    quizId,
    session,
    question
  ) as { questionId: number };
  adminQuizQuestionCreate(
    quizId,
    session,
    question2
  ) as { questionId: number };

  const gameStartResponse = adminQuizGameStart(
    session,
    quizId,
    VALID_AUTO_START_NUM
  ) as { gameId: number };
  gameId = gameStartResponse.gameId;
  validPlayerName = 'Yuchao Jiang';
  const playerJoinResponse = playerJoinGame(gameId, validPlayerName) as { playerId: number};
  playerId = playerJoinResponse.playerId;
});

afterEach(() => {
  clear();
});

describe('playerAnswerSubmissionServer', () => {
  beforeEach(() => {
    // Get game state to QUESTION_OPEN
    // From LOBBY to QUESTION_COUNTDOWN
    adminQuizGameStateUpdate(quizId, gameId, session, 'NEXT_QUESTION');
    // From QUESTION_COUNTDOWN to QUESTION_OPEN
    adminQuizGameStateUpdate(quizId, gameId, session, 'SKIP_COUNTDOWN');
    // Check gameStatusResponse
    const gameStatusResponse = adminQuizGameStatus(session, quizId, gameId) as GameStatus;
    expect(gameStatusResponse.state).toStrictEqual(GameState.QUESTION_OPEN);
    questionPosition = gameStatusResponse.atQuestion;
    // Use Player current question Info to get the answerIds
    const gamePlayerQuestionInfoResponse = gamePlayerQuestionInfo(
      playerId,
      questionPosition
    ) as QuestionInfo;
    answerIds = gamePlayerQuestionInfoResponse.answerOptions.map(option => option.answerId);
  });

  describe('Success Cases', () => {
    test('Successfully submits answer to currently active question', () => {
      const answerSubmitResponse = playerAnswerSubmission(
        [answerIds[0]],
        playerId,
        questionPosition
      );
      expect(answerSubmitResponse).toStrictEqual({});
    });
    test('Successfully allows resubmission of answer when in right state', () => {
      const answerSubmitResponseIntial = playerAnswerSubmission(
        [answerIds[0]],
        playerId,
        questionPosition
      );
      expect(answerSubmitResponseIntial).toStrictEqual({});

      const answerSubmitResponseFinal = playerAnswerSubmission(
        [answerIds[1]],
        playerId,
        questionPosition
      );
      expect(answerSubmitResponseFinal).toStrictEqual({});
    });
    test('Successfully submits multiple answers to currently active question', () => {
      const answerSubmitResponse = playerAnswerSubmission(
        [answerIds[0], answerIds[1]],
        playerId,
        questionPosition
      );
      expect(answerSubmitResponse).toStrictEqual({});
    });
  });

  describe('Error Cases', () => {
    test('Fails as player ID does not exist', () => {
      const answerSubmitResponse = playerAnswerSubmission(
        [answerIds[0]],
        playerId + 1,
        questionPosition
      );
      expect(answerSubmitResponse).toStrictEqual(HTTP_STATUS.BAD_REQUEST);
    });
    test('Fails as question position is not valid for the game this player is in', () => {
      const answerSubmitResponse = playerAnswerSubmission([answerIds[0]], playerId, 100);
      expect(answerSubmitResponse).toStrictEqual(HTTP_STATUS.BAD_REQUEST);
    });
    test('Fails as Game is not in QUESTION_OPEN state', () => {
      // updateGameStatus('END');
      adminQuizGameStateUpdate(quizId, gameId, session, 'END');
      const answerSubmitResponse = playerAnswerSubmission(
        [answerIds[0]],
        playerId,
        questionPosition
      );
      expect(answerSubmitResponse).toStrictEqual(HTTP_STATUS.BAD_REQUEST);
    });
    test('Fails as game is not currently on this question', () => {
      const answerSubmitResponse = playerAnswerSubmission(
        [answerIds[0]],
        playerId,
        questionPosition + 1
      );
      expect(answerSubmitResponse).toStrictEqual(HTTP_STATUS.BAD_REQUEST);
    });
    test('Fails as Answer IDs are not valid for this particular question', () => {
      const answerSubmitResponse = playerAnswerSubmission(
        [answerIds[0] + 999],
        playerId,
        questionPosition
      );
      expect(answerSubmitResponse).toStrictEqual(HTTP_STATUS.BAD_REQUEST);
    });
    test('Fails as there are duplicate answer IDs provided', () => {
      const answerSubmitResponseFinal = playerAnswerSubmission(
        [answerIds[0], answerIds[0]],
        playerId,
        questionPosition
      );
      expect(answerSubmitResponseFinal).toStrictEqual(HTTP_STATUS.BAD_REQUEST);
    });
    test('Fails as less than 1 answer ID was submitted', () => {
      const answerSubmitResponse = playerAnswerSubmission([], playerId, questionPosition);
      expect(answerSubmitResponse).toStrictEqual(HTTP_STATUS.BAD_REQUEST);
    });
  });
});
