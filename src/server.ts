import express, { json, Request, Response } from 'express';
import { echo } from './newecho';
import morgan from 'morgan';
import config from './config.json';
import cors from 'cors';
import YAML from 'yaml';
import sui from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import process from 'process';
import multer from 'multer';
import { BadRequestError, ForbiddenError, UnauthorisedError } from './errors';
import { saveData } from './dataStore';
import {
  adminAuthLogin,
  adminAuthLogout,
  adminAuthRegister,
  adminUserDetails,
  adminUserDetailsUpdate,
  adminUserPasswordUpdate,
} from './auth';
import {
  adminQuizDescriptionUpdate,
  adminQuizExport,
  adminQuizImport,
  adminQuizCreate,
  adminQuizInfo,
  adminQuizInfoV2,
  adminQuizList,
  adminQuizNameUpdate,
  adminQuizQuestionAttachment,
  adminQuizQuestionAttachmentVerification,
  adminQuizQuestionAttachmentRemove,
  adminQuizQuestionCreate,
  adminQuizQuestionCreateV2,
  adminQuizQuestionMove,
  adminQuizQuestionRemove,
  adminQuizQuestionRemoveV2,
  // adminQuizQuestionSuggestion,
  adminQuizQuestionUpdate,
  adminQuizQuestionUpdateV2,
  adminQuizRemove,
  adminQuizRemoveV2,
  adminQuizThumbnailUpdate,
  adminQuizTransfer,
  adminQuizTransferV2
} from './quiz';

import {
  adminQuizGameFinalResults,
  adminQuizGameStart,
  adminQuizGameStateUpdate,
  adminQuizGameStatus,
  adminQuizGameView,
} from './game';

import {
  gamePlayerFinalResults,
  gamePlayerQuestionInfo,
  gamePlayerStatus,
  playerJoinGame,
  playerAnswerSubmission,
  playerQuestionResults,
  gamePlayerQuestionHint
} from './player';

import { clear } from './other';
import { actionParser } from './helpers/gameHelpers';

// Set up web app
export const app = express();

// Use middleware that allows us to access the JSON body of requests
app.use(json());
// Use middleware that allows for access from other domains
app.use(cors());
// for logging errors (print to terminal)
app.use(morgan('dev'));
// for producing the docs that define the API
const file = fs.readFileSync(path.join(process.cwd(), 'swagger.yaml'), 'utf8');
app.get('/', (req: Request, res: Response) => res.redirect('/docs'));
app.use(
  '/docs',
  sui.serve,
  sui.setup(YAML.parse(file), {
    swaggerOptions: { docExpansion: config.expandDocs ? 'full' : 'list' },
  })
);

const PORT: number = parseInt(process.env.PORT || config.port);
const HOST: string = process.env.IP || '127.0.0.1';

const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORISED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(process.cwd(), 'uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage });

// ====================================================================
//  ================= WORK IS DONE BELOW THIS LINE ===================
// ====================================================================

// Example get request
app.get('/echo', (req: Request, res: Response) => {
  const result = echo(req.query.echo as string);
  if ('error' in result) {
    res.status(HTTP_STATUS.BAD_REQUEST);
  }

  return res.json(result);
});

app.delete('/v1/clear', (req: Request, res: Response) => {
  res.json(clear());
  saveData();
});

app.post('/v1/admin/auth/register', (req: Request, res: Response) => {
  const { email, password, nameFirst, nameLast } = req.body;
  try {
    const result = adminAuthRegister(email, password, nameFirst, nameLast);
    saveData();
    res.json(result);
  } catch (error) {
    if (error instanceof BadRequestError) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({ error: error.message });
    }
  }
});

app.post('/v1/admin/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const result = adminAuthLogin(email, password);
    saveData();
    res.json(result);
  } catch (error) {
    if (error instanceof BadRequestError) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({ error: error.message });
    }
  }
});

app.get('/v1/admin/quiz/list', (req: Request, res: Response) => {
  const sessions = req.header('session') as string;
  try {
    const result = adminQuizList(sessions);
    saveData();
    res.status(HTTP_STATUS.OK).json(result);
  } catch (error) {
    if (error instanceof UnauthorisedError) {
      res.status(HTTP_STATUS.UNAUTHORISED).json({ error: error.message });
    }
  }
});

