import request from 'sync-request-curl';
import config from '../src/config.json';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';

const PORT: number = parseInt(process.env.PORT || config.port);
const HOST: string = process.env.IP || '127.0.0.1';
const SERVER_URL = `http://${HOST}:${PORT}`;
const TIMEOUT_MS = 10000;
/// ////////////////////////////////////////////////////////////////////////////
//                             FUNCTION IMPORTS                               //
/// ////////////////////////////////////////////////////////////////////////////
import {
  UserDetails,
  QuizInfo,
  QuestionCreate,
  QuestionCreateV2,
  GameStatus,
  GameFinalResults,
  QuestionResultInfo,
  QuizInfoV2,
  QuestionInfoV2,
} from './interfaces';

export interface QuestionInfo {
  questionId: number;
  question: string;
  timeLimit: number;
  points: number;
  answerOptions: AnswerOptionInfo[];
}

interface AnswerOptionInfo {
  answerId: number;
  answer: string;
  colour: string;
  correct: boolean;
}

export interface Question {
  question: string;
  timeLimit: number;
  points: number;
  answerOptions: AnswerOption[];
}

interface AnswerOption {
  answer: string;
  correct: boolean;
}

export interface PlayerResults {
  playerName: string,
  score: number
}

export interface QuestionResults {
  questionId: number,
  playersCorrect: string[],
  averageAnswerTime: number,
  percentCorrect: number
}

/// /////////////////////////////////////////////////////////////////////////////
//                             WRAPPER FUNCTIONS                              //
/// /////////////////////////////////////////////////////////////////////////////
/// ////////////////////////////////////////////////////////////////////////////
//                               DECLARATIONS                                 //
/// ////////////////////////////////////////////////////////////////////////////
const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
};
/// ////////////////////////////////////////////////////////////////////////////
//                             FUNCTION IMPORTS                               //
/// ////////////////////////////////////////////////////////////////////////////

export function adminAuthRegister(
  email: string,
  password: string,
  nameFirst: string,
  nameLast: string
): { session: string } | number {
  const res = request('POST', `http://${HOST}:${PORT}/v1/admin/auth/register`, {
    json: { email, password, nameFirst, nameLast },
  });

  const body = JSON.parse(res.body.toString());

  // If the status code is 400, return the error with a message
  if (res.statusCode === 400) {
    expect(body).toStrictEqual({ error: expect.any(String) });
    return res.statusCode;
  }

  // If registration is successful, return the sessionId
  return { session: body.session };
}

export function adminAuthLogin(
  email: string,
  password: string
): { session: string } | number {
  const res = request('POST', `http://${HOST}:${PORT}/v1/admin/auth/login`, {
    json: { email, password },
  });
  const body = JSON.parse(res.body.toString());
  if (res.statusCode === 400) {
    expect(body).toStrictEqual({ error: expect.any(String) });
    return res.statusCode;
  }
  return body;
}

export function clear(): Record<string, never> | { error: string } {
  const res = request('DELETE', `http://${HOST}:${PORT}/v1/clear`, {});

  const body = JSON.parse(res.body.toString());

  // Return empty object as expected
  return body;
}

export function adminQuizList(
  session: string
): { quizzes: { quizId: number; name: string }[] } | number {
  const res = request('GET', `http://${HOST}:${PORT}/v1/admin/quiz/list`, {
    headers: { session },
    timeout: TIMEOUT_MS,
  });

  const body = JSON.parse(res.body.toString());

  if (res.statusCode === 401) {
    expect(body).toStrictEqual({ error: expect.any(String) });
    return res.statusCode;
  }

  return body;
}

export function adminQuizCreate(
  session: string,
  name: string,
  description: string
): { quizId: number } | number {
  const res = request('POST', `http://${HOST}:${PORT}/v1/admin/quiz`, {
    headers: { session },
    json: { name, description },
    timeout: TIMEOUT_MS,
  });

  const body = JSON.parse(res.body.toString());

  if ([400, 401].includes(res.statusCode)) {
    expect(body).toStrictEqual({ error: expect.any(String) });
    return res.statusCode;
  }

  return body;
}

