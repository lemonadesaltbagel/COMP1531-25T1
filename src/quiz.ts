/// /////////////////////////////////////////////////////////////////////////////
//                             FUNCTION IMPORTS                               //
/// /////////////////////////////////////////////////////////////////////////////
import {
  Game,
  GameState,
  getData,
  loadData,
  Question,
  Quiz,
  setData,
} from './dataStore';
import { AnswerOptionCreate, QuizInfo, QuizInfoV2 } from './interfaces';

import {
  findQuiz,
  validQuizName,
  validDescription,
  generateQuizId,
  isUniqueName,
  validQuizTimeLimit,
  removeQuizFromQuizzesOwned,
  findUsersQuizzes,
  createFilteredQuizzesArray,
  sumQuestionTimeLimits,
  findUserQuizzesExceptUpdating,
  updateTotalTimeLimit,
  removeQuizFromQuizzes,
  validQuizOwner,
  validThumbnailUrl,
} from './helpers/quizHelpers';

import {
  generateQuestionId,
  validQuestionSettings,
  generateAnswerOptions,
  findQuestionIndex,
  validNewQuestionPosition,
  // generateQuestionPrompt,
  // fetchGeneratedQuestion,
  MAX_QUESTION_TIME_LIMIT,
} from './helpers/questionHelpers';

import {
  findUserFromSession, findUserFromEmail,
} from './helpers/userHelpers';

import {
  getTimestamp,
  validateUserAndQuiz,
  fileExists
} from './helpers/helperFunctions';

import { BadRequestError, ForbiddenError } from './errors';

/// /////////////////////////////////////////////////////////////////////////////
//                           ADMIN QUIZ LIST                                  //
/// /////////////////////////////////////////////////////////////////////////////
/**
 * Returns a list of a user's owned quizzes
 *
 * @param {number} session - session of user
 * ...
 *
 * @returns {Object}
 *   - Returns an object `{ quizzes: [{ quizId: number, name: string }] }`
 *     if the user is found.
 *   - Returns an error message if the user is not found, in the form of
 *     `{ error: string }`.
 */

export function adminQuizList(session: string): {
  quizzes: { quizId: number; name: string }[];
} {
  const data = getData();

  const user = findUserFromSession(session);

  const quizzes: Quiz[] = findUsersQuizzes(data, user.userId);
  const quizzesFiltered: { quizId: number; name: string }[] =
    createFilteredQuizzesArray(quizzes);
  return { quizzes: quizzesFiltered };
}

/// /////////////////////////////////////////////////////////////////////////////
//                          ADMIN QUIZ CREATE                                 //
/// /////////////////////////////////////////////////////////////////////////////
/**
 * Creates a quiz with provided name and description, owner by the relevant
 * userId.
 *
 * @param {string} session - session of the account creating the quiz.
 * @param {string} name - Name of the quiz.
 * @param {string} description - Description of the quiz.
 * ...
 *
 * @returns {Object}
 *   - Returns an object `{ quizId: number }` if the quiz is successfully made.
 *   - Returns an error message if the user is not found, in the form of
 *     `{ error: string }`.
 */

export function adminQuizCreate(
  session: string,
  name: string,
  description: string
): { quizId: number } {
  loadData();
  const data = getData();

  const user = findUserFromSession(session);

  validQuizName(name);

  isUniqueName(user.userId, name, data);

  validDescription(description);

  const quizId = generateQuizId(data);
  const timeCreated = getTimestamp();

  const quiz = {
    quizId: quizId,
    userId: user.userId,
    name: name,
    description: description,
    timeCreated: timeCreated,
    timeLastEdited: timeCreated,
    timeLimit: 0,
    thumbnailUrl: '',
    games: [] as Game[],
    questions: [] as Question[],
  };

  data.quizzes.push(quiz);
  user.quizzesOwned.push(quizId);
  setData(data);
  return { quizId };
}

