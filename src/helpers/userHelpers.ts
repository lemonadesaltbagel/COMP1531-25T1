/// ////////////////////////////////////////////////////////////////////////////
//                                  IMPORTS                                   //
/// ////////////////////////////////////////////////////////////////////////////
import validator from 'validator';
import { BadRequestError, UnauthorisedError } from './../errors';
import {
  DataStore,
  User,
  getData,
} from './../dataStore';

/// ////////////////////////////////////////////////////////////////////////////
//                                CONSTANTS                                   //
/// ////////////////////////////////////////////////////////////////////////////
const MAX_NAME_LENGTH = 20;
const MIN_NAME_LENGTH = 2;
const MIN_PASSWORD_LENGTH = 8;

/// ////////////////////////////////////////////////////////////////////////////
//                            VALID EMAIL HELPER                              //
/// ////////////////////////////////////////////////////////////////////////////
export function validEmail(
  email: string,
  data: DataStore
): true {
  // check if valid email format
  if (!validator.isEmail(email)) {
    throw new BadRequestError('Email is not in correct email format.');
  }
  // Check if email is already being used by another user
  if (emailExists(email, data)) {
    throw new BadRequestError('Email is being used by another registered user.');
  }
  return true;
}

export function emailExists(email: string, data: DataStore): boolean {
  return data.users.some((user) => user.email === email);
}

/// /////////////////////////////////////////////////////////////////////////////
//                             NAME CHECK HELPER                              //
/// /////////////////////////////////////////////////////////////////////////////
export function validName(name: string): true {
  // Looping through each character to ensure valid naming convention
  for (const letter of name) {
    if (!validNameChar(letter)) {
      throw new BadRequestError('Name contains characters other than lowercase letters,' +
          ' uppercase letters, spaces, hyphens, or apostrophes');
    }
  }
  // ensure valid name length
  const nameLength = name.length;
  if (nameLength < MIN_NAME_LENGTH || nameLength > MAX_NAME_LENGTH) {
    throw new BadRequestError('Name is less than 2 characters or more than 20 characters.');
  }

  return true;
}

/* export Function that ensures characters are lower or uppercase, space, hypen
 or apostrophe
*/
function validNameChar(letter: string): boolean {
  return /^[a-zA-Z '-]+$/.test(letter);
}

/// /////////////////////////////////////////////////////////////////////////////
//                          VALID PASSWORD CREATION                           //
/// /////////////////////////////////////////////////////////////////////////////
export function validPassword(password: string): true {
  const passwordLength = password.length;

  if (passwordLength < MIN_PASSWORD_LENGTH) {
    throw new BadRequestError(`Password is less than ${MIN_PASSWORD_LENGTH} characters.`);
  }
  if (!containsNumber(password)) {
    throw new BadRequestError('Password must contain at least one number.');
  }
  if (!containsLetter(password)) {
    throw new BadRequestError('Password must contain at least one letter.');
  }
  return true;
}

function containsNumber(password: string): boolean {
  return /[0-9]/.test(password);
}

function containsLetter(password: string): boolean {
  return /[a-zA-Z]/.test(password);
}

/// /////////////////////////////////////////////////////////////////////////////
//                            FIND USER BY ID                                 //
/// /////////////////////////////////////////////////////////////////////////////

export function findUser(
  userId: number,
  data: DataStore
): User {
  const user = data.users.find((user) => user.userId === userId);

  return user;
}

/// /////////////////////////////////////////////////////////////////////////////
//                               UNIQUE PASSWORD                              //
/// /////////////////////////////////////////////////////////////////////////////

export function uniquePassword(
  password: string,
  user: User
): true {
  if (user.password.some((pwd) => pwd === password)) {
    throw new BadRequestError('New password cannot be the same as one of the previous passwords');
  }
  return true;
}

/// /////////////////////////////////////////////////////////////////////////////
//                          MAPPING SESIONID TO USER ID                     //
/// /////////////////////////////////////////////////////////////////////////////

export function findUserFromSession(session: string) {
  const data = getData();
  const userId = data.sessions[session];
  if (userId === undefined) {
    throw new UnauthorisedError('Invalid session ID.');
  }
  const user = findUser(userId, data);

  return user;
}

/// /////////////////////////////////////////////////////////////////////////////
//                           FIND USER FROM EMAIL                             //
/// /////////////////////////////////////////////////////////////////////////////

export function findUserFromEmail(email: string): User {
  const data = getData();
  const user = data.users.find((user) => user.email === email);
  if (!user) {
    throw new BadRequestError('Provided email is not a real user');
  }
  return user;
}

/// /////////////////////////////////////////////////////////////////////////////
//                          Password Does not Match                           //
/// /////////////////////////////////////////////////////////////////////////////
export function passwordDoesNotMatch(
  user: User,
  password: string,
  currentpw: number
): boolean {
  if (user.password[currentpw] === password) {
    return false;
  } else {
    return true;
  }
}