export function adminQuizDescriptionUpdate(
  session: string,
  quizId: number,
  description: string
): number {
  const res = request(
    'PUT',
    `http://${HOST}:${PORT}/v1/admin/quiz/${quizId}/description`,
    {
      headers: { session },
      json: { description },
    }
  );

  const body = JSON.parse(res.body.toString());

  if ([400, 401, 403].includes(res.statusCode)) {
    expect(body).toStrictEqual({ error: expect.any(String) });
    return res.statusCode;
  }
  expect(res.statusCode).toBe(200);
  return res.statusCode;
}

export function adminQuizInfo(
  session: string,
  quizId: number
): QuizInfo | number {
  const res = request('GET', `http://${HOST}:${PORT}/v1/admin/quiz/${quizId}`, {
    headers: { session },
    timeout: TIMEOUT_MS,
  });

  const body = JSON.parse(res.body.toString());

  if ([401, 403].includes(res.statusCode)) {
    expect(body).toStrictEqual({ error: expect.any(String) });
    return res.statusCode;
  }

  return body;
}

export function adminUserDetails(
  session: string
): { user: UserDetails } | number {
  const res = request('GET', `${SERVER_URL}/v1/admin/user/details`, {
    headers: { session },
    timeout: TIMEOUT_MS,
  });
  // do we need to consider if this is a valid JSON file being returned from the backend?
  const body = JSON.parse(res.body.toString());
  if (res.statusCode === 401 || res.statusCode === 500) {
    expect(body).toStrictEqual({ error: expect.any(String) });
    return res.statusCode;
  }
  return body;
}

export function adminUserDetailsUpdate(
  session: string,
  email: string,
  nameFirst: string,
  nameLast: string
): Record<string, never> | number {
  const res = request('PUT', `${SERVER_URL}/v1/admin/user/details`, {
    headers: { session },
    json: { email, nameFirst, nameLast },
    timeout: TIMEOUT_MS,
  });
  const body = JSON.parse(res.body.toString());

  if ([400, 401].includes(res.statusCode)) {
    expect(body).toStrictEqual({ error: expect.any(String) });
    return res.statusCode;
  }
  return body;
}

export function adminUserPasswordUpdate(
  session: string,
  oldPassword: string,
  newPassword: string
): Record<string, never> | number {
  const res = request('PUT', `${HOST}:${PORT}/v1/admin/user/password`, {
    headers: { session },
    json: { oldPassword, newPassword },
    timeout: TIMEOUT_MS,
  });

  const body = JSON.parse(res.body.toString());
  if ([400, 401].includes(res.statusCode)) {
    expect(body).toStrictEqual({ error: expect.any(String) });
    return res.statusCode;
  }
  expect(res.statusCode).toBe(200);
  return body;
}

export function adminAuthLogout(session: string): Record<string, never> | number {
  const res = request('POST', `http://${HOST}:${PORT}/v1/admin/auth/logout`, {
    headers: { session },
    timeout: TIMEOUT_MS,
  });

  const body = JSON.parse(res.body.toString());
  if ([401].includes(res.statusCode)) {
    expect(body).toStrictEqual({ error: expect.any(String) });
    // return res.statusCode
    return res.statusCode;
  }
  return body;
}

export function adminQuizRemove(quizid: number, session: string): Record<string, never> | number {
  const res = request(
    'DELETE',
    `http://${HOST}:${PORT}/v1/admin/quiz/${quizid}`,
    {
      headers: { session },
      timeout: TIMEOUT_MS,
    }
  );

  const body = JSON.parse(res.body.toString());
  if ([401, 403].includes(res.statusCode)) {
    expect(body).toStrictEqual({ error: expect.any(String) });
    return res.statusCode;
  }
  return body;
}

// Iter2
export function adminQuizTransfer(
  quizId: number,
  session: string,
  userEmail: string
): Record<string, never> | number {
  const res = request(
    'POST',
    `http://${HOST}:${PORT}/v1/admin/quiz/${quizId}/transfer`,
    {
      headers: { session },
      json: { userEmail },
      timeout: TIMEOUT_MS,
    }
  );

  const body = JSON.parse(res.body.toString());
  if ([400, 401, 403].includes(res.statusCode)) {
    expect(body).toStrictEqual({ error: expect.any(String) });
    return res.statusCode;
  }
  return body;
}