/// /////////////////////////////////////////////////////////////////////////////
//                          ADMIN QUIZ REMOVE                                 //
/// /////////////////////////////////////////////////////////////////////////////
/**
 * Removes a quiz with provided quizId, and the quiz's owner's userId.
 *
 * @param {string} session - session of the account owning the quiz.
 * @param {number} quizId - quizId of the quiz to be deleted.
 * ...
 *
 * @returns {Object}
 *   - Returns an empty object `{ }` if the quiz is successfully removed.
 *   - Returns an error message if the quiz can not be removed, in the form of
 *     `{ error: string }`.
 */
export function adminQuizRemove(
  quizId: number,
  session: string
): Record<string, never> {
  const data = getData();

  const { user } = validateUserAndQuiz(session, quizId, data);

  data.quizzes = removeQuizFromQuizzes(data, quizId);
  user.quizzesOwned = removeQuizFromQuizzesOwned(user, quizId);

  setData(data);
  return {};
}

export function adminQuizRemoveV2(
  quizId: number,
  session: string
): Record<string, never> {
  const data = getData();

  const { user, quiz } = validateUserAndQuiz(session, quizId, data);

  const activeGamesExist = quiz.games.some(game => game.state !== GameState.END);

  if (activeGamesExist) {
    throw new BadRequestError('Cannot delete a quiz with game that is active');
  }

  data.quizzes = removeQuizFromQuizzes(data, quizId);
  user.quizzesOwned = removeQuizFromQuizzesOwned(user, quizId);

  setData(data);
  return {};
}

/// /////////////////////////////////////////////////////////////////////////////
//                           ADMIN QUIZ INFO                                  //
/// /////////////////////////////////////////////////////////////////////////////
/**
 * Returns a information about a provided quizId, that is owned by a specified
 * user.
 *
 * @param {string} session - sessionId of the account owning the quiz.
 * @param {number} quizId - quizId of the quiz to be deleted.
 * ...
 *
 * @returns {Object}
 *   - Returns an object `{ quizId: number, name: string, timeCreated: number,
 *     timeLastEdited: number, description: string }` if the quiz is
 *     successfully found.
 *   - Returns an error message if the quiz can not be found, in the form of
 *     `{ error: string }`.
 */
export function adminQuizInfo(session: string, quizId: number): QuizInfo {
  const data = getData();

  const { quiz } = validateUserAndQuiz(session, quizId, data);

  const total = sumQuestionTimeLimits(quiz);

  return {
    quizId: quiz.quizId,
    name: quiz.name,
    timeCreated: quiz.timeCreated,
    timeLastEdited: quiz.timeLastEdited,
    description: quiz.description,
    numQuestions: quiz.questions.length,
    questions: quiz.questions,
    timeLimit: total,
  };
}

export function adminQuizInfoV2(session: string, quizId: number): QuizInfoV2 {
  const data = getData();

  const { quiz } = validateUserAndQuiz(session, quizId, data);

  const total = sumQuestionTimeLimits(quiz);

  return {
    quizId: quiz.quizId,
    name: quiz.name,
    timeCreated: quiz.timeCreated,
    timeLastEdited: quiz.timeLastEdited,
    description: quiz.description,
    numQuestions: quiz.questions.length,
    questions: quiz.questions,
    timeLimit: total,
    thumbnailUrl: quiz.thumbnailUrl,
  };
}
/// /////////////////////////////////////////////////////////////////////////////
//                        ADMIN QUIZ NAME UPDATE                              //
/// /////////////////////////////////////////////////////////////////////////////
/**
 * Updates the name of a quiz, if the user owns that quiz.
 *
 * @param {string} session - sessionId of the account owning the quiz.
 * @param {number} quizId - quizId of the quiz to be renamed.
 * @param {string} name - New name of the quiz.
 * ...
 *
 * @returns {Object}
 *   - Returns an empty object `{ }` if the quiz is successfully renamed.
 *   - Returns an error message if the quiz can not be renamed, in the form of
 *     `{ error: string }`.
 */