app.post('/v1/admin/quiz', (req: Request, res: Response) => {
  const session = req.headers.session as string;
  const { name, description } = req.body;

  try {
    const result = adminQuizCreate(session, name, description);
    saveData();
    res.status(HTTP_STATUS.OK).json(result);
  } catch (error) {
    if (error instanceof BadRequestError) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({ error: error.message });
    } else if (error instanceof UnauthorisedError) {
      res.status(HTTP_STATUS.UNAUTHORISED).json({ error: error.message });
    }
  }
});

app.get('/v1/admin/user/details', (req: Request, res: Response) => {
  const session = req.header('session');
  try {
    const result = adminUserDetails(session);
    saveData();
    res.status(HTTP_STATUS.OK).json(result);
  } catch (error) {
    if (error instanceof UnauthorisedError) {
      res.status(HTTP_STATUS.UNAUTHORISED).json({ error: error.message });
    }
  }
});

app.put('/v1/admin/user/details', (req: Request, res: Response) => {
  const { email, nameFirst, nameLast } = req.body;
  const session = req.header('session');
  try {
    const result = adminUserDetailsUpdate(
      session,
      email,
      nameFirst,
      nameLast
    );
    saveData();
    res.status(HTTP_STATUS.OK).json(result);
  } catch (error) {
    if (error instanceof BadRequestError) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({ error: error.message });
    } else if (error instanceof UnauthorisedError) {
      res.status(HTTP_STATUS.UNAUTHORISED).json({ error: error.message });
    }
  }
});

app.put('/v1/admin/user/password', (req: Request, res: Response) => {
  const { oldPassword, newPassword } = req.body;
  const session = req.header('session');

  try {
    const result = adminUserPasswordUpdate(
      session,
      oldPassword,
      newPassword
    );
    saveData();
    res.status(HTTP_STATUS.OK).json(result);
  } catch (error) {
    if (error instanceof BadRequestError) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({ error: error.message });
    } else if (error instanceof UnauthorisedError) {
      res.status(HTTP_STATUS.UNAUTHORISED).json({ error: error.message });
    }
  }
});

app.post('/v1/admin/auth/logout', (req: Request, res: Response) => {
  const session = req.header('session');

  try {
    const result = adminAuthLogout(session);
    saveData();
    res.status(HTTP_STATUS.OK).json(result);
  } catch (error) {
    if (error instanceof UnauthorisedError) {
      res.status(HTTP_STATUS.UNAUTHORISED).json({ error: error.message });
    }
  }
});

app.delete('/v1/admin/quiz/:quizid', (req: Request, res: Response) => {
  const session = req.header('session');
  const { quizid } = req.params;

  try {
    const result = adminQuizRemove(Number(quizid), session);
    saveData();
    res.status(HTTP_STATUS.OK).json(result);
  } catch (error) {
    if (error instanceof UnauthorisedError) {
      res.status(HTTP_STATUS.UNAUTHORISED).json({ error: error.message });
    } else if (error instanceof ForbiddenError) {
      res.status(HTTP_STATUS.FORBIDDEN).json({ error: error.message });
    }
  }
});

app.delete('/v2/admin/quiz/:quizid', (req: Request, res: Response) => {
  const session = req.header('session');
  const { quizid } = req.params;

  try {
    const result = adminQuizRemoveV2(Number(quizid), session);
    saveData();
    res.status(HTTP_STATUS.OK).json(result);
  } catch (error) {
    if (error instanceof BadRequestError) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({ error: error.message });
    } else if (error instanceof UnauthorisedError) {
      res.status(HTTP_STATUS.UNAUTHORISED).json({ error: error.message });
    } else if (error instanceof ForbiddenError) {
      res.status(HTTP_STATUS.FORBIDDEN).json({ error: error.message });
    }
  }
});

app.get('/v1/admin/quiz/:quizId', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizId);
  const session = req.header('session');

  try {
    const result = adminQuizInfo(session, quizId);
    saveData();
    res.status(HTTP_STATUS.OK).json(result);
  } catch (error) {
    if (error instanceof UnauthorisedError) {
      res.status(HTTP_STATUS.UNAUTHORISED).json({ error: error.message });
    } else if (error instanceof ForbiddenError) {
      res.status(HTTP_STATUS.FORBIDDEN).json({ error: error.message });
    }
  }
});

