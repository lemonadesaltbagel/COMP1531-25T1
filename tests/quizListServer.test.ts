/// /////////////////////////////////////////////////////////////////////////////
//                             FUNCTION IMPORTS                               //
/// /////////////////////////////////////////////////////////////////////////////
import {
  adminAuthRegister,
  adminQuizCreate,
  adminQuizList,
  clear,
} from './wrapperFunctions';

/// /////////////////////////////////////////////////////////////////////////////
//                             INITIALISATION                                 //
/// /////////////////////////////////////////////////////////////////////////////
const validFirstName = 'Hayden';
const validLastName = 'Smith';
const validEmail = 'hayden.smith@unsw.edu.au';
const validPassword = 'password6';

const validFirstNameSecond = 'Jayden';
const validLastNameSecond = 'Smoth';
const validEmailSecond = 'jayden.smoth@unsw.edu.au';
const validPasswordSecond = 'password8';

const name = 'quizName';
const description = 'quizDescription';

const nameSecond = 'quizNameSecond';
const descriptionSecond = 'quizDescriptionSecond';

/// /////////////////////////////////////////////////////////////////////////////
//                                 TESTING                                    //
/// /////////////////////////////////////////////////////////////////////////////
describe('adminQuizList', () => {
  let quizId: number;
  let sessionId: string;
  let secondSessionId: string;
  let quizIdSecond: number;

  beforeEach(() => {
    clear();
    const registeredUser = adminAuthRegister(
      validEmail,
      validPassword,
      validFirstName,
      validLastName
    );
    sessionId = (registeredUser as { session: string }).session;
    const createResponse = adminQuizCreate(sessionId, name, description);
    if (
      typeof createResponse === 'object' &&
      createResponse !== null &&
      'quizId' in createResponse
    ) {
      quizId = createResponse.quizId;
    }
  });

  afterEach(() => {
    clear();
  });

  describe('adminQuizList - Success Cases', () => {
    test('Successfully returns quizzes when owner owns no quizzes', () => {
      const secondUser = adminAuthRegister(
        validEmailSecond,
        validPasswordSecond,
        validFirstNameSecond,
        validLastNameSecond
      );
      secondSessionId = (secondUser as { session: string }).session;

      const response = adminQuizList(secondSessionId);
      expect(response).toMatchObject({
        quizzes: [],
      });
    });

    test('Successfully returns quizzes when owner owns one quiz', () => {
      const response = adminQuizList(sessionId);
      expect(response).toMatchObject({
        quizzes: [
          {
            quizId,
            name,
          },
        ],
      });
    });

    test('Successfully returns quizzes when owner owns multiple quizzes', () => {
      const secondResponse = adminQuizCreate(
        sessionId,
        nameSecond,
        descriptionSecond
      );
      if (
        typeof secondResponse === 'object' &&
        secondResponse !== null &&
        'quizId' in secondResponse
      ) {
        quizIdSecond = secondResponse.quizId;
      }
      const response = adminQuizList(sessionId);
      expect(response).toMatchObject({
        quizzes: [
          {
            quizId: quizId,
            name: name,
          },
          {
            quizId: quizIdSecond,
            name: nameSecond,
          },
        ],
      });
    });
  });

  describe('adminQuizList - Error cases', () => {
    test('Fails for invalid userId', () => {
      const response = adminQuizList(sessionId + 1);
      expect(response).toStrictEqual(401);
    });
  });
});
