/// /////////////////////////////////////////////////////////////////////////////
//                             FUNCTION IMPORTS                               //
/// /////////////////////////////////////////////////////////////////////////////
import {
  adminAuthRegister,
  adminQuizCreate,
  adminQuizInfo,
  adminQuizQuestionCreate,
  clear,
} from './wrapperFunctions';

/// /////////////////////////////////////////////////////////////////////////////
//                                 CONSTANTS                                  //
/// /////////////////////////////////////////////////////////////////////////////
const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
};

const QUESTION_LIMITS = {
  MIN_LENGTH: 5,
  MAX_LENGTH: 50,
};

const ANSWER_LIMITS = {
  MIN_LENGTH: 1,
  MAX_LENGTH: 30,
  MIN_COUNT: 2,
  MAX_COUNT: 6,
};

const TIME_LIMITS = {
  MIN: 1,
  MAX: 180,
  TOTAL_MAX: 180,
  VALID: 30,
  ZERO: 0,
  NEGATIVE: -30,
  EXCEEDS_TOTAL_MAX: 181,
  EXCEEDS_TOTAL_MIN: 0,
};

const POINTS_LIMITS = {
  MIN: 1,
  MAX: 10,
  VALID: 5,
  ZERO: 0,
  NEGATIVE: -5,
};

const VALID_QUESTION = {
  question: 'What is the capital of France?',
  timeLimit: TIME_LIMITS.VALID,
  points: POINTS_LIMITS.VALID,
  answerOptions: [
    { answer: 'Paris', correct: true },
    { answer: 'London', correct: false },
  ],
};

const VALID_QUESTION_2 = {
  question: 'What is the capital of Germany?',
  timeLimit: TIME_LIMITS.VALID,
  points: POINTS_LIMITS.VALID,
  answerOptions: [
    { answer: 'Berlin', correct: true },
    { answer: 'Munich', correct: false },
  ],
};

