import {
  adminAuthRegister,
  adminQuizCreate,
  adminQuizGameStart,
  adminQuizGameStateUpdate,
  adminQuizQuestionCreate,
  clear,
  playerGetFinalResults,
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

describe('playerGetFinalResults', () => {
  let admin: { session: string };
  let quizId: number;
  let gameId: number;
  let playerId: number;

  beforeEach(() => {
    clear();

    // Register admin and create quiz with question
    const registerResponse = adminAuthRegister(
      validEmail,
      validPassword,
      validFirstName,
      validLastName
    );
    admin = { session: (registerResponse as { session: string }).session };

    const quizResponse = adminQuizCreate(admin.session, validQuizName, validQuizDescription);
    quizId = (quizResponse as { quizId: number }).quizId;

    // Add a question to the quiz
    adminQuizQuestionCreate(quizId, admin.session, validQuestion);

    // Start a game
    // the game is Lobby state by default, NOT FINAL_RESULTS!!
    const gameResponse = adminQuizGameStart(admin.session, quizId, 1);
    gameId = (gameResponse as { gameId: number }).gameId;

    // Player joins the game
    const playerResponse = playerJoinGame(gameId, playerName);
    playerId = (playerResponse as { playerId: number }).playerId;
  });

  afterEach(() => {
    clear();
  });

  describe('gamePlayerFinalResults - Error Cases', () => {
    test('Returns 400 when playerID is invalid', () => {
      const results = playerGetFinalResults(playerId - 1);
      expect(results).toBe(HTTP_STATUS.BAD_REQUEST);
    });

    test('Returns 400 when game is not in FINAL_RESULTS state', () => {
      // Game is in LOBBY state by default after creation
      const response = playerGetFinalResults(playerId);
      expect(response).toBe(HTTP_STATUS.BAD_REQUEST);
    });
  });

  describe('gamePlayerFinalResults - Success Cases', () => {
    test('Returns final results when game is in FINAL_RESULTS state', () => {
      // Use the existing game created in beforeEach instead of creating a new one

      // NEXT_QUESTION (LOBBY -> QUESTION_COUNTDOWN)
      adminQuizGameStateUpdate(quizId, gameId, admin.session, 'NEXT_QUESTION');
      // SKIP_COUNTDOWN (QUESTION_COUNTDOWN -> QUESTION_OPEN)
      adminQuizGameStateUpdate(quizId, gameId, admin.session, 'SKIP_COUNTDOWN');
      // GO_TO_ANSWER (QUESTION_OPEN -> ANSWER_SHOW)
      adminQuizGameStateUpdate(quizId, gameId, admin.session, 'GO_TO_ANSWER');
      // GO_TO_FINAL_RESULTS (ANSWER_SHOW -> FINAL_RESULTS)
      adminQuizGameStateUpdate(quizId, gameId, admin.session, 'GO_TO_FINAL_RESULTS');

      // Get final results
      const response = playerGetFinalResults(playerId);

      expect(typeof response).toBe('object');
      expect(response).toHaveProperty('usersRankedByScore');
      expect(response).toHaveProperty('questionResults');
      expect(Array.isArray((response as GameFinalResults).usersRankedByScore)).toBe(true);
      expect(Array.isArray((response as GameFinalResults).questionResults)).toBe(true);
    });
  });
});