export function adminQuizQuestionCreate(
  quizId: number,
  session: string,
  question: QuestionCreate
): { questionId: number } | number {
  const res = request(
    'POST',
    `http://${HOST}:${PORT}/v1/admin/quiz/${quizId}/question`,
    {
      headers: { session },
      json: { questionBody: question },
      timeout: TIMEOUT_MS,
    }
  );

  const body = JSON.parse(res.body.toString());
  if ([400, 401, 403].includes(res.statusCode)) {
    expect(body).toStrictEqual({ error: expect.any(String) });
    return res.statusCode;
  }
  expect(res.statusCode).toBe(200);
  return body;
}

export function adminQuizNameUpdate(
  session: string,
  quizId: number,
  name: string
): Record<string, never> | number {
  const res = request(
    'PUT',
    `http://${HOST}:${PORT}/v1/admin/quiz/${quizId}/name`,
    {
      headers: { session },
      json: { name },
    }
  );

  const body = JSON.parse(res.body.toString());

  if ([400, 401, 403].includes(res.statusCode)) {
    expect(body).toStrictEqual({ error: expect.any(String) });
    return res.statusCode;
  }
  expect(res.statusCode).toBe(200);
  return res.statusCode;
}

export function adminQuizQuestionSuggestion(
  session: string,
  quizId: number
): { question: string } | number {
  const res = request(
    'GET',
    `http://${HOST}:${PORT}/v1/admin/quiz/${quizId}/question/suggestion`,
    {
      headers: { session },
      timeout: TIMEOUT_MS,
    }
  );

  const body = JSON.parse(res.body.toString());

  if ([401, 403, 500].includes(res.statusCode)) {
    expect(body).toStrictEqual({ error: expect.any(String) });
    return res.statusCode;
  }

  return body;
}

export function adminQuizQuestionRemove(
  quizId: number,
  questionId: number,
  session: string
): Record<string, never> | number {
  const res = request(
    'DELETE',
    `http://${HOST}:${PORT}/v1/admin/quiz/${quizId}/question/${questionId}`,
    {
      headers: { session },
      timeout: TIMEOUT_MS,
    }
  );

  const body = JSON.parse(res.body.toString());

  if ([400, 401, 403].includes(res.statusCode)) {
    expect(body).toStrictEqual({ error: expect.any(String) });
    return res.statusCode;
  }

  return body;
}

export function adminQuizQuestionRemoveV2(
  quizId: number,
  questionId: number,
  session: string
): Record<string, never> | number {
  const res = request(
    'DELETE',
    `http://${HOST}:${PORT}/v2/admin/quiz/${quizId}/question/${questionId}`,
    {
      headers: { session },
      timeout: TIMEOUT_MS,
    }
  );

  const body = JSON.parse(res.body.toString());

  if ([400, 401, 403].includes(res.statusCode)) {
    expect(body).toStrictEqual({ error: expect.any(String) });
    return res.statusCode;
  }

  return body;
}

export function adminQuizQuestionUpdate(
  quizId: number,
  questionId: number,
  session: string,
  questionBody: QuestionCreate
): Record<string, never> | number {
  const res = request(
    'PUT',
    `http://${HOST}:${PORT}/v1/admin/quiz/${quizId}/question/${questionId}`,
    {
      headers: { session },
      json: { questionBody },
      timeout: TIMEOUT_MS,
    }
  );

  const body = JSON.parse(res.body.toString());
  if ([400, 401, 403].includes(res.statusCode)) {
    expect(body).toStrictEqual({ error: expect.any(String) });
    return res.statusCode;
  }

  return body;
}

export function adminQuizQuestionMove(
  quizId: number,
  questionId: number,
  sessionId: string,
  newPosition: number
): Record<string, never> | number {
  const res = request(
    'PUT',
    `http://${HOST}:${PORT}/v1/admin/quiz/${quizId}/question/${questionId}/move`,
    {
      headers: {
        session: sessionId,
        'Content-Type': 'application/json',
      },
      json: { newPosition },
    }
  );
  const body = JSON.parse(res.body.toString());
  if ([400, 401, 403].includes(res.statusCode)) {
    expect(body).toStrictEqual({ error: expect.any(String) });
    return res.statusCode;
  }

  expect(res.statusCode).toBe(200);
  return body;
}
// Iter3

