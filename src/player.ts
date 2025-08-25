/// /////////////////////////////////////////////////////////////////////////////
//                             FUNCTION IMPORTS                               //
/// /////////////////////////////////////////////////////////////////////////////
import { GameState, getData, setData, Player, Question } from './dataStore';

import {
  validPlayerName, uniquePlayerName, generatePlayerStructure, findPlayerById,
  validPlayerId,
  playerCanRequestHints,
  generateHintPrompt,
  fetchGeneratedHint,
  adjustScoresForAllPlayers,
} from './helpers/playerHelpers';

import {
  validGameId,
  gameIsJoinable,
  getUsersRankedByScore,
  calculateQuestionResults,
  findGameByPlayerId,
  validateGameState,
  validateQuestionPosition,
  validateGameStateForAnswerSubmission,
  validateAnswerIds,
  calculateTimeTaken,
  validateQuestionPositionInGame,
  calculatePlayerQuestionResults
} from './helpers/gameHelpers';

import { BadRequestError, ForbiddenError } from './errors';
import {
  GameFinalResults,
  QuestionResults,
  PlayerStatus,
  PlayerQuestionInfo,
} from './interfaces';

/// /////////////////////////////////////////////////////////////////////////////
//                              Player Functions                              //
/// /////////////////////////////////////////////////////////////////////////////
/// ////////////////////////////////////////////////////////////////////////////
//                              PLAYER JOIN GAME                              //
/// ////////////////////////////////////////////////////////////////////////////
/**
 * Player joins a game.
 *
 * @param {number} gameId - Id of the game to be joined.
 * @param {string} playerName - Name of the player joining the game.
 * ...
 *
 * @returns {Object}
 *   - Returns { playerId: number } if the player successfully joins the game.
 *  - Returns an error message if the question can not be successfully
 *    moved, in the form of `{ error: string }`.
 */
export function playerJoinGame(
  gameId: number,
  playerName: string
): { playerId: number } {
  if (!validGameId(gameId)) {
    throw new BadRequestError('GameId does not refer to a valid game');
  }
  if (!gameIsJoinable(gameId)) {
    throw new BadRequestError('Game is not in the LOBBY state');
  }

  if (playerName !== '' && !validPlayerName(playerName)) {
    throw new BadRequestError('Invalid Player Name');
  }

  if (playerName !== '' && !uniquePlayerName(gameId, playerName)) {
    throw new BadRequestError('Name of user is not unique');
  }

  return generatePlayerStructure(gameId, playerName);
}

/// ////////////////////////////////////////////////////////////////////////////
//                                PLAYER STATUS                                //
/// ////////////////////////////////////////////////////////////////////////////
/**
 * Get the status of a guest player that has already joined a game
 *
 * @param {number} playerId - Id of the player to get the status of.
 * ...
 *
 * @returns {Object}
 *   - Returns
 *  { "state": GameState,
 *    "numQuestions": number,
 *    "atQuestion": number }
 *  if the player exists.
 *  - Returns an error message if the player could not be found, in the form of
 *  `{ error: string }`.
 */
export function gamePlayerStatus(
  playerid: number
): PlayerStatus {
  validPlayerId(playerid);

  const data = getData();
  let gameStructure;
  for (const key of data.games) {
    for (const value of key.players) {
      if (value.playerId === playerid) {
        gameStructure = key;
      }
    }
  }

  const state = gameStructure.state;
  const atQuestion = gameStructure.atQuestion;
  const numQuestions = gameStructure.metadata.numQuestions;
  return { state, atQuestion, numQuestions };
}

/// ////////////////////////////////////////////////////////////////////////////
//                          PLAYER QUESTION INFO                              //
/// ////////////////////////////////////////////////////////////////////////////
/**
 * Get the information about a question that the guest player is on.
 * Question Position starts at 1.
 *
 * @param {number} playerId - Id of the player to get question information of.
 * @param {number} questionposition - Position of the question in the game.
 * ...
 *
 * @returns {Object}
 *   - Returns
 *  { "questionId": number,
 *    "question": string,
 *    "timeLimit": number,
 *    "thumbnailUrl": string,
 *    "points": number,
 *    "answerOptions": Array<{
 *     "answerId": number,
 *     "answer": string,
 *     "colour": string,
 *      }>,
 *  }
 *  if the player exists.
 *  - Returns an error message if the question information could not be retrieved,
 *  in the form of `{ error: string }`.
 */
export function gamePlayerQuestionInfo(
  playerId: number,
  questionposition: number
): PlayerQuestionInfo {
  const data = getData();

  validPlayerId(playerId);

  const gameStructure = findGameByPlayerId(data, playerId);

  validateGameState(gameStructure);

  validateQuestionPosition(gameStructure, questionposition);

  const questionIndex = questionposition - 1;
  const question = gameStructure.metadata.questions[questionIndex];

  return {
    questionId: question.questionId,
    question: question.question,
    timeLimit: question.timeLimit,
    thumbnailUrl: question.thumbnailUrl ?? '',
    points: question.points,
    answerOptions: question.answerOptions.map((option) => ({
      answerId: option.answerId,
      answer: option.answer,
      colour: option.colour,
    })),
  };
}

