/// /////////////////////////////////////////////////////////////////////////////
//                             FUNCTION IMPORTS                               //
/// /////////////////////////////////////////////////////////////////////////////
import {
  adminAuthRegister,
  adminQuizCreate,
  adminQuizQuestionCreateV2,
  adminQuizGameStart,
  playerJoinGame,
  clear,
  adminQuizGameStateUpdate,
  playerAnswerSubmission,
  gamePlayerQuestionInfo,
  gamePlayerQuestionHint,
  playerQuestionResults,
} from './wrapperFunctions';
import { QuestionInfoV2 } from './interfaces';

function wait(seconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}
function advanceToNextQuestion() {
  adminQuizGameStateUpdate(quizId, gameId, session, 'NEXT_QUESTION');
  adminQuizGameStateUpdate(quizId, gameId, session, 'SKIP_COUNTDOWN');
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
const validPassword = 'passWord6';
const name = 'Quiz 1';
const description = 'Valid Quiz Description';
const validThumbnail1 = 'http://google.com/somethingyes1/image/path.jpg';
const validThumbnail2 = 'http://google.com/somethingyes2/image/path.jpg';
const validThumbnail3 = 'http://google.com/somethingyes4/image/path.jpg';
const validThumbnail4 = 'http://google.com/somethingyes4/image/path.jpg';
const validThumbnail5 = 'http://google.com/somethingyes5/image/path.jpg';

let session: string;
let quizId: number;
let gameId: number;
let validPlayerName: string;
let playerId: number;
let question1Answers: number[];
let question2Answers: number[];
let question3Answers: number[];
let question4Answers: number[];
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
    adminQuizQuestionCreateV2(
      quizId,
      session,
      {
        question: 'What is the capital of France?',
        timeLimit: 5,
        points: 10,
        answerOptions: [
          { answer: 'Paris', correct: true },
          { answer: 'London', correct: false },
          { answer: 'Berlin', correct: false },
          { answer: 'Madrid', correct: false },
        ],
        thumbnailUrl: validThumbnail1
      }
    ) as { questionId: number };
    adminQuizQuestionCreateV2(
      quizId,
      session,
      {
        question: 'What is the capital of England?',
        timeLimit: 5,
        points: 10,
        answerOptions: [
          { answer: 'Paris', correct: false },
          { answer: 'London', correct: true },
          { answer: 'Berlin', correct: false },
          { answer: 'Madrid', correct: false },
        ],
        thumbnailUrl: validThumbnail2
      }
    ) as { questionId: number };
    adminQuizQuestionCreateV2(
      quizId,
      session,
      {
        question: 'What is the capital of India?',
        timeLimit: 5,
        points: 10,
        answerOptions: [
          { answer: 'Paris', correct: false },
          { answer: 'Berlin', correct: false },
          { answer: 'New Delhi', correct: true },
          { answer: 'Madrid', correct: false },
        ],
        thumbnailUrl: validThumbnail3
      }
    ) as { questionId: number };
    adminQuizQuestionCreateV2(
      quizId,
      session,
      {
        question: 'What is the capital of Australia?',
        timeLimit: 5,
        points: 10,
        answerOptions: [
          { answer: 'Paris', correct: false },
          { answer: 'Berlin', correct: false },
          { answer: 'Madrid', correct: false },
          { answer: 'Canberra', correct: true },
        ],
        thumbnailUrl: validThumbnail4
      }
    ) as { questionId: number };
    adminQuizQuestionCreateV2(
      quizId,
      session,
      {
        question: 'What is the capital city of Italy?',
        timeLimit: 5,
        points: 10,
        answerOptions: [
          { answer: 'Rome', correct: true },
          { answer: 'Paris', correct: false },
          { answer: 'Monte Carlo', correct: false },
          { answer: 'Madrid', correct: false },
        ],
        thumbnailUrl: validThumbnail5
      }
    ) as { questionId: number };
    const gameStartResponse = adminQuizGameStart(
      session,
      quizId,
      VALID_AUTO_START_NUM
    ) as { gameId: number };
    gameId = gameStartResponse.gameId;
    validPlayerName = 'Yuchao Jiang';
    const playerJoinresponse = playerJoinGame(gameId, validPlayerName) as { playerId: number };
    playerId = playerJoinresponse.playerId;
});