/// /////////////////////////////////////////////////////////////////////////////
//                                 TESTING                                    //
/// /////////////////////////////////////////////////////////////////////////////
describe('Quiz Question Create tests', () => {
  let sessionId: string;
  let quizId: number;

  beforeEach(() => {
    clear();
    const registerResult = adminAuthRegister(
      'example@email.com',
      'password123',
      'Dylan',
      'Smith'
    );
    sessionId = (registerResult as { session: string }).session;
    const quizCreateResult = adminQuizCreate(
      sessionId,
      'Quiz Name',
      'Quiz Description'
    );
    quizId = (quizCreateResult as { quizId: number }).quizId;
  });

  afterAll(() => {
    clear();
  });

  describe('Success Cases', () => {
    test('Correct return value', () => {
      const questionCreateResult = adminQuizQuestionCreate(
        quizId,
        sessionId,
        VALID_QUESTION
      );
      expect(questionCreateResult).toEqual({
        questionId: expect.any(Number),
      });
    });
    describe('Valid question creation', () => {
      test.each([
        { points: POINTS_LIMITS.VALID, timeLimit: TIME_LIMITS.VALID },
        { points: POINTS_LIMITS.MAX, timeLimit: TIME_LIMITS.VALID },
        { points: POINTS_LIMITS.MIN, timeLimit: TIME_LIMITS.VALID },
        { points: POINTS_LIMITS.MAX, timeLimit: TIME_LIMITS.MAX },
        { points: POINTS_LIMITS.MAX, timeLimit: TIME_LIMITS.MIN },
      ])(
        'Creates question with points: $points and timeLimit: $timeLimit',
        ({ points, timeLimit }) => {
          const questionCreateResult = adminQuizQuestionCreate(
            quizId,
            sessionId,
            {
              question: 'What is the capital of France?',
              timeLimit,
              points,
              answerOptions: [
                { answer: 'Paris', correct: true },
                { answer: 'London', correct: false },
              ],
            }
          );

          expect(questionCreateResult).toEqual({
            questionId: expect.any(Number),
          });

          const questionId = (questionCreateResult as { questionId: number })
            .questionId;
          const quizInfoResult = adminQuizInfo(sessionId, quizId);

          expect(quizInfoResult).toEqual({
            quizId,
            name: 'Quiz Name',
            timeCreated: expect.any(Number),
            timeLastEdited: expect.any(Number),
            description: 'Quiz Description',
            numQuestions: 1,
            questions: [
              {
                questionId,
                question: 'What is the capital of France?',
                timeLimit,
                points,
                answerOptions: [
                  {
                    answerId: expect.any(Number),
                    answer: 'Paris',
                    colour: expect.any(String),
                    correct: true,
                  },
                  {
                    answerId: expect.any(Number),
                    answer: 'London',
                    colour: expect.any(String),
                    correct: false,
                  },
                ],
              },
            ],
            timeLimit,
          });
        }
      );
    });
    test('Multiple questions creation', () => {
      const questionCreateResult1 = adminQuizQuestionCreate(
        quizId,
        sessionId,
        VALID_QUESTION
      );

      expect(questionCreateResult1).toEqual({
        questionId: expect.any(Number),
      });

      const questionCreateResult2 = adminQuizQuestionCreate(
        quizId,
        sessionId,
        VALID_QUESTION_2
      );
      expect(questionCreateResult2).toEqual({
        questionId: expect.any(Number),
      });

      const quizInfoResult = adminQuizInfo(sessionId, quizId);
      expect(quizInfoResult).toEqual({
        quizId,
        name: 'Quiz Name',
        timeCreated: expect.any(Number),
        timeLastEdited: expect.any(Number),
        description: 'Quiz Description',
        numQuestions: 2,
        questions: [
          {
            questionId: (questionCreateResult1 as { questionId: number })
              .questionId,
            question: 'What is the capital of France?',
            timeLimit: TIME_LIMITS.VALID,
            points: POINTS_LIMITS.VALID,
            answerOptions: [
              {
                answerId: expect.any(Number),
                answer: 'Paris',
                colour: expect.any(String),
                correct: true,
              },
              {
                answerId: expect.any(Number),
                answer: 'London',
                colour: expect.any(String),
                correct: false,
              },
            ],
          },
          {
            questionId: (questionCreateResult2 as { questionId: number })
              .questionId,
            question: 'What is the capital of Germany?',
            timeLimit: TIME_LIMITS.VALID,
            points: POINTS_LIMITS.VALID,
            answerOptions: [
              {
                answerId: expect.any(Number),
                answer: 'Berlin',
                colour: expect.any(String),
                correct: true,
              },
              {
                answerId: expect.any(Number),
                answer: 'Munich',
                colour: expect.any(String),
                correct: false,
              },
            ],
          },
        ],
        timeLimit: TIME_LIMITS.VALID + TIME_LIMITS.VALID,
      });
    });
  });

  describe('Error Cases', () => {
    describe('Invalid Session', () => {
      test.each([
        { session: '', description: 'empty session' },
        { session: sessionId + 'invalid', description: 'invalid session' },
      ])('Session is $description', ({ session }) => {
        const questionCreateResult = adminQuizQuestionCreate(quizId, session, {
          question: 'What is the capital of France?',
          timeLimit: TIME_LIMITS.VALID,
          points: POINTS_LIMITS.VALID,
          answerOptions: [
            { answer: 'Paris', correct: true },
            { answer: 'London', correct: false },
          ],
        });
        expect(questionCreateResult).toEqual(HTTP_STATUS.UNAUTHORIZED);
      });
    });

    describe('Unauthorised Access', () => {
      test('Valid session, but user is not the owner of the quiz', () => {
        const anotherRegisterResult = adminAuthRegister(
          'another@email.com',
          'password456',
          'Alex',
          'Johnson'
        );
        const anotherSessionId = (anotherRegisterResult as { session: string })
          .session;

        const questionCreateResult = adminQuizQuestionCreate(
          quizId,
          anotherSessionId,
          {
            question: 'What is the capital of France?',
            timeLimit: TIME_LIMITS.VALID,
            points: POINTS_LIMITS.VALID,
            answerOptions: [
              { answer: 'Paris', correct: true },
              { answer: 'London', correct: false },
            ],
          }
        );
        expect(questionCreateResult).toEqual(HTTP_STATUS.FORBIDDEN);
      });

      test('Valid session, but quiz does not exist', () => {
        const questionCreateResult = adminQuizQuestionCreate(9999, sessionId, {
          question: 'What is the capital of France?',
          timeLimit: TIME_LIMITS.VALID,
          points: POINTS_LIMITS.VALID,
          answerOptions: [
            { answer: 'Paris', correct: true },
            { answer: 'London', correct: false },
          ],
        });
        expect(questionCreateResult).toEqual(HTTP_STATUS.FORBIDDEN);
      });
    });

    describe('Invalid Question Length', () => {
      test.each([
        {
          question: 'Wat?',
          description: `less than ${QUESTION_LIMITS.MIN_LENGTH} characters`,
        },
        {
          question: 'a'.repeat(QUESTION_LIMITS.MAX_LENGTH + 1),
          description: `more than ${QUESTION_LIMITS.MAX_LENGTH} characters`,
        },
      ])('Question is $description', ({ question }) => {
        const questionCreateResult = adminQuizQuestionCreate(
          quizId,
          sessionId,
          {
            question,
            timeLimit: TIME_LIMITS.VALID,
            points: POINTS_LIMITS.VALID,
            answerOptions: [
              { answer: 'Paris', correct: true },
              { answer: 'London', correct: false },
            ],
          }
        );
        expect(questionCreateResult).toEqual(HTTP_STATUS.BAD_REQUEST);
      });
    });

    describe('Invalid Answer Options', () => {
      test.each([
        {
          answerOptions: [{ answer: '', correct: true }],
          description: `less than ${ANSWER_LIMITS.MIN_LENGTH} character`,
        },
        {
          answerOptions: [
            { answer: 'a'.repeat(ANSWER_LIMITS.MAX_LENGTH + 1), correct: true },
            { answer: 'London', correct: false },
          ],
          description: `more than ${ANSWER_LIMITS.MAX_LENGTH} characters`,
        },
        {
          answerOptions: [
            { answer: 'Paris', correct: true },
            { answer: 'London', correct: false },
            { answer: 'Madrid', correct: false },
            { answer: 'Madrid', correct: false },
          ],
          description: 'duplicate answers',
        },
        {
          answerOptions: [
            { answer: 'Sydney', correct: false },
            { answer: 'London', correct: false },
            { answer: 'Berlin', correct: false },
            { answer: 'Madrid', correct: false },
          ],
          description: 'no correct answer',
        },
        {
          answerOptions: [{ answer: 'Paris', correct: true }],
          description: `less than ${ANSWER_LIMITS.MIN_COUNT} answers`,
        },
        {
          answerOptions: [
            { answer: 'Paris', correct: true },
            { answer: 'London', correct: false },
            { answer: 'Berlin', correct: false },
            { answer: 'Madrid', correct: false },
            { answer: 'Rome', correct: false },
            { answer: 'Tokyo', correct: false },
            { answer: 'New York', correct: false },
          ],
          description: `more than ${ANSWER_LIMITS.MAX_COUNT} answers`,
        },
      ])('Answer options are invalid: $description', ({ answerOptions }) => {
        const questionCreateResult = adminQuizQuestionCreate(
          quizId,
          sessionId,
          {
            question: 'What is the capital of France?',
            timeLimit: TIME_LIMITS.VALID,
            points: POINTS_LIMITS.VALID,
            answerOptions,
          }
        );
        expect(questionCreateResult).toEqual(HTTP_STATUS.BAD_REQUEST);
      });
    });

    describe('Invalid Time Limits', () => {
      test.each([
        { timeLimit: TIME_LIMITS.NEGATIVE, description: 'negative time limit' },
        { timeLimit: TIME_LIMITS.ZERO, description: 'zero time limit' },
      ])('Time limit is $description', ({ timeLimit }) => {
        const questionCreateResult = adminQuizQuestionCreate(
          quizId,
          sessionId,
          {
            question: 'What is the capital of France?',
            timeLimit,
            points: POINTS_LIMITS.VALID,
            answerOptions: [
              { answer: 'Paris', correct: true },
              { answer: 'London', correct: false },
            ],
          }
        );
        expect(questionCreateResult).toEqual(HTTP_STATUS.BAD_REQUEST);
      });

      test(`Sum of time limits exceeds ${TIME_LIMITS.TOTAL_MAX} seconds`, () => {
        adminQuizQuestionCreate(quizId, sessionId, {
          question: 'Question 1',
          timeLimit: TIME_LIMITS.VALID,
          points: POINTS_LIMITS.VALID,
          answerOptions: [
            { answer: 'Paris', correct: true },
            { answer: 'London', correct: false },
          ],
        });

        const questionCreateResult = adminQuizQuestionCreate(
          quizId,
          sessionId,
          {
            question: 'Question 2',
            timeLimit: TIME_LIMITS.TOTAL_MAX - TIME_LIMITS.VALID + 1,
            points: POINTS_LIMITS.VALID,
            answerOptions: [
              { answer: 'Berlin', correct: true },
              { answer: 'Madrid', correct: false },
            ],
          }
        );

        expect(questionCreateResult).toEqual(HTTP_STATUS.BAD_REQUEST);
      });
    });

    describe('Invalid Points', () => {
      test.each([
        { points: POINTS_LIMITS.NEGATIVE, description: 'negative points' },
        { points: POINTS_LIMITS.ZERO, description: 'zero points' },
        {
          points: POINTS_LIMITS.MAX + 1,
          description: `points greater than ${POINTS_LIMITS.MAX}`,
        },
      ])('Points are $description', ({ points }) => {
        const questionCreateResult = adminQuizQuestionCreate(
          quizId,
          sessionId,
          {
            question: 'What is the capital of France?',
            timeLimit: TIME_LIMITS.VALID,
            points,
            answerOptions: [
              { answer: 'Paris', correct: true },
              { answer: 'London', correct: false },
            ],
          }
        );
        expect(questionCreateResult).toEqual(HTTP_STATUS.BAD_REQUEST);
      });
    });
  });
});