export function adminQuizNameUpdate(
  session: string,
  quizId: number,
  name: string
): Record<string, never> {
  const data = getData();

  const { user, quiz } = validateUserAndQuiz(session, quizId, data);

  validQuizName(name);

  const userQuizzes = findUserQuizzesExceptUpdating(data, user, quizId);
  if (userQuizzes.some((q) => q.name === name)) {
    throw new BadRequestError('Name is already used.');
  }

  quiz.name = name;
  quiz.timeLastEdited = getTimestamp();
  return {};
}

/// /////////////////////////////////////////////////////////////////////////////
//                   ADMIN QUIZ DESCRIPTION UPDATE                            //
/// /////////////////////////////////////////////////////////////////////////////
/**
 * Updates the name of a quiz, if the user owns that quiz.
 *
 * @param {string} session - sessionId of the account owning the quiz.
 * @param {number} quizId - quizId of the quiz to be amended.
 * @param {string} description - New description of the quiz.
 * ...
 *
 * @returns {Object}
 *   - Returns an empty object `{ }` if the quiz is successfully updated.
 *   - Returns an error message if the quiz description can not be updated, in
 *     the form of `{ error: string }`.
 */
export function adminQuizDescriptionUpdate(
  session: string,
  quizId: number,
  description: string
): Record<string, never> {
  const data = getData();

  const { quiz } = validateUserAndQuiz(session, quizId, data);

  validDescription(description);

  quiz.description = description;
  quiz.timeLastEdited = getTimestamp();
  return {};
}

/// ////////////////////////////////////////////////////////////////////////////
//                             ADMIN QUIZ TRANSFER                            //
/// ////////////////////////////////////////////////////////////////////////////
/**
 * Transfers ownership of quiz to a new user, if the user owns that quiz.
 *
 * @param {number} quizId - quizId of the quiz to be amended.
 * @param {string} session - sessionId of the account owning the quiz.
 * @param {string} userEmail - Email of the user to transfer the quiz to.
 * ...
 *
 * @returns {Object}
 *   - Returns an empty object `{ }` if the quiz is successfully transferred.
 *   - Returns an error message if the quiz can not be transferred, in
 *     the form of `{ error: string }`.
 */
export function adminQuizTransfer(
  quizId: number,
  session: string,
  userEmail: string
): Record<string, never> {
  const data = getData();

  const targetUser = findUserFromEmail(userEmail);

  const originalUser = findUserFromSession(session);

  if (userEmail === originalUser.email) {
    throw new BadRequestError(
      'Invalid userEmail as it corresponds to the current logged in user'
    );
  }

  const quiz = findQuiz(quizId, data);

  validQuizOwner(originalUser, quizId);

  isUniqueName(targetUser.userId, quiz.name, data);

  quiz.userId = targetUser.userId;
  quiz.timeLastEdited = getTimestamp();
  return {};
}

export function adminQuizTransferV2(
  quizId: number,
  session: string,
  userEmail: string
): Record<string, never> {
  const data = getData();

  const targetUser = findUserFromEmail(userEmail);

  const originalUser = findUserFromSession(session);

  if (userEmail === originalUser.email) {
    throw new BadRequestError(
      'Invalid userEmail as it corresponds to the current logged in user'
    );
  }

  const quiz = findQuiz(quizId, data);

  validQuizOwner(originalUser, quizId);

  isUniqueName(targetUser.userId, quiz.name, data);

  const activeGamesExist = quiz.games.some(game => game.state !== GameState.END);

  if (activeGamesExist) {
    throw new BadRequestError('Cannot delete a quiz with game that is active');
  }

  quiz.userId = targetUser.userId;
  quiz.timeLastEdited = getTimestamp();
  return {};
}