describe('Success Cases', () => {
  test('Player Receives Hints', () => {
    advanceToNextQuestion();
    questionPosition = 1;
    const questionInfoRes1 = gamePlayerQuestionInfo(
      playerId,
      questionPosition) as QuestionInfoV2;
    question1Answers = questionInfoRes1.answerOptions.map(option => option.answerId);
    let incorrect = 1;
    playerAnswerSubmission([question1Answers[incorrect]], playerId, questionPosition);
    adminQuizGameStateUpdate(quizId, gameId, session, 'GO_TO_ANSWER');
    playerQuestionResults(playerId, questionPosition);
    advanceToNextQuestion();
    questionPosition = 2;
    incorrect = 0;
    const questionInfoRes2 = gamePlayerQuestionInfo(
      playerId,
      questionPosition) as QuestionInfoV2;
    question2Answers = questionInfoRes2.answerOptions.map(option => option.answerId);
    playerAnswerSubmission([question2Answers[incorrect]], playerId, questionPosition);
    adminQuizGameStateUpdate(quizId, gameId, session, 'GO_TO_ANSWER');
    playerQuestionResults(playerId, questionPosition);
    advanceToNextQuestion();
    const result = gamePlayerQuestionHint(playerId, gameId);
    expect(result).toStrictEqual({ hint: expect.any(String) });
  });

  test('Hints disable after player begins to be performing better', () => {
    advanceToNextQuestion();
    questionPosition = 1;
    const questionInfoRes1 = gamePlayerQuestionInfo(
      playerId,
      questionPosition) as QuestionInfoV2;
    question1Answers = questionInfoRes1.answerOptions.map(option => option.answerId);
    let incorrect = 1;
    playerAnswerSubmission([question1Answers[incorrect]], playerId, questionPosition);
    adminQuizGameStateUpdate(quizId, gameId, session, 'GO_TO_ANSWER');
    playerQuestionResults(playerId, questionPosition);
    advanceToNextQuestion();
    questionPosition = 2;
    incorrect = 0;
    const questionInfoRes2 = gamePlayerQuestionInfo(
      playerId,
      questionPosition) as QuestionInfoV2;
    question2Answers = questionInfoRes2.answerOptions.map(option => option.answerId);
    playerAnswerSubmission([question2Answers[incorrect]], playerId, questionPosition);
    adminQuizGameStateUpdate(quizId, gameId, session, 'GO_TO_ANSWER');
    playerQuestionResults(playerId, questionPosition);
    advanceToNextQuestion();
    const result = gamePlayerQuestionHint(playerId, gameId);
    expect(result).toStrictEqual({ hint: expect.any(String) });
    questionPosition = 3;
    let correct = 2;
    const questionInfoRes3 = gamePlayerQuestionInfo(
      playerId,
      questionPosition) as QuestionInfoV2;
    question3Answers = questionInfoRes3.answerOptions.map(option => option.answerId);
    playerAnswerSubmission([question3Answers[correct]], playerId, questionPosition);
    adminQuizGameStateUpdate(quizId, gameId, session, 'GO_TO_ANSWER');
    playerQuestionResults(playerId, questionPosition);
    advanceToNextQuestion();
    questionPosition = 4;
    correct = 3;
    const questionInfoRes4 = gamePlayerQuestionInfo(
      playerId,
      questionPosition) as QuestionInfoV2;
    question4Answers = questionInfoRes4.answerOptions.map(option => option.answerId);
    playerAnswerSubmission([question4Answers[correct]], playerId, questionPosition);
    adminQuizGameStateUpdate(quizId, gameId, session, 'GO_TO_ANSWER');
    playerQuestionResults(playerId, questionPosition);
    advanceToNextQuestion();
    expect(gamePlayerQuestionHint(playerId, gameId)).toBe(HTTP_STATUS.FORBIDDEN);
  });

  test('Receives hint because performing 50% worse than other player', () => {
    const validPlayer2Name = 'AlexLum';
    const playerJoinresponse = playerJoinGame(gameId, validPlayer2Name) as { playerId: number };
    const playerId2 = playerJoinresponse.playerId;
    advanceToNextQuestion();
    questionPosition = 1;
    const questionInfoRes1 = gamePlayerQuestionInfo(
      playerId,
      questionPosition) as QuestionInfoV2;
    question1Answers = questionInfoRes1.answerOptions.map(option => option.answerId);
    let incorrect = 1;
    let correct = 0;
    playerAnswerSubmission([question1Answers[incorrect]], playerId, questionPosition);
    playerAnswerSubmission([question1Answers[correct]], playerId2, questionPosition);
    adminQuizGameStateUpdate(quizId, gameId, session, 'GO_TO_ANSWER');
    playerQuestionResults(playerId, questionPosition);
    advanceToNextQuestion();
    questionPosition = 2;
    incorrect = 0;
    correct = 1;
    const questionInfoRes2 = gamePlayerQuestionInfo(
      playerId,
      questionPosition) as QuestionInfoV2;
    question2Answers = questionInfoRes2.answerOptions.map(option => option.answerId);
    playerAnswerSubmission([question2Answers[incorrect]], playerId, questionPosition);
    playerAnswerSubmission([question1Answers[correct]], playerId, questionPosition);
    adminQuizGameStateUpdate(quizId, gameId, session, 'GO_TO_ANSWER');
    playerQuestionResults(playerId, questionPosition);
    advanceToNextQuestion();
    const result = gamePlayerQuestionHint(playerId, gameId);
    expect(result).toStrictEqual({ hint: expect.any(String) });
  });

  test.skip('Player recieves hints because his answers are too slow', async () => {
    advanceToNextQuestion();
    questionPosition = 1;
    const questionInfoRes1 = gamePlayerQuestionInfo(
      playerId,
      questionPosition) as QuestionInfoV2;
    question1Answers = questionInfoRes1.answerOptions.map(option => option.answerId);
    let correct = 0;
    const questionTime = questionInfoRes1.timeLimit;
    const threshold = 0.85 * questionTime;
    await wait(threshold);
    playerAnswerSubmission([question1Answers[correct]], playerId, questionPosition);
    adminQuizGameStateUpdate(quizId, gameId, session, 'GO_TO_ANSWER');
    playerQuestionResults(playerId, questionPosition);
    advanceToNextQuestion();
    questionPosition = 2;
    correct = 1;
    const questionInfoRes2 = gamePlayerQuestionInfo(
      playerId,
      questionPosition) as QuestionInfoV2;
    question2Answers = questionInfoRes2.answerOptions.map(option => option.answerId);
    const questionTime2 = questionInfoRes2.timeLimit;
    const threshold2 = 0.85 * questionTime2;
    await wait(threshold2);
    playerAnswerSubmission([question2Answers[correct]], playerId, questionPosition);
    adminQuizGameStateUpdate(quizId, gameId, session, 'GO_TO_ANSWER');
    playerQuestionResults(playerId, questionPosition);
    advanceToNextQuestion();
    const result = gamePlayerQuestionHint(playerId, gameId);
    expect(result).toStrictEqual({ hint: expect.any(String) });
  }, 20000);
});

