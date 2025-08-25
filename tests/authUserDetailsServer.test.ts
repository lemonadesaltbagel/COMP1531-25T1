/// /////////////////////////////////////////////////////////////////////////////
//                             FUNCTION IMPORTS                               //
/// /////////////////////////////////////////////////////////////////////////////
import {
  adminAuthRegister,
  adminAuthLogin,
  adminUserDetails,
  clear,
} from './wrapperFunctions';
/// /////////////////////////////////////////////////////////////////////////////
//                                      TESTS                                 //
/// /////////////////////////////////////////////////////////////////////////////
describe('Success Cases', () => {
  let token: { session: string };
  const validmail = 'validemail@gmail.com';
  const validpass = 'Validpassword9';
  const firstName = 'Alex';
  const lastName = 'Lum';

  beforeEach(() => {
    clear();
    token = adminAuthRegister(validmail, validpass, firstName, lastName) as {
      session: string;
    };
  });
  afterEach(() => {
    // Clear the state after each test to ensure tests are isolated
    clear();
  });

  test('Return User Details straight after one user is created', () => {
    expect(token).toStrictEqual({ session: expect.any(String) });
    expect(adminUserDetails(token.session)).toStrictEqual({
      user: {
        userId: expect.any(Number),
        name: 'Alex Lum',
        email: validmail,
        numSuccessfulLogins: 1,
        numFailedPasswordsSinceLastLogin: 0,
      },
    });
  });

  test('Return User Details after a login attempt', () => {
    const result = adminAuthLogin(validmail, validpass) as { session: string };
    expect(adminUserDetails(result.session)).toStrictEqual({
      user: {
        userId: expect.any(Number),
        name: 'Alex Lum',
        email: validmail,
        numSuccessfulLogins: 2,
        numFailedPasswordsSinceLastLogin: 0,
      },
    });
  });

  test('Return User Details after multiple logins', () => {
    const result = adminAuthLogin(validmail, validpass) as { session: string };
    adminAuthLogin(validmail, validpass);
    adminAuthLogin(validmail, validpass);
    expect(adminUserDetails(result.session)).toStrictEqual({
      user: {
        userId: expect.any(Number),
        name: 'Alex Lum',
        email: validmail,
        numSuccessfulLogins: 4,
        numFailedPasswordsSinceLastLogin: 0,
      },
    });
  });

  test('Return User Details after a failed login attempt', () => {
    const result = adminAuthLogin(validmail, validpass) as { session: string };
    adminAuthLogin(validmail, validpass);
    adminAuthLogin(validmail, validpass + '!');
    expect(adminUserDetails(result.session)).toStrictEqual({
      user: {
        userId: expect.any(Number),
        name: 'Alex Lum',
        email: validmail,
        numSuccessfulLogins: 3,
        numFailedPasswordsSinceLastLogin: 1,
      },
    });
  });

  test('Return User Details after multiple failed login attempts', () => {
    const result = adminAuthLogin(validmail, validpass) as { session: string };
    adminAuthLogin(validmail, validpass);
    adminAuthLogin(validmail, validpass + '!');
    adminAuthLogin(validmail, validpass + '!!');
    expect(adminUserDetails(result.session)).toStrictEqual({
      user: {
        userId: expect.any(Number),
        name: 'Alex Lum',
        email: validmail,
        numSuccessfulLogins: 3,
        numFailedPasswordsSinceLastLogin: 2,
      },
    });
  });

  test('Return User Details after a mixture of failed and successful attempts', () => {
    const result = adminAuthLogin(validmail, validpass) as { session: string };
    adminAuthLogin(validmail, validpass + '!');
    adminAuthLogin(validmail, validpass + '!!');
    adminAuthLogin(validmail, validpass);
    adminAuthLogin(validmail, validpass);
    adminAuthLogin(validmail, validpass + '!!!');
    expect(adminUserDetails(result.session)).toStrictEqual({
      user: {
        userId: expect.any(Number),
        name: 'Alex Lum',
        email: validmail,
        numSuccessfulLogins: 4,
        numFailedPasswordsSinceLastLogin: 1,
      },
    });
  });

  test('Returns detail of correct user after multiple users are created', () => {
    const newPerson = adminAuthRegister(
      '2validemail@gmail.com',
      '2validpassword',
      'Arnav',
      'Lum'
    ) as { session: string };
    adminAuthLogin(validmail, validpass);
    adminAuthLogin(validmail, validpass + '!');
    adminAuthLogin(validmail, validpass + '!!');
    adminAuthLogin(validmail, validpass);
    expect(adminUserDetails(newPerson.session)).toStrictEqual({
      user: {
        userId: expect.any(Number),
        name: 'Arnav Lum',
        email: '2validemail@gmail.com',
        numSuccessfulLogins: 1,
        numFailedPasswordsSinceLastLogin: 0,
      },
    });
  });
});

describe('Error cases: passing in an invalid session', () => {
  let token: { session: string } | { error: string };
  const validmail = 'validemail@gmail.com';
  const validpass = 'Validpassword9';
  const firstName = 'Alex';
  const lastName = 'Lum';

  beforeEach(() => {
    const result = adminAuthRegister(validmail, validpass, firstName, lastName);
    token =
      typeof result === 'number' ? { error: 'Unexpected return type' } : result;
  });

  test('Inputting an invalid userId after only 1 user has been created', () => {
    const input = token as { session: string };
    expect(adminUserDetails(input.session + '1')).toBe(401);
  });

  test('Given there are no userId', () => {
    clear();
    const session = 'invalidsessionbecausenouserscreated';
    expect(adminUserDetails(session)).toStrictEqual(401);
  });
});
