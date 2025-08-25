/// ////////////////////////////////////////////////////////////////////////////
//                                  IMPORTS                                   //
/// ////////////////////////////////////////////////////////////////////////////
import { BadRequestError } from '../errors';
import {
  DataStore,
  Quiz,
  getData,
  GameState,
  Game,
  Player,
  setData,
  Question,
  saveData
} from '../dataStore';

import { getTimestamp } from './helperFunctions';

import {
  QuestionResults,
  PlayerResults,
  Action
} from '../interfaces';

/// ////////////////////////////////////////////////////////////////////////////
//                             HELPER FUNCTIONS                               //
/// ////////////////////////////////////////////////////////////////////////////

/// ////////////////////////////////////////////////////////////////////////////
//                              FIND GAME IN QUIZ                             //
/// ////////////////////////////////////////////////////////////////////////////
export function findGameInQuiz(
  quiz: Quiz,
  gameId: number
): Game {
  const game = quiz.games.find((game) => game.gameId === gameId);
  if (!game) {
    throw new BadRequestError('Invalid game ID.');
  }
  return game;
}

/// ////////////////////////////////////////////////////////////////////////////
//                              GENERATE GAME ID                              //
/// ////////////////////////////////////////////////////////////////////////////
export function generateGameId(): number {
  const data = getData();
  let highestId = 0;
  for (const game of data.games) {
    if (game.gameId > highestId) {
      highestId = game.gameId;
    }
  }
  return highestId + 1;
}

/// ////////////////////////////////////////////////////////////////////////////
//                              VALID GAME ID                                 //
/// ////////////////////////////////////////////////////////////////////////////
export function validGameId(
  gameId: number
): boolean {
  const data = getData();
  for (const key of data.games) {
    if (key.gameId === gameId) {
      return true;
    }
  }
  return false;
}

/// ////////////////////////////////////////////////////////////////////////////
//                              GAME IS JOINABLE                              //
/// ////////////////////////////////////////////////////////////////////////////
export function gameIsJoinable(
  gameId: number
): boolean {
  const data = getData();
  for (const key of data.games) {
    if (key.gameId === gameId) {
      if (key.state === GameState.LOBBY) { return true; }
    }
  }
  return false;
}

/// ////////////////////////////////////////////////////////////////////////////
//                            RANK USERS BY SCORE                             //
/// ////////////////////////////////////////////////////////////////////////////
export function getUsersRankedByScore(game: Game): PlayerResults[] {
  const usersRankedByScore: PlayerResults[] = [];
  game.players.sort((a, b) => b.score - a.score);
  for (const p of game.players) {
    const playerName = p.name;
    const score = p.score;

    usersRankedByScore.push({
      playerName,
      score
    });
  }
  return usersRankedByScore;
}

/// ////////////////////////////////////////////////////////////////////////////
//                         CALCULATE QUESTION RESULTS                         //
/// ////////////////////////////////////////////////////////////////////////////
export function calculateQuestionResults(game: Game): QuestionResults[] {
  const questionResults: QuestionResults[] = [];
  for (const q of game.metadata.questions) {
    const questionId = q.questionId;
    const playersCorrect = getPlayersCorrectCount(game, questionId);
    const averageAnswerTime = playerAverageAnswerTime(game.players, questionId);
    const percentCorrect = calculatePercentCorrect(game, questionId);

    questionResults.push({
      questionId,
      playersCorrect,
      averageAnswerTime,
      percentCorrect
    });
  }
  return questionResults;
}

/// ////////////////////////////////////////////////////////////////////////////
//                         GET PLAYERS CORRECT COUNT                          //
/// ////////////////////////////////////////////////////////////////////////////

export function getPlayersCorrectCount(game: Game, questionId: number): string[] {
  return game.players
    .filter(player => {
      const answer = player.answers?.find(ans => ans.questionId === questionId);

      const quiz = getData().quizzes.find(q => q.quizId === game.metadata.quizId);

      const question = quiz.questions.find(q => q.questionId === questionId);

      const correctAnswerIds = question.answerOptions
        .filter(option => option.correct)
        .map(option => option.answerId);

      // Check if player's answer matches the correct answers
      return answer &&
             JSON.stringify(answer.answerIds.sort()) === JSON.stringify(correctAnswerIds.sort());
    })
    .map(player => player.name);
}

/// ////////////////////////////////////////////////////////////////////////////
//                             PERCENT CORRECT                                //
/// ////////////////////////////////////////////////////////////////////////////
export function calculatePercentCorrect(game: Game, questionId: number): number {
  const playersCorrect = getPlayersCorrectCount(game, questionId);
  if (playersCorrect.length === 0) return 0;

  const totalPlayers = game.players.length;
  return (playersCorrect.length / totalPlayers) * 100;
}

