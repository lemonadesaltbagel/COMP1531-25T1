/// /////////////////////////////////////////////////////////////////////////////
//                             FUNCTION IMPORTS                               //
/// /////////////////////////////////////////////////////////////////////////////
import {
  adminAuthLogin,
  adminAuthRegister,
  clear
} from './wrapperFunctions';

/// /////////////////////////////////////////////////////////////////////////////
//                                 TESTING                                    //
/// /////////////////////////////////////////////////////////////////////////////

afterAll(() => {
  clear();
});

beforeEach(() => {
  clear();
  adminAuthRegister('Validemail@gmail.com', 'ValidPassword9', 'Abhi', 'Lum');
});

afterEach(() => {
  clear();
});

describe('/v1/admin/auth/login Tests', () => {
  describe('Error Cases', () => {
    test.each([
      { invalid_email: '' },
      { invalid_email: 'validemail@gmail.com' },
      { invalid_email: 'alidemail@gmail.com' },
    ])('Email is not registered', ({ invalid_email }) => {
      const result = adminAuthLogin(invalid_email, 'ValidPassword9');
      expect(result).toStrictEqual(400);
    });

    test.each([
      { unmatched_password: '' },
      { unmatched_password: 'validpassword9' },
      { unmatched_password: 'ValidPassword' },
    ])('Password does not match registered email', ({ unmatched_password }) => {
      const result = adminAuthLogin('Validemail@gmail.com', unmatched_password);
      expect(result).toStrictEqual(400);
    });
    test('Email and Password are not inputted', () => {
      const result = adminAuthLogin('', '');
      expect(result).toStrictEqual(400);
    });
  });
  describe('Success case', () => {
    test('Valid Email and Password entered that matches registered user', () => {
      expect(
        adminAuthLogin('Validemail@gmail.com', 'ValidPassword9')
      ).toStrictEqual({ session: expect.any(String) });
    });
  });
});
