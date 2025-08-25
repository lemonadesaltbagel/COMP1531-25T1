/// ////////////////////////////////////////////////////////////////////////////
//                             FUNCTION IMPORTS                               //
/// ////////////////////////////////////////////////////////////////////////////
import request from 'sync-request-curl';
import config from '../src/config.json';

const PORT: number = parseInt(process.env.PORT || config.port);
const HOST: string = process.env.IP || '127.0.0.1';
const SERVER_URL = `http://${HOST}:${PORT}`;
const TIMEOUT_MS = 10000;

/// ////////////////////////////////////////////////////////////////////////////
//                              TYPE DEFINITIONS                              //
/// ////////////////////////////////////////////////////////////////////////////
interface AnswerOption {
  answer: string;
  correct: boolean;
}

interface Question {
  question: string;
  timeLimit: number;
  points: number;
  answerOptions: AnswerOption[];
  thumbnailUrl?: string;
}

interface AnswerOptionInfo {
  answer: string;
  correct: boolean;
}

interface QuestionInfo {
  questionId: number;
  question: string;
  duration: number;
  timeLimit: number;
  points: number;
  answerOptions: AnswerOptionInfo[];
  thumbnailUrl?: string;
}

interface QuizInfo {
  quizId: number;
  name: string;
  timeCreated: number;
  timeLastEdited: number;
  description: string;
  numQuestions: number;
  questions: QuestionInfo[];
  duration: number;
  thumbnailUrl?: string;
}

/// ////////////////////////////////////////////////////////////////////////////
//                          HARDCODED FUNCTIONS                               //
/// ////////////////////////////////////////////////////////////////////////////
function adminAuthRegister(
  email: string,
  password: string,
  nameFirst: string,
  nameLast: string
) {
  const res = request('POST', `${SERVER_URL}/v1/admin/auth/register`, {
    json: {
      email,
      password,
      nameFirst,
      nameLast,
    },
    timeout: TIMEOUT_MS,
  });

  if (res.statusCode !== 200) {
    return res.statusCode;
  }

  return JSON.parse(res.body.toString());
}

function adminQuizCreate(session: string, name: string, description: string) {
  const res = request('POST', `${SERVER_URL}/v1/admin/quiz`, {
    headers: { session },
    json: { name, description },
    timeout: TIMEOUT_MS,
  });

  if (res.statusCode !== 200) {
    return res.statusCode;
  }

  return JSON.parse(res.body.toString());
}

function adminQuizInfo(session: string, quizId: number) {
  const res = request('GET', `${SERVER_URL}/v1/admin/quiz/${quizId}`, {
    headers: { session },
    timeout: TIMEOUT_MS,
  });

  if (res.statusCode !== 200) {
    return res.statusCode;
  }

  return JSON.parse(res.body.toString());
}

function adminQuizQuestionCreate(
  quizId: number,
  session: string,
  questionBody: Question
) {
  const res = request(
    'POST',
    `${SERVER_URL}/v1/admin/quiz/${quizId}/question`,
    {
      headers: { session },
      json: { questionBody },
      timeout: TIMEOUT_MS,
    }
  );

  if (res.statusCode !== 200) {
    return res.statusCode;
  }

  return JSON.parse(res.body.toString());
}

function adminQuizQuestionUpdateV2(
  quizId: number,
  questionId: number,
  session: string,
  questionBody: Question
) {
  const res = request(
    'PUT',
    `${SERVER_URL}/v2/admin/quiz/${quizId}/question/${questionId}`,
    {
      headers: { session },
      json: { questionBody },
      timeout: TIMEOUT_MS,
    }
  );

  if (res.statusCode !== 200) {
    return res.statusCode;
  }

  return JSON.parse(res.body.toString());
}

function clear() {
  const res = request('DELETE', `${SERVER_URL}/v1/clear`, {
    timeout: TIMEOUT_MS,
  });

  if (res.statusCode !== 200) {
    return res.statusCode;
  }

  return JSON.parse(res.body.toString());
}

/// ////////////////////////////////////////////////////////////////////////////
//                             INITIALISATION                                 //
/// ////////////////////////////////////////////////////////////////////////////
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

const questionWithThumbnail = {
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
  thumbnailUrl: 'https://example.com/image.jpg',
};

