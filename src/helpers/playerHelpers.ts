/// ////////////////////////////////////////////////////////////////////////////
//                                  IMPORTS                                   //
/// ////////////////////////////////////////////////////////////////////////////
import request from 'sync-request-curl';
import { isAlphanumeric } from 'validator';
import {
  getData,
  Player,
  PlayerAnswer,
  setData,
  Game,
  Question,
} from './../dataStore';

import { Action } from './../interfaces';

import randomstring from 'randomstring';

import { adminQuizGameStateUpdate } from '../game';
import { findGameInQuizById } from './gameHelpers';
import { findQuiz } from './quizHelpers';
import { findUser } from './userHelpers';
import { playerAnswerChecker } from './gameHelpers';
import { BadRequestError, ForbiddenError } from './../errors';
const HUGGINGFACE_API_TOKEN = 'add_your_token_here';

/// ////////////////////////////////////////////////////////////////////////////
//                             HELPER FUNCTIONS                               //
/// ////////////////////////////////////////////////////////////////////////////
/// ////////////////////////////////////////////////////////////////////////////
//                              GENERATE PLAYER ID                             //
/// ////////////////////////////////////////////////////////////////////////////
export function generatePlayerId(): number {
  const data = getData();
  let playerId = 0;
  for (const game of data.games) {
    playerId += game.players.length;
  }
  return playerId;
}

/// ////////////////////////////////////////////////////////////////////////////
//                              VALID PLAYER NAME                             //
/// ////////////////////////////////////////////////////////////////////////////
export function validPlayerName(
  playerName: string
): boolean {
  for (const key of playerName) {
    if (!isAlphanumeric(key) && key !== ' ') {
      return false;
    }
  }
  return true;
}

/// ////////////////////////////////////////////////////////////////////////////
//                              GENERATE PLAYER NAME                          //
/// ////////////////////////////////////////////////////////////////////////////
export function generatePlayerName(): string {
  let newPlayerName = '';
  let counter = 0;
  while (counter < 5) {
    const letter = randomstring.generate({
      length: 1,
      charset: 'alphabetic',
    });
    if (!newPlayerName.includes(letter)) {
      newPlayerName += letter;
      counter++;
    }
  }

  counter = 0;
  while (counter < 3) {
    const number = randomstring.generate({
      length: 1,
      charset: 'numeric'
    });
    if (!newPlayerName.includes(number)) {
      newPlayerName += number;
      counter++;
    }
  }
  return newPlayerName;
}

/// ////////////////////////////////////////////////////////////////////////////
//                            UNIQUE PLAYER NAME                              //
/// ////////////////////////////////////////////////////////////////////////////
export function uniquePlayerName(
  gameId: number,
  playerName: string
): boolean {
  const data = getData();
  let game;
  for (const key of data.games) {
    if (key.gameId === gameId) {
      game = key;
    }
  }

  for (const key of game.players) {
    if (key.name === playerName) {
      return false;
    }
  }
  return true;
}

/// ////////////////////////////////////////////////////////////////////////////
//                         GENERATE PLAYER STRUCTURE                          //
/// ////////////////////////////////////////////////////////////////////////////
export function generatePlayerStructure(
  gameId: number,
  playerName: string
): { playerId: number } {
  const data = getData();
  if (playerName === '') {
    playerName = generatePlayerName();
    while (!uniquePlayerName(gameId, playerName)) {
      playerName = generatePlayerName();
    }
  }
  let game;
  for (const key of data.games) {
    if (key.gameId === gameId) {
      game = key;
    }
  }
  const playerId = generatePlayerId();
  const newPlayer: Player = {
    name: playerName,
    playerId: playerId,
    answers: [] as PlayerAnswer[],
    score: 0,
    questionPosition: 0,
  };
  game.players.push(newPlayer);
  const { session } = findOwnerOfGame(gameId);
  if (game.players.length === game.autoStartNum && game.state === 'LOBBY') {
    adminQuizGameStateUpdate(game.metadata.quizId, gameId, session, Action.NEXT_QUESTION);
  }
  setData(data);
  return { playerId };
}

