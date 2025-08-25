/// /////////////////////////////////////////////////////////////////////////////
//                             FUNCTION IMPORTS                               //
/// /////////////////////////////////////////////////////////////////////////////
import {
  adminAuthRegister,
  adminQuizCreate,
  adminQuizInfo,
  adminQuizNameUpdate,
  clear,
} from './wrapperFunctions';

import { QuizInfo } from './interfaces';

/// /////////////////////////////////////////////////////////////////////////////
//                             INITIALISATION                                 //
/// /////////////////////////////////////////////////////////////////////////////
const validFirstName = 'Hayden';
const validLastName = 'Smith';
const validEmail = 'hayden.smith@unsw.edu.au';
const validPassword = 'password6';

const anotherFirstName = 'Alice';
const anotherLastName = 'Brown';
const anotherEmail = 'alice.brown@unsw.edu.au';
const anotherPassword = 'password6';

const name = 'Quiz 1';
const description = 'Test Quiz';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
/// /////////////////////////////////////////////////////////////////////////////
//                                 TESTING                                    //
/// /////////////////////////////////////////////////////////////////////////////
describe('adminQuizInfo', () => {
  let session: string;
  let quizId: number;

  beforeEach(() => {
    clear();
    const registerResponse = adminAuthRegister(
      validEmail,
      validPassword,
      validFirstName,
      validLastName
    ) as { session: string };
    session = registerResponse.session;
    const createResponse = adminQuizCreate(session, name, description) as {
      quizId: number;
    };
    quizId = createResponse.quizId;
  });

  afterEach(() => {
    clear();
  });

  describe('adminQuizInfo - Success Cases', () => {
    let infoResponse: QuizInfo;
    test('Successfully retrieves quiz information', () => {
      infoResponse = adminQuizInfo(session, quizId) as QuizInfo;

      expect(infoResponse).toMatchObject({
        quizId,
        name: name,
        description: description,
      });

      expect(typeof infoResponse.timeCreated).toBe('number');
      expect(typeof infoResponse.timeLastEdited).toBe('number');

      expect(infoResponse.timeCreated).toBe(infoResponse.timeLastEdited);
      expect(infoResponse).toEqual({
        quizId,
        name,
        timeCreated: expect.any(Number),
        timeLastEdited: expect.any(Number),
        description,
        numQuestions: 0,
        questions: [],
        timeLimit: 0,
      });
    });
    test('Successfully updates quiz and modifies timeLastEdited', async () => {
      const initialResponse = adminQuizInfo(session, quizId) as QuizInfo;
      const initialTimeCreated = initialResponse.timeCreated;
      const initialTimeLastEdited = initialResponse.timeLastEdited;

      expect(initialTimeCreated).toBe(initialTimeLastEdited);

      await delay(1000);
      adminQuizNameUpdate(session, quizId, 'Updated Quiz Name');

      infoResponse = adminQuizInfo(session, quizId) as QuizInfo;

      expect(infoResponse.name).toBe('Updated Quiz Name');

      expect(typeof infoResponse.timeCreated).toBe('number');
      expect(typeof infoResponse.timeLastEdited).toBe('number');

      expect(infoResponse.timeLastEdited).toBeGreaterThan(initialTimeCreated);
      expect(infoResponse.timeLastEdited).not.toBe(initialTimeCreated);
      expect(infoResponse).toEqual({
        quizId,
        name: 'Updated Quiz Name',
        timeCreated: expect.any(Number),
        timeLastEdited: expect.any(Number),
        description,
        numQuestions: 0,
        questions: [],
        timeLimit: 0,
      });
    });
  });

  describe('adminQuizInfo - Failure Cases', () => {
    let response: QuizInfo | number;
    test('Fails for invalid session or userId', () => {
      response = adminQuizInfo('invalidsession', quizId);
      expect(response).toStrictEqual(401);
    });

    test('Fails for invalid quizId', () => {
      response = adminQuizInfo(session, quizId + 1);
      expect(response).toStrictEqual(403);
    });

    test('Fails when user does not own the quiz', () => {
      const { session: nonOwnerId } = adminAuthRegister(
        anotherEmail,
        anotherPassword,
        anotherFirstName,
        anotherLastName
      ) as { session: string };
      response = adminQuizInfo(nonOwnerId, quizId);
      expect(response).toStrictEqual(403);
    });
  });
});
