/// /////////////////////////////////////////////////////////////////////////////
//                             FUNCTION IMPORTS                               //
/// /////////////////////////////////////////////////////////////////////////////
import {
  adminAuthRegister,
  adminAuthLogin,
  adminQuizCreate,
  adminQuizDescriptionUpdate,
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

    const createResult = adminQuizCreate(sessionId, 'Quiz name', 'Description');
    expect(createResult).toHaveProperty('quizId');
    quizId = (createResult as { quizId: number }).quizId;
  });

  afterEach(() => {
    clear();
  });

  describe('Error cases', () => {
    test('Invalid sessionId', () => {
      const result = adminQuizDescriptionUpdate(
        sessionId + '-Invalid',
        quizId,
        'New Description'
      );
      expect(result).toStrictEqual(401);
    });

    test('Invalid quizId', () => {
      const result = adminQuizDescriptionUpdate(
        sessionId,
        quizId + 1000,
        'New Description'
      );
      expect(result).toStrictEqual(403);
    });

    test('Unauthorized quiz', () => {
      adminAuthRegister('another@example.com', 'Passwor6', 'Another', 'User');
      const anotherLoginResult = adminAuthLogin(
        'another@example.com',
        'Passwor6'
      );
      expect(anotherLoginResult).toHaveProperty('session');
      const anotherSessionId = (anotherLoginResult as { session: string })
        .session;

      const result = adminQuizDescriptionUpdate(
        anotherSessionId,
        quizId,
        'New Description'
      );
      expect(result).toStrictEqual(403);
    });

    test('Description exceeds 100 characters', () => {
      const longDescription = 'a'.repeat(101);
      const result = adminQuizDescriptionUpdate(
        sessionId,
        quizId,
        longDescription
      );
      expect(result).toStrictEqual(400);
    });
  });

  describe('Success cases', () => {
    test('Valid description', () => {
      const result = adminQuizDescriptionUpdate(
        sessionId,
        quizId,
        'New valid description'
      );
      expect(result).toStrictEqual(200);
    });

    test('Empty description', () => {
      const result = adminQuizDescriptionUpdate(sessionId, quizId, '');
      expect(result).toStrictEqual(200);
    });

    test('Description with exactly 100 characters', () => {
      const description100Chars = 'a'.repeat(100);
      const result = adminQuizDescriptionUpdate(
        sessionId,
        quizId,
        description100Chars
      );
      expect(result).toStrictEqual(200);
    });
  });
});
