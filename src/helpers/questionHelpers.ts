/// ////////////////////////////////////////////////////////////////////////////
//                                  IMPORTS                                   //
/// ////////////////////////////////////////////////////////////////////////////
// import request from 'sync-request-curl';

import { BadRequestError } from '../errors';
import {
  Quiz,
  // getData,
  AnswerOption,
} from '../dataStore';

import {
  AnswerOptionCreate,
} from '../interfaces';
/// ////////////////////////////////////////////////////////////////////////////
//                                CONSTANTS                                   //
/// ////////////////////////////////////////////////////////////////////////////
const MIN_QUESTION_LENGTH = 5;
const MAX_QUESTION_LENGTH = 50;

const MIN_ANSWER_OPTIONS = 2;
const MAX_ANSWER_OPTIONS = 6;

const MIN_ANSWER_OPTION_LENGTH = 1;
const MAX_ANSWER_OPTION_LENGTH = 30;

const MIN_QUESTION_POINTS = 1;
const MAX_QUESTION_POINTS = 10;

const MIN_QUESTION_TIME_LIMIT = 0;
export const MAX_QUESTION_TIME_LIMIT = 180;

const MIN_INDEX = 0;

/// ////////////////////////////////////////////////////////////////////////////
//                            HELPER FUNCTIONS                                //
/// ////////////////////////////////////////////////////////////////////////////

/// ////////////////////////////////////////////////////////////////////////////
//                           QUESTIONID Generator                             //
/// ////////////////////////////////////////////////////////////////////////////
export function generateQuestionId(quiz: Quiz): number {
  let highestId = 0;
  for (const question of quiz.questions) {
    if (question.questionId > highestId) {
      highestId = question.questionId;
    }
  }
  return highestId + 1;
}

/// ////////////////////////////////////////////////////////////////////////////
//                         Valid Question Settings                            //
/// ////////////////////////////////////////////////////////////////////////////
export function validQuestionSettings(question: {
  question: string;
  timeLimit: number;
  points: number;
  answerOptions: AnswerOptionCreate[];
}): true {
  if (!validQuestionlength(question.question)) {
    throw new BadRequestError('Question is less than 5 characters or more than 50 characters.');
  }

  if (
    question.points < MIN_QUESTION_POINTS ||
    question.points > MAX_QUESTION_POINTS
  ) {
    throw new BadRequestError(`Points must be between ${MIN_QUESTION_POINTS} and ` +
      `${MAX_QUESTION_POINTS}.`);
  }

  if (question.timeLimit <= MIN_QUESTION_TIME_LIMIT) {
    throw new BadRequestError('Time limit must be greater than ' +
      `${MIN_QUESTION_TIME_LIMIT}.`);
  }

  validAnswerOptions(question.answerOptions);

  return true;
}

/// ////////////////////////////////////////////////////////////////////////////
//                           Valid Question Length                            //
/// ////////////////////////////////////////////////////////////////////////////
function validQuestionlength(question: string): boolean {
  if (
    question.length < MIN_QUESTION_LENGTH ||
    question.length > MAX_QUESTION_LENGTH
  ) {
    return false;
  }
  return true;
}

/// ////////////////////////////////////////////////////////////////////////////
//                           Valid Answer Options                             //
/// ////////////////////////////////////////////////////////////////////////////
function validAnswerOptions(
  answerOptions: AnswerOptionCreate[]
): true {
  // Check for valid answer option length
  if (
    answerOptions.length < MIN_ANSWER_OPTIONS ||
    answerOptions.length > MAX_ANSWER_OPTIONS
  ) {
    throw new BadRequestError(`Answer options must be between ${MIN_ANSWER_OPTIONS} ` +
      `and ${MAX_ANSWER_OPTIONS}.`);
  }

  // Check for valid answer option length
  for (const currentAnswerOption of answerOptions) {
    if (
      currentAnswerOption.answer.length < MIN_ANSWER_OPTION_LENGTH ||
      currentAnswerOption.answer.length > MAX_ANSWER_OPTION_LENGTH
    ) {
      throw new BadRequestError(`Answer option must be between ${MIN_ANSWER_OPTION_LENGTH} ` +
        `and ${MAX_ANSWER_OPTION_LENGTH} characters.`);
    }
  }

  // Check for at least one correct answer option
  const hasCorrectAnswer = answerOptions.some((option) => option.correct);
  if (!hasCorrectAnswer) {
    throw new BadRequestError('There must be at least one correct answer option.');
  }

  // Check for duplicate answer options
  const answerStrings = answerOptions.map((option) => option.answer);
  const uniqueAnswers = new Set(answerStrings);
  if (uniqueAnswers.size !== answerStrings.length) {
    throw new BadRequestError('Duplicate answer options are not allowed.');
  }

  return true;
}

/// ////////////////////////////////////////////////////////////////////////////
//                           Generate Answer Options                          //
/// ////////////////////////////////////////////////////////////////////////////
export function generateAnswerOptions(
  answerOptions: AnswerOptionCreate[]
): AnswerOption[] {
  const colours = [
    'red',
    'blue',
    'green',
    'yellow',
    'purple',
    'pink',
    'orange',
  ];
  return answerOptions.map((option, index) => ({
    answerId: index + 1,
    answer: option.answer,
    colour: colours[Math.floor(Math.random() * colours.length)],
    correct: option.correct,
  }));
}

/// ////////////////////////////////////////////////////////////////////////////
//                              Find Question Index                           //
/// ////////////////////////////////////////////////////////////////////////////
export function findQuestionIndex(quiz: Quiz, questionId: number): number {
  return quiz.questions.findIndex(
    (question) => question.questionId === questionId
  );
}

/// ////////////////////////////////////////////////////////////////////////////
//                         Valid New Question Position                        //
/// ////////////////////////////////////////////////////////////////////////////
export function validNewQuestionPosition(
  newPosition: number,
  questionIndex: number,
  quiz: Quiz
): true {
  if (
    newPosition < MIN_INDEX ||
    newPosition > quiz.questions.length - 1 ||
    newPosition === questionIndex
  ) {
    throw new BadRequestError('Invalid new position');
  }
  return true;
}

/// ////////////////////////////////////////////////////////////////////////////
//                             Generate LLM Prompt                            //
/// ////////////////////////////////////////////////////////////////////////////
// export function generateQuestionPrompt(quiz: Quiz): string {
//   return `
//     You are a helpful quiz creator specializing in creating educational quiz questions.
//     Generate a high-quality, challenging question based on the following quiz information:

//     Quiz Name: ${quiz.name}
//     Quiz Description: ${quiz.description}

//     Only generate a question, do not include any explanations or answers.
//   `;
// }
/// ////////////////////////////////////////////////////////////////////////////
//                             Generate LLM Output                            //
/// ////////////////////////////////////////////////////////////////////////////
// export function fetchGeneratedQuestion(prompt: string): string {
//   const response = request(
//     'POST',
//     'https://api-inference.huggingface.co/models/google/gemma-2-2b-it',
//     {
//       headers: {
//         Authorization: `Bearer ${HUGGINGFACE_API_TOKEN}`,
//         'Content-Type': 'application/json',
//       },
//       json: { inputs: prompt },
//     }
//   );

//   const responseBody = JSON.parse(response.getBody('utf8'));
//   const question =
//     Array.isArray(responseBody) && responseBody.length > 0
//       ? responseBody[0].generated_text
//       : responseBody.generated_text;

//   // Clean up and ensure the question meets length requirements
//   const cleanQuestion = question.split('?')[0] + '?';
//   const lastLine = cleanQuestion.split('\n').pop()?.trim() || '';
//   return lastLine;
// }