export function adminQuizInfoV2(
  session: string,
  quizId: number
): QuizInfoV2 | number {
  const res = request('GET', `http://${HOST}:${PORT}/v2/admin/quiz/${quizId}`, {
    headers: { session },
    timeout: TIMEOUT_MS,
  });

  const body = JSON.parse(res.body.toString());

  if ([401, 403].includes(res.statusCode)) {
    expect(body).toStrictEqual({ error: expect.any(String) });
    return res.statusCode;
  }

  return body;
}

export function adminQuizQuestionCreateV2(
  quizId: number,
  session: string,
  question: QuestionCreateV2
): { questionId: number } | number {
  const res = request(
    'POST',
    `http://${HOST}:${PORT}/v2/admin/quiz/${quizId}/question`,
    {
      headers: { session },
      json: { questionBody: question },
      timeout: TIMEOUT_MS,
    }
  );

  const body = JSON.parse(res.body.toString());
  if ([400, 401, 403].includes(res.statusCode)) {
    expect(body).toStrictEqual({ error: expect.any(String) });
    return res.statusCode;
  }
  expect(res.statusCode).toBe(200);
  return body;
}

export function adminQuizQuestionUpdateV2(
  quizId: number,
  questionId: number,
  session: string,
  questionBody: QuestionCreateV2
): Record<string, never> | number {
  const res = request(
    'PUT',
    `http://${HOST}:${PORT}/v2/admin/quiz/${quizId}/question/${questionId}`,
    {
      headers: { session },
      json: { questionBody },
      timeout: TIMEOUT_MS,
    }
  );

  const body = JSON.parse(res.body.toString());

  if ([400, 401, 403].includes(res.statusCode)) {
    expect(body).toStrictEqual({ error: expect.any(String) });
    return res.statusCode;
  }

  return body;
}

export function adminQuizThumbnailUpdate(
  quizId: number,
  session: string,
  thumbnailUrl: string
): { quizId: number } | number {
  const res = request(
    'PUT',
    `${SERVER_URL}/v1/admin/quiz/${quizId}/thumbnail`,
    {
      headers: { session },
      json: { thumbnailUrl },
      timeout: TIMEOUT_MS,
    }
  );

  const body = JSON.parse(res.body.toString());

  if ([400, 401, 403].includes(res.statusCode)) {
    expect(body).toStrictEqual({ error: expect.any(String) });
    return res.statusCode;
  }

  return body;
}

export function adminQuizGameView(
  session: string,
  quizId: number
): { activeGames: number[]; inactiveGames: number[] } | number {
  const res = request(
    'GET',
    `${SERVER_URL}/v1/admin/quiz/${quizId}/games`,
    {
      headers: { session },
      timeout: TIMEOUT_MS,
    }
  );
  const body = JSON.parse(res.body.toString());
  if (
    [
      HTTP_STATUS.BAD_REQUEST,
      HTTP_STATUS.UNAUTHORIZED,
      HTTP_STATUS.FORBIDDEN,
    ].includes(res.statusCode)
  ) {
    expect(body).toStrictEqual({ error: expect.any(String) });
    return res.statusCode;
  }
  expect(res.statusCode).toBe(HTTP_STATUS.OK);
  return body;
}

export function adminQuizGameStart(
  session: string,
  quizId: number,
  autoStartNum: number
): { gameId: number } | number {
  const res = request(
    'POST',
    `${SERVER_URL}/v1/admin/quiz/${quizId}/game/start`,
    {
      headers: { session },
      json: { autoStartNum },
      timeout: TIMEOUT_MS,
    }
  );

  const body = JSON.parse(res.body.toString());

  if (
    [
      HTTP_STATUS.BAD_REQUEST,
      HTTP_STATUS.UNAUTHORIZED,
      HTTP_STATUS.FORBIDDEN,
    ].includes(res.statusCode)
  ) {
    expect(body).toStrictEqual({ error: expect.any(String) });
    return res.statusCode;
  }

  return body;
}

