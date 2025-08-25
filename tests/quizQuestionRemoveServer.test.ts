/// /////////////////////////////////////////////////////////////////////////////
//                             FUNCTION IMPORTS                               //
/// /////////////////////////////////////////////////////////////////////////////
import {
  adminAuthRegister,
  adminQuizCreate,
  adminQuizInfo,
  adminQuizQuestionCreate,
  adminQuizQuestionRemove,
  clear,
} from './wrapperFunctions';
/// /////////////////////////////////////////////////////////////////////////////
//                             INITIALISATION                                 //
/// /////////////////////////////////////////////////////////////////////////////
// adminAuthRegister
const validFirstName = 'Hayden';
const validLastName = 'Smith';
const validEmail = 'hayden.smith@unsw.edu.au';
const validPassword = 'password6';

const anotherFirstName = 'Alice';
const anotherLastName = 'Brown';
const anotherEmail = 'alice.brown@unsw.edu.au';
const anotherPassword = 'password6';

// adminQuizCreate
const name = 'Quiz 1';
const description = 'Test Quiz';

// adminQuizQuestionCreate
const question = {
  question: 'Who is the Monarch of England?',
  timeLimit: 4,
  points: 5,
  answerOptions: [
    {
      answer: 'Prince Charles',
      correct: true,
    },
    {
      answer: 'Prince Sandeep',
      correct: false,
    },
    {
      answer: 'King Arthur',
      correct: false,
    },
  ],
};

const question2 = {
  question: 'What is the capital of France?',
  timeLimit: 5,
  points: 9,
  answerOptions: [
    {
      answer: 'Paris',
      correct: true,
    },
    {
      answer: 'Lyon',
      correct: false,
    },
    {
      answer: 'FRANCE',
      correct: false,
    },
  ],
};

/// /////////////////////////////////////////////////////////////////////////////
//                                 TESTING                                    //
/// /////////////////////////////////////////////////////////////////////////////

describe('quizQuestionRemove', () => {
  let session: string;
  let quizId: number;
  let questionId: number;

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

    const createQuestionResponse = adminQuizQuestionCreate(
      quizId,
      session,
      question
    ) as { questionId: number };
    questionId = createQuestionResponse.questionId;
  });

  afterEach(() => {
    clear();
  });

  describe('quizQuestionRemove - Success Cases', () => {
    test('Successfully removes a Quiz Question', () => {
      const removeResponse = adminQuizQuestionRemove(
        quizId,
        questionId,
        session
      );
      expect(removeResponse).toStrictEqual({});

      const quizInfo = adminQuizInfo(session, quizId) as { questions: any[] };
      expect(quizInfo.questions.length).toBe(0);
    });

    test('Successfully removes multiple Quiz Questions', () => {
      const secondQuestion = adminQuizQuestionCreate(
        quizId,
        session,
        question2
      ) as { questionId: number };

      const res1 = adminQuizQuestionRemove(quizId, questionId, session);
      const res2 = adminQuizQuestionRemove(
        quizId,
        secondQuestion.questionId,
        session
      );

      expect(res1).toStrictEqual({});
      expect(res2).toStrictEqual({});

      const quizInfo = adminQuizInfo(session, quizId) as { questions: any[] };
      expect(quizInfo.questions.length).toBe(0);
    });
  });
  describe('quizQuestionRemove - Failure Cases', () => {
    test('QuestionId does not refer to a valid question in quiz', () => {
      const removeResponse = adminQuizQuestionRemove(
        quizId,
        questionId + 999,
        session
      );
      expect(removeResponse).toStrictEqual(400);
    });

    test.each([
      { description: 'invalid session token', session: session + 'x' },
      { description: 'empty session token', session: '' },
    ])('Session is invalid or empty: $description', ({ session }) => {
      const removeResponse = adminQuizQuestionRemove(
        quizId,
        questionId,
        session
      );
      expect(removeResponse).toStrictEqual(401);
    });

    test('Valid session is provided, but user is not an owner of this quiz', () => {
      const registerOther = adminAuthRegister(
        anotherEmail,
        anotherPassword,
        anotherFirstName,
        anotherLastName
      ) as { session: string };
      const otherSession = registerOther.session;

      const removeResponse = adminQuizQuestionRemove(
        quizId,
        questionId,
        otherSession
      );
      expect(removeResponse).toStrictEqual(403);
    });

    test('Quiz ID does not exist', () => {
      const removeResponse = adminQuizQuestionRemove(
        quizId + 999,
        questionId,
        session
      );
      expect(removeResponse).toStrictEqual(403);
    });
  });
});