app.get('/v2/admin/quiz/:quizId', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizId);
  const session = req.header('session');

  try {
    const result = adminQuizInfoV2(session, quizId);
    saveData();
    res.status(HTTP_STATUS.OK).json(result);
  } catch (error) {
    if (error instanceof UnauthorisedError) {
      res.status(HTTP_STATUS.UNAUTHORISED).json({ error: error.message });
    } else if (error instanceof ForbiddenError) {
      res.status(HTTP_STATUS.FORBIDDEN).json({ error: error.message });
    }
  }
});

app.post('/v1/admin/quiz/:quizid/transfer', (req: Request, res: Response) => {
  const session = req.header('session');
  const { quizid } = req.params;
  const { userEmail } = req.body;

  try {
    const result = adminQuizTransfer(Number(quizid), session, userEmail);
    saveData();
    res.status(HTTP_STATUS.OK).json(result);
  } catch (error) {
    if (error instanceof BadRequestError) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({ error: error.message });
    } else if (error instanceof UnauthorisedError) {
      res.status(HTTP_STATUS.UNAUTHORISED).json({ error: error.message });
    } else if (error instanceof ForbiddenError) {
      res.status(HTTP_STATUS.FORBIDDEN).json({ error: error.message });
    }
  }
});

app.post('/v2/admin/quiz/:quizid/transfer', (req: Request, res: Response) => {
  const session = req.header('session');
  const { quizid } = req.params;
  const { userEmail } = req.body;

  try {
    const result = adminQuizTransferV2(Number(quizid), session, userEmail);
    saveData();
    res.status(HTTP_STATUS.OK).json(result);
  } catch (error) {
    if (error instanceof BadRequestError) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({ error: error.message });
    } else if (error instanceof UnauthorisedError) {
      res.status(HTTP_STATUS.UNAUTHORISED).json({ error: error.message });
    } else if (error instanceof ForbiddenError) {
      res.status(HTTP_STATUS.FORBIDDEN).json({ error: error.message });
    }
  }
});

app.post('/v1/admin/quiz/:quizid/question', (req: Request, res: Response) => {
  const session = req.header('session');
  const { questionBody } = req.body;
  const { quizid } = req.params;
  const quizId = parseInt(quizid);

  try {
    const result = adminQuizQuestionCreate(quizId, session, questionBody);
    saveData();
    res.status(HTTP_STATUS.OK).json(result);
  } catch (error) {
    if (error instanceof BadRequestError) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({ error: error.message });
    } else if (error instanceof UnauthorisedError) {
      res.status(HTTP_STATUS.UNAUTHORISED).json({ error: error.message });
    } else if (error instanceof ForbiddenError) {
      res.status(HTTP_STATUS.FORBIDDEN).json({ error: error.message });
    }
  }
});

app.post('/v2/admin/quiz/:quizid/question', (req: Request, res: Response) => {
  const session = req.header('session');
  const { questionBody } = req.body;
  const { quizid } = req.params;
  const quizId = parseInt(quizid);

  try {
    const result = adminQuizQuestionCreateV2(quizId, session, questionBody);
    saveData();
    res.status(HTTP_STATUS.OK).json(result);
  } catch (error) {
    if (error instanceof BadRequestError) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({ error: error.message });
    } else if (error instanceof UnauthorisedError) {
      res.status(HTTP_STATUS.UNAUTHORISED).json({ error: error.message });
    } else if (error instanceof ForbiddenError) {
      res.status(HTTP_STATUS.FORBIDDEN).json({ error: error.message });
    }
  }
});

app.put('/v1/admin/quiz/:quizid/name', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const { name } = req.body;
  const session = req.header('session');

  try {
    const result = adminQuizNameUpdate(session, quizId, name);
    saveData();
    res.status(HTTP_STATUS.OK).json(result);
  } catch (error) {
    if (error instanceof BadRequestError) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({ error: error.message });
    } else if (error instanceof UnauthorisedError) {
      res.status(HTTP_STATUS.UNAUTHORISED).json({ error: error.message });
    } else if (error instanceof ForbiddenError) {
      res.status(HTTP_STATUS.FORBIDDEN).json({ error: error.message });
    }
  }
});