describe('Error Cases', () => {
  test('Game is still in the lobby state', () => {
    expect(gamePlayerQuestionHint(playerId, gameId)).toBe(HTTP_STATUS.BAD_REQUEST);
  });

  test('Game is in Question Cooldown not answer open state', () => {
    adminQuizGameStateUpdate(quizId, gameId, session, 'NEXT_QUESTION');
    expect(gamePlayerQuestionHint(playerId, gameId)).toBe(HTTP_STATUS.BAD_REQUEST);
  });

  test('Game is in answer show state not in question open', () => {
    adminQuizGameStateUpdate(quizId, gameId, session, 'NEXT_QUESTION');
    adminQuizGameStateUpdate(quizId, gameId, session, 'SKIP_COUNTDOWN');
    adminQuizGameStateUpdate(quizId, gameId, session, 'GO_TO_ANSWER');
    expect(gamePlayerQuestionHint(playerId, gameId)).toBe(HTTP_STATUS.BAD_REQUEST);
  });

  test('GameId is not valid', () => {
    adminQuizGameStateUpdate(quizId, gameId, session, 'NEXT_QUESTION');
    adminQuizGameStateUpdate(quizId, gameId, session, 'SKIP_COUNTDOWN');
    const invalidGameId = gameId + 1;
    expect(gamePlayerQuestionHint(playerId, invalidGameId)).toBe(HTTP_STATUS.BAD_REQUEST);
  });

  test('PlayerId is invalid', () => {
    adminQuizGameStateUpdate(quizId, gameId, session, 'NEXT_QUESTION');
    adminQuizGameStateUpdate(quizId, gameId, session, 'SKIP_COUNTDOWN');
    const invalidPlayerId = playerId + 1;
    expect(gamePlayerQuestionHint(invalidPlayerId, gameId)).toBe(HTTP_STATUS.BAD_REQUEST);
  });

  test('Trying to retreive hints on first question', () => {
    adminQuizGameStateUpdate(quizId, gameId, session, 'NEXT_QUESTION');
    adminQuizGameStateUpdate(quizId, gameId, session, 'SKIP_COUNTDOWN');
    questionPosition = 1;
    const questionInfoRes = gamePlayerQuestionInfo(playerId, questionPosition) as QuestionInfoV2;
    question1Answers = questionInfoRes.answerOptions.map(option => option.answerId);
    expect(gamePlayerQuestionHint(playerId, gameId)).toBe(HTTP_STATUS.FORBIDDEN);
  });

  test('Trying to retrieve hints on the second question', () => {
    adminQuizGameStateUpdate(quizId, gameId, session, 'NEXT_QUESTION');
    adminQuizGameStateUpdate(quizId, gameId, session, 'SKIP_COUNTDOWN');
    questionPosition = 1;
    const questionInfoRes = gamePlayerQuestionInfo(playerId, questionPosition) as QuestionInfoV2;
    question1Answers = questionInfoRes.answerOptions.map(option => option.answerId);
    const incorrect = 2;
    playerAnswerSubmission([question1Answers[incorrect]], playerId, questionPosition);
    adminQuizGameStateUpdate(quizId, gameId, session, 'GO_TO_ANSWER');
    playerQuestionResults(playerId, questionPosition);
    adminQuizGameStateUpdate(quizId, gameId, session, 'NEXT_QUESTION');
    adminQuizGameStateUpdate(quizId, gameId, session, 'SKIP_COUNTDOWN');
    expect(gamePlayerQuestionHint(playerId, gameId)).toBe(HTTP_STATUS.FORBIDDEN);
  });

  test('Player answers all questions correctly so cannot retreieve hint', () => {
    adminQuizGameStateUpdate(quizId, gameId, session, 'NEXT_QUESTION');
    adminQuizGameStateUpdate(quizId, gameId, session, 'SKIP_COUNTDOWN');
    questionPosition = 1;
    const questionInfoRes1 = gamePlayerQuestionInfo(
      playerId,
      questionPosition) as QuestionInfoV2;
    question1Answers = questionInfoRes1.answerOptions.map(option => option.answerId);
    let correct = 0;
    playerAnswerSubmission([question1Answers[correct]], playerId, questionPosition);
    adminQuizGameStateUpdate(quizId, gameId, session, 'GO_TO_ANSWER');
    playerQuestionResults(playerId, questionPosition);
    adminQuizGameStateUpdate(quizId, gameId, session, 'NEXT_QUESTION');
    adminQuizGameStateUpdate(quizId, gameId, session, 'SKIP_COUNTDOWN');
    questionPosition = 2;
    correct = 1;
    const questionInfoRes2 = gamePlayerQuestionInfo(
      playerId,
      questionPosition) as QuestionInfoV2;
    question2Answers = questionInfoRes2.answerOptions.map(option => option.answerId);
    playerAnswerSubmission([question2Answers[correct]], playerId, questionPosition);
    adminQuizGameStateUpdate(quizId, gameId, session, 'GO_TO_ANSWER');
    playerQuestionResults(playerId, questionPosition);
    adminQuizGameStateUpdate(quizId, gameId, session, 'NEXT_QUESTION');
    adminQuizGameStateUpdate(quizId, gameId, session, 'SKIP_COUNTDOWN');
    expect(gamePlayerQuestionHint(playerId, gameId)).toBe(HTTP_STATUS.FORBIDDEN);
  });
});
