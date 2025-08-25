/// /////////////////////////////////////////////////////////////////////////////
//                             FUNCTION IMPORTS                               //
/// /////////////////////////////////////////////////////////////////////////////
import {
  clear,
  adminAuthRegister,
  adminUserDetails,
  adminQuizCreate,
  adminQuizInfo
} from './wrapperFunctions';

/// /////////////////////////////////////////////////////////////////////////////
//                             INITIALISATION                                 //
/// /////////////////////////////////////////////////////////////////////////////
describe('Clear tests', () => {
  beforeEach(() => {
    clear();
  });
  afterEach(() => {
    clear();
  });
  describe('Success Cases', () => {
    test('Correct Return Type', () => {
      const res = clear();
      expect(res).toStrictEqual({});
    });
    test('Clears users and sessions', () => {
      const registerResult = adminAuthRegister(
        'validemail@gmail.com',
        'Validpassword9',
        'Abhi',
        'Lum'
      ) as { session: string };
      const sessionId = registerResult.session;
      const res = clear();
      expect(res).toStrictEqual({});
      const userDetails = adminUserDetails(sessionId);
      expect(userDetails).toStrictEqual(401);
    });
    test('Clears multiple users', () => {
      const registerResult = adminAuthRegister(
        'validemail@gmail.com',
        'Validpassword9',
        'Abhi',
        'Lum'
      ) as { session: string };
      const sessionId = registerResult.session;

      const anotherRegisterResult = adminAuthRegister(
        'anotherEmail@gmail.com',
        'Validpassword9',
        'Dylan',
        'Nguyen'
      ) as { session: string };
      const anotherSessionId = anotherRegisterResult.session;

      const res = clear();
      expect(res).toStrictEqual({});
      const userDetails = adminUserDetails(sessionId);
      const anotherUserDetails = adminUserDetails(anotherSessionId);
      expect(userDetails).toStrictEqual(401);
      expect(anotherUserDetails).toStrictEqual(401);
    });

    test('Clears quizzes', () => {
      const registerResult = adminAuthRegister(
        'validemail@gmail.com',
        'Validpassword9',
        'Abhi',
        'Lum'
      ) as { session: string };
      const sessionId = registerResult.session;
      const quizResult = adminQuizCreate(
        sessionId,
        'Quiz 1',
        'Description'
      ) as { quizId: number };
      const quizId = quizResult.quizId;
      const res = clear();
      expect(res).toStrictEqual({});
      const quizInfo = adminQuizInfo(sessionId, quizId) as
        | { quizId: number }
        | number;
      expect(quizInfo).toStrictEqual(401);
    });

    test('Clears multiple quizzes', () => {
      const registerResult = adminAuthRegister(
        'validemail@gmail.com',
        'Validpassword9',
        'Abhi',
        'Lum'
      ) as { session: string };
      const sessionId = registerResult.session;
      const quizResult = adminQuizCreate(
        sessionId,
        'Quiz 1',
        'Description'
      ) as { quizId: number };
      const quizId = quizResult.quizId;

      const anotherQuizResult = adminQuizCreate(
        sessionId,
        'Quiz 2',
        'Description'
      ) as { quizId: number };
      const anotherQuizId = anotherQuizResult.quizId;
      const res = clear();
      expect(res).toStrictEqual({});
      const quizInfo = adminQuizInfo(sessionId, quizId) as
        | { quizId: number }
        | number;
      const anotherQuizInfo = adminQuizInfo(sessionId, anotherQuizId) as
        | { quizId: number }
        | number;

      expect(quizInfo).toStrictEqual(401);
      expect(anotherQuizInfo).toStrictEqual(401);
    });
    test('Clears multiple quizzes from multiple users', () => {
      const registerResult = adminAuthRegister(
        'validemail@gmail.com',
        'Validpassword9',
        'Abhi',
        'Lum'
      ) as { session: string };
      const sessionId = registerResult.session;

      const anotherRegisterResult = adminAuthRegister(
        'anotherEmail@gmail.com',
        'Validpassword9',
        'Dylan',
        'Nguyen'
      ) as { session: string };
      const anotherSessionId = anotherRegisterResult.session;

      const quizResult = adminQuizCreate(
        sessionId,
        'Quiz 1',
        'Description'
      ) as { quizId: number };
      const quizId = quizResult.quizId;

      const anotherQuizResult = adminQuizCreate(
        anotherSessionId,
        'Quiz 2',
        'Description'
      ) as { quizId: number };
      const anotherQuizId = anotherQuizResult.quizId;

      const res = clear();
      expect(res).toStrictEqual({});
      const quizInfo = adminQuizInfo(sessionId, quizId) as
        | { quizId: number }
        | number;
      const anotherQuizInfo = adminQuizInfo(anotherSessionId, anotherQuizId) as
        | { quizId: number }
        | number;

      expect(quizInfo).toStrictEqual(401);
      expect(anotherQuizInfo).toStrictEqual(401);
    });
  });
});