/// ////////////////////////////////////////////////////////////////////////////
//                        ADMIN QUIZ Question CREATE                          //
/// ////////////////////////////////////////////////////////////////////////////
/**
 * Adds a new question to the quiz
 *
 *
 * @param {number} quizId - quizId of the quiz to be amended.
 * @param {string} session - sessionId of the account owning the quiz.
 * @param {object} question - Question object to be added.
 *  @param {string} question.question - Question text.
 *  @param {number} question.timeLimit - Time limit for the question.
 *  @param {number} question.points - Points for the question.
 *  @param {AnswerOptionCreate[]} question.answerOptions - Array of answer
 *    options for the question.
 *  @param {string} question.answerOptions.answer - Answer text.
 *  @param {boolean} question.answerOptions.correct - Whether the answer is
 *    correct or not.
 * ...
 *
 * @returns {number} QuestionId
 *   - Returns the new questionId if the question is successfully added.
 *  - Returns an error message if the question can not be added, in the form of
 *    `{ error: string }`.
 */
export function adminQuizQuestionCreate(
  quizId: number,
  session: string,
  question: {
    question: string;
    timeLimit: number;
    points: number;
    answerOptions: AnswerOptionCreate[];
  }
): { questionId: number } {
  const data = getData();

  const { quiz } = validateUserAndQuiz(session, quizId, data);
  validQuestionSettings(question);

  validQuizTimeLimit(quizId, session, question);

  const questionId = generateQuestionId(quiz);
  const questionAnswerOptions = generateAnswerOptions(question.answerOptions);

  const newQuestion: Question = {
    questionId,
    question: question.question,
    timeLimit: question.timeLimit,
    points: question.points,
    answerOptions: questionAnswerOptions,
  };
  quiz.timeLimit += question.timeLimit;
  quiz.questions.push(newQuestion);
  quiz.timeLastEdited = getTimestamp();

  return { questionId };
}

export function adminQuizQuestionCreateV2(
  quizId: number,
  session: string,
  question: {
    question: string;
    timeLimit: number;
    points: number;
    answerOptions: AnswerOptionCreate[];
    thumbnailUrl?: string;
  }
): { questionId: number } {
  const data = getData();

  const { quiz } = validateUserAndQuiz(session, quizId, data);
  validQuestionSettings(question);

  if (question.thumbnailUrl || question.thumbnailUrl === '') {
    validThumbnailUrl(question.thumbnailUrl);
  }

  validQuizTimeLimit(quizId, session, question);

  const questionId = generateQuestionId(quiz);
  const questionAnswerOptions = generateAnswerOptions(question.answerOptions);

  const newQuestion: Question = {
    questionId,
    question: question.question,
    timeLimit: question.timeLimit,
    thumbnailUrl: question.thumbnailUrl || '',
    points: question.points,
    answerOptions: questionAnswerOptions,
  };
  quiz.timeLimit += question.timeLimit;
  quiz.questions.push(newQuestion);
  quiz.timeLastEdited = getTimestamp();

  return { questionId };
}

/// ////////////////////////////////////////////////////////////////////////////
//                             ADMIN QUIZ SUGGESTION                          //
/// ////////////////////////////////////////////////////////////////////////////
/**
 * Provides a question suggestion for a quiz, using the Hugging Face API.
 *
 * @param {string} session - sessionId of the account owning the quiz.
 * @param {number} quizId - quizId of the quiz to be suggested for.
 * ...
 *
 * @returns {Object}
 *   - Returns an question object containing the suggested question as a string.
 *   - Returns an error message if the quiz can not be transferred, in
 *     the form of `{ error: string }`.
 */
// export function adminQuizQuestionSuggestion(
//   session: string,
//   quizId: number
// ): { question: string } {
//   const data = getData();

//   const { quiz } = validateUserAndQuiz(session, quizId, data);

//   try {
//     const prompt = generateQuestionPrompt(quiz);
//     const question = fetchGeneratedQuestion(prompt);

