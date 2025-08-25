/// /////////////////////////////////////////////////////////////////////////////
//                             FUNCTION IMPORTS                               //
/// /////////////////////////////////////////////////////////////////////////////
import {
  adminAuthRegister,
  adminAuthLogin,
  adminQuizCreate,
  adminQuizNameUpdate,
  clear,
} from './wrapperFunctions';

/// /////////////////////////////////////////////////////////////////////////////
//                                 TESTING                                    //
/// /////////////////////////////////////////////////////////////////////////////
describe('adminQuizDescriptionUpdate server tests', () => {
  let sessionId: string;
  let quizId: number;

  beforeEach(() => {
    clear();
    adminAuthRegister('admin@example.com', 'Passwor6', 'Admin', 'User');
    const loginResult = adminAuthLogin('admin@example.com', 'Passwor6');
    expect(loginResult).toHaveProperty('session');
    sessionId = (loginResult as { session: string }).session;

    const createResult = adminQuizCreate(sessionId, 'Quiz name', 'Name');
    expect(createResult).toHaveProperty('quizId');
    quizId = (createResult as { quizId: number }).quizId;
  });

  afterEach(() => {
    clear();
  });

  describe('Error Case', () => {
    test('Invalid sessionId', () => {
      const result = adminQuizNameUpdate(
        sessionId + '-Invalid',
        quizId,
        'New Quiz Name'
      );
      expect(result).toStrictEqual(401);
    });

    test('Invalid quizId', () => {
      const result = adminQuizNameUpdate(
        sessionId,
        quizId + 1000,
        'New Quiz Name'
      );
      expect(result).toStrictEqual(403);
    });

    test('Unauthorized quiz', () => {
      adminAuthRegister('another@example.com', 'Passwor6', 'Another', 'User');
      const anotherSessionId = (
        adminAuthLogin('another@example.com', 'Passwor6') as { session: string }
      ).session;

      const result = adminQuizNameUpdate(
        anotherSessionId,
        quizId,
        'New Quiz Name'
      );
      expect(result).toStrictEqual(403);
    });

    test.each([
      { name: 'ab', description: 'Name too short' },
      { name: 'a'.repeat(31), description: 'Name too long' },
      { name: 'Invalid#Name@', description: 'Invalid character' },
    ])('$description', ({ name }) => {
      const result = adminQuizNameUpdate(sessionId, quizId, name);
      expect(result).toStrictEqual(400);
    });

    test('Occupied name', () => {
      const anotherQuizName = 'Another Quiz Name';
      adminQuizCreate(sessionId, anotherQuizName, 'Another description');

      const result = adminQuizNameUpdate(sessionId, quizId, anotherQuizName);
      expect(result).toStrictEqual(400);
    });
  });

  describe('Success Case', () => {
    test('Update with valid name', () => {
      const result = adminQuizNameUpdate(
        sessionId,
        quizId,
        'Updated Quiz Name'
      );
      expect(result).toStrictEqual(200);
    });

    test('Update with same name', () => {
      const result = adminQuizNameUpdate(sessionId, quizId, 'Quiz name');
      expect(result).toStrictEqual(200);
    });

    test('Quiz name with exactly 100 characters', () => {
      const quizName100Char = 'a'.repeat(30);
      const result = adminQuizNameUpdate(sessionId, quizId, quizName100Char);
      expect(result).toStrictEqual(200);
    });
  });
});