export function adminQuizGameStateUpdate(
  quizId: number,
  gameId: number,
  session: string,
  action: string | number
): Record<string, never> | number {
  const res = request('PUT', `${SERVER_URL}/v1/admin/quiz/${quizId}/game/${gameId}`, {
    headers: { session },
    json: { action },
    timeout: TIMEOUT_MS,
  });

  const body = JSON.parse(res.body.toString());
  if ([400, 401, 403].includes(res.statusCode)) {
    expect(body).toStrictEqual({ error: expect.any(String) });
    return res.statusCode;
  }
  return body;
}

export function adminQuizGameStatus(
  session: string,
  quizId: number,
  gameid: number
): GameStatus | number {
  const res = request(
    'GET',
    `${SERVER_URL}/v1/admin/quiz/${quizId}/game/${gameid}`,
    {
      headers: { session },
      timeout: TIMEOUT_MS,
    }
  );

  const body = JSON.parse(res.body.toString());

  if (
    [
      HTTP_STATUS.BAD_REQUEST,
      HTTP_STATUS.UNAUTHORIZED,
      HTTP_STATUS.FORBIDDEN,
    ].includes(res.statusCode)
  ) {
    expect(body).toStrictEqual({ error: expect.any(String) });
    return res.statusCode;
  }

  return body;
}

export function adminQuizGameFinalResults(
  quizId: number,
  gameId: number,
  session: string
): GameFinalResults | number {
  const res = request('GET', `${SERVER_URL}/v1/admin/quiz/${quizId}/game/${gameId}/results`, {
    headers: { session },
    timeout: TIMEOUT_MS,
  });

  const body = JSON.parse(res.body.toString());

  if (
    [
      HTTP_STATUS.BAD_REQUEST,
      HTTP_STATUS.UNAUTHORIZED,
      HTTP_STATUS.FORBIDDEN,
    ].includes(res.statusCode)
  ) {
    expect(body).toStrictEqual({ error: expect.any(String) });
    return res.statusCode;
  }

  return body;
}

export function playerJoinGame(
  gameId: number,
  playerName: string
): { playerId: number } | number {
  const res = request('POST', `${SERVER_URL}/v1/player/join`, {
    json: { gameId, playerName },
    timeout: TIMEOUT_MS,
  });

  const body = JSON.parse(res.body.toString());
  if ([400].includes(res.statusCode)) {
    expect(body).toStrictEqual({ error: expect.any(String) });
    return res.statusCode;
  }
  return body as { playerId: number };
}

export function playerGuestStatus(
  playerid: number
): { state: string; numQuestions: number; atQuestion: number } | number {
  const res = request('GET', `${SERVER_URL}/v1/player/${playerid}`);

  const body = JSON.parse(res.body.toString());
  if ([400].includes(res.statusCode)) {
    expect(body).toStrictEqual({ error: expect.any(String) });
    return res.statusCode;
  }

  return body;
}

export function gamePlayerQuestionInfo(
  playerId: number,
  questionposition: number
): QuestionInfoV2 | number {
  const res = request('GET', `${SERVER_URL}/v1/player/${playerId}/question/${questionposition}`);
  const body = JSON.parse(res.body.toString());
  if ([400].includes(res.statusCode)) {
    expect(body).toStrictEqual({ error: expect.any(String) });
    return res.statusCode;
  }
  return body;
}

export function playerAnswerSubmission(
  answerIds: Array<number>,
  playerId: number,
  questionPosition: number
): Record<string, never> | number {
  const res = request(
    'PUT',
    `${SERVER_URL}/v1/player/${playerId}/question/${questionPosition}/answer`,
    {
      json: { answerIds },
      timeout: TIMEOUT_MS,
    }
  );

  const body = JSON.parse(res.body.toString());
  if ([400].includes(res.statusCode)) {
    expect(body).toStrictEqual({ error: expect.any(String) });
    return res.statusCode;
  }

  return body;
}

