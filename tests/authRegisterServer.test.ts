/// /////////////////////////////////////////////////////////////////////////////
//                             FUNCTION IMPORTS                               //
/// /////////////////////////////////////////////////////////////////////////////
import {
  adminAuthRegister,
  clear,
} from './wrapperFunctions';
/// /////////////////////////////////////////////////////////////////////////////
//                                 TESTING                                    //
/// ////////////////////////////////////////////////////////////////////////////
afterAll(() => {
  clear();
});

beforeEach(() => {
  clear();
});

afterEach(() => {
  clear();
});

describe('AdminAuthRegister Tests', () => {
  test('Valid email registration', () => {
    const result = adminAuthRegister(
      'validemail@gmail.com',
      'Validpassword9',
      'Abhi',
      'Lum'
    );
    expect(result).toStrictEqual({ session: expect.any(String) });
  });
  describe('AdminAuthRegister Tests', () => {
    describe('Success Cases', () => {
      test.each([
        {
          email: 'validemail@gmail.com',
          password: 'Validpassword9',
          nameFirst: 'Abhi',
          nameLast: 'Lum',
        },
        {
          email: 'validemail@gmail.com',
          password: 'Validpassword9',
          nameFirst: 'Abhi-alex',
          nameLast: 'abhi-Lum',
        },
        {
          email: 'validemail@gmail.com',
          password: 'Validpassword9',
          nameFirst: "Abhi'alex",
          nameLast: "abhi'Lum",
        },
        {
          email: 'validemail@gmail.com',
          password: 'Validpassword9',
          nameFirst: 'Abhi alex',
          nameLast: 'Lum',
        },
      ])(
        'Valid Email and Password Inputted',
        ({ email, password, nameFirst, nameLast }) => {
          const result = adminAuthRegister(
            email,
            password,
            nameFirst,
            nameLast
          );
          expect(result).toStrictEqual({ session: expect.any(String) });
        }
      );
    });

    describe('Error Cases', () => {
      test('Invalid Email address is used by another user', () => {
        adminAuthRegister(
          'validuserl@gmail.com',
          'Validpassword9',
          'Abhi',
          'Lum'
        );

        const errorResult = adminAuthRegister(
          'validuserl@gmail.com',
          'AnotherValidPw2',
          'Jarrod',
          'Lum'
        );
        expect(errorResult).toStrictEqual(400);
      });

      describe('Invalid Email address format', () => {
        test.each([
          { invalid_email: '' },
          { invalid_email: 'invalidemail@' },
          { invalid_email: 'invalidemailgmail.com' },
          { invalid_email: 'invalid__email__format' },
          { invalid_email: '@gmail.com' },
          { invalid_email: 'invalid@gmail' },
        ])('Error testing for invalid email format inputted', ({ invalid_email }) => {
          const errorResult = adminAuthRegister(
            invalid_email,
            'ValidPassword1',
            'Abhi',
            'Lum'
          );
          expect(errorResult).toStrictEqual(400);
        });
      });

      describe('Invalid NameFirst Format', () => {
        test.each([
          { invalid_first_name: '' },
          { invalid_first_name: 'Alex_' },
          { invalid_first_name: '!!!----Alex' },
          { invalid_first_name: 'A' },
          { invalid_first_name: 'Alexandriathesecondthenametheperson' },
        ])(
          'Error testing for invalid first name format inputted',
          ({ invalid_first_name }) => {
            const errorResult = adminAuthRegister(
              'validemail@gmail.com',
              'ValidPassword1',
              invalid_first_name,
              'Lum'
            );
            expect(errorResult).toStrictEqual(400);
          }
        );
      });

      describe('Invalid NameLast Format', () => {
        test.each([
          { invalid_last_name: '' },
          { invalid_last_name: 'Abhi_' },
          { invalid_last_name: 'Abhi!!!__~~' },
          { invalid_last_name: 'B' },
          { invalid_last_name: 'abhiiiiiiiiiiiiiiiiiiiiiiiiiii' },
        ])(
          'Error testing for invalid last name format inputted',
          ({ invalid_last_name }) => {
            const errorResult = adminAuthRegister(
              'validemail@gmail.com',
              'ValidPassword1',
              'Alex',
              invalid_last_name
            );
            expect(errorResult).toStrictEqual(400);
          }
        );
      });

      describe('Invalid Password Format', () => {
        test.each([
          { invalid_password: '' },
          { invalid_password: 'invalid' },
          { invalid_password: '1234567890' },
          { invalid_password: 'ABCDEFGHIJKLMNO' },
        ])(
          'Error testing for invalid password format inputted',
          ({ invalid_password }) => {
            const errorResult = adminAuthRegister(
              'validemail@gmail.com',
              invalid_password,
              'Alex',
              'Lum'
            );
            expect(errorResult).toStrictEqual(400);
          }
        );
      });
    });
  });
});