app.put('/v1/admin/quiz/:quizid/description', (req: Request, res: Response) => {
  const session = req.header('session');
  const quizId = parseInt(req.params.quizid);
  const { description } = req.body;

  try {
    const result = adminQuizDescriptionUpdate(session, quizId, description);
    saveData();
    res.status(HTTP_STATUS.OK).json(result);
  } catch (error) {
    if (error instanceof BadRequestError) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({ error: error.message });
    } else if (error instanceof UnauthorisedError) {
      res.status(HTTP_STATUS.UNAUTHORISED).json({ error: error.message });
    } else if (error instanceof ForbiddenError) {
      res.status(HTTP_STATUS.FORBIDDEN).json({ error: error.message });
    }
  }
});

// app.get(
//   '/v1/admin/quiz/:quizid/question/suggestion',
//   (req: Request, res: Response) => {
//     const quizId = parseInt(req.params.quizid);
//     const session = req.header('session');

//     try {
//       const result = adminQuizQuestionSuggestion(session, quizId);
//       return res.status(HTTP_STATUS.OK).json(result);
//     } catch (error) {
//       if (error instanceof UnauthorisedError) {
//         res.status(HTTP_STATUS.UNAUTHORISED).json({ error: error.message });
//       } else if (error instanceof ForbiddenError) {
//         res.status(HTTP_STATUS.FORBIDDEN).json({ error: error.message });
//       }
//     }
//   }
// );

app.put(
  '/v1/admin/quiz/:quizid/question/:questionid',
  (req: Request, res: Response) => {
    const session = req.header('session');
    const quizId = parseInt(req.params.quizid);
    const questionId = parseInt(req.params.questionid);
    const { questionBody } = req.body;

    try {
      const result = adminQuizQuestionUpdate(
        quizId,
        questionId,
        session,
        questionBody
      );
      saveData();
      return res.status(HTTP_STATUS.OK).json(result);
    } catch (error) {
      if (error instanceof BadRequestError) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({ error: error.message });
      } else if (error instanceof UnauthorisedError) {
        res.status(HTTP_STATUS.UNAUTHORISED).json({ error: error.message });
      } else if (error instanceof ForbiddenError) {
        res.status(HTTP_STATUS.FORBIDDEN).json({ error: error.message });
      }
    }
  }
);

app.put(
  '/v2/admin/quiz/:quizid/question/:questionid',
  (req: Request, res: Response) => {
    const session = req.header('session');
    const quizId = parseInt(req.params.quizid);
    const questionId = parseInt(req.params.questionid);
    const { questionBody } = req.body;

    try {
      // Use the v2 version of the function
      const result = adminQuizQuestionUpdateV2(
        quizId,
        questionId,
        session,
        questionBody
      );
      saveData();
      return res.status(HTTP_STATUS.OK).json(result);
    } catch (error) {
      if (error instanceof BadRequestError) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({ error: error.message });
      } else if (error instanceof UnauthorisedError) {
        res.status(HTTP_STATUS.UNAUTHORISED).json({ error: error.message });
      } else if (error instanceof ForbiddenError) {
        res.status(HTTP_STATUS.FORBIDDEN).json({ error: error.message });
      }
    }
  }
);

app.delete(
  '/v1/admin/quiz/:quizid/question/:questionid',
  (req: Request, res: Response) => {
    const session = req.header('session');
    const quizId = parseInt(req.params.quizid);
    const questionId = parseInt(req.params.questionid);

    try {
      const result = adminQuizQuestionRemove(quizId, questionId, session);
      saveData();
      return res.status(HTTP_STATUS.OK).json(result);
    } catch (error) {
      if (error instanceof BadRequestError) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({ error: error.message });
      } else if (error instanceof UnauthorisedError) {
        res.status(HTTP_STATUS.UNAUTHORISED).json({ error: error.message });
      } else if (error instanceof ForbiddenError) {
        res.status(HTTP_STATUS.FORBIDDEN).json({ error: error.message });
      }
    }
  }
);

app.delete(
  '/v2/admin/quiz/:quizid/question/:questionid',
  (req: Request, res: Response) => {
    const session = req.header('session');
    const quizId = parseInt(req.params.quizid);
    const questionId = parseInt(req.params.questionid);

    try {
      const result = adminQuizQuestionRemoveV2(quizId, questionId, session);
      saveData();
      return res.status(HTTP_STATUS.OK).json(result);
    } catch (error) {
      if (error instanceof BadRequestError) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({ error: error.message });
      } else if (error instanceof UnauthorisedError) {
        res.status(HTTP_STATUS.UNAUTHORISED).json({ error: error.message });
      } else if (error instanceof ForbiddenError) {
        res.status(HTTP_STATUS.FORBIDDEN).json({ error: error.message });
      }
    }
  }
);

