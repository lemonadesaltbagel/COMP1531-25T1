/// ////////////////////////////////////////////////////////////////////////////
//                             FUNCTION IMPORTS                               //
/// ////////////////////////////////////////////////////////////////////////////
import {
  adminAuthRegister,
  adminAuthLogin,
  adminUserPasswordUpdate,
  clear,
} from './wrapperFunctions';
/// ////////////////////////////////////////////////////////////////////////////
//                             INITIALISATION                                 //
/// ////////////////////////////////////////////////////////////////////////////
let firstName: string;
let lastName: string;
let validemail: string;
let oldPassword: string;
let token: { session: string } | { error: string };
let newPassword: string;
let input: { session: string };
const INVALID_SESSION = 'thisisinvalidsessionid' as string;

/// ////////////////////////////////////////////////////////////////////////////
//                                 TESTING                                    //
/// ////////////////////////////////////////////////////////////////////////////
beforeEach(() => {
  clear();
  firstName = 'Alex';
  lastName = 'Lum';
  validemail = 'validemail@gmail.com';
  oldPassword = 'ValidPassword9';
  newPassword = 'ValidPa$$9';
  token = adminAuthRegister(validemail, oldPassword, firstName, lastName) as
    | { session: string }
    | { error: string };
  input = token as { session: string };
});

afterEach(() => {
  clear();
});

describe('Success Cases', () => {
  test('Returns the correct empty object', () => {
    const result = adminUserPasswordUpdate(
      input.session,
      oldPassword,
      newPassword
    );
    expect(result).toStrictEqual({});
  });

  test('Updates the password', () => {
    adminUserPasswordUpdate(input.session, oldPassword, newPassword);
    expect(adminAuthLogin(validemail, oldPassword)).toBe(400);
    expect(adminAuthLogin(validemail, newPassword)).toStrictEqual({
      session: expect.any(String),
    });
  });
});

describe('Error Cases', () => {
  test('userId is not valid', () => {
    expect(
      adminUserPasswordUpdate(INVALID_SESSION, oldPassword, newPassword)
    ).toBe(401);
  });

  test('Old password is not the correct oldPasswordword', () => {
    const invalidOldPassword = oldPassword + '1';
    expect(
      adminUserPasswordUpdate(input.session, invalidOldPassword, newPassword)
    ).toBe(400);
  });

  test('Old and New password are the same', () => {
    const invalidNewPassword = oldPassword;
    expect(
      adminUserPasswordUpdate(input.session, oldPassword, invalidNewPassword)
    ).toBe(400);
  });

  test('New password has already been used before by user', () => {
    expect(
      adminUserPasswordUpdate(input.session, oldPassword, newPassword)
    ).toStrictEqual({});
    const invalidNewPassword = oldPassword;
    expect(
      adminUserPasswordUpdate(input.session, newPassword, invalidNewPassword)
    ).toBe(400);
  });

  test.each([
    ['Password is empty', ''],
    ['Less than 8 characters', 'invalid'],
    ['All numbers', '12345678'],
    ['All letters', 'onlyletters'],
  ])('New password has invalid format: %s', (_, invalidPassword) => {
    expect(
      adminUserPasswordUpdate(input.session, oldPassword, invalidPassword)
    ).toBe(400);
  });
});
