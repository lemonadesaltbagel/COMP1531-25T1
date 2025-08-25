/// /////////////////////////////////////////////////////////////////////////////
//                             FUNCTION IMPORTS                               //
/// /////////////////////////////////////////////////////////////////////////////
import {
  adminQuizCreate,
  adminAuthRegister,
  clear,
} from './wrapperFunctions';

/// /////////////////////////////////////////////////////////////////////////////
//                             INITIALISATION                                 //
/// /////////////////////////////////////////////////////////////////////////////
const validFirstName = 'Hayden';
const validLastName = 'Smith';
const validEmail = 'hayden.smith@unsw.edu.au';
const validPassword = 'password6';

const validName = 'quizName';
const validDescription = 'quizDescription';
const validNameSecond = 'quizNameSecond';
const validDescriptionSecond = 'quizDescriptionSecond';

const invalidDescription = 'Invalid'.repeat(100);

/// /////////////////////////////////////////////////////////////////////////////
//                                 TESTING                                    //
/// /////////////////////////////////////////////////////////////////////////////
describe('adminQuizCreate', () => {
  let sessionId: string;
  let response: { quizId: number } | number;

  beforeEach(() => {
    clear();
    const registeredResponse = adminAuthRegister(
      validEmail,
      validPassword,
      validFirstName,
      validLastName
    );
    sessionId = (registeredResponse as { session: string }).session;
  });

  afterEach(() => {
    clear();
  });

  describe('adminQuizCreate - Error Cases', () => {
    test('Fails for invalid session', () => {
      response = adminQuizCreate(sessionId + 1, validName, validDescription);
      expect(response).toEqual(401);
    });

    test.each([
      { name: 'iq' },
      { name: 'q'.repeat(31) },
      { name: 'Invalid_Name!' },
    ])('Fails for invalid quiz name: %s', ({ name }) => {
      response = adminQuizCreate(sessionId, name, validDescription);
      expect(response).toStrictEqual(400);
    });

    test('Fails for using name of already created quiz owned by logged in user', () => {
      response = adminQuizCreate(sessionId, validName, validDescription);
      expect(response).toStrictEqual({ quizId: expect.any(Number) });
      response = adminQuizCreate(sessionId, validName, validDescription);
      expect(response).toEqual(400);
    });

    test('Fails for description more than 100 characters in length', () => {
      response = adminQuizCreate(sessionId, validName, invalidDescription);
      expect(response).toEqual(400);
    });
  });

  describe('adminQuizCreate - Success Cases', () => {
    test('Successfully returns quizId for one quiz', () => {
      response = adminQuizCreate(sessionId, validName, validDescription);
      expect(response).toStrictEqual({ quizId: expect.any(Number) });
    });

    test('Successfully returns quizId for multiple quizzes', () => {
      response = adminQuizCreate(sessionId, validName, validDescription);
      expect(response).toStrictEqual({ quizId: expect.any(Number) });

      response = adminQuizCreate(
        sessionId,
        validNameSecond,
        validDescriptionSecond
      );
      expect(response).toStrictEqual({ quizId: expect.any(Number) });
    });

    test('Successfully creates quiz with valid name at edge of requirements', () => {
      // Valid quiz name with exactly 3 characters (minimum requirement)
      const minLengthName = 'Qz3';

      response = adminQuizCreate(sessionId, minLengthName, validDescription);
      expect(response).toStrictEqual({ quizId: expect.any(Number) });

      // Valid quiz name with exactly 30 characters (maximum requirement)
      const maxLengthName = 'ThisQuizNameIsExactly30Chars12';

      response = adminQuizCreate(sessionId, maxLengthName, validDescription);
      expect(response).toStrictEqual({ quizId: expect.any(Number) });
    });
  });
});