app.put(
  '/v1/admin/quiz/:quizid/question/:questionid/move',
  (req: Request, res: Response) => {
    const { quizid, questionid } = req.params;
    const newPosition = parseInt(req.body.newPosition, 10);
    const session = req.header('session');

    try {
      const result = adminQuizQuestionMove(
        parseInt(quizid, 10),
        parseInt(questionid, 10),
        session,
        newPosition
      );
      saveData();
      res.status(HTTP_STATUS.OK).json(result);
    } catch (error) {
      if (error instanceof BadRequestError) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({ error: error.message });
      } else if (error instanceof UnauthorisedError) {
        res.status(HTTP_STATUS.UNAUTHORISED).json({ error: error.message });
      } else if (error instanceof ForbiddenError) {
        res.status(HTTP_STATUS.FORBIDDEN).json({ error: error.message });
      }
    }
  }
);

app.put('/v1/admin/quiz/:quizid/thumbnail', (req: Request, res: Response) => {
  const { quizid } = req.params;
  const session = req.header('session');
  const { thumbnailUrl } = req.body;

  try {
    const result = adminQuizThumbnailUpdate(
      parseInt(quizid, 10),
      session,
      thumbnailUrl
    );
    saveData();
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof BadRequestError) {
      res.status(400).json({ error: error.message });
    } else if (error instanceof UnauthorisedError) {
      res.status(401).json({ error: error.message });
    } else if (error instanceof ForbiddenError) {
      res.status(403).json({ error: error.message });
    }
  }
});

app.get('/v1/admin/quiz/:quizid/games', (req: Request, res: Response) => {
  const { quizid } = req.params;
  const session = req.header('session');

  try {
    const result = adminQuizGameView(session, parseInt(quizid, 10));
    saveData();
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof UnauthorisedError) {
      res.status(401).json({ error: error.message });
    } else if (error instanceof ForbiddenError) {
      res.status(403).json({ error: error.message });
    }
  }
});

app.post('/v1/admin/quiz/:quizid/game/start', (req: Request, res: Response) => {
  const session = req.header('session');
  const { quizid } = req.params;
  const { autoStartNum } = req.body;

  try {
    const result = adminQuizGameStart(
      Number(quizid),
      session,
      autoStartNum
    );
    saveData();
    res.status(HTTP_STATUS.OK).json(result);
  } catch (error) {
    if (error instanceof BadRequestError) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({ error: error.message });
    } else if (error instanceof UnauthorisedError) {
      res.status(HTTP_STATUS.UNAUTHORISED).json({ error: error.message });
    } else if (error instanceof ForbiddenError) {
      res.status(HTTP_STATUS.FORBIDDEN).json({ error: error.message });
    }
  }
});

app.put('/v1/admin/quiz/:quizid/game/:gameid',
  (req: Request, res: Response) => {
    const session = req.header('session');
    const { quizid, gameid } = req.params;
    const { action } = req.body;

    try {
      const actionEnum = actionParser(action);
      const result = adminQuizGameStateUpdate(
        parseInt(quizid),
        parseInt(gameid),
        session,
        actionEnum
      );
      saveData();
      res.status(200).json(result);
    } catch (error) {
      if (error instanceof BadRequestError) {
        res.status(400).json({ error: error.message });
      } else if (error instanceof UnauthorisedError) {
        res.status(401).json({ error: error.message });
      } else if (error instanceof ForbiddenError) {
        res.status(403).json({ error: error.message });
      }
    }
  }
);

app.get(
  '/v1/admin/quiz/:quizid/game/:gameid',
  (req: Request, res: Response) => {
    const session = req.header('session');
    const { quizid, gameid } = req.params;

    try {
      const result = adminQuizGameStatus(
        parseInt(quizid),
        parseInt(gameid),
        session
      );
      saveData();
      res.status(HTTP_STATUS.OK).json(result);
    } catch (error) {
      if (error instanceof BadRequestError) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({ error: error.message });
      } else if (error instanceof UnauthorisedError) {
        res.status(HTTP_STATUS.UNAUTHORISED).json({ error: error.message });
      } else if (error instanceof ForbiddenError) {
        res.status(HTTP_STATUS.FORBIDDEN).json({ error: error.message });
      }
    }
  }
);

