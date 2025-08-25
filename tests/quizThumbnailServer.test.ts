/// /////////////////////////////////////////////////////////////////////////////
//                             FUNCTION IMPORTS                               //
/// ////////////////////////////////////////////////////////////////////
import {
  adminAuthRegister,
  adminQuizCreate,
  adminQuizInfoV2,
  adminQuizThumbnailUpdate,
  clear,
} from './wrapperFunctions';

import { QuizInfoV2 } from './interfaces';
/// /////////////////////////////////////////////////////////////////////////////
//                                 CONSTANTS                                  //
/// /////////////////////////////////////////////////////////////////////////////
const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  INVALID_GAMEID: 400,
  INVALID_PLAYERNAME: 400,
  EMPTY_SESSION: 401,
  INVALID_SESSION: 401,
  UNAUTHORIZED: 403,
  INVALID_QUIZ: 403,
  FORBIDDEN: 403,
};

const JPG_VALID_URL = 'http://google.com/some/image/path.jpg';
const JPEG_VALID_URL = 'http://google.com/some/image/path.jpeg';
const PNG_VALID_URL = 'http://google.com/some/image/path.png';
const HTTP_VALID_URL = 'http://google.com/some/image/path.png';
const HTTPS_VALID_URL = 'https://google.com/some/image/path.png';
/// /////////////////////////////////////////////////////////////////////////////
//                             INITIALISATION                                 //
/// /////////////////////////////////////////////////////////////////////////////
const validFirstName = 'Hayden';
const validLastName = 'Smith';
const validEmail = 'hayden.smith@unsw.edu.au';
const validPassword = 'password6';
const name = 'Quiz 1';
const description = 'Valid Quiz Description';

const anotherFirstName = 'Alex';
const anotherLastName = 'Lum';
const anotherEmail = 'alex.lum@unsw.edu.au';
const anotherPassword = 'password7';
const anotherName = 'Quiz 2';
const anotherDescription = 'Second Quiz Description';

let session: string;
let quizId: number;
let secondQuizId: number;

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

  const secondResponse = adminQuizCreate(
    session,
    anotherName,
    anotherDescription
  ) as {
    quizId: number;
  };
  secondQuizId = secondResponse.quizId;
});

afterEach(() => {
  clear();
});

describe('adminQuizThumbnailUpdate', () => {
  describe('adminQuizThumbnailUpdate - Success Cases', () => {
    describe('Successfully updates thumbnail for quiz with different filetypes ', () => {
      test.each([
        { thumbnailUrl: JPG_VALID_URL, description: 'jpg filetype at end' },
        { thumbnailUrl: JPEG_VALID_URL, description: 'jpeg filetype at end' },
        { thumbnailUrl: PNG_VALID_URL, description: 'png filetype at end' },
        {
          thumbnailUrl: HTTP_VALID_URL,
          description: 'HTTP:// filetype at beginning',
        },
        {
          thumbnailUrl: HTTPS_VALID_URL,
          description: 'HTTPS:// filetype at beginning',
        },
      ])('400 for invalid thumbnailUrl filetype', ({ thumbnailUrl }) => {
        const result = adminQuizThumbnailUpdate(quizId, session, thumbnailUrl);
        expect(result).toEqual({});

        const infoResult = adminQuizInfoV2(session, quizId) as QuizInfoV2;
        expect(infoResult.thumbnailUrl).toStrictEqual(thumbnailUrl);
      });
    });

    test('Successfully updates thumbnail for multiple quizzes', () => {
      const result = adminQuizThumbnailUpdate(quizId, session, JPG_VALID_URL);
      const result1 = adminQuizThumbnailUpdate(
        secondQuizId,
        session,
        PNG_VALID_URL
      );
      expect(result).toEqual({});
      expect(result1).toEqual({});

      const infoResult = adminQuizInfoV2(session, quizId) as QuizInfoV2;
      expect(infoResult.thumbnailUrl).toStrictEqual(JPG_VALID_URL);

      const secondInfoResult = adminQuizInfoV2(session, secondQuizId) as QuizInfoV2;
      expect(secondInfoResult.thumbnailUrl).toStrictEqual(PNG_VALID_URL);
    });
  });

  describe('adminQuizThumbnailUpdate - Failure Cases', () => {
    // remove test.each as case insensitive?
    test.each([
      { thumbnailUrl: 'http://google.com/some/image/path.' },
      { thumbnailUrl: 'http://google.com/some/image/path.JPEGG' },
      { thumbnailUrl: 'http://google.com/some/image/path.mov' },
    ])('400 for invalid thumbnailUrl filetype', ({ thumbnailUrl }) => {
      const quizThumbnailResult = adminQuizThumbnailUpdate(
        quizId,
        session,
        thumbnailUrl
      );
      expect(quizThumbnailResult).toStrictEqual(HTTP_STATUS.BAD_REQUEST);
    });
    // remove test.each as case insensitive?
    test.each([
      { thumbnailUrl: 'google.com/some/image/path.jpg' },
      { thumbnailUrl: 'httpss://google.com/some/image/path.jpeg' },
    ])('400 for invalid thumbnailUrl beginning url', ({ thumbnailUrl }) => {
      const quizThumbnailResult = adminQuizThumbnailUpdate(
        quizId,
        session,
        thumbnailUrl
      );
      expect(quizThumbnailResult).toStrictEqual(HTTP_STATUS.BAD_REQUEST);
    });

    describe('Invalid Session', () => {
      test.each([{ session: '' }, { session: session + 'invalid' }])(
        'Session is $description',
        ({ session }) => {
          const quizThumbnailResult = adminQuizThumbnailUpdate(
            quizId,
            session,
            JPG_VALID_URL
          );
          expect(quizThumbnailResult).toEqual(HTTP_STATUS.INVALID_SESSION);
        }
      );
    });

    test('Fails for invalid quizId', () => {
      const result = adminQuizThumbnailUpdate(9999, session, JPG_VALID_URL);

      expect(result).toStrictEqual(HTTP_STATUS.UNAUTHORIZED);
    });

    test('Fails when user does not own the quiz', () => {
      const nonOwnerId = adminAuthRegister(
        anotherEmail,
        anotherPassword,
        anotherFirstName,
        anotherLastName
      );

      const nonOwnerSessionId = (nonOwnerId as { session: string }).session;
      const quizThumbnailResult = adminQuizThumbnailUpdate(
        quizId,
        nonOwnerSessionId,
        JPG_VALID_URL
      );

      expect(quizThumbnailResult).toStrictEqual(HTTP_STATUS.UNAUTHORIZED);
    });
  });
});
