/// /////////////////////////////////////////////////////////////////////////////
//                             FUNCTION IMPORTS                               //
/// /////////////////////////////////////////////////////////////////////////////
import {
  adminAuthRegister,
  adminUserDetails,
  adminUserDetailsUpdate,
  clear,
} from './wrapperFunctions';

/// /////////////////////////////////////////////////////////////////////////////
//                             INITIALISATION                                 //
/// /////////////////////////////////////////////////////////////////////////////
let firstName;
let lastName;
let validemail: string;
let ValidPassword;
let token: { session: string };

/// /////////////////////////////////////////////////////////////////////////////
//                                 TESTING                                    //
/// /////////////////////////////////////////////////////////////////////////////
beforeEach(() => {
  clear();
  firstName = 'Alex';
  lastName = 'Lum';
  validemail = 'validemail@gmail.com';
  ValidPassword = 'ValidPassword9';
  token = adminAuthRegister(validemail, ValidPassword, firstName, lastName) as {
    session: string;
  };
});

afterEach(() => {
  clear();
});

describe('Success Cases', () => {
  test('Provides the correct return type', () => {
    const updatedFirstName = 'NewAlex';
    const updatedEmail = 'newemail@gmail.com';
    const updatedLastName = 'NewLum';
    expect(
      adminUserDetailsUpdate(
        token.session,
        updatedEmail,
        updatedFirstName,
        updatedLastName
      )
    ).toStrictEqual({});
  });

  test('Details have been sucessfully updated for one user', () => {
    adminUserDetailsUpdate(
      token.session,
      'newmail@gmail.com',
      'newAlex',
      'newLum'
    );
    expect(adminUserDetails(token.session)).toStrictEqual({
      user: {
        userId: expect.any(Number),
        name: 'newAlex newLum',
        email: 'newmail@gmail.com',
        numSuccessfulLogins: 1,
        numFailedPasswordsSinceLastLogin: 0,
      },
    });
  });

  test('Details have been successfully updated for multiple users', () => {
    adminUserDetailsUpdate(
      token.session,
      'newmail@gmail.com',
      'newAlex',
      'newLum'
    );
    const secondUser = adminAuthRegister(
      'seconduser@gmail.com',
      'seconduserPass9',
      'Abhi',
      'Chen'
    ) as { session: string };
    adminUserDetailsUpdate(
      secondUser.session,
      'newsecond@gmail.com',
      'newAbhi',
      'newChen'
    );
    expect(adminUserDetails(token.session)).toStrictEqual({
      user: {
        userId: expect.any(Number),
        name: 'newAlex newLum',
        email: 'newmail@gmail.com',
        numSuccessfulLogins: 1,
        numFailedPasswordsSinceLastLogin: 0,
      },
    });

    expect(adminUserDetails(secondUser.session)).toStrictEqual({
      user: {
        userId: expect.any(Number),
        name: 'newAbhi newChen',
        email: 'newsecond@gmail.com',
        numSuccessfulLogins: 1,
        numFailedPasswordsSinceLastLogin: 0,
      },
    });
  });
});

describe('Error cases', () => {
  test('Invalid SessionId', () => {
    expect(
      adminUserDetailsUpdate(
        token.session + '1',
        'newmail@gmail.com',
        'newAlex',
        'newLum'
      )
    ).toStrictEqual(401);
  });

  test('Email is used by another user', () => {
    adminAuthRegister(
      'seconduser@gmail.com',
      'seconduserPass9',
      'Abhi',
      'Chen'
    );
    expect(
      adminUserDetailsUpdate(
        token.session,
        'seconduser@gmail.com',
        'newAlex',
        'newLum'
      )
    ).toStrictEqual(400);
  });

  test.each([
    { invalidemail: '' },
    { invalidemail: 'missingdomain@' },
    { invalidemail: 'missingatsymbol.com' },
    { invalidemail: 'invalid_characters' },
    { invalidemail: '@missingstringbeforeatsymbolgmail.com' },
    { invalidemail: 'invalid@gmail' },
  ])('Error testing for invalid email format inputted', ({ invalidemail }) => {
    expect(
      adminUserDetailsUpdate(token.session, invalidemail, 'newAlex', 'newLum')
    ).toStrictEqual(400);
  });

  test.each([
    { invalid_nameFirst: '' },
    { invalid_nameFirst: 'SpecialCharsAbhi!' },
    { invalid_nameFirst: 'ManySpecialChars!_~' },
    { invalid_nameFirst: 'A' },
    { invalid_nameFirst: 'Nameismorethan20charsAlexAbhiArnav' },
  ])('Error testing for invalid first name format inputted', ({ invalid_nameFirst }) => {
    expect(
      adminUserDetailsUpdate(token.session, validemail, invalid_nameFirst, 'newLum')
    ).toStrictEqual(400);
  });

  test.each([
    { invalid_nameLast: '' },
    { invalid_nameLast: 'Abhi_' },
    { invalid_nameLast: 'ManySpecialChars!_~' },
    { invalid_nameLast: 'B' },
    { invalid_nameLast: 'Nameismorethan20charsAlexAbhiArnav' },
  ])('Error testing for invalid last name format inputted', ({ invalid_nameLast }) => {
    expect(
      adminUserDetailsUpdate(token.session, validemail, 'newAlex', invalid_nameLast)
    ).toBe(400);
  });
});
