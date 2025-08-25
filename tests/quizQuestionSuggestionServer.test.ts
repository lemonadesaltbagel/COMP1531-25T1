/// /////////////////////////////////////////////////////////////////////////////
//                             FUNCTION IMPORTS                               //
/// /////////////////////////////////////////////////////////////////////////////
import {
  adminAuthRegister,
  adminAuthLogin,
  adminQuizCreate,
  adminQuizQuestionSuggestion,
  clear,
} from './wrapperFunctions';

/// /////////////////////////////////////////////////////////////////////////////
//                                 TESTING                                    //
/// /////////////////////////////////////////////////////////////////////////////
describe.skip('adminQuizQuestionSuggestion server tests', () => {
  let sessionId: string;
  let quizId: number;

  beforeEach(() => {
    clear();
    adminAuthRegister('admin@example.com', 'Password123', 'Admin', 'User');
    const loginResult = adminAuthLogin('admin@example.com', 'Password123');
    expect(loginResult).toHaveProperty('session');
    sessionId = (loginResult as { session: string }).session;

    const createResult = adminQuizCreate(
      sessionId,
      'Test Quiz',
      'This is a test quiz'
    );
    expect(createResult).toHaveProperty('quizId');
    quizId = (createResult as { quizId: number }).quizId;
  });

  afterEach(() => {
    clear();
  });

  describe('Error cases', () => {
    test('Invalid sessionId', () => {
      const result = adminQuizQuestionSuggestion(
        sessionId + '-Invalid',
        quizId
      );
      expect(result).toStrictEqual(401);
    });

    test('Invalid quizId', () => {
      const result = adminQuizQuestionSuggestion(sessionId, quizId + 1000);
      expect(result).toStrictEqual(403);
    });

    test('Unauthorized quiz', () => {
      const anotherRegisterResult = adminAuthRegister(
        'another@example.com',
        'Password123',
        'Another',
        'User'
      ) as { session: string };
      const anotherSessionId = anotherRegisterResult.session;

      const result = adminQuizQuestionSuggestion(anotherSessionId, quizId);
      expect(result).toStrictEqual(403);
    });
  });

  describe('Success cases', () => {
    test('Successfully returns a question suggestion', () => {
      const result = adminQuizQuestionSuggestion(sessionId, quizId);
      expect(result).toHaveProperty('question');
      expect(typeof (result as { question: string }).question).toBe('string');
    });
  });
});