//     return { question };
//   } catch (error) {
//     return { question: error.message };
//   }
// }

/// /////////////////////////////////////////////////////////////////////////////
//                        ADMIN QUIZ QUESTION UPDATE                          //
/// /////////////////////////////////////////////////////////////////////////////
/**
 * Updates a question in the quiz, if the user owns that quiz.
 * @param {number} quizId - quizId of the quiz to be suggested for.
 * @param {number} questionId - questionId of the question to be updated.
 * @param {string} session - sessionId of the account owning the quiz.
 * @param {object} questionBody - Question object to be added.
 *  @param {string} questionBody.question - Question text.
 *  @param {number} questionBody.timeLimit - Time limit for the question.
 *  @param {number} questionBody.points - Points for the question.
 *  @param {AnswerOptionCreate[]} questionBody.answerOptions - Array of answer
 *    options for the question.
 *  @param {string} questionBody.answerOptions.answer - Answer text.
 *  @param {boolean} questionBody.answerOptions.correct - Whether the answer is
 *    correct or not.
 *
 * @returns {Object}
 *   - Returns an empty object {} if the question was successfully updated.
 *   - Returns an error message if the quiz can not be transferred, in
 *     the form of `{ error: string }`.
 */
export function adminQuizQuestionUpdate(
  quizId: number,
  questionId: number,
  session: string,
  questionBody: {
    question: string;
    timeLimit: number;
    points: number;
    answerOptions: AnswerOptionCreate[];
  }
): Record<string, never> {
  const data = getData();

  const { quiz } = validateUserAndQuiz(session, quizId, data);

  const questionIndex = findQuestionIndex(quiz, questionId);
  if (questionIndex === -1) {
    throw new BadRequestError('Question not found in this quiz');
  }

  validQuestionSettings(questionBody);

  const newTotalTimeLimit = updateTotalTimeLimit(
    quiz,
    questionIndex,
    questionBody
  );
  if (newTotalTimeLimit > MAX_QUESTION_TIME_LIMIT) {
    throw new BadRequestError(
      'The total time limit for the quiz cannot exceed 3 minutes'
    );
  }

  const answerOptions = generateAnswerOptions(questionBody.answerOptions);
  const question: Question = {
    questionId: questionId,
    question: questionBody.question,
    timeLimit: questionBody.timeLimit,
    thumbnailUrl: '',
    points: questionBody.points,
    answerOptions: answerOptions,
  };

  quiz.timeLimit -= quiz.questions[questionIndex].timeLimit;
  quiz.timeLimit += questionBody.timeLimit;
  quiz.questions.splice(questionIndex, 1, question);
  quiz.timeLastEdited = getTimestamp();

  setData(data);
  return {};
}

export function adminQuizQuestionUpdateV2(
  quizId: number,
  questionId: number,
  session: string,
  questionBody: {
    question: string;
    timeLimit: number;
    points: number;
    answerOptions: AnswerOptionCreate[];
    thumbnailUrl?: string;
  }
): Record<string, never> {
  const data = getData();
  const { quiz } = validateUserAndQuiz(session, quizId, data);

  const questionIndex = findQuestionIndex(quiz, questionId);
  if (questionIndex === -1) {
    throw new BadRequestError('Question not found in this quiz');
  }

  validQuestionSettings(questionBody);

  if (questionBody.thumbnailUrl || questionBody.thumbnailUrl === '') {
    validThumbnailUrl(questionBody.thumbnailUrl);
  }

  const newTotalTimeLimit = updateTotalTimeLimit(
    quiz,
    questionIndex,
    questionBody
  );
  if (newTotalTimeLimit > MAX_QUESTION_TIME_LIMIT) {
    throw new BadRequestError('The total time limit for the quiz cannot exceed 3 minutes');
  }

  const answerOptions = generateAnswerOptions(questionBody.answerOptions);
  const question: Question = {
    questionId: questionId,
    question: questionBody.question,
    timeLimit: questionBody.timeLimit,
    thumbnailUrl: questionBody.thumbnailUrl || '',
    points: questionBody.points,
    answerOptions: answerOptions,
  };

  quiz.timeLimit -= quiz.questions[questionIndex].timeLimit;
  quiz.timeLimit += questionBody.timeLimit;
  quiz.questions.splice(questionIndex, 1, question);
  quiz.timeLastEdited = getTimestamp();

  setData(data);
  return {};
}