/// ///////////////////////////////////////////////////////////////////////////
//                                 TESTING                                    //
/// ////////////////////////////////////////////////////////////////////////////
describe('adminQuizQuestionUpdateV2', () => {
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

  describe('adminQuizQuestionUpdateV2 - Success Cases', () => {
    test('Successfully updates a Quiz Question, when Questions are changed,' +
      'last time edited updates', () => {
      const updateResponse = adminQuizQuestionUpdateV2(
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

    test('Successfully updates a Quiz Question, when answer is added', () => {
      const updateResponse = adminQuizQuestionUpdateV2(
        quizId,
        questionId,
        session,
        questionUpdate
      );
      expect(updateResponse).toStrictEqual({});

      const InfoResponse = adminQuizInfo(session, quizId) as QuizInfo;
      expect(InfoResponse.questions[0].answerOptions.length).toBe(4);
    });

    test('Successfully updates a Quiz Question, when timeLimit is changed', () => {
      const updateResponse = adminQuizQuestionUpdateV2(
        quizId,
        questionId,
        session,
        question
      );
      expect(updateResponse).toStrictEqual({});

      const InfoResponse = adminQuizInfo(session, quizId) as QuizInfo;
      expect(InfoResponse.questions[0].timeLimit).toBe(4);
    });

    test('Successfully updates a Quiz Question, when points are changed', () => {
      const updateResponse = adminQuizQuestionUpdateV2(
        quizId,
        questionId,
        session,
        question
      );
      expect(updateResponse).toStrictEqual({});

      const InfoResponse = adminQuizInfo(session, quizId) as QuizInfo;
      expect(InfoResponse.questions[0].points).toBe(5);
    });

    test('Successfully updates a Quiz Question with thumbnailUrl', () => {
      const updateResponse = adminQuizQuestionUpdateV2(
        quizId,
        questionId,
        session,
        questionWithThumbnail
      );
      expect(updateResponse).toStrictEqual({});

      const InfoResponse = adminQuizInfo(session, quizId) as QuizInfo;
      expect(InfoResponse.questions[0].thumbnailUrl).toBe(
        'https://example.com/image.jpg'
      );
    });

    test('Successfully updates multiple Quiz Questions', () => {
      const updateResponse1 = adminQuizQuestionUpdateV2(
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
      const updateResponse2 = adminQuizQuestionUpdateV2(
        quizId,
        questionId2,
        session,
        questionUpdate
      );
      expect(updateResponse2).toStrictEqual({});
    });
  });

  describe('adminQuizQuestionUpdateV2 - Failure Cases', () => {
    test('Question Id does not refer to a valid question within this quiz', () => {
      const invalidQuestionId = 9999;
      const updateResponse = adminQuizQuestionUpdateV2(
        quizId,
        invalidQuestionId,
        session,
        questionUpdate
      );
      expect(updateResponse).toBe(400);
    });

    test('Question string is less than 5 characters in length', () => {
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
        ],
      };
      const updateResponse = adminQuizQuestionUpdateV2(
        quizId,
        questionId,
        session,
        invalidQuestion
      );
      expect(updateResponse).toBe(400);
    });

    test('Question string is greater than 50 characters in length', () => {
      const invalidQuestion = {
        question:
          'long'.repeat(15),
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
        ],
      };
      const updateResponse = adminQuizQuestionUpdateV2(
        quizId,
        questionId,
        session,
        invalidQuestion
      );
      expect(updateResponse).toBe(400);
    });

    test('The question has more than 6 answers', () => {
      const invalidQuestion = {
        question: 'Who is the Monarch of England?',
        timeLimit: 4,
        points: 5,
        answerOptions: [
          { answer: 'test1', correct: true },
          { answer: 'test2', correct: false },
          { answer: 'test3', correct: false },
          { answer: 'test4', correct: false },
          { answer: 'test5', correct: false },
          { answer: 'test6', correct: false },
          { answer: 'test7', correct: false },
        ],
      };
      const updateResponse = adminQuizQuestionUpdateV2(
        quizId,
        questionId,
        session,
        invalidQuestion
      );
      expect(updateResponse).toBe(400);
    });

    test('The question has less than 2 answers', () => {
      const invalidQuestion = {
        question: 'Who is the Monarch of England?',
        timeLimit: 4,
        points: 5,
        answerOptions: [{ answer: 'test', correct: true }],
      };
      const updateResponse = adminQuizQuestionUpdateV2(
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
          { answer: 'test1', correct: true },
          { answer: 'test2', correct: false },
        ],
      };
      const updateResponse = adminQuizQuestionUpdateV2(
        quizId,
        questionId,
        session,
        invalidQuestion
      );
      expect(updateResponse).toBe(400);
    });

    test('Sum of the question timeLimits in the quiz exceeds 3 minutes', () => {
      // Create a second question with a large time limit first
      const largeTimeQuestion = {
        question: 'Near limit question?',
        timeLimit: 170, // 2:50 minutes
        points: 5,
        answerOptions: [
          { answer: 'test1', correct: true },
          { answer: 'test2', correct: false },
        ],
      };

      // Add this question to the quiz
      adminQuizQuestionCreate(quizId, session, largeTimeQuestion);

      // Now try to update original question with time that would exceed limit
      const exceedingLimitQuestion = {
        question: 'Who is the Monarch of England?',
        timeLimit: 15, // This would bring total to 185 seconds (> 3 min)
        points: 5,
        answerOptions: [
          { answer: 'test1', correct: true },
          { answer: 'test2', correct: false },
        ],
      };
      const updateResponse = adminQuizQuestionUpdateV2(
        quizId,
        questionId,
        session,
        exceedingLimitQuestion
      );
      expect(updateResponse).toBe(400);
    });

    test('The points awarded for the question are less than 1', () => {
      const invalidQuestion = {
        question: 'Who is the Monarch of England?',
        timeLimit: 4,
        points: 0,
        answerOptions: [
          { answer: 'test1', correct: true },
          { answer: 'test2', correct: false },
        ],
      };
      const updateResponse = adminQuizQuestionUpdateV2(
        quizId,
        questionId,
        session,
        invalidQuestion
      );
      expect(updateResponse).toBe(400);
    });

    test('The points awarded for the question are greater than 10', () => {
      const invalidQuestion = {
        question: 'Who is the Monarch of England?',
        timeLimit: 4,
        points: 11,
        answerOptions: [
          { answer: 'test1', correct: true },
          { answer: 'test2', correct: false },
        ],
      };
      const updateResponse = adminQuizQuestionUpdateV2(
        quizId,
        questionId,
        session,
        invalidQuestion
      );
      expect(updateResponse).toBe(400);
    });

    test('The length of an answer is shorter than 1 character long', () => {
      const invalidQuestion = {
        question: 'Who is the Monarch of England?',
        timeLimit: 4,
        points: 5,
        answerOptions: [
          { answer: '', correct: true },
          { answer: 'test2', correct: false },
        ],
      };
      const updateResponse = adminQuizQuestionUpdateV2(
        quizId,
        questionId,
        session,
        invalidQuestion
      );
      expect(updateResponse).toBe(400);
    });

    test('The length of an answer is longer than 30 characters', () => {
      const invalidQuestion = {
        question: 'Who is the Monarch of England?',
        timeLimit: 4,
        points: 5,
        answerOptions: [
          {
            answer: 'This is a very long answer that exceeds thirty characters',
            correct: true,
          },
          { answer: 'test2', correct: false },
        ],
      };
      const updateResponse = adminQuizQuestionUpdateV2(
        quizId,
        questionId,
        session,
        invalidQuestion
      );
      expect(updateResponse).toBe(400);
    });

    test('Answer strings are duplicates of one another', () => {
      const invalidQuestion = {
        question: 'Who is the Monarch of England?',
        timeLimit: 4,
        points: 5,
        answerOptions: [
          { answer: 'duplicate', correct: true },
          { answer: 'duplicate', correct: false },
        ],
      };
      const updateResponse = adminQuizQuestionUpdateV2(
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
          { answer: 'test1', correct: false },
          { answer: 'test2', correct: false },
        ],
      };
      const updateResponse = adminQuizQuestionUpdateV2(
        quizId,
        questionId,
        session,
        invalidQuestion
      );
      expect(updateResponse).toBe(400);
    });

    test('The thumbnailUrl is an empty string', () => {
      const invalidQuestion = {
        question: 'Who is the Monarch of England?',
        timeLimit: 4,
        points: 5,
        answerOptions: [
          { answer: 'test1', correct: true },
          { answer: 'test2', correct: false },
        ],
        thumbnailUrl: '',
      };
      const updateResponse = adminQuizQuestionUpdateV2(
        quizId,
        questionId,
        session,
        invalidQuestion
      );
      expect(updateResponse).toBe(400);
    });

    test('The thumbnailUrl does not end with a valid filetype', () => {
      const invalidQuestion = {
        question: 'Who is the Monarch of England?',
        timeLimit: 4,
        points: 5,
        answerOptions: [
          { answer: 'test1', correct: true },
          { answer: 'test2', correct: false },
        ],
        thumbnailUrl: 'https://example.com/image.gif',
      };
      const updateResponse = adminQuizQuestionUpdateV2(
        quizId,
        questionId,
        session,
        invalidQuestion
      );
      expect(updateResponse).toBe(400);
    });

    test('The thumbnailUrl does not begin with http:// or https://', () => {
      const invalidQuestion = {
        question: 'Who is the Monarch of England?',
        timeLimit: 4,
        points: 5,
        answerOptions: [
          { answer: 'test1', correct: true },
          { answer: 'test2', correct: false },
        ],
        thumbnailUrl: 'ftp://example.com/image.jpg',
      };
      const updateResponse = adminQuizQuestionUpdateV2(
        quizId,
        questionId,
        session,
        invalidQuestion
      );
      expect(updateResponse).toBe(400);
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
      const updateResponse = adminQuizQuestionUpdateV2(
        quizId,
        questionId,
        otherSession,
        questionUpdate
      );
      expect(updateResponse).toBe(403);
    });

    test('Session is empty or invalid', () => {
      const updateResponse = adminQuizQuestionUpdateV2(
        quizId,
        questionId,
        session + 'invalid',
        questionUpdate
      );
      expect(updateResponse).toBe(401);
    });
  });
});