/// ////////////////////////////////////////////////////////////////////////////
//                                IS VALID ACTION                             //
/// ////////////////////////////////////////////////////////////////////////////
export function isValidAction(action: number | Action): action is Action {
  return Object.values(Action).includes(action);
}

/// ////////////////////////////////////////////////////////////////////////////
//                         FIND GAME IN QUIZ BY ID                            //
/// ////////////////////////////////////////////////////////////////////////////
export function findGameInQuizById(gameId: number, data: DataStore): Game {
  for (const quiz of data.quizzes) {
    const game = quiz.games.find(g => g.gameId === gameId);
    if (game) return game;
  }
}

// Timers for helperfunctions
const gameTimers: Record<number, ReturnType<typeof setTimeout>> = {};

/// ////////////////////////////////////////////////////////////////////////////
//                            CLEAR GAME TIMER                                //
/// ////////////////////////////////////////////////////////////////////////////
export function clearGameTimer(gameId: number) {
  if (gameTimers[gameId]) {
    clearTimeout(gameTimers[gameId]);
    delete gameTimers[gameId];
  }
}

/// ////////////////////////////////////////////////////////////////////////////
//                             BEGIN COUNTDOWN                                //
/// ////////////////////////////////////////////////////////////////////////////
export function beginCountdown(game: Game) {
  game.state = GameState.QUESTION_COUNTDOWN;
  gameTimers[game.gameId] = setTimeout(() => {
    const data = getData();
    const updatedGame = findGameInQuizById(game.gameId, data);
    openQuestion(updatedGame);
    setData(data);
    saveData();
  }, 3000);
}

/// ////////////////////////////////////////////////////////////////////////////
//                              OPEN QUESTION                                 //
/// ////////////////////////////////////////////////////////////////////////////
export function openQuestion(game: Game) {
  game.state = GameState.QUESTION_OPEN;
  const question = game.metadata.questions[game.atQuestion - 1];
  const timeLimit = question.timeLimit;
  // Implement timeOpened key within game.question
  question.timeOpened = getTimestamp();

  gameTimers[game.gameId] = setTimeout(() => {
    const data = getData();
    const updatedGame = findGameInQuizById(game.gameId, data);
    updatedGame.state = GameState.QUESTION_CLOSE;
    setData(data);
    saveData();
  }, timeLimit * 1000);
}

/// ////////////////////////////////////////////////////////////////////////////
//                         PLAYER ANSWER CHECKER                              //
/// ////////////////////////////////////////////////////////////////////////////
export function playerAnswerChecker(
  player: Player,
  question: Question
): boolean {
  // check if no answers from player

  if (player.answers.length === 0) {
    return false;
  }

  const correctOptions = question.answerOptions.filter(options => options.correct);

  const correctAnswerId = correctOptions.map(answer => answer.answerId);

  const playerAnswerList = player.answers.find(answer => answer.questionId === question.questionId);
  if (!playerAnswerList) {
    return false;
  }
  const playerAnswerIds = playerAnswerList.answerIds;

  if (correctAnswerId.length !== playerAnswerIds.length) {
    return false;
  }

  for (const correctAnswer of correctAnswerId) {
    if (!playerAnswerIds.includes(correctAnswer)) {
      return false;
    }
  }
  return true;
}
/// ////////////////////////////////////////////////////////////////////////////
//                        PLAYER AVERAGE ANSWER TIME                          //
/// ////////////////////////////////////////////////////////////////////////////
export function playerAverageAnswerTime(allPlayers: Player[], questionid: number) {
  let totalTime = 0;

  for (const player of allPlayers) {
    for (const answer of player.answers) {
      if (answer.questionId === questionid) {
        totalTime += answer.timeTaken;
      }
    }
  }
  return totalTime / allPlayers.length;
}

/// ////////////////////////////////////////////////////////////////////////////
//                           FIND GAME BY PLAYERID                            //
/// ////////////////////////////////////////////////////////////////////////////
export function findGameByPlayerId(data: DataStore, playerId: number): Game {
  for (const game of data.games) {
    for (const player of game.players) {
      if (player.playerId === playerId) {
        return game;
      }
    }
  }
  throw new BadRequestError('Player ID does not exist');
}

/// ////////////////////////////////////////////////////////////////////////////
//                            VALIDATE GAME STATE                             //
/// ////////////////////////////////////////////////////////////////////////////
export function validateGameState(game: Game): void {
  if (game.state === GameState.LOBBY) {
    throw new BadRequestError('Game is in lobby');
  }
  if (game.state === GameState.QUESTION_COUNTDOWN) {
    throw new BadRequestError('Game is in Question Countdown');
  }
  if (game.state === GameState.FINAL_RESULTS) {
    throw new BadRequestError('Game is in Final Results');
  }
  if (game.state === GameState.END) {
    throw new BadRequestError('Game has ended');
  }
}
/// ////////////////////////////////////////////////////////////////////////////
//                        VALIDATE QUESTION POSITION                          //
/// ////////////////////////////////////////////////////////////////////////////
export function validateQuestionPosition(
  game: Game,
  questionPosition: number
): Record<string, never> {
  if (game.atQuestion !== questionPosition) {
    throw new BadRequestError('Game is not at requested question position');
  }
  return {};
}

