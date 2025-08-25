import fs from 'fs';
import path from 'path';

// Define the path to the JSON file
const DATA_FILE_PATH = path.join(__dirname, 'data.json');

// Define the structure of your data
export interface DataStore {
  users: User[];
  quizzes: Quiz[];
  sessions: Record<string, number>;
  games: Game[];
}

export interface User {
  userId: number;
  nameFirst: string;
  nameLast: string;
  email: string;
  password: string[];
  numSuccessfulLogins: number;
  numFailedPasswordsSinceLastLogin: number;
  quizzesOwned: number[];
  sessions: string[];
  uploads?: string[];
}

export interface Quiz {
  quizId: number;
  userId: number;
  name: string;
  description: string;
  timeCreated: number;
  timeLastEdited: number;
  questions: Question[];
  timeLimit: number;
  thumbnailUrl: string;
  games: Game[];
}

export interface Question {
  questionId: number;
  question: string;
  timeLimit: number;
  thumbnailUrl?: string;
  points: number;
  answerOptions: AnswerOption[];
  fileAttachments?: string[];
  timeOpened?: number;
}

export interface AnswerOption {
  answerId: number;
  answer: string;
  colour: string;
  correct: boolean;
}

export interface Game {
  gameId: number,
  state: GameState,
  atQuestion: number,
  metadata: GameMetadata;
  players: Player[];
  questionResult: QuestionResult[];
  autoStartNum: number;
}

export interface QuestionResult {
  questionId: number;
  playersCorrect: string[];
  averageAnswerTime: number;
  percentCorrect: number;
}

export enum GameState {
  LOBBY = 'LOBBY',
  QUESTION_COUNTDOWN = 'QUESTION_COUNTDOWN',
  QUESTION_OPEN = 'QUESTION_OPEN',
  QUESTION_CLOSE = 'QUESTION_CLOSE',
  ANSWER_SHOW = 'ANSWER_SHOW',
  FINAL_RESULTS = 'FINAL_RESULTS',
  END = 'END',
}

export interface GameMetadata {
  quizId: number;
  name: string;
  timeCreated: number;
  timeLastEdited: number;
  description: string;
  numQuestions: number;
  questions: Question[],
  timeLimit: number;
  thumbnailUrl: string;
}

export interface Player {
  name: string;
  playerId: number;
  answers: PlayerAnswer[];
  score: number;
  questionPosition: number;
}

export interface PlayerAnswer {
  questionId: number;
  answerIds: number[];
  timeTaken: number;
}

/// /////////////////////////////////////////////////////////////////////////////////
const defaultData: DataStore = { users: [], quizzes: [], sessions: {}, games: [] };
let dataStore: DataStore = defaultData;

export function loadData(): void {
  if (fs.existsSync(DATA_FILE_PATH)) {
    const fileData = fs.readFileSync(DATA_FILE_PATH, 'utf8');
    dataStore = JSON.parse(fileData) || defaultData;
  }
}

export function getData(): DataStore {
  return dataStore;
}

export function setData(data: DataStore): void {
  dataStore = data;
}

export function saveData(): void {
  fs.writeFileSync(
    DATA_FILE_PATH,
    JSON.stringify(dataStore, null, 2),
    'utf8'
  );
}

process.on('SIGINT', () => {
  console.log('Saving data before shutdown...');
  saveData();
  process.exit();
});

loadData();
