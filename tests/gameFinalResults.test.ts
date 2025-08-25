/// /////////////////////////////////////////////////////////////////////////////
//                             FUNCTION IMPORTS                               //
/// /////////////////////////////////////////////////////////////////////////////
import {
  adminAuthRegister,
  adminQuizCreate,
  adminQuizGameFinalResults,
  adminQuizGameStart,
  adminQuizGameStateUpdate,
  adminQuizQuestionCreate,
  clear,
  playerJoinGame
} from './wrapperFunctions';
import { GameFinalResults } from './interfaces';

/// /////////////////////////////////////////////////////////////////////////////
//                                 CONSTANTS                                  //
/// /////////////////////////////////////////////////////////////////////////////
const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORISED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404
};

/// /////////////////////////////////////////////////////////////////////////////
//                             INITIALISATION                                 //
/// /////////////////////////////////////////////////////////////////////////////
const validFirstName = 'Hayden';
const validLastName = 'Smith';
const validEmail = 'hayden.smith@unsw.edu.au';
const validPassword = 'password123';

const validQuizName = 'Sample Quiz';
const validQuizDescription = 'A quiz for testing purposes';

const validQuestion = {
  question: 'What is the capital of Australia?',
  timeLimit: 30,
  points: 5,
  answerOptions: [
    { answer: 'Sydney', correct: false },
    { answer: 'Melbourne', correct: false },
    { answer: 'Canberra', correct: true },
    { answer: 'Perth', correct: false }
  ]
};

const playerName = 'TestPlayer';

/// /////////////////////////////////////////////////////////////////////////////
//                                 TESTING                                    //
/// /////////////////////////////////////////////////////////////////////////////
describe('adminQuizGameFinalResults', () => {
  let sessionId: string;
  let quizId: number;
  let gameId: number;

  beforeEach(() => {
    clear();

    // Register admin and create quiz with question
    const registerResponse = adminAuthRegister(validEmail, validPassword,
      validFirstName, validLastName);
    sessionId = (registerResponse as { session: string }).session;

    const quizResponse = adminQuizCreate(sessionId, validQuizName, validQuizDescription);
    quizId = (quizResponse as { quizId: number }).quizId;

    // Add a question to the quiz
    adminQuizQuestionCreate(quizId, sessionId, validQuestion);

    // Start a game
    // the game is Lobby state by default, NOT FINAL_RESULTS!!
    const gameResponse = adminQuizGameStart(sessionId, quizId, 1);
    gameId = (gameResponse as { gameId: number }).gameId;

    // Player joins the game
    playerJoinGame(gameId, playerName);
  });

  afterEach(() => {
    clear();
  });

  describe('adminQuizGameFinalResults - Error Cases', () => {
    test('Returns 401 when session is invalid', () => {
      const response = adminQuizGameFinalResults(quizId, gameId, 'invalid-session');
      expect(response).toBe(HTTP_STATUS.UNAUTHORISED);
    });

    test('Returns 400 when game ID is invalid', () => {
      const response = adminQuizGameFinalResults(quizId, 999999, sessionId);
      expect(response).toBe(HTTP_STATUS.BAD_REQUEST);
    });

    test('Returns 400 when game is not in FINAL_RESULTS state', () => {
      // Game is in LOBBY state by default after creation
      const response = adminQuizGameFinalResults(quizId, gameId, sessionId);
      expect(response).toBe(HTTP_STATUS.BAD_REQUEST);
    });

    test("Returns 403 when quiz doesn't exist", () => {
      const nonExistentQuizId = 99999;
      const response = adminQuizGameFinalResults(nonExistentQuizId, gameId, sessionId);
      expect(response).toBe(HTTP_STATUS.FORBIDDEN);
    });

    test('Returns 403 when user is not an owner of this quiz', () => {
      // Create a new admin user
      const anotherAdminResponse = adminAuthRegister(
        'another@email.com',
        'password456',
        'Another',
        'Admin'
      );
      const anotherSessionId = (anotherAdminResponse as { session: string }).session;

      const response = adminQuizGameFinalResults(quizId, gameId, anotherSessionId);
      expect(response).toBe(HTTP_STATUS.FORBIDDEN);
    });
  });

  describe('adminQuizGameFinalResults - Success Cases', () => {
    test('Returns final results when game is in FINAL_RESULTS state', () => {
      // Start a new game
      const startGame = adminQuizGameStart(sessionId, quizId, 1);
      const newGameId = (startGame as { gameId: number }).gameId;

      // Player joins the game
      playerJoinGame(newGameId, 'FinalResultsPlayer');

      // NEXT_QUESTION (LOBBY -> QUESTION_COUNTDOWN)
      adminQuizGameStateUpdate(quizId, newGameId, sessionId, 'NEXT_QUESTION');
      // SKIP_COUNTDOWN (QUESTION_COUNTDOWN -> QUESTION_OPEN)
      adminQuizGameStateUpdate(quizId, newGameId, sessionId, 'SKIP_COUNTDOWN');
      // GO_TO_ANSWER (QUESTION_OPEN -> QUESTION_CLOSE -> ANSWER_SHOW)
      adminQuizGameStateUpdate(quizId, newGameId, sessionId, 'GO_TO_ANSWER');
      // GO_TO_FINAL_RESULTS (ANSWER_SHOW -> FINAL_RESULTS)
      adminQuizGameStateUpdate(quizId, newGameId, sessionId, 'GO_TO_FINAL_RESULTS');

      const response = adminQuizGameFinalResults(quizId, newGameId, sessionId);

      expect(typeof response).toBe('object');
      expect(response).toHaveProperty('usersRankedByScore');
      expect(response).toHaveProperty('questionResults');
      expect(Array.isArray((response as GameFinalResults).usersRankedByScore)).toBe(true);
      expect(Array.isArray((response as GameFinalResults).questionResults)).toBe(true);
    });
  });
});
