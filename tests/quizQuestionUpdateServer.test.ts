/// /////////////////////////////////////////////////////////////////////////////
//                             FUNCTION IMPORTS                               //
/// /////////////////////////////////////////////////////////////////////////////
import {
  adminAuthRegister,
  adminQuizCreate,
  adminQuizQuestionCreate,
  adminQuizQuestionUpdate,
  adminQuizInfo,
  clear,
} from './wrapperFunctions';

import { QuizInfo } from './interfaces';
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

const questionUpdate = {
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
    {
      answer: 'Queen Bee',
      correct: false,
    },
  ],
};

/// /////////////////////////////////////////////////////////////////////////////
//                                 TESTING                                    //
/// /////////////////////////////////////////////////////////////////////////////
describe('adminQuizQuestionUpdate', () => {
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

  describe('adminQuizQuestionUpdate - Success Cases', () => {
    test('Successfully updates a Quiz Question, when Questions are changed,' +
      'last time edited updates and colours are randomly generated', () => {
      const updateResponse = adminQuizQuestionUpdate(
        quizId,
        questionId,
        session,
        questionUpdate
      );
      expect(updateResponse).toStrictEqual({});

      const InfoResponse = adminQuizInfo(session, quizId) as QuizInfo;
      expect(InfoResponse.questions[0].question).toBe(
        'Who is the Monarch of England?'
      );
      expect(InfoResponse.questions[0].timeLimit).toBe(4);
      expect(InfoResponse.questions[0].points).toBe(5);
    });

    test('Successfully updates a Quiz Question, when answer is added, last time edited' +
      'updates and colours are randomly generated', () => {
      const updateResponse = adminQuizQuestionUpdate(
        quizId,
        questionId,
        session,
        questionUpdate
      );
      expect(updateResponse).toStrictEqual({});

      const InfoResponse = adminQuizInfo(session, quizId) as QuizInfo;
      expect(InfoResponse.questions[0].answerOptions.length).toBe(4);
    });

    test('Successfully updates a Quiz Question, when timeLimit is changed, last time edited' +
      'updates and colours are randomly generated', () => {
      const updateResponse = adminQuizQuestionUpdate(
        quizId,
        questionId,
        session,
        question
      );
      expect(updateResponse).toStrictEqual({});

      const InfoResponse = adminQuizInfo(session, quizId) as QuizInfo;
      expect(InfoResponse.questions[0].timeLimit).toBe(4);
    });

    test('Successfully updates a Quiz Question, when points are changed, last time edited' +
      'updates and colours are randomly generated', () => {
      const updateResponse = adminQuizQuestionUpdate(
        quizId,
        questionId,
        session,
        question
      );
      expect(updateResponse).toStrictEqual({});

      const InfoResponse = adminQuizInfo(session, quizId) as QuizInfo;
      expect(InfoResponse.questions[0].points).toBe(5);
    });

    test('Successfully updates multiple Quiz Questions, last time edited updates and colours' +
      'are randomly generated', () => {
      const updateResponse1 = adminQuizQuestionUpdate(
        quizId,
        questionId,
        session,
        questionUpdate
      );
      expect(updateResponse1).toStrictEqual({});

      const question3 = {
        question: 'What is the square root of 16?',
        timeLimit: 5,
        points: 10,
        answerOptions: [
          {
            answer: '4',
            correct: true,
          },
          {
            answer: '5',
            correct: false,
          },
        ],
      };
      const createQuestionResponse2 = adminQuizQuestionCreate(
        quizId,
        session,
        question3
      ) as { questionId: number };
      const questionId2 = createQuestionResponse2.questionId;
      const updateResponse2 = adminQuizQuestionUpdate(
        quizId,
        questionId2,
        session,
        questionUpdate
      );
      expect(updateResponse2).toStrictEqual({});
    });
  });

  describe('adminQuizQuestionUpdate - Failure Cases', () => {
    test('Question Id does not refer to a valid question within this quiz', () => {
      const invalidQuestionId = 9999;
      const updateResponse = adminQuizQuestionUpdate(
        quizId,
        invalidQuestionId,
        session,
        questionUpdate
      );
      expect(updateResponse).toBe(400);
    });

    test('Question string is less than 5 characters in length or greater than 50' +
      'characters in length', () => {
      const invalidQuestion = {
        question: '123',
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
      const updateResponse = adminQuizQuestionUpdate(
        quizId,
        questionId,
        session,
        invalidQuestion
      );
      expect(updateResponse).toBe(400);
    });

    test('The question has more than 6 answers or less than 2 answers', () => {
      const invalidQuestion = {
        question: 'Who is the Monarch of England?',
        timeLimit: 4,
        points: 5,
        answerOptions: [
          { answer: 'test', correct: false },
          { answer: 'test', correct: false },
          { answer: 'test', correct: false },
          { answer: 'test', correct: false },
          { answer: 'test', correct: false },
          { answer: 'test', correct: false },
          { answer: 'test', correct: false },
        ],
      };
      const updateResponse = adminQuizQuestionUpdate(
        quizId,
        questionId,
        session,
        invalidQuestion
      );
      expect(updateResponse).toBe(400);
    });

    test('The question timeLimit is not a positive number', () => {
      const invalidQuestion = {
        question: 'Who is the Monarch of England?',
        timeLimit: -1,
        points: 5,
        answerOptions: [
          { answer: 'Prince Charles', correct: true },
          { answer: 'Prince Sandeep', correct: false },
          { answer: 'King Arthur', correct: false },
        ],
      };
      const updateResponse = adminQuizQuestionUpdate(
        quizId,
        questionId,
        session,
        invalidQuestion
      );
      expect(updateResponse).toBe(400);
    });

    test('If this question were to be updated, the sum of the question timeLimits' +
      'in the quiz exceeds 3 minutes', () => {
      const invalidQuestion = {
        question: 'Who is the Monarch of England?',
        timeLimit: 185,
        points: 5,
        answerOptions: [
          { answer: 'Prince Charles', correct: true },
          { answer: 'Prince Sandeep', correct: false },
          { answer: 'King Arthur', correct: false },
        ],
      };
      const updateResponse = adminQuizQuestionUpdate(
        quizId,
        questionId,
        session,
        invalidQuestion
      );
      expect(updateResponse).toBe(400);
    });

    test('The points awarded for the question are less than 1 or greater than 10', () => {
      const invalidQuestion = {
        question: 'Who is the Monarch of England?',
        timeLimit: 4,
        points: 0,
        answerOptions: [
          { answer: 'Prince Charles', correct: true },
          { answer: 'Prince Sandeep', correct: false },
          { answer: 'King Arthur', correct: false },
        ],
      };
      const updateResponse = adminQuizQuestionUpdate(
        quizId,
        questionId,
        session,
        invalidQuestion
      );
      expect(updateResponse).toBe(400);
    });

    test('The length of any answer is shorter than 1 character long, or longer' +
      'than 30 characters long', () => {
      const invalidQuestion = {
        question: 'Who is the Monarch of England?',
        timeLimit: 4,
        points: 5,
        answerOptions: [
          { answer: 'A', correct: true },
          { answer: 'A'.repeat(31), correct: false },
        ],
      };
      const updateResponse = adminQuizQuestionUpdate(
        quizId,
        questionId,
        session,
        invalidQuestion
      );
      expect(updateResponse).toBe(400);
    });

    test('Any answer strings are duplicates of one another (within the same question)', () => {
      const invalidQuestion = {
        question: 'Who is the Monarch of England?',
        timeLimit: 4,
        points: 5,
        answerOptions: [
          { answer: 'Prince Charles', correct: true },
          { answer: 'Prince Charles', correct: false },
        ],
      };
      const updateResponse = adminQuizQuestionUpdate(
        quizId,
        questionId,
        session,
        invalidQuestion
      );
      expect(updateResponse).toBe(400);
    });

    test('There are no correct answers', () => {
      const invalidQuestion = {
        question: 'Who is the Monarch of England?',
        timeLimit: 4,
        points: 5,
        answerOptions: [
          { answer: 'Prince Sandeep', correct: false },
          { answer: 'King Arthur', correct: false },
        ],
      };
      const updateResponse = adminQuizQuestionUpdate(
        quizId,
        questionId,
        session,
        invalidQuestion
      );
      expect(updateResponse).toBe(400);
    });

    test('Session is empty or invalid', () => {
      const invalidSession = '';
      const updateResponse = adminQuizQuestionUpdate(
        quizId,
        questionId,
        invalidSession,
        questionUpdate
      );
      expect(updateResponse).toBe(401);
    });

    test('Valid session is provided, but user is not an owner of this quiz or quiz' +
      'does not exist', () => {
      const registerOther = adminAuthRegister(
        anotherEmail,
        anotherPassword,
        anotherFirstName,
        anotherLastName
      ) as { session: string };
      const otherSession = registerOther.session;
      const updateResponse = adminQuizQuestionUpdate(
        quizId,
        questionId,
        otherSession,
        questionUpdate
      );
      expect(updateResponse).toBe(403);
    });
  });
});
