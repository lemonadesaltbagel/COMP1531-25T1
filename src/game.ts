/// /////////////////////////////////////////////////////////////////////////////
//                             FUNCTION IMPORTS                               //
/// /////////////////////////////////////////////////////////////////////////////
import {
  GameMetadata,
  GameState,
  getData,
  Player,
  setData,
  QuestionResult
} from './dataStore';

import { Action, GameFinalResults } from './interfaces';

import {
  findQuiz
} from './helpers/quizHelpers';

import {
  findUserFromSession,
} from './helpers/userHelpers';

import {
  getTimestamp,
  validateUserAndQuiz,
} from './helpers/helperFunctions';

import {
  findGameInQuiz,
  generateGameId,
  getUsersRankedByScore,
  calculateQuestionResults,
  isValidAction,
  clearGameTimer,
  beginCountdown,
  openQuestion,
  findGameByGameId,
} from './helpers/gameHelpers';

import { BadRequestError, ForbiddenError } from './errors';

/// /////////////////////////////////////////////////////////////////////////////
//                               GAME VIEW                                     //
/// /////////////////////////////////////////////////////////////////////////////
export function adminQuizGameView(
  session: string,
  quizId: number
): {activeGames: number[], inactiveGames: number[]} {
  const data = getData();

  const { quiz } = validateUserAndQuiz(session, quizId, data);

  const activeGames: number[] = [];
  const inactiveGames: number[] = [];
  for (const game of quiz.games) {
    if (game.state === GameState.END) {
      inactiveGames.push(game.gameId);
    } else {
      activeGames.push(game.gameId);
    }
  }

  return { activeGames, inactiveGames };
}

export function adminQuizGameStart(
  quizId: number,
  session: string,
  autoStartNum: number
): { gameId: number } {
  const data = getData();

  const { quiz } = validateUserAndQuiz(session, quizId, data);

  if (autoStartNum > 50) {
    throw new BadRequestError('autoStartNum must be less than or equal to 50');
  }

  let activeCount = 0;
  data.games.forEach((game) => {
    if (game.state !== GameState.END && game.metadata.quizId === quizId) {
      activeCount++;
    }
  });
  if (activeCount >= 10) {
    throw new BadRequestError('Maximum number of active games reached');
  }
  if (quiz.questions.length === 0) {
    throw new BadRequestError('Quiz has no questions');
  }

  const gameId = generateGameId();

  const quizMetadataCopy = {
    quizId: quiz.quizId,
    name: quiz.name,
    timeCreated: quiz.timeCreated,
    timeLastEdited: quiz.timeLastEdited,
    description: quiz.description,
    numQuestions: quiz.questions.length,
    questions: JSON.parse(JSON.stringify(quiz.questions)),
    timeLimit: quiz.timeLimit,
    thumbnailUrl: quiz.thumbnailUrl,
  };

  const newGame = {
    gameId: gameId,
    state: GameState.LOBBY,
    atQuestion: 0,
    metadata: quizMetadataCopy,
    players: [] as Player[],
    questionResult: [] as QuestionResult[],
    autoStartNum: autoStartNum,
  };

  data.games.push(newGame);
  quiz.games.push(newGame);
  quiz.timeLastEdited = getTimestamp();
  setData(data);
  return { gameId };
}

