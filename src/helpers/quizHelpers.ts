/// ////////////////////////////////////////////////////////////////////////////
//                                  IMPORTS                                   //
/// ////////////////////////////////////////////////////////////////////////////
import { BadRequestError, ForbiddenError } from '../errors';
import {
  DataStore,
  User,
  Quiz,
} from '../dataStore';

import { adminQuizInfo } from '../quiz';

import {
  AnswerOptionCreate,
  QuizInfo,
  QuizzesFiltered,
  QuestionUpdate,
} from '../interfaces';

/// ////////////////////////////////////////////////////////////////////////////
//                                CONSTANTS                                   //
/// ////////////////////////////////////////////////////////////////////////////
const MAX_QUIZ_NAME_LENGTH = 30;
const MIN_QUIZ_NAME_LENGTH = 3;
const MAX_DESCRIPTION_LENGTH = 100;

export const MAX_QUESTION_TIME_LIMIT = 180;

/// ////////////////////////////////////////////////////////////////////////////
//                             HELPER FUNCTIONS                               //
/// ////////////////////////////////////////////////////////////////////////////

/// /////////////////////////////////////////////////////////////////////////////
//                             FIND QUIZ BY ID                                //
/// /////////////////////////////////////////////////////////////////////////////

export function findQuiz(
  quizId: number,
  data: DataStore
): Quiz {
  const quiz = data.quizzes.find((quiz) => quiz.quizId === quizId);
  if (!quiz) {
    throw new ForbiddenError('Invalid quiz ID.');
  }
  return quiz;
}

/// /////////////////////////////////////////////////////////////////////////////
//                           VALIDATE QUIZ OWNERSHIP                          //
/// /////////////////////////////////////////////////////////////////////////////

export function validQuizOwner(
  user: User,
  quizId: number
): true {
  if (!user.quizzesOwned.includes(quizId)) {
    throw new ForbiddenError('Unauthorized quiz access.');
  }
  return true;
}

/// /////////////////////////////////////////////////////////////////////////////
//                              QUIZ NAME CHECK                               //
/// /////////////////////////////////////////////////////////////////////////////

export function validQuizName(name: string): true {
  const quizNameLength = name.length;

  if (
    quizNameLength < MIN_QUIZ_NAME_LENGTH ||
    quizNameLength > MAX_QUIZ_NAME_LENGTH
  ) {
    throw new BadRequestError(
        `Name is either less than ${MIN_QUIZ_NAME_LENGTH} characters long ` +
        `or more than ${MAX_QUIZ_NAME_LENGTH} characters long.`);
  }

  for (const character of name) {
    if (!validQuizChar(character)) {
      throw new BadRequestError(
        'Name contains invalid characters. Valid characters are' +
          ' alphanumeric and spaces.');
    }
  }

  return true;
}

function validQuizChar(character: string): boolean {
  return /^[a-zA-Z0-9 ]$/.test(character);
}

/// /////////////////////////////////////////////////////////////////////////////
//                         QUIZ DESCRIPTION CHECK                             //
/// /////////////////////////////////////////////////////////////////////////////

export function validDescription(
  description: string
): true {
  if (description.length > MAX_DESCRIPTION_LENGTH) {
    throw new BadRequestError(
    `Description is more than ${MAX_DESCRIPTION_LENGTH} ` +
    'characters in length.');
  }

  return true; // Return true if the description is valid
}

/// /////////////////////////////////////////////////////////////////////////////
//                             QUIZ ID GENERATOR                              //
/// /////////////////////////////////////////////////////////////////////////////
export function generateQuizId(data: DataStore): number {
  let highestId = 0;
  for (const quiz of data.quizzes) {
    if (quiz.quizId > highestId) {
      highestId = quiz.quizId;
    }
  }
  return highestId + 1;
}

/// /////////////////////////////////////////////////////////////////////////////
//                             UNIQUE NAME CHECK                              //
/// /////////////////////////////////////////////////////////////////////////////

export function isUniqueName(
  userId: number,
  name: string,
  data: DataStore
): true {
  const ownedQuizzes = data.quizzes.filter((quiz) => quiz.userId === userId);
  const quiz = ownedQuizzes.find((quiz) => quiz.name === name);
  if (!quiz) {
    return true;
  }
  throw new BadRequestError('This Quiz name has already been used!');
}