export function playerQuestionResults(
  playerId: number,
  questionPosition: number
): QuestionResultInfo | number {
  const res = request(
    'GET',
    `${SERVER_URL}/v1/player/${playerId}/question/${questionPosition}/results`,
    {
      timeout: TIMEOUT_MS,
    }
  );

  const body = JSON.parse(res.body.toString());
  if ([400].includes(res.statusCode)) {
    expect(body).toStrictEqual({ error: expect.any(String) });
    return res.statusCode;
  }
  return body;
}

// gamePlayerFinalResults()
export function playerGetFinalResults(
  playerId: number
): GameFinalResults | number {
  const res = request('GET', `${SERVER_URL}/v1/player/${playerId}/results`, {
    timeout: TIMEOUT_MS,
  });

  const body = JSON.parse(res.body.toString());

  if (
    [
      HTTP_STATUS.BAD_REQUEST,
      HTTP_STATUS.UNAUTHORIZED,
      HTTP_STATUS.FORBIDDEN,
    ].includes(res.statusCode)
  ) {
    expect(body).toStrictEqual({ error: expect.any(String) });
    return res.statusCode;
  }

  return body;
}

export function adminQuizTransferV2(
  quizId: number,
  session: string,
  userEmail: string
): Record<string, never> | number {
  const res = request(
    'POST',
    `http://${HOST}:${PORT}/v2/admin/quiz/${quizId}/transfer`,
    {
      headers: { session },
      json: { userEmail },
      timeout: TIMEOUT_MS,
    }
  );

  const body = JSON.parse(res.body.toString());
  if (
    [
      HTTP_STATUS.BAD_REQUEST,
      HTTP_STATUS.UNAUTHORIZED,
      HTTP_STATUS.FORBIDDEN,
    ].includes(res.statusCode)
  ) {
    expect(body).toStrictEqual({ error: expect.any(String) });
    return res.statusCode;
  }
  expect(res.statusCode).toBe(HTTP_STATUS.OK);
  return body;
}

export function adminQuizRemoveV2(quizid: number, session: string): Record<string, never> | number {
  const res = request(
    'DELETE',
    `http://${HOST}:${PORT}/v2/admin/quiz/${quizid}`,
    {
      headers: { session },
      timeout: TIMEOUT_MS,
    }
  );

  const body = JSON.parse(res.body.toString());
  if (
    [
      HTTP_STATUS.BAD_REQUEST,
      HTTP_STATUS.UNAUTHORIZED,
      HTTP_STATUS.FORBIDDEN,
    ].includes(res.statusCode)
  ) {
    expect(body).toStrictEqual({ error: expect.any(String) });
    return res.statusCode;
  }
  expect(res.statusCode).toBe(HTTP_STATUS.OK);
  return body;
}

export function gamePlayerFinalResults(
  playerId: number,
  session: string
): GameFinalResults | number {
  const res = request(
    'GET',
    `http://${HOST}:${PORT}/v1/player/${playerId}/results`,
    {
      headers: { session },
      timeout: TIMEOUT_MS,
    }
  );

  const body = JSON.parse(res.body.toString());

  if ([400, 401, 403, 404].includes(res.statusCode)) {
    expect(body).toStrictEqual({ error: expect.any(String) });
    return res.statusCode;
  }

  return body;
}

export function adminQuizQuestionAttachment(
  session: string,
  quizId: number,
  questionId: number,
  filePath: string
): Record<string, never> | number {
  const form = new FormData();

  try {
    const fileBuffer = fs.readFileSync(filePath);
    form.append('file', fileBuffer, {
      filename: path.basename(filePath),
      contentType: 'text/plain',
    });
  } catch (error) {
    if (error.code === 'ENOENT') {
      return HTTP_STATUS.BAD_REQUEST;
    }
    throw error;
  }

  const res = request(
    'PUT',
    `http://${HOST}:${PORT}/v1/admin/quiz/${quizId}/question/${questionId}/upload`,
    {
      headers: {
        ...form.getHeaders(),
        session,
      },
      body: form.getBuffer(),
      timeout: TIMEOUT_MS,
    }
  );

  const body = JSON.parse(res.body.toString());
  if ([400, 401, 403].includes(res.statusCode)) {
    expect(body).toStrictEqual({ error: expect.any(String) });
    return res.statusCode;
  }
  expect(res.statusCode).toBe(200);
  return body;
}