function findOwnerOfGame(
  gameId: number
): { userId: number, session: string } {
  const data = getData();
  const game = findGameInQuizById(gameId, data);
  const quizId = game.metadata.quizId;
  const quiz = findQuiz(quizId, data);

  const userId = quiz.userId;
  const user = findUser(userId, data);
  const validSession = user.sessions[0]; // can assume owner is logged in
  return { userId, session: validSession };
}
/// ////////////////////////////////////////////////////////////////////////////
//                              FIND PLAYER by ID                             //
/// ////////////////////////////////////////////////////////////////////////////
export function findPlayerById(playerid: number): Player {
  const data = getData();
  let foundPlayer = null;

  for (const game of data.games) {
    for (const player of game.players) {
      if (player.playerId === playerid) {
        foundPlayer = player;
        break;
      }
    }
  }

  return foundPlayer;
}
/// ////////////////////////////////////////////////////////////////////////////
//                                 VALID PLAYERID                             //
/// ////////////////////////////////////////////////////////////////////////////
export function validPlayerId(
  playerId: number
): boolean {
  const data = getData();
  for (const key of data.games) {
    for (const players of key.players) {
      if (players.playerId === playerId) {
        return true;
      }
    }
  }
  throw new BadRequestError('PlayedId is invalid');
}

export function averageCompetitorsScore(playerId: number, game: Game): number {
  let score = 0;
  for (const key of game.players) {
    if (key.playerId !== playerId) {
      score = score + key.score;
    }
  }
  const totalCompetitors = (game.players.length - 1);
  const average = score / totalCompetitors;
  return average;
}

export function generateHintPrompt(question: Question): string {
  return `
    You are a helper quiz owner.
    Provide a concise and subtle hint guiding the player towards the correct multiple choice answer.
    Base the hint off the information below.
    DO NOT reveal the answer directly
    DO NOT mention the correct option or the letter of the correct option
    The hint should can provide a guiding question or eliminate a wrong answer.
    Question: ${question.question}
    Question Options: ${question.answerOptions.map(opt => opt.answer).join(', ')}
    
    Provide the hint only.
  `;
}

export function fetchGeneratedHint(prompt: string): { hint: string } {
  const response = request(
    'POST',
    'https://api-inference.huggingface.co/models/google/flan-t5-base',
    {
      headers: {
        Authorization: `Bearer ${HUGGINGFACE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      json: { inputs: prompt },
    }
  );

  const responseBody = JSON.parse(response.getBody('utf8'));
  const rawHint = Array.isArray(responseBody)
    ? responseBody[0].generated_text
    : responseBody.generated_text;

  if (!rawHint || rawHint.trim().length === 0) {
    throw new ForbiddenError('Hint is empty');
  }

  const cleanedHint = rawHint.trim().replace(/\n/g, ' ');

  const finalHint = cleanedHint.length > 50
    ? cleanedHint.slice(0, 47).trim() + '...'
    : cleanedHint;

  return { hint: finalHint };
}

export function playerCanRequestHints(
  player: Player,
  game: Game
): boolean {
  if (game.players.length === 1) {
    const scoreThreshold = Math.floor(game.atQuestion / 2);
    if (player.score < scoreThreshold) {
      return true;
    }
    let sum = 0;
    for (const answer of player.answers) {
      sum = sum + answer.timeTaken;
    }
    const average = sum / player.answers.length;
    const currentQuestion = game.atQuestion - 1;
    const timeThreshold = 0.8 * game.metadata.questions[currentQuestion].timeLimit;
    if (average > timeThreshold) {
      return true;
    }
  } else {
    const multiPlayerThreshold = averageCompetitorsScore(player.playerId, game);
    if (player.score < multiPlayerThreshold) {
      return true;
    }
  }

  return false;
}

export function getPlayerAnswerTime(player: Player, questionId: number): number {
  const answer = player.answers.find(ans => ans.questionId === questionId);
  if (!answer) {
    return Infinity;
  } else {
    return answer.timeTaken;
  }
}

export function adjustScoresForAllPlayers(game: Game, question: Question): void {
  const data = getData();
  const correctPlayers = game.players.filter(p => playerAnswerChecker(p, question));
  const playerDetails = correctPlayers.map(p => ({
    playerId: p.playerId,
    player: p,
    time: getPlayerAnswerTime(p, question.questionId),
  }));

  playerDetails.sort((a, b) => a.time - b.time);
  playerDetails.forEach((entry, index) => {
    const scalingFactor = 1 / (index + 1);
    const score = question.points * scalingFactor;
    const roundedScore = Math.round(score);
    entry.player.score += roundedScore;
  });
  setData(data);
}