app.get('/v1/admin/quiz/:quizid/game/:gameid/results', (req: Request, res: Response) => {
  const session = req.header('session');
  const { quizid, gameid } = req.params;

  try {
    const result = adminQuizGameFinalResults(parseInt(quizid), parseInt(gameid), session);
    saveData();
    res.status(HTTP_STATUS.OK).json(result);
  } catch (error) {
    if (error instanceof BadRequestError) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({ error: error.message });
    } else if (error instanceof UnauthorisedError) {
      res.status(HTTP_STATUS.UNAUTHORISED).json({ error: error.message });
    } else if (error instanceof ForbiddenError) {
      res.status(HTTP_STATUS.FORBIDDEN).json({ error: error.message });
    }
  }
});

app.post('/v1/player/join', (req: Request, res: Response) => {
  const { gameId, playerName } = req.body;

  try {
    const result = playerJoinGame(parseInt(gameId), playerName);
    saveData();
    res.status(HTTP_STATUS.OK).json(result);
  } catch (error) {
    if (error instanceof BadRequestError) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({ error: error.message });
    }
  }
});

app.get('/v1/player/:playerid', (req: Request, res: Response) => {
  const { playerid } = req.params;
  const body = parseInt(playerid);
  try {
    const result = gamePlayerStatus(body);
    res.status(HTTP_STATUS.OK).json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

app.get('/v1/player/:playerid/question/:questionposition', (req: Request, res: Response) => {
  const { playerid, questionposition } = req.params;
  try {
    const result = gamePlayerQuestionInfo(parseInt(playerid), parseInt(questionposition));
    res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

app.get('/v1/player/:playerid/results', (req: Request, res: Response) => {
  const { playerid } = req.params;

  try {
    const result = gamePlayerFinalResults(parseInt(playerid));
    saveData();
    res.status(HTTP_STATUS.OK).json(result);
  } catch (error) {
    if (error instanceof BadRequestError) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({ error: error.message });
    }
  }
});

app.put('/v1/admin/quiz/:quizid/question/:questionid/upload', upload.single('file'),
  (req: Request, res: Response) => {
    const session = req.header('session');
    const quizId = parseInt(req.params.quizid);
    const questionId = parseInt(req.params.questionid);

    try {
      const fileUrl = `/uploads/${req.file.originalname}`;
      const result = adminQuizQuestionAttachment(
        session,
        quizId,
        questionId,
        fileUrl
      );
      saveData();
      res.status(HTTP_STATUS.OK).json(result);
    } catch (error) {
      if (error instanceof BadRequestError) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({ error: error.message });
      } else if (error instanceof UnauthorisedError) {
        res.status(HTTP_STATUS.UNAUTHORISED).json({ error: error.message });
      } else if (error instanceof ForbiddenError) {
        res.status(HTTP_STATUS.FORBIDDEN).json({ error: error.message });
      }
    }
  });

app.get('/uploads/:filename', async (req: Request, res: Response) => {
  const session = req.header('session');
  const filename = req.params.filename;

  try {
    const fileUrl = `/uploads/${filename}`;

    adminQuizQuestionAttachmentVerification(session, fileUrl);

    const filePath = path.join(process.cwd(), 'uploads', filename);
    await fs.promises.access(filePath, fs.constants.R_OK);

    res.sendFile(filePath);
  } catch (error) {
    if (error instanceof BadRequestError) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({ error: error.message });
    }
  }
});

app.delete('/v1/admin/quiz/:quizid/question/:questionid/upload', (req: Request, res: Response) => {
  const session = req.header('session');
  const quizId = parseInt(req.params.quizid);
  const questionId = parseInt(req.params.questionid);
  const { filename } = req.body;

  if (!filename || typeof filename !== 'string') {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'Filename is required' });
  }

  if (filename.includes('..') || path.isAbsolute(filename)) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({ error: 'Invalid filename' });
  }

  const fileUrl = `/uploads/${filename}`;
  const filePath = path.join(process.cwd(), 'uploads', filename);

  try {
    const result = adminQuizQuestionAttachmentRemove(session, quizId, questionId, fileUrl);
    saveData();

    fs.unlink(filePath, (_) => {});

    res.status(HTTP_STATUS.OK).json(result);
  } catch (error) {
    console.log(error.message);
    if (error instanceof BadRequestError) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({ error: error.message });
    } else if (error instanceof UnauthorisedError) {
      res.status(HTTP_STATUS.UNAUTHORISED).json({ error: error.message });
    } else if (error instanceof ForbiddenError) {
      res.status(HTTP_STATUS.FORBIDDEN).json({ error: error.message });
    }
  }
});

