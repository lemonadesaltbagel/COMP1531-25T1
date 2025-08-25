/// /////////////////////////////////////////////////////////////////////////////
//                             FUNCTION IMPORTS                               //
/// /////////////////////////////////////////////////////////////////////////////
import {
  adminAuthRegister,
  adminAuthLogin,
  adminAuthLogout,
  clear,
  adminUserDetails,
  adminUserDetailsUpdate,
  adminUserPasswordUpdate,
  adminQuizCreate,
  adminQuizList,
  adminQuizRemove,
  adminQuizInfo,
  adminQuizNameUpdate,
  adminQuizTransfer,
  adminQuizQuestionCreate,
  // adminQuizQuestionSuggestion,
  adminQuizQuestionUpdate,
  adminQuizQuestionRemove,
  adminQuizQuestionMove,
} from './wrapperFunctions';

import { QuestionCreate } from './interfaces';

/// /////////////////////////////////////////////////////////////////////////////
//                             INITIALISATION                                 //
/// /////////////////////////////////////////////////////////////////////////////
let firstName: string;
let lastName: string;
let validemail: string;
let validPassword: string;
let token: { error: string } | { session: string };
let invalidSession: string;
let input: { session: string };
let quizName: string;
let quizDescription: string;
let firstQuizQuestion: { questionBody: QuestionCreate };
let secondQuizQuestion: { questionBody: QuestionCreate };
let quizId: { quizId: number } | number;

afterAll(() => {
  clear();
});

beforeEach(() => {
  clear();
  firstName = 'Alex';
  lastName = 'Lum';
  validemail = 'validemail@gmail.com';
  validPassword = 'validPassword9';
  token = adminAuthRegister(validemail, validPassword, firstName, lastName) as {
    session: string;
  };
  invalidSession = 'Thisisaninvalidsession';
  input = token as { session: string };
  quizName = 'My quiz Name';
  quizDescription = 'description of my quiz';
  firstQuizQuestion = {
    questionBody: {
      question: 'Who is the Monarch of England?',
      timeLimit: 4,
      points: 5,
      answerOptions: [
        {
          answer: 'Prince Charles',
          correct: true,
        },
      ],
    },
  };
  secondQuizQuestion = {
    questionBody: {
      question: 'What was the name of the queen who recently passed away?',
      timeLimit: 4,
      points: 5,
      answerOptions: [
        {
          answer: 'Queen Elizabeth',
          correct: true,
        },
      ],
    },
  };
  quizId = adminQuizCreate(input.session, quizName, quizDescription);
});

afterEach(() => {
  clear();
});

