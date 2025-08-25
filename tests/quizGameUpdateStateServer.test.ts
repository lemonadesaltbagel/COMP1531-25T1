/// /////////////////////////////////////////////////////////////////////////////
//                             FUNCTION IMPORTS                               //
/// ////////////////////////////////////////////////////////////////////
import {
  adminAuthRegister,
  adminQuizCreate,
  adminQuizQuestionCreate,
  adminQuizGameStart,
  adminQuizGameStateUpdate,
  adminQuizGameStatus,
  clear,
} from './wrapperFunctions';

import { GameState, GameStatus } from './interfaces';

function wait(seconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}
/// /////////////////////////////////////////////////////////////////////////////
//                                 CONSTANTS                                  //
/// /////////////////////////////////////////////////////////////////////////////
const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  INVALID_GAMEID: 400,
  INVALID_PLAYERNAME: 400,
  EMPTY_SESSION: 401,
  INVALID_SESSION: 401,
  UNAUTHORIZED: 403,
  INVALID_QUIZ: 403,
  FORBIDDEN: 403,
};

const VALID_AUTO_START_NUM = 5;
const COUNTDOWN_WAIT_TIME = 3;

/// /////////////////////////////////////////////////////////////////////////////
//                             INITIALISATION                                 //
/// /////////////////////////////////////////////////////////////////////////////
const validFirstName = 'Hayden';
const validLastName = 'Smith';
const validEmail = 'hayden.smith@unsw.edu.au';
const validPassword = 'password6';
const name = 'Quiz 1';
const description = 'Valid Quiz Description';

const anotherValidFirstName = 'Jarrod';
const anotherValidLastName = 'Choi';
const anotherValidEmail = 'jarrod.choi@unsw.edu.au';
const anotherValidPassword = 'password7';

let session: string;
let quizId: number;
let gameId: number;

const validQuestion = {
  question: 'What is the capital of France?',
  timeLimit: 2,
  points: 10,
  answerOptions: [
    { answer: 'Paris', correct: true },
    { answer: 'London', correct: false },
    { answer: 'Berlin', correct: false },
    { answer: 'Madrid', correct: false },
  ],
};

const anotherValidQuestion = {
  question: 'What is the capital of Australia?',
  timeLimit: 2,
  points: 10,
  answerOptions: [
    { answer: 'Sydney', correct: true },
    { answer: 'London', correct: false },
    { answer: 'Berlin', correct: false },
    { answer: 'Madrid', correct: false },
  ],
};