export function adminQuizQuestionAttachmentRemove(
  session: string,
  quizId: number,
  questionId: number,
  filename: string
): Record<string, never> | number {
  const res = request(
    'DELETE',
    `http://${HOST}:${PORT}/v1/admin/quiz/${quizId}/question/${questionId}/upload`,
    {
      headers: { session, 'Content-Type': 'application/json' },
      json: { filename },
      timeout: TIMEOUT_MS,
    }
  );

  const body = JSON.parse(res.body.toString());
  if ([400, 401, 403].includes(res.statusCode)) {
    expect(body).toStrictEqual({ error: expect.any(String) });
    return res.statusCode;
  }
  expect(res.statusCode).toBe(HTTP_STATUS.OK);
  return body;
}

export function adminQuizImport(
  session: string,
  filePath: string
): { quizId: number } | number {
  const form = new FormData();

  try {
    const fileBuffer = fs.readFileSync(filePath);
    form.append('file', fileBuffer, {
      filename: path.basename(filePath),
      contentType: 'application/json',
    });
  } catch (error) {
    if (error.code === 'ENOENT') {
      return HTTP_STATUS.BAD_REQUEST;
    }
    throw error;
  }

  const res = request(
    'POST',
    `http://${HOST}:${PORT}/v1/admin/quiz/import`,
    {
      headers: {
        ...form.getHeaders(),
        session,
      },
      body: form.getBuffer(),
      timeout: TIMEOUT_MS,
    }
  );

  const body = JSON.parse(res.body.toString());
  if ([HTTP_STATUS.BAD_REQUEST,
    HTTP_STATUS.UNAUTHORIZED,
    HTTP_STATUS.FORBIDDEN].includes(res.statusCode)) {
    expect(body).toStrictEqual({ error: expect.any(String) });
    return res.statusCode;
  }
  expect(res.statusCode).toBe(200);
  return body;
}

export function adminQuizExport(
  session: string,
  quizId: number,
  outputPath: string
): number {
  const res = request(
    'GET',
    `http://${HOST}:${PORT}/v1/admin/quiz/${quizId}/export`,
    {
      headers: { session },
      timeout: TIMEOUT_MS,
    }
  );

  if ([HTTP_STATUS.BAD_REQUEST,
    HTTP_STATUS.UNAUTHORIZED,
    HTTP_STATUS.FORBIDDEN].includes(res.statusCode)) {
    const body = JSON.parse(res.body.toString());
    expect(body).toStrictEqual({ error: expect.any(String) });
    return res.statusCode;
  }

  expect(res.statusCode).toBe(HTTP_STATUS.OK);

  try {
    fs.writeFileSync(outputPath, res.body.toString());
  } catch (error) {
    throw new Error(`Failed to write exported quiz to file: ${error.message}`);
  }

  return HTTP_STATUS.OK;
}

export function quizOpenFile(
  session: string,
  filename: string
): string | number {
  const res = request('GET', `http://${HOST}:${PORT}/uploads/${filename}`, {
    headers: { session },
    timeout: TIMEOUT_MS,
  });

  if ([
    HTTP_STATUS.BAD_REQUEST,
    HTTP_STATUS.UNAUTHORIZED,
    HTTP_STATUS.FORBIDDEN
  ].includes(res.statusCode)) {
    const body = JSON.parse(res.body.toString());
    expect(body).toStrictEqual({ error: expect.any(String) });
    return res.statusCode;
  }

  expect(res.statusCode).toBe(HTTP_STATUS.OK);
  return res.body.toString();
}

export function gamePlayerQuestionHint(
  playerId: number,
  gameId: number
): { hint: string } | number {
  const res = request('GET', `${SERVER_URL}/v1/game/${gameId}/player/${playerId}/hint`, {
    timeout: TIMEOUT_MS,
  });

  const body = JSON.parse(res.body.toString());
  if ([400, 403].includes(res.statusCode)) {
    expect(body).toStrictEqual({ error: expect.any(String) });
    return res.statusCode;
  }
  return body;
}