/// /////////////////////////////////////////////////////////////////////////////
//                       ADMIN QUIZ QUESTION REMOVE                           //
/// /////////////////////////////////////////////////////////////////////////////
/**
 * Removes a question in the quiz, if the user owns that quiz.
 * @param {number} quizId - quizId of the quiz to be suggested for.
 * @param {number} questionId - questionId of the question to be removed.
 * @param {string} session - sessionId of the account owning the quiz.
 * @returns {Object}
 *   - Returns an empty object {} if the question was successfully removed.
 *   - Returns an error message if the quiz can not be transferred, in
 *     the form of `{ error: string }`.
 */
export function adminQuizQuestionRemove(
  quizId: number,
  questionId: number,
  session: string
): Record<string, never> {
  const data = getData();

  const { quiz } = validateUserAndQuiz(session, quizId, data);

  const questionIndex = quiz.questions.findIndex(
    (question) => question.questionId === questionId
  );

  if (questionIndex === -1) {
    throw new BadRequestError('Question not found in this quiz');
  }
  quiz.timeLimit -= quiz.questions[questionIndex].timeLimit;
  // Remove the question
  quiz.questions.splice(questionIndex, 1);
  quiz.timeLastEdited = getTimestamp();
  // Save the updated data
  setData(data);

  return {};
}

export function adminQuizQuestionRemoveV2(
  quizId: number,
  questionId: number,
  session: string
): Record<string, never> {
  const data = getData();

  const { quiz } = validateUserAndQuiz(session, quizId, data);

  const activeGamesExist = quiz.games.some(quizGame => {
    const activeGame = data.games.find(g => g.gameId === quizGame.gameId);
    return activeGame && activeGame.state !== GameState.END;
  });

  if (activeGamesExist) {
    throw new BadRequestError('Cannot delete an active Quiz!');
  }

  const questionIndex = quiz.questions.findIndex(
    (question) => question.questionId === questionId
  );

  if (questionIndex === -1) {
    throw new BadRequestError('Question not found in this quiz');
  }
  quiz.timeLimit -= quiz.questions[questionIndex].timeLimit;
  // Remove the question
  quiz.questions.splice(questionIndex, 1);
  quiz.timeLastEdited = getTimestamp();
  // Save the updated data
  setData(data);

  return {};
}

/// ////////////////////////////////////////////////////////////////////////////
//                         ADMIN QUIZ QUESTION MOVE                           //
/// ////////////////////////////////////////////////////////////////////////////

/**
 * Moves a specified question to a new position in the quiz. (One-indexed)
 *
 * @param {number} quizId - quizId of the quiz to be adjusted.
 * @param {number} questionId - questionId of the question to be moved.
 * @param {string} session - sessionId of the user owning the quiz.
 * @param {number} newPosition - New position of the question in the quiz.
 * ...
 *
 * @returns {Object}
 *   - Returns an empty object `{ }` if the quiz is successfully updated.
 *  - Returns an error message if the question can not be successfully
 *    moved, in the form of `{ error: string }`.
 */
export function adminQuizQuestionMove(
  quizId: number,
  questionId: number,
  session: string,
  newPosition: number
): Record<string, never> {
  const data = getData();

  const { quiz } = validateUserAndQuiz(session, quizId, data);

  const questionIndex = findQuestionIndex(quiz, questionId);
  if (questionIndex === -1) {
    throw new BadRequestError('Question not found'); // return 400
  }

  validNewQuestionPosition(newPosition, questionIndex, quiz);

  const question = quiz.questions[questionIndex];
  quiz.questions.splice(questionIndex, 1);
  quiz.questions.splice(newPosition, 0, question);
  quiz.timeLastEdited = getTimestamp();
  setData(data);
  return {};
}

