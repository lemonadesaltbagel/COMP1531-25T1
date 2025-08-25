import {
  DataStore,
  User,
  Quiz,
  getData,
} from '../dataStore';
import { v4 as uuidv4 } from 'uuid';

import { BadRequestError } from '../errors';
import { findQuiz, validQuizOwner } from './quizHelpers';
import { findUserFromSession } from './userHelpers';

const MILLISECONDS_IN_SECONDS = 1000;
export const MAX_QUESTION_TIME_LIMIT = 180;

/// /////////////////////////////////////////////////////////////////////////////
//                                GET TIMESTAMP                              //
/// /////////////////////////////////////////////////////////////////////////////

export function getTimestamp() {
  return Math.floor(Date.now() / MILLISECONDS_IN_SECONDS);
}

/// ////////////////////////////////////////////////////////////////////////////
//                            Valid User and Quiz                             //
/// ////////////////////////////////////////////////////////////////////////////
export function validateUserAndQuiz(
  session: string,
  quizId: number,
  data: DataStore
): { user: User; quiz: Quiz } {
  const user = findUserFromSession(session);
  const quiz = findQuiz(quizId, data);
  validQuizOwner(user, quizId);

  return { user, quiz };
}

/// /////////////////////////////////////////////////////////////////////////////
//                             Generate Session ID                            //
/// /////////////////////////////////////////////////////////////////////////////
export function generateSessionId(): string {
  return uuidv4();
}

/// /////////////////////////////////////////////////////////////////////////////
//                       Remove Session from User Array                       //
/// /////////////////////////////////////////////////////////////////////////////
export function removeSessionFromUserArray(
  data: DataStore,
  session: string
): Record<string, never> {
  for (const user of data.users) {
    const sessionIndex = user.sessions.indexOf(session);
    if (sessionIndex !== -1) {
      user.sessions.splice(sessionIndex, 1);
      return {};
    }
  }
}

export function fileExists(
  fileUrl: string
): void {
  const data = getData();
  if (!data.users.some((user) => user.uploads.includes(fileUrl))) {
    throw new BadRequestError('File does not exist');
  }
}