/// /////////////////////////////////////////////////////////////////////////////
//                               Valid Quiz Time                              //
/// /////////////////////////////////////////////////////////////////////////////
export function validQuizTimeLimit(
  quizId: number,
  session: string,
  question: {
    question: string;
    timeLimit: number;
    points: number;
    answerOptions: AnswerOptionCreate[];
  }
): true {
  const quizInfo = adminQuizInfo(session, quizId) as QuizInfo;
  const currentQuizTime = quizInfo.timeLimit;

  if (currentQuizTime + question.timeLimit > MAX_QUESTION_TIME_LIMIT) {
    throw new BadRequestError('Quiz time limit exceeded.');
  }

  return true;
}

/// /////////////////////////////////////////////////////////////////////////////
//                          Remove Quiz From Quizzes                          //
/// /////////////////////////////////////////////////////////////////////////////
export function removeQuizFromQuizzes(data: DataStore, quizId: number): Array<Quiz> {
  return data.quizzes.filter(
    (q) => q.quizId !== quizId
  );
}

/// /////////////////////////////////////////////////////////////////////////////
//                         Remove Quiz From Quizzes Owned                     //
/// /////////////////////////////////////////////////////////////////////////////
export function removeQuizFromQuizzesOwned(user: User, quizId: number): Array<number> {
  return user.quizzesOwned.filter(
    (id) => id !== quizId
  );
}

/// /////////////////////////////////////////////////////////////////////////////
//                           Find User's Quizzes                              //
/// /////////////////////////////////////////////////////////////////////////////
export function findUsersQuizzes(data: DataStore, userId: number): Array<Quiz> {
  return data.quizzes.filter(
    (quiz) => quiz.userId === userId
  );
}

/// /////////////////////////////////////////////////////////////////////////////
//                         Create Filtered Quizzes Array                      //
/// /////////////////////////////////////////////////////////////////////////////
export function createFilteredQuizzesArray(
  quizzes: Quiz[]
): Array<QuizzesFiltered> {
  return quizzes.map(
    ({ quizId, name }) => ({ quizId, name })
  );
}

/// /////////////////////////////////////////////////////////////////////////////
//                            Sum Question Time Limits                        //
/// /////////////////////////////////////////////////////////////////////////////
export function sumQuestionTimeLimits(quiz: Quiz): number {
  return quiz.questions.reduce((prev, curr) => prev + curr.timeLimit, 0);
}

/// /////////////////////////////////////////////////////////////////////////////
//                          Find User Quizzes Except Updating                 //
/// /////////////////////////////////////////////////////////////////////////////
export function findUserQuizzesExceptUpdating(
  data: DataStore,
  user: User,
  quizId: number
): Array<Quiz> {
  return data.quizzes.filter(
    (q) => user.quizzesOwned.includes(q.quizId) && q.quizId !== quizId
  );
}

/// /////////////////////////////////////////////////////////////////////////////
//                               Update Quiz Time Limit                       //
/// /////////////////////////////////////////////////////////////////////////////
export function updateTotalTimeLimit(
  quiz: Quiz,
  questionIndex: number,
  questionBody: QuestionUpdate
): number {
  // Calculate the total time limit for all questions
  const totalTimeLimit = quiz.questions.reduce(
    (total, question) => total + question.timeLimit,
    0
  );

  // Update the total time limit by replacing the time limit for the specific question
  const newTotalTimeLimit =
    totalTimeLimit -
    quiz.questions[questionIndex].timeLimit +
    questionBody.timeLimit;

  return newTotalTimeLimit;
}

/// /////////////////////////////////////////////////////////////////////////////
//                             VALID THUMBNAIL URL                            //
/// /////////////////////////////////////////////////////////////////////////////
export function validThumbnailUrl(
  thumbnailUrl: string
): true {
  if (thumbnailUrl === '') {
    throw new BadRequestError('Thumbnail Url is empty');
  }
  const lowercaseUrl = thumbnailUrl.toLowerCase();
  if (!(lowercaseUrl.endsWith('jpg') ||
      lowercaseUrl.endsWith('jpeg') ||
      lowercaseUrl.endsWith('png'))) {
    throw new BadRequestError('Thumbnail Url does not end with valid filetype');
  }

  if (!(lowercaseUrl.startsWith('http://') ||
      lowercaseUrl.startsWith('https://'))) {
    throw new BadRequestError('Thumbnail Url does not begin wuth valid url');
  }
  return true;
}