/// ////////////////////////////////////////////////////////////////////////////
//                          PLAYER ANSWER SUBMISSION                          //
/// ////////////////////////////////////////////////////////////////////////////
/**
 * Allow the current player to submit answer(s) to the currently active question.
 * Question position starts at 1
 * Note: An answer can be re-submitted once first selection is made,
 * as long as game is in the right state
 * @param {array<number>} answerIds - Array of answer IDs selected by the player.
 * @param {number} playerid - Id of the player to get question information of.
 * @param {number} questionposition - Position of the question in the game.
 * ...
 *
 * @returns {Object}
 *   - Returns {} if the player successfully submits the answer.
 *  - Returns an error message if the answers could not be successfully submitted
 *  in the form of `{ error: string }`.
 */
export function playerAnswerSubmission(
  answerIds: Array<number>,
  playerid: number,
  questionposition: number
): Record<string, never> | { error: string } {
  const data = getData();

  validPlayerId(playerid);

  const game = findGameByPlayerId(data, playerid);
  validateQuestionPositionInGame(game, questionposition);

  const player = findPlayerById(playerid);

  validateGameStateForAnswerSubmission(game, questionposition);

  const question = game.metadata.questions[questionposition - 1];
  validateAnswerIds(question, answerIds);

  const timeTaken = calculateTimeTaken(question);

  player.answers.push({
    questionId: question.questionId,
    answerIds: answerIds,
    timeTaken: timeTaken
  });

  return {};
}

/// ////////////////////////////////////////////////////////////////////////////
//                          PLAYER QUESTION RESULTS                           //
/// ////////////////////////////////////////////////////////////////////////////
/**
 * Get the results for a particular question of the game a player is playing in.
 * Question position starts at 1
 *
 * @param {number} playerid - Id of the player to get question information of.
 * @param {number} questionposition - Position of the question in the game.
 * ...
 *
 * @returns {Object}
 *   - Returns {
      *  "questionId": number,
      *   "playersCorrect": string[],
      *  "averageAnswerTime": number,
      *  "percentCorrect": number,
      *  }
 * if the player results could be successfully retrieved.
 *  - Returns an error message if the results could not be successfully retrieved
 *  in the form of `{ error: string }`.
 */
export function playerQuestionResults(
  playerid: number,
  questionPosition: number
): QuestionResults | { error: string } {
  const data = getData();
  const player: Player = findPlayerById(playerid);

  if (!player) {
    throw new BadRequestError('Player ID does not exist');
  }

  const game = findGameByPlayerId(data, playerid);
  const result = calculatePlayerQuestionResults(game, questionPosition);
  const questionIndex = questionPosition - 1;
  const question = game.metadata.questions[questionIndex] as Question;
  adjustScoresForAllPlayers(game, question);
  setData(data);
  return result;
}

/// ////////////////////////////////////////////////////////////////////////////
//                          PLAYER QUESTION RESULTS                           //
/// ////////////////////////////////////////////////////////////////////////////
/**
 * Get the final results for a whole game a player is playing in
 *
 * @param {number} playerid - Id of the player to get final results of.
 * ...
 *
 * @returns {Object}
 *   - Returns {
      *  "usersRankedByScore": {
      *     "playerName": string,
      *     "score": number } []
      *  "questionResults": {
      *    "questionId": number,
      *   "playersCorrect": string[],
      *   "averageAnswerTime": number,
      *  "percentCorrect": number} [],
      * }
 * if the final results could be successfully retrieved.
 *  - Returns an error message if the final results could not be successfully retrieved
 *  in the form of `{ error: string }`.
 */
export function gamePlayerFinalResults(
  playerId: number
): GameFinalResults | { error: string } {
  const data = getData();
  const game = findGameByPlayerId(data, playerId);
  if (game.state !== GameState.FINAL_RESULTS) {
    throw new BadRequestError('Game is not in FINAL_RESULTS state');
  }

  const usersRankedByScore = getUsersRankedByScore(game);
  const questionResults = calculateQuestionResults(game);

  return {
    usersRankedByScore,
    questionResults
  };
}

/// ////////////////////////////////////////////////////////////////////////////
//                          PLAYER QUESTION HINT                           //
/// ////////////////////////////////////////////////////////////////////////////
/**
 * Provides a hint to the player generated by an LLM for their current question if:
 *  1. They are performing poorly
 *  2. Taking too long to answer on average.
 * Hinting will be disabled if the player's performance improves beyond the threshold.

 *
 * @param {number} playerid - Id of the player to get hints for
 * @param {number} gameId - gameId that will provide hints
 * ...
 *
 * @returns {Object}
 *   - Returns { hint: string }
 * if the final results could be successfully retrieved.
 *  - Returns an error message if the final results could not be successfully retrieved
 *  in the form of `{ error: string }`.
 */

export function gamePlayerQuestionHint(
  playerId: number,
  gameId: number
): { hint: string } {
  const data = getData();

  const game = data.games.find(game => game.gameId === gameId);
  if (!game) {
    throw new BadRequestError('Game has not started or does not exist');
  }

  const player = game.players.find(player => player.playerId === playerId);
  if (!player) {
    throw new BadRequestError('PlayerId is not valid');
  }

  if (game.state !== GameState.QUESTION_OPEN) {
    throw new BadRequestError('Cannot ask for request unless question is open');
  }

  const questionThreshold = 2;
  if (game.atQuestion <= questionThreshold) {
    throw new ForbiddenError('Two or less questions in the game have been answered');
  }

  if (!playerCanRequestHints(player, game)) {
    throw new ForbiddenError('Player does not meet the requirements for a hint');
  }

  const currentQuestion = game.atQuestion - 1;
  const question = game.metadata.questions[currentQuestion];
  const prompt = generateHintPrompt(question);
  const generated = fetchGeneratedHint(prompt);
  return { hint: generated.hint };
}