/// ////////////////////////////////////////////////////////////////////////////
//                     VALIDATE QUESTION POSITION IN GAME                     //
/// ////////////////////////////////////////////////////////////////////////////
export function validateQuestionPositionInGame(
  game: Game,
  questionPosition: number
): Record<string, never> {
  if (questionPosition > game.metadata.numQuestions || questionPosition < 1) {
    throw new BadRequestError('Question Position is invalid for current game');
  }
  return {};
}

/// ////////////////////////////////////////////////////////////////////////////
//                 VALIDATE GAME STATE FOR ANSWER SUBMISSION                  //
/// ////////////////////////////////////////////////////////////////////////////
export function validateGameStateForAnswerSubmission(
  game: Game,
  questionPosition: number
): Record<string, never> {
  if (game.state !== GameState.QUESTION_OPEN) {
    throw new BadRequestError('Game is not in QUESTION_OPEN state');
  }
  if (game.atQuestion !== questionPosition) {
    throw new BadRequestError('Not at that question currently');
  }
  return {};
}

/// ////////////////////////////////////////////////////////////////////////////
//                             VALIDATE ANSWER IDS                            //
/// ////////////////////////////////////////////////////////////////////////////
export function validateAnswerIds(question: Question, answerIds: number[]): Record<string, never> {
  const validAnswerIds = question.answerOptions.map(option => option.answerId);
  if (!answerIds.every(id => validAnswerIds.includes(id))) {
    throw new BadRequestError('Includes invalid answer Ids');
  }
  if (new Set(answerIds).size !== answerIds.length) {
    throw new BadRequestError('Duplicate answer IDs provided');
  }
  if (answerIds.length === 0) {
    throw new BadRequestError('Needs at least one answerId');
  }
  return {};
}

/// ////////////////////////////////////////////////////////////////////////////
//                           CALCULATE TIME TAKEN                             //
/// ////////////////////////////////////////////////////////////////////////////
export function calculateTimeTaken(question: Question): number {
  const currentTime = getTimestamp();
  const questionBeginTime = question.timeOpened;
  if (!questionBeginTime) {
    throw new BadRequestError('Question has not been opened yet');
  }
  return currentTime - questionBeginTime;
}

/// ////////////////////////////////////////////////////////////////////////////
//                      CALCULATE PLAYER QUESTION RESULTS                     //
/// ////////////////////////////////////////////////////////////////////////////
export function calculatePlayerQuestionResults(
  game: Game,
  questionPosition: number
): QuestionResults {
  if (questionPosition > game.metadata.numQuestions || questionPosition < 1) {
    throw new BadRequestError('Question Position is invalid for current game');
  }

  if (game.state !== GameState.ANSWER_SHOW) {
    throw new BadRequestError('Question is not in the correct state');
  }

  if (game.atQuestion !== questionPosition) {
    throw new BadRequestError('Game is not currently on the same question');
  }

  const questionIndex = questionPosition - 1;
  const question: Question = game.metadata.questions[questionIndex];

  const playersCorrect = game.players
    .filter(player => playerAnswerChecker(player, question))
    .map(player => player.name);

  const averageAnswerTime = playerAverageAnswerTime(game.players, question.questionId);

  const percentCorrect = (playersCorrect.length / game.players.length) * 100;

  const questionResults: QuestionResults = {
    questionId: question.questionId,
    playersCorrect,
    averageAnswerTime,
    percentCorrect,
  };

  game.questionResult.push(questionResults);
  return questionResults;
}
/// ////////////////////////////////////////////////////////////////////////////
//                                ACTION PARSER                               //
/// ////////////////////////////////////////////////////////////////////////////
export function actionParser(action: string): Action {
  if (action === 'NEXT_QUESTION') {
    return Action.NEXT_QUESTION;
  }
  if (action === 'SKIP_COUNTDOWN') {
    return Action.SKIP_COUNTDOWN;
  }
  if (action === 'GO_TO_ANSWER') {
    return Action.GO_TO_ANSWER;
  }
  if (action === 'GO_TO_FINAL_RESULTS') {
    return Action.GO_TO_FINAL_RESULTS;
  }
  if (action === 'END') {
    return Action.END;
  }
  throw new BadRequestError('Invalid action');
}

/// ////////////////////////////////////////////////////////////////////////////
//                             FIND GAME BY GAMEID                            //
/// ////////////////////////////////////////////////////////////////////////////
export function findGameByGameId(gameId: number): Game {
  const data = getData();
  const game = data.games.find(g => g.gameId === gameId);

  return game;
}
