/// /////////////////////////////////////////////////////////////////////////////
//                             FUNCTION IMPORTS                               //
/// /////////////////////////////////////////////////////////////////////////////
import { getData, setData } from './dataStore';

import {
  validEmail,
  validName,
  validPassword,
  uniquePassword,
  findUserFromSession,
  findUserFromEmail,
  passwordDoesNotMatch
} from './helpers/userHelpers';

import {
  generateSessionId,
  removeSessionFromUserArray,
} from './helpers/helperFunctions';

import { User } from './dataStore';
import { UserDetails } from './interfaces';
import { BadRequestError } from './errors';
import JsSHA from 'jssha';
/// /////////////////////////////////////////////////////////////////////////////
//                          CONSTANT DEFINITIONS                              //
/// /////////////////////////////////////////////////////////////////////////////
const CURRENT_PW = 0;

/// /////////////////////////////////////////////////////////////////////////////
//                          ADMIN AUTH REGISTER                               //
/// /////////////////////////////////////////////////////////////////////////////
/**
 * <Register a user with an email, password, and names, then return their userId
 *  value.>
 *
 * @param {string} email - email of user's account
 * @param {string} password - password for user's account
 * @param {string} nameFirst - the user's first name
 * @param {string} nameLast - the user's last name
 * ...
 *
 * @returns {Object}
 *   - Returns an object `{ userId: string }` if registration is successful.
 *   - Returns an error object `{ error: string }` if registration fails.
 */
export function adminAuthRegister(
  email: string,
  password: string,
  nameFirst: string,
  nameLast: string
): { session: string } {
  const data = getData();

  validEmail(email, data);

  validName(nameFirst);

  validName(nameLast);

  validPassword(password);

  const userId = data.users.length + 1;

  const shaObj = new JsSHA('SHA-256', 'TEXT', { encoding: 'UTF8' });
  shaObj.update(password);
  const hashedPassword = shaObj.getHash('HEX');

  const user: User = {
    userId: userId,
    nameFirst: nameFirst,
    nameLast: nameLast,
    email: email,
    password: [hashedPassword],
    numSuccessfulLogins: 1,
    numFailedPasswordsSinceLastLogin: 0,
    quizzesOwned: [],
    sessions: [],
    uploads: []
  };

  const sessionId = generateSessionId();
  user.sessions.push(sessionId);

  data.sessions[sessionId] = user.userId;

  setData(data);
  data.users.push(user);
  return { session: sessionId };
}

/// /////////////////////////////////////////////////////////////////////////////
//                            ADMIN AUTH LOGIN                                //
/// /////////////////////////////////////////////////////////////////////////////
/**
 * <Login a user with an email, and password, then return their userId
 *  value.>
 *
 * @param {string} email - email of user's account
 * @param {string} password - password for user's account
 * ...
 *
 * @returns {Object}
 *   - Returns an object `{ userId: string }` if login is successful.
 *   - Returns an error object `{ error: string }` if login fails.
 */
export function adminAuthLogin(
  email: string,
  password: string
): { session: string } {
  const data = getData();

  const user = findUserFromEmail(email);

  const shaObj = new JsSHA('SHA-256', 'TEXT', { encoding: 'UTF8' });
  shaObj.update(password);
  const hashedPassword = shaObj.getHash('HEX');

  if (passwordDoesNotMatch(user, hashedPassword, CURRENT_PW)) {
    user.numFailedPasswordsSinceLastLogin++;
    throw new BadRequestError('Password does not match user');
  }

  user.numFailedPasswordsSinceLastLogin = 0;
  user.numSuccessfulLogins++;

  const sessionId = generateSessionId();
  user.sessions.push(sessionId);

  data.sessions[sessionId] = user.userId;

  setData(data);

  return { session: sessionId };
}

/// /////////////////////////////////////////////////////////////////////////////
//                        ADMIN AUTH USER DETAILS                             //
/// /////////////////////////////////////////////////////////////////////////////
/**
 * <Register a user with an email, password, and names, then return their userId
 *  value.>
 *
 * @param {Number} userId - user's userId
 * ...
 *
 * @returns {Object}
 *   - Returns an object with user details if login is successful:
 *     {
 *       session: string,
 *       name: string,
 *       email: string
 *     }
 *   - Returns an error object with an error message if login fails:
 *     { error: string }
 */