/// /////////////////////////////////////////////////////////////////////////////
//                                 TESTING                                    //
/// /////////////////////////////////////////////////////////////////////////////
describe('quizGameUpdateStateServer', () => {
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
    adminQuizQuestionCreate(quizId, session, validQuestion);
    adminQuizQuestionCreate(quizId, session, anotherValidQuestion);
    const gameStartResponse = adminQuizGameStart(
      session,
      quizId,
      VALID_AUTO_START_NUM
    ) as { gameId: number };
    gameId = gameStartResponse.gameId;
  });

  afterEach(() => {
    clear();
  });

  describe('Universal Error Cases', () => {
    test('Game Id does not refer to a valid game within this quiz', () => {
      const adminQuizGameStateUpdateResponse = adminQuizGameStateUpdate(
        quizId,
        gameId + 1,
        session,
        'NEXT_QUESTION'
      );
      expect(adminQuizGameStateUpdateResponse).toStrictEqual(
        HTTP_STATUS.INVALID_GAMEID
      );
    });
    test('Action provided is not a valid Action enum', () => {
      const adminQuizGameStateUpdateResponse = adminQuizGameStateUpdate(
        quizId,
        gameId,
        session,
        -1
      );
      expect(adminQuizGameStateUpdateResponse).toStrictEqual(HTTP_STATUS.BAD_REQUEST);
    });
    test.each([{ session: '' }, { session: session + 'x' }])(
      'Session is empty or invalid',
      ({ session }) => {
        const adminQuizGameStateUpdateResponse = adminQuizGameStateUpdate(
          quizId,
          gameId,
          session,
          'NEXT_QUESTION'
        );
        expect(adminQuizGameStateUpdateResponse).toStrictEqual(
          HTTP_STATUS.EMPTY_SESSION
        );
      }
    );
    test('Valid session is provided, but user is not an owner of this quiz', () => {
      const registerAnotherResponse = adminAuthRegister(
        anotherValidEmail,
        anotherValidPassword,
        anotherValidFirstName,
        anotherValidLastName
      ) as { session: string };
      const anotherSession = registerAnotherResponse.session;
      const adminQuizGameStateUpdateResponse = adminQuizGameStateUpdate(
        quizId,
        gameId,
        anotherSession,
        'NEXT_QUESTION'
      );
      expect(adminQuizGameStateUpdateResponse).toStrictEqual(
        HTTP_STATUS.UNAUTHORIZED
      );
    });
    test('Valid session is provided, but quiz does not exist', () => {
      const adminQuizGameStateUpdateResponse = adminQuizGameStateUpdate(
        quizId + 1,
        gameId,
        session,
        'NEXT_QUESTION'
      );
      expect(adminQuizGameStateUpdateResponse).toStrictEqual(
        HTTP_STATUS.INVALID_QUIZ
      );
    });
  });

  describe('From LOBBY', () => {
    beforeEach(() => {
      const adminQuizGameStatusResponse = adminQuizGameStatus(
        session,
        quizId,
        gameId
      ) as GameStatus;

      expect(adminQuizGameStatusResponse.state).toStrictEqual(GameState.LOBBY);
    });
    describe('Success Cases', () => {
      test('Successfully changes from LOBBY to QUESTION_COUNTDOWN', () => {
        const adminQuizGameStateUpdateResponse = adminQuizGameStateUpdate(
          quizId,
          gameId,
          session,
          'NEXT_QUESTION'
        );
        const adminQuizGameStatusResponse = adminQuizGameStatus(
          session,
          quizId,
          gameId
        ) as GameStatus;

        expect(adminQuizGameStateUpdateResponse).toStrictEqual({});
        expect(adminQuizGameStatusResponse.state).toStrictEqual(
          GameState.QUESTION_COUNTDOWN
        );
      });
      test('Successfully changes from LOBBY to END', () => {
        const adminQuizGameStateUpdateResponse = adminQuizGameStateUpdate(
          quizId,
          gameId,
          session,
          'END'
        );
        const adminQuizGameStatusResponse = adminQuizGameStatus(
          session,
          quizId,
          gameId
        ) as GameStatus;

        expect(adminQuizGameStateUpdateResponse).toStrictEqual({});
        expect(adminQuizGameStatusResponse.state).toStrictEqual(GameState.END);
      });
    });
    describe('Error Cases', () => {
      test('Fails to go to SKIP_COUNTDOWN', () => {
        const adminQuizGameStateUpdateResponse = adminQuizGameStateUpdate(
          quizId,
          gameId,
          session,
          'SKIP_COUNTDOWN'
        );
        expect(adminQuizGameStateUpdateResponse).toStrictEqual(
          HTTP_STATUS.BAD_REQUEST
        );
      });
      test('Fails to GO_TO_ANSWER', () => {
        const adminQuizGameStateUpdateResponse = adminQuizGameStateUpdate(
          quizId,
          gameId,
          session,
          'GO_TO_ANSWER'
        );
        expect(adminQuizGameStateUpdateResponse).toStrictEqual(
          HTTP_STATUS.BAD_REQUEST
        );
      });
      test('Fails to GO_TO_FINAL_RESULTS', () => {
        const adminQuizGameStateUpdateResponse = adminQuizGameStateUpdate(
          quizId,
          gameId,
          session,
          'GO_TO_FINAL_RESULTS'
        );
        expect(adminQuizGameStateUpdateResponse).toStrictEqual(
          HTTP_STATUS.BAD_REQUEST
        );
      });
    });
  });

  describe('From QUESTION_COUNTDOWN', () => {
    beforeEach(() => {
      adminQuizGameStateUpdate(quizId, gameId, session, 'NEXT_QUESTION');
      const adminQuizGameStatusResponse = adminQuizGameStatus(
        session,
        quizId,
        gameId
      ) as GameStatus;
      expect(adminQuizGameStatusResponse.state).toStrictEqual(
        GameState.QUESTION_COUNTDOWN
      );
    });
    describe('Success Cases', () => {
      test('Successfully changes from QUESTION_COUNTDOWN to QUESTION_OPEN without delay', () => {
        adminQuizGameStateUpdate(
          quizId,
          gameId,
          session,
          'SKIP_COUNTDOWN'
        );
        const adminQuizGameStatusResponse = adminQuizGameStatus(
          session,
          quizId,
          gameId
        ) as GameStatus;
        expect(adminQuizGameStatusResponse.state).toStrictEqual(
          GameState.QUESTION_OPEN
        );
      });
      test('Successfully changes from QUESTION_COUNTDOWN to END', () => {
        adminQuizGameStateUpdate(quizId, gameId, session, 'END');
        const adminQuizGameStatusResponse = adminQuizGameStatus(
          session,
          quizId,
          gameId
        ) as GameStatus;
        expect(adminQuizGameStatusResponse.state).toStrictEqual(GameState.END);
      });
    });
    describe('Error Cases', () => {
      test('Fails to go to NEXT_QUESTION', () => {
        const adminQuizGameStateUpdateResponse = adminQuizGameStateUpdate(
          quizId,
          gameId,
          session,
          'NEXT_QUESTION'
        );
        expect(adminQuizGameStateUpdateResponse).toStrictEqual(
          HTTP_STATUS.BAD_REQUEST
        );
      });
      test('Fails to GO_TO_ANSWER', () => {
        const adminQuizGameStateUpdateResponse = adminQuizGameStateUpdate(
          quizId,
          gameId,
          session,
          'GO_TO_ANSWER'
        );
        expect(adminQuizGameStateUpdateResponse).toStrictEqual(
          HTTP_STATUS.BAD_REQUEST
        );
      });
      test('Fails to GO_TO_FINAL_RESULTS', () => {
        const adminQuizGameStateUpdateResponse = adminQuizGameStateUpdate(
          quizId,
          gameId,
          session,
          'GO_TO_FINAL_RESULTS'
        );
        expect(adminQuizGameStateUpdateResponse).toStrictEqual(
          HTTP_STATUS.BAD_REQUEST
        );
      });
    });
  });

  describe('From QUESTION_OPEN', () => {
    beforeEach(() => {
      adminQuizGameStateUpdate(quizId, gameId, session, 'NEXT_QUESTION');
      adminQuizGameStateUpdate(quizId, gameId, session, 'SKIP_COUNTDOWN');
      const adminQuizGameStatusResponse = adminQuizGameStatus(
        session,
        quizId,
        gameId
      ) as GameStatus;
      expect(adminQuizGameStatusResponse.state).toStrictEqual(
        GameState.QUESTION_OPEN
      );
    });
    describe('Success Cases', () => {
      test(
        'Successfully changes from QUESTION_OPEN to ANSWER_SHOW without' +
          'switching after timeLimit',
        async () => {
          adminQuizGameStateUpdate(
            quizId,
            gameId,
            session,
            'GO_TO_ANSWER'
          );
          await wait(COUNTDOWN_WAIT_TIME); // wait here before checking state
          const adminQuizGameStatusResponse = adminQuizGameStatus(
            session,
            quizId,
            gameId
          ) as GameStatus;
          expect(adminQuizGameStatusResponse.state).toStrictEqual(
            GameState.ANSWER_SHOW
          );
        }
      );
      test(
        'Successfully changes from QUESTION_OPEN to END without switching after' +
          'timeLimit',
        async () => {
          adminQuizGameStateUpdate(quizId, gameId, session, 'END');
          await wait(COUNTDOWN_WAIT_TIME); // wait here before checking state
          const adminQuizGameStatusResponse = adminQuizGameStatus(
            session,
            quizId,
            gameId
          ) as GameStatus;
          expect(adminQuizGameStatusResponse.state).toStrictEqual(
            GameState.END
          );
        }
      );
    });
    describe('Error Cases', () => {
      test('Fails to go to NEXT_QUESTION', () => {
        const adminQuizGameStateUpdateResponse = adminQuizGameStateUpdate(
          quizId,
          gameId,
          session,
          'NEXT_QUESTION'
        );
        expect(adminQuizGameStateUpdateResponse).toStrictEqual(
          HTTP_STATUS.BAD_REQUEST
        );
      });
      test('Fails to SKIP_COUNTDOWN', () => {
        const adminQuizGameStateUpdateResponse = adminQuizGameStateUpdate(
          quizId,
          gameId,
          session,
          'SKIP_COUNTDOWN'
        );
        expect(adminQuizGameStateUpdateResponse).toStrictEqual(
          HTTP_STATUS.BAD_REQUEST
        );
      });
      test('Fails to GO_TO_FINAL_RESULTS', () => {
        const adminQuizGameStateUpdateResponse = adminQuizGameStateUpdate(
          quizId,
          gameId,
          session,
          'GO_TO_FINAL_RESULTS'
        );
        expect(adminQuizGameStateUpdateResponse).toStrictEqual(
          HTTP_STATUS.BAD_REQUEST
        );
      });
    });
  });

  describe('From QUESTION_CLOSE', () => {
    beforeEach(async () => {
      adminQuizGameStateUpdate(quizId, gameId, session, 'NEXT_QUESTION');
      adminQuizGameStateUpdate(quizId, gameId, session, 'SKIP_COUNTDOWN');
      await wait(validQuestion.timeLimit + 1);
      const adminQuizGameStatusResponse = adminQuizGameStatus(
        session,
        quizId,
        gameId
      ) as GameStatus;
      expect(adminQuizGameStatusResponse.state).toStrictEqual(
        GameState.QUESTION_CLOSE
      );
    });
    describe('Success Cases', () => {
      test('Successfully changes from QUESTION_CLOSE to FINAL_RESULTS', () => {
        adminQuizGameStateUpdate(
          quizId,
          gameId,
          session,
          'GO_TO_FINAL_RESULTS'
        );
        const adminQuizGameStatusResponse = adminQuizGameStatus(
          session,
          quizId,
          gameId
        ) as GameStatus;
        expect(adminQuizGameStatusResponse.state).toStrictEqual(
          GameState.FINAL_RESULTS
        );
      });
      test('Successfully changes from QUESTION_CLOSE to ANSWER_SHOW', () => {
        adminQuizGameStateUpdate(quizId, gameId, session, 'GO_TO_ANSWER');
        const adminQuizGameStatusResponse = adminQuizGameStatus(
          session,
          quizId,
          gameId
        ) as GameStatus;
        expect(adminQuizGameStatusResponse.state).toStrictEqual(
          GameState.ANSWER_SHOW
        );
      });
      test('Successfully changes from QUESTION_CLOSE to QUESTION_COUNTDOWN', () => {
        adminQuizGameStateUpdate(quizId, gameId, session, 'NEXT_QUESTION');
        const adminQuizGameStatusResponse = adminQuizGameStatus(
          session,
          quizId,
          gameId
        ) as GameStatus;
        expect(adminQuizGameStatusResponse.state).toStrictEqual(
          GameState.QUESTION_COUNTDOWN
        );
      });
      test('Successfully changes from QUESTION_CLOSE to END', () => {
        adminQuizGameStateUpdate(quizId, gameId, session, 'END');
        const adminQuizGameStatusResponse = adminQuizGameStatus(
          session,
          quizId,
          gameId
        ) as GameStatus;
        expect(adminQuizGameStatusResponse.state).toStrictEqual(GameState.END);
      });
    });
    describe('Error Cases', () => {
      test('Fails to SKIP_COUNTDOWN', () => {
        const adminQuizGameStateUpdateResponse = adminQuizGameStateUpdate(
          quizId,
          gameId,
          session,
          'SKIP_COUNTDOWN'
        );
        expect(adminQuizGameStateUpdateResponse).toStrictEqual(
          HTTP_STATUS.BAD_REQUEST
        );
      });
      test('Fails to NEXT_QUESTION when Last Question', async() => {
        adminQuizGameStateUpdate(quizId,
          gameId,
          session,
          'NEXT_QUESTION'
        );
        adminQuizGameStateUpdate(quizId,
          gameId,
          session,
          'SKIP_COUNTDOWN'
        );
        await wait(validQuestion.timeLimit + 1);
        const adminQuizGameStatusResponse = adminQuizGameStatus(
          session,
          quizId,
          gameId
        ) as GameStatus;
        expect(adminQuizGameStatusResponse.state).toStrictEqual(GameState.QUESTION_CLOSE);

        const adminQuizGameStateUpdateResponse = adminQuizGameStateUpdate(
          quizId,
          gameId,
          session,
          'NEXT_QUESTION'
        );

        expect(adminQuizGameStateUpdateResponse).toStrictEqual(HTTP_STATUS.BAD_REQUEST);
      });
    });
  });

  describe('From ANSWER_SHOW', () => {
    beforeEach(() => {
      adminQuizGameStateUpdate(quizId, gameId, session, 'NEXT_QUESTION');
      adminQuizGameStateUpdate(quizId, gameId, session, 'SKIP_COUNTDOWN');
      adminQuizGameStateUpdate(quizId, gameId, session, 'GO_TO_ANSWER');
      const adminQuizGameStatusResponse = adminQuizGameStatus(
        session,
        quizId,
        gameId
      ) as GameStatus;
      expect(adminQuizGameStatusResponse.state).toStrictEqual(
        GameState.ANSWER_SHOW
      );
    });

    describe('Success Cases', () => {
      test('Successfully changes from ANSWER_SHOW to FINAL_RESULTS', () => {
        adminQuizGameStateUpdate(
          quizId,
          gameId,
          session,
          'GO_TO_FINAL_RESULTS'
        );
        const adminQuizGameStatusResponse = adminQuizGameStatus(
          session,
          quizId,
          gameId
        ) as GameStatus;
        expect(adminQuizGameStatusResponse.state).toStrictEqual(
          GameState.FINAL_RESULTS
        );
      });
      test('Successfully changes from ANSWER_SHOW to QUESTION_COUNTDOWN', () => {
        adminQuizGameStateUpdate(quizId, gameId, session, 'NEXT_QUESTION');
        const adminQuizGameStatusResponse = adminQuizGameStatus(
          session,
          quizId,
          gameId
        ) as GameStatus;
        expect(adminQuizGameStatusResponse.state).toStrictEqual(
          GameState.QUESTION_COUNTDOWN
        );
      });
      test('Successfully changes from ANSWER_SHOW to END', () => {
        adminQuizGameStateUpdate(quizId, gameId, session, 'END');
        const adminQuizGameStatusResponse = adminQuizGameStatus(
          session,
          quizId,
          gameId
        ) as GameStatus;
        expect(adminQuizGameStatusResponse.state).toStrictEqual(GameState.END);
      });
    });

    describe('Error Cases', () => {
      test('Fails to SKIP_COUNTDOWN', () => {
        const adminQuizGameStateUpdateResponse = adminQuizGameStateUpdate(
          quizId,
          gameId,
          session,
          'SKIP_COUNTDOWN'
        );
        expect(adminQuizGameStateUpdateResponse).toStrictEqual(
          HTTP_STATUS.BAD_REQUEST
        );
      });
      test('Fails to NEXT_QUESTION when it is the last question', () => {
        const adminQuizGameStateUpdateResponse = adminQuizGameStateUpdate(
          quizId,
          gameId,
          session,
          'SKIP_COUNTDOWN'
        );
        expect(adminQuizGameStateUpdateResponse).toStrictEqual(
          HTTP_STATUS.BAD_REQUEST
        );
      });
      test('Fails to NEXT_QUESTION when Last Question', async() => {
        adminQuizGameStateUpdate(quizId, gameId, session, 'NEXT_QUESTION');
        adminQuizGameStateUpdate(quizId, gameId, session, 'SKIP_COUNTDOWN');
        adminQuizGameStateUpdate(quizId, gameId, session, 'GO_TO_ANSWER');
        const adminQuizGameStatusResponse = adminQuizGameStatus(
          session,
          quizId,
          gameId
        ) as GameStatus;
        expect(adminQuizGameStatusResponse.state).toStrictEqual(GameState.ANSWER_SHOW);

        const adminQuizGameStateUpdateResponse = adminQuizGameStateUpdate(
          quizId,
          gameId,
          session,
          'NEXT_QUESTION'
        );

        expect(adminQuizGameStateUpdateResponse).toStrictEqual(HTTP_STATUS.BAD_REQUEST);
      });
    });
  });

  describe('From FINAL_RESULTS', () => {
    beforeEach(() => {
      adminQuizGameStateUpdate(quizId, gameId, session, 'NEXT_QUESTION');
      adminQuizGameStateUpdate(quizId, gameId, session, 'SKIP_COUNTDOWN');
      adminQuizGameStateUpdate(quizId, gameId, session, 'GO_TO_ANSWER');
      adminQuizGameStateUpdate(
        quizId,
        gameId,
        session,
        'GO_TO_FINAL_RESULTS'
      );
      const adminQuizGameStatusResponse = adminQuizGameStatus(
        session,
        quizId,
        gameId
      ) as GameStatus;
      expect(adminQuizGameStatusResponse.state).toStrictEqual(
        GameState.FINAL_RESULTS
      );
    });
    describe('Success Cases', () => {
      test('Successfully changes from FINAL_RESULTS to END', () => {
        adminQuizGameStateUpdate(quizId, gameId, session, 'END');
        const adminQuizGameStatusResponse = adminQuizGameStatus(
          session,
          quizId,
          gameId
        ) as GameStatus;
        expect(adminQuizGameStatusResponse.state).toStrictEqual(GameState.END);
      });
    });
    describe('Error Cases', () => {
      test('Fails to go to NEXT_QUESTION', () => {
        const adminQuizGameStateUpdateResponse = adminQuizGameStateUpdate(
          quizId,
          gameId,
          session,
          'NEXT_QUESTION'
        );
        expect(adminQuizGameStateUpdateResponse).toStrictEqual(
          HTTP_STATUS.BAD_REQUEST
        );
      });
      test('Fails to SKIP_COUNTDOWN', () => {
        const adminQuizGameStateUpdateResponse = adminQuizGameStateUpdate(
          quizId,
          gameId,
          session,
          'SKIP_COUNTDOWN'
        );
        expect(adminQuizGameStateUpdateResponse).toStrictEqual(
          HTTP_STATUS.BAD_REQUEST
        );
      });
      test('Fails to GO_TO_ANSWER', () => {
        const adminQuizGameStateUpdateResponse = adminQuizGameStateUpdate(
          quizId,
          gameId,
          session,
          'GO_TO_ANSWER'
        );
        expect(adminQuizGameStateUpdateResponse).toStrictEqual(
          HTTP_STATUS.BAD_REQUEST
        );
      });
      test('Fails to GO_TO_FINAL_RESULTS', () => {
        const adminQuizGameStateUpdateResponse = adminQuizGameStateUpdate(
          quizId,
          gameId,
          session,
          'GO_TO_FINAL_RESULTS'
        );
        expect(adminQuizGameStateUpdateResponse).toStrictEqual(
          HTTP_STATUS.BAD_REQUEST
        );
      });
    });
  });

  describe('From End', () => {
    beforeEach(() => {
      adminQuizGameStateUpdate(quizId, gameId, session, 'END');
      const adminQuizGameStatusResponse = adminQuizGameStatus(
        session,
        quizId,
        gameId
      ) as GameStatus;
      expect(adminQuizGameStatusResponse.state).toStrictEqual(GameState.END);
    });
    describe('Error Cases', () => {
      test('Fails to go to NEXT_QUESTION', () => {
        const adminQuizGameStateUpdateResponse = adminQuizGameStateUpdate(
          quizId,
          gameId,
          session,
          'NEXT_QUESTION'
        );
        expect(adminQuizGameStateUpdateResponse).toStrictEqual(
          HTTP_STATUS.BAD_REQUEST
        );
      });
      test('Fails to SKIP_COUNTDOWN', () => {
        const adminQuizGameStateUpdateResponse = adminQuizGameStateUpdate(
          quizId,
          gameId,
          session,
          'SKIP_COUNTDOWN'
        );
        expect(adminQuizGameStateUpdateResponse).toStrictEqual(
          HTTP_STATUS.BAD_REQUEST
        );
      });
      test('Fails to GO_TO_ANSWER', () => {
        const adminQuizGameStateUpdateResponse = adminQuizGameStateUpdate(
          quizId,
          gameId,
          session,
          'GO_TO_ANSWER'
        );
        expect(adminQuizGameStateUpdateResponse).toStrictEqual(
          HTTP_STATUS.BAD_REQUEST
        );
      });
      test('Fails to GO_TO_FINAL_RESULTS', () => {
        const adminQuizGameStateUpdateResponse = adminQuizGameStateUpdate(
          quizId,
          gameId,
          session,
          'GO_TO_FINAL_RESULTS'
        );
        expect(adminQuizGameStateUpdateResponse).toStrictEqual(
          HTTP_STATUS.BAD_REQUEST
        );
      });
      test('Fails to go to END', () => {
        const adminQuizGameStateUpdateResponse = adminQuizGameStateUpdate(
          quizId,
          gameId,
          session,
          'END'
        );
        expect(adminQuizGameStateUpdateResponse).toStrictEqual(
          HTTP_STATUS.BAD_REQUEST
        );
      });
    });
  });
});