/// ////////////////////////////////////////////////////////////////////////////
//                         QUIZ THUMBNAIL UPDATE                              //
/// ////////////////////////////////////////////////////////////////////////////

/**
 * Updates a quiz thumbnail, if the user owns that quiz.
 *
 * @param {number} quizId - quizId of the quiz to be updated.
 * @param {string} session - sessionId of the user owning the quiz.
 * @param {string} thumbnailUrl - Url to thumbnail image.
 * ...
 *
 * @returns {Object}
 *   - Returns an empty object `{ }` if the quiz is successfully updated
 *    with the new thumbnail.
 *  - Returns an error message if the thumbnail can not be successfully
 *    successfully attached, in the form of `{ error: string }`.
 */
export function adminQuizThumbnailUpdate(
  quizId: number,
  session: string,
  thumbnailUrl: string
): Record<string, never> | { error: string } {
  const data = getData();

  validThumbnailUrl(thumbnailUrl);

  const { quiz } = validateUserAndQuiz(session, quizId, data);

  quiz.thumbnailUrl = thumbnailUrl;
  quiz.timeLastEdited = getTimestamp();
  return {};
}

/// ////////////////////////////////////////////////////////////////////////////
//                           QUESTION ATTACHMENT                              //
/// ////////////////////////////////////////////////////////////////////////////

/**
 * Attaches a file to a question in the quiz, if the user owns that quiz.
 *
 * @param {string} session - sessionId of the user owning the quiz.
 * @param {number} quizId - userId of the account owning the quiz.
 * @param {number} questionId - questionId of the question to be attached.
 * @param {string} fileUrl - File URL to be attached to the question.
 * ...
 *
 * @returns {Object}
 *   - Returns an empty object `{ }` if the question is successfully updated
 *    with the new attachment.
 *  - Returns an error message if the question can not be successfully
 *    attached, in the form of `{ error: string }`.
 */
export function adminQuizQuestionAttachment(
  session: string,
  quizId: number,
  questionId: number,
  fileUrl: string
): Record<string, never> {
  const data = getData();

  const { user, quiz } = validateUserAndQuiz(session, quizId, data);

  const questionIndex = findQuestionIndex(quiz, questionId);
  if (questionIndex === -1) {
    throw new BadRequestError('Question not found in this quiz');
  }

  if (!quiz.questions[questionIndex].fileAttachments) {
    quiz.questions[questionIndex].fileAttachments = [];
  }
  if (quiz.questions[questionIndex].fileAttachments.some((url) => url === fileUrl)) {
    throw new BadRequestError('File already attached');
  }

  user.uploads = user.uploads ?? [];
  user.uploads.push(fileUrl);
  quiz.questions[questionIndex].fileAttachments.push(fileUrl);
  quiz.timeLastEdited = getTimestamp();
  setData(data);
  return {};
}

/// ////////////////////////////////////////////////////////////////////////////
//                    QUESTION ATTACHMENT VERIFICATION                        //
/// ////////////////////////////////////////////////////////////////////////////

/**
 * Checks if a file exists in the user's uploads, and if they own it.
 *
 * @param {string} session - sessionId of the user owning the quiz.
 * @param {string} fileUrl - File URL to be verified.
 * ...
 *
 * @returns {Object}
 *  - Returns an empty object `{ }` if the user can access the file.
 *  - Returns an error message if the attachment can not be successfully
 *    fetched, in the form of `{ error: string }`.
 */