export function adminUserDetails(
  session: string
): { user: UserDetails } {
  const user = findUserFromSession(session);

  return {
    user: {
      userId: user.userId,
      name: `${user.nameFirst} ${user.nameLast}`,
      email: user.email,
      numSuccessfulLogins: user.numSuccessfulLogins,
      numFailedPasswordsSinceLastLogin: user.numFailedPasswordsSinceLastLogin,
    },
  };
}

/// /////////////////////////////////////////////////////////////////////////////
//                  ADMIN AUTH USER DETAILS UPDATE                            //
/// /////////////////////////////////////////////////////////////////////////////
/**
 * Update a users email, first and last name given their userId>
 *
 * @param {number} userId - userId of user's account
 * @param {string} newEmail - new email for user's account
 * @param {string} newNameFirst - the user's new first name
 * @param {string} newNameLast - the user's new last name
 * ...
 *
 * @returns {Object}
 *   - Returns an empty object `{}` if the update is successful.
 *   - Returns an error message if the update fails, in the form of
 *     `{ error: string }`.
 */
export function adminUserDetailsUpdate(
  session: string,
  newEmail: string,
  newNameFirst: string,
  newNameLast: string
): Record<string, never> {
  const data = getData();

  const user = findUserFromSession(session);

  if (newEmail !== user.email) {
    validEmail(newEmail, data);
  }
  validName(newNameFirst);

  validName(newNameLast);

  user.email = newEmail;
  user.nameFirst = newNameFirst;
  user.nameLast = newNameLast;
  setData(data);
  return {};
}

/// /////////////////////////////////////////////////////////////////////////////
//                        ADMIN USER PASSWORD UPDATE                          //
/// /////////////////////////////////////////////////////////////////////////////
/**
 * Given a user's current password, update a users password to an inputted
 * password>
 *
 * @param {number} userId - userId of user's account
 * @param {string} oldPassword - the user's old password
 * @param {string} newPassword - the user's new password
 * ...
 *
 * @returns {Object}
 *   - Returns an empty object `{}` if the update is successful.
 *   - Returns an error message if the update fails, in the form of
 *  `{ error: string }`.
 */
export function adminUserPasswordUpdate(
  session: string,
  oldPassword: string,
  newPassword: string
): Record<string, never> {
  const user = findUserFromSession(session);

  const shaOld = new JsSHA('SHA-256', 'TEXT', { encoding: 'UTF8' });
  shaOld.update(oldPassword);
  const hashedOld = shaOld.getHash('HEX');

  if (user.password[CURRENT_PW] !== hashedOld) {
    throw new BadRequestError('Incorrect password login');
  }

  if (oldPassword === newPassword) {
    throw new BadRequestError(
      'New password cannot be the same as your' + ' current password'
    );
  }

  const shaNew = new JsSHA('SHA-256', 'TEXT', { encoding: 'UTF8' });
  shaNew.update(newPassword);
  const hashedNew = shaNew.getHash('HEX');

  uniquePassword(hashedNew, user);
  validPassword(newPassword);

  user.password.unshift(hashedNew);

  return {};
}

/// /////////////////////////////////////////////////////////////////////////////
//                             ADMIN AUTH LOGOUT                              //
/// /////////////////////////////////////////////////////////////////////////////
/**
 * Logs out a user given a sessionId
 *
 * @param {string} sesionId - sessionId of the user to be logged out
 * ...
 *
 * @returns {Object}
 *   - Returns an empty object `{ }` if the session is logged out.
 *   - Returns an error message if the user can not be logged out, in the form of
 *     `{ error: string }`.
 */
export function adminAuthLogout(session: string): Record<string, never> {
  const data = getData();
  findUserFromSession(session);

  delete data.sessions[session];

  removeSessionFromUserArray(data, session);
  setData(data);
  return {};
}