describe('Success Cases', () => {
  test('Correct return type after user registered', () => {
    expect(adminAuthLogout(input.session)).toStrictEqual({});
  });

  test('Correct return type after multiple logins and register attempts', () => {
    const firstlogin = adminAuthLogin(validemail, validPassword) as {
      session: string;
    };
    const secondlogin = adminAuthLogin(validemail, validPassword) as {
      session: string;
    };
    expect(adminAuthLogout(firstlogin.session)).toStrictEqual({});
    expect(adminAuthLogout(secondlogin.session)).toStrictEqual({});
    expect(adminAuthLogout(input.session)).toStrictEqual({});
  });

  test('Trying to view user details of a logged out user', () => {
    adminAuthLogout(input.session);
    expect(adminUserDetails(input.session)).toBe(401);
  });

  test('Trying to update user for an invalid session', () => {
    const newNameFirst = 'Arnav';
    const newValidEmail = 'newvalidemail@gmail.com';
    const newNameLast = 'Sahay';
    adminAuthLogout(input.session);
    expect(
      adminUserDetailsUpdate(
        input.session,
        newValidEmail,
        newNameFirst,
        newNameLast
      )
    ).toBe(401);
  });

  test('Trying to update password for a logged out session', () => {
    const newPassword = 'Validpassword123';
    let currentPassword = validPassword;
    expect(
      adminUserPasswordUpdate(input.session, currentPassword, newPassword)
    );
    currentPassword = newPassword;
    const newPass2 = 'NewLoggedOutPassword123';
    adminAuthLogout(input.session);
    expect(
      adminUserPasswordUpdate(input.session, currentPassword, newPass2)
    ).toBe(401);
  });

  test('Trying to create a quiz with a logged out session', () => {
    adminAuthLogout(input.session);
    expect(adminQuizCreate(input.session, quizName, quizDescription)).toBe(
      401
    );
  });

  test('Trying to list quizzes for a logged out session', () => {
    adminQuizCreate(input.session, quizName, quizDescription);
    const newQuizName = 'This is a new quiz being created';
    const newQuizDescription = 'this is a new quiz description';
    adminQuizCreate(input.session, newQuizName, newQuizDescription);
    adminAuthLogout(input.session);
    expect(adminQuizList(input.session)).toBe(401);
  });

  test('Trying to delete a quiz given a logged out session', () => {
    adminAuthLogout(input.session);
    expect(adminQuizRemove(Number(quizId), input.session)).toBe(401);
  });

  test('Trying to get information about a quiz from a logged out session', () => {
    adminAuthLogout(input.session);
    expect(adminQuizInfo(input.session, Number(quizId))).toBe(401);
  });

  test('Trying to update quiz name for a logged out session', () => {
    adminAuthLogout(input.session);
    const newQuizName = 'This is a new Name';
    expect(
      adminQuizNameUpdate(input.session, Number(quizId), newQuizName)
    ).toBe(401);
  });

  test('Trying to update quiz description for a logged out session', () => {
    adminAuthLogout(input.session);
    const newQuizDescription = 'This is a new quiz description';
    expect(
      adminQuizNameUpdate(input.session, Number(quizId), newQuizDescription)
    ).toBe(401);
  });

  test('Trying to transfer quizzes for a logged out session', () => {
    const initialQuizId = adminQuizCreate(
      input.session,
      quizName,
      quizDescription
    );
    const newEmail = 'newuseremail@gmail.com';
    const newPass = 'newuserPass09';
    const newNamefirst = 'Abtin';
    const newNamelast = 'Moghadam';
    const newUser = adminAuthRegister(
      newEmail,
      newPass,
      newNamefirst,
      newNamelast
    ) as { session: string };
    adminAuthLogout(newUser.session);
    adminAuthLogout(input.session);
    expect(
      adminQuizTransfer(Number(initialQuizId), input.session, newEmail)
    ).toBe(401);
  });

  test('Trying to create a new question for a quiz for a session that has been logged out', () => {
    adminAuthLogout(input.session);
    expect(
      adminQuizQuestionCreate(
        Number(quizId),
        input.session,
        firstQuizQuestion.questionBody
      )
    );
  });

  // test.skip('Trying to get a suggestion for a quiz question of a logged out session', () => {
  //   adminAuthLogout(input.session);
  //   expect(adminQuizQuestionSuggestion(input.session, Number(quizId))).toBe(
  //     401
  //   );
  // });

  test('Trying to update a quiz question for a logged out session', () => {
    const questionId = adminQuizQuestionCreate(
      Number(quizId),
      input.session,
      firstQuizQuestion.questionBody
    );
    adminAuthLogout(input.session);
    expect(
      adminQuizQuestionUpdate(
        Number(quizId),
        Number(questionId),
        input.session,
        secondQuizQuestion.questionBody
      )
    );
  });

  test('Trying to login and remove a quiz question after logging out of session', () => {
    const questionId = adminQuizQuestionCreate(
      Number(quizId),
      input.session,
      firstQuizQuestion.questionBody
    );
    adminAuthLogout(input.session);
    expect(
      adminQuizQuestionRemove(Number(quizId), Number(questionId), input.session)
    ).toBe(401);
  });

  test('Trying to move a quiz question with logged out session', () => {
    const questionId1 = adminQuizQuestionCreate(
      Number(quizId),
      input.session,
      firstQuizQuestion.questionBody
    );
    adminQuizQuestionCreate(
      Number(quizId),
      input.session,
      secondQuizQuestion.questionBody
    );
    adminAuthLogout(input.session);
    const newPosition = 2;
    expect(
      adminQuizQuestionMove(
        Number(quizId),
        Number(questionId1),
        input.session,
        newPosition
      )
    ).toBe(401);
  });
});

describe('Error cases', () => {
  test("Trying to logout with an invalid session that doesn't refer to any users", () => {
    expect(adminAuthLogout(invalidSession)).toBe(401);
  });

  test('Logout with empty token', () => {
    let request = adminAuthLogout('');
    request = JSON.parse(request.toString());
    expect(request).toBe(401);
  });

  test('Try to logout twice', () => {
    adminAuthLogout(input.session);
    expect(adminAuthLogout(input.session)).toBe(401);
  });
});