export function adminQuizQuestionAttachmentVerification(
  session: string,
  fileUrl: string
): void {
  const user = findUserFromSession(session);
  fileExists(fileUrl);

  if (!user.uploads.includes(fileUrl)) {
    throw new ForbiddenError('You do not have access to this file');
  }
}

/// ////////////////////////////////////////////////////////////////////////////
//                       ADMIN QUIZ ATTACHMENT REMOVE                         //
/// ////////////////////////////////////////////////////////////////////////////

/**
 * Removes a file from a question in the quiz, if the user owns that quiz.
 *
 * @param {string} session - sessionId of the user owning the quiz.
 * @param {number} quizId - quizId of the account owning the quiz.
 * @param {number} questionId - questionId of the question to be amended.
 * @param {string} fileUrl - Url to file to be removed.
 * ...
 *
 * @returns {Object}
 *   - Returns an empty object `{ }` if the file is successfully removed.
 *  - Returns an error message if the file can not be successfully
 *    unattached, in the form of `{ error: string }`.
 */
export function adminQuizQuestionAttachmentRemove(
  session: string,
  quizId: number,
  questionId: number,
  fileUrl: string
): Record<string, never> {
  const data = getData();
  const { user, quiz } = validateUserAndQuiz(session, quizId, data);

  const questionIndex = findQuestionIndex(quiz, questionId);
  if (questionIndex === -1) {
    throw new BadRequestError('Question not found in this quiz');
  }
  if (!quiz.questions[questionIndex].fileAttachments) {
    throw new BadRequestError('No file attachments found for this question');
  }
  const fileIndex =
    quiz.questions[questionIndex].fileAttachments.findIndex((url) => url === fileUrl);
  if (fileIndex === -1) {
    throw new BadRequestError('File not found in this question');
  }
  quiz.questions[questionIndex].fileAttachments.splice(fileIndex, 1);

  const userFileIndex = user.uploads.findIndex((url) => url === fileUrl);

  user.uploads.splice(userFileIndex, 1);
  quiz.timeLastEdited = getTimestamp();
  setData(data);
  return {};
}

/// ////////////////////////////////////////////////////////////////////////////
//                          ADMIN QUIZ EXPORT                                 //
/// ////////////////////////////////////////////////////////////////////////////
/**
 * Exports a specific quiz owned by the user as a JSON string.
 *
 * @param {string} session - The session of the user requesting the export.
 * @param {number} quizId - The ID of the quiz to export.
 * @returns {string} - A JSON string containing the quiz data.
 */
export function adminQuizExport(session: string, quizId: number): string {
  const data = getData();
  const { quiz } = validateUserAndQuiz(session, quizId, data);
  return JSON.stringify(quiz, null, 2);
}

/// ////////////////////////////////////////////////////////////////////////////
//                            ADMIN QUIZ IMPORT                               //
/// ////////////////////////////////////////////////////////////////////////////
/**
 * Imports a new quiz from a JSON string and assigns it to the current user.
 *
 * @param {string} session - The session of the user importing the quiz.
 * @param {string} fileContent - The JSON string containing the quiz data.
 * @returns {number} - The ID of the newly created quiz.
 */
export function adminQuizImport(session: string, fileContent: string): {quizId: number} {
  const user = findUserFromSession(session);
  const importedQuiz = JSON.parse(fileContent);

  const data = getData();
  const newQuizId = generateQuizId(data);

  const newQuiz: Quiz = {
    quizId: newQuizId,
    userId: user.userId,
    name: importedQuiz.name || 'Untitled Quiz',
    description: importedQuiz.description || '',
    timeCreated: getTimestamp(),
    timeLastEdited: getTimestamp(),
    timeLimit: importedQuiz.timeLimit || 0,
    thumbnailUrl: importedQuiz.thumbnailUrl || '',
    questions: importedQuiz.questions || [],
    games: [],
  };

  data.quizzes.push(newQuiz);
  user.quizzesOwned.push(newQuizId);
  setData(data);

  return { quizId: newQuizId };
}