export function adminQuizGameStateUpdate(
  quizId: number,
  gameId: number,
  session: string,
  action: Action | number
): Record<string, never> | { error: string } {
  const data = getData();

  const { quiz } = validateUserAndQuiz(session, quizId, data);
  const game = findGameInQuiz(quiz, gameId);

  if (!isValidAction(action)) {
    throw new BadRequestError('Invalid Action');
  }

  clearGameTimer(gameId);

  const state = game.state;

  if (state === GameState.LOBBY) {
    if (action === Action.NEXT_QUESTION) {
      game.atQuestion++;
      beginCountdown(game);
    } else if (action === Action.END) {
      game.state = GameState.END;
    } else {
      throw new BadRequestError('Invalid action from LOBBY');
    }
  } else if (state === GameState.QUESTION_COUNTDOWN) {
    if (action === Action.SKIP_COUNTDOWN) {
      openQuestion(game);
    } else if (action === Action.END) {
      game.state = GameState.END;
    } else {
      throw new BadRequestError('Invalid action from QUESTION_COUNTDOWN');
    }
  } else if (state === GameState.QUESTION_OPEN) {
    if (action === Action.GO_TO_ANSWER) {
      game.state = GameState.ANSWER_SHOW;
    } else if (action === Action.END) {
      game.state = GameState.END;
    } else {
      throw new BadRequestError('Invalid action from QUESTION_OPEN');
    }
  } else if (state === GameState.QUESTION_CLOSE) {
    if (action === Action.NEXT_QUESTION) {
      game.atQuestion++;
      if (game.atQuestion <= game.metadata.questions.length) {
        beginCountdown(game);
      } else {
        throw new BadRequestError('Invalid action, Last Question');
      }
    } else if (action === Action.GO_TO_ANSWER) {
      game.state = GameState.ANSWER_SHOW;
    } else if (action === Action.GO_TO_FINAL_RESULTS) {
      game.state = GameState.FINAL_RESULTS;
    } else if (action === Action.END) {
      game.state = GameState.END;
    } else {
      throw new BadRequestError('Invalid action from QUESTION_CLOSE');
    }
  } else if (state === GameState.ANSWER_SHOW) {
    if (action === Action.NEXT_QUESTION) {
      game.atQuestion++;
      if (game.atQuestion <= game.metadata.questions.length) {
        beginCountdown(game);
      } else {
        throw new BadRequestError('Invalid action, Last Question');
      }
    } else if (action === Action.GO_TO_FINAL_RESULTS) {
      game.state = GameState.FINAL_RESULTS;
    } else if (action === Action.END) {
      game.state = GameState.END;
    } else {
      throw new BadRequestError('Invalid action from ANSWER_SHOW');
    }
  } else if (state === GameState.FINAL_RESULTS) {
    if (action === Action.END) {
      game.state = GameState.END;
    } else {
      throw new BadRequestError('Invalid action from FINAL_RESULTS');
    }
  } else if (state === GameState.END) {
    throw new BadRequestError('Game is already finished');
  }
  findGameByGameId(gameId).state = game.state;
  findGameByGameId(gameId).atQuestion = game.atQuestion;
  findGameByGameId(gameId).questionResult = game.questionResult;
  findGameByGameId(gameId).players = game.players;
  findGameByGameId(gameId).metadata = game.metadata;
  setData(data);
  return {};
}

export function adminQuizGameStatus(
  quizId: number,
  gameid: number,
  session: string
): {
  state: GameState;
  atQuestion: number;
  players: string[];
  metadata: GameMetadata;
} {
  const data = getData();
  const { quiz } = validateUserAndQuiz(session, quizId, data);
  const game = findGameInQuiz(quiz, gameid);

  return {
    state: game.state,
    atQuestion: game.atQuestion,
    players: game.players.map((player) => player.name),
    metadata: {
      quizId: game.metadata.quizId,
      name: game.metadata.name,
      timeCreated: game.metadata.timeCreated,
      timeLastEdited: game.metadata.timeLastEdited,
      description: game.metadata.description,
      numQuestions: game.metadata.numQuestions,
      questions: game.metadata.questions,
      timeLimit: game.metadata.timeLimit,
      thumbnailUrl: game.metadata.thumbnailUrl,
    },
  };
}

export function adminQuizGameFinalResults(
  quizId: number,
  gameId: number,
  session: string
): GameFinalResults | { error: string } {
  const data = getData();

  const user = findUserFromSession(session);

  const quiz = findQuiz(quizId, data);
  if (quiz.userId !== user.userId) {
    throw new ForbiddenError('User is not an owner of this quiz');
  }

  const game = findGameInQuiz(quiz, gameId);
  // Check if the game is in FINAL_RESULTS state
  if (game.state !== GameState.FINAL_RESULTS) {
    throw new BadRequestError('Game is not in the FINAL_RESULTS state');
  }

  const usersRankedByScore = getUsersRankedByScore(game);
  const questionResults = calculateQuestionResults(game);

  return {
    usersRankedByScore,
    questionResults
  };
}