app.get('/v1/admin/quiz/:quizid/export', (req: Request, res: Response) => {
  const session = req.header('session');
  const quizId = parseInt(req.params.quizid);
  const filename = req.query.filename as string || `quiz_${quizId}.json`;

  try {
    const exportData = adminQuizExport(session, quizId);

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/json');
    res.status(HTTP_STATUS.OK).send(exportData);
  } catch (error) {
    if (error instanceof UnauthorisedError) {
      res.status(HTTP_STATUS.UNAUTHORISED).json({ error: error.message });
    } else {
      res.status(HTTP_STATUS.FORBIDDEN).json({ error: error.message });
    }
  }
});

app.post('/v1/admin/quiz/import', upload.single('file'), (req: Request, res: Response) => {
  const session = req.header('session');
  try {
    const fileContent = fs.readFileSync(req.file.path, 'utf8');
    const result = adminQuizImport(session, fileContent);
    saveData();
    res.status(HTTP_STATUS.OK).json(result);
  } catch (error) {
    if (error instanceof UnauthorisedError) {
      res.status(HTTP_STATUS.UNAUTHORISED).json({ error: error.message });
    }
  }
});

app.put('/v1/player/:playerId/question/:questionPosition/answer', (req: Request, res: Response) => {
  const playerId = req.params.playerId;
  const questionPosition = req.params.questionPosition;
  const { answerIds } = req.body;

  try {
    const result = playerAnswerSubmission(
      answerIds,
      parseInt(playerId),
      parseInt(questionPosition)
    );
    saveData();
    res.status(200).json(result);
  } catch (error) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({ error: error.message });
  }
});

app.get(
  '/v1/player/:playerId/question/:questionPosition/results', (req: Request, res: Response) => {
    const playerId = req.params.playerId;
    const questionPosition = req.params.questionPosition;
    try {
      const result = playerQuestionResults(
        parseInt(playerId),
        parseInt(questionPosition)
      );
      saveData();
      res.status(200).json(result);
    } catch (error) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({ error: error.message });
    }
  });

app.get('/v1/game/:gameid/player/:playerid/hint', (req: Request, res: Response) => {
  const gameId = parseInt(req.params.gameid);
  const playerId = parseInt(req.params.playerid);

  try {
    const result = gamePlayerQuestionHint(playerId, gameId);
    return res.status(200).json(result);
  } catch (err) {
    if (err instanceof BadRequestError) {
      return res.status(400).json({ error: err.message });
    } else if (err instanceof ForbiddenError) {
      return res.status(403).json({ error: err.message });
    }
  }
});

// ====================================================================
//  ================= WORK IS DONE ABOVE THIS LINE ===================
// ====================================================================

app.use((req: Request, res: Response) => {
  const error = `
    Route not found - This could be because:
      0. You have defined routes below (not above) this middleware in server.ts
      1. You have not implemented the route ${req.method} ${req.path}
      2. There is a typo in either your test or server, e.g. /posts/list in one
         and, incorrectly, /post/list in the other
      3. You are using ts-node (instead of ts-node-dev) to start your server and
         have forgotten to manually restart to load the new changes
      4. You've forgotten a leading slash (/), e.g. you have posts/list instead
         of /posts/list in your server.ts or test file
  `;
  res.status(HTTP_STATUS.NOT_FOUND).json({ error });
});

// start server
export const server = app.listen(PORT, HOST, () => {
  // DO NOT CHANGE THIS LINE
  console.log(`⚡️ Server started on port ${PORT} at ${HOST}`);
});

// For coverage, handle Ctrl+C gracefully
process.on('SIGINT', () => {
  server.close(() => {
    console.log('Shutting down server gracefully.');
    process.exit();
  });
});
