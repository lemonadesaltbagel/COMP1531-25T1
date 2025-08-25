export interface UserDetails {
  userId: number;
  name: string;
  email: string;
  numSuccessfulLogins: number;
  numFailedPasswordsSinceLastLogin: number;
}

export interface QuizInfo {
  quizId: number;
  name: string;
  timeCreated: number;
  timeLastEdited: number;
  description: string;
  numQuestions: number;
  questions: QuestionInfo[];
  timeLimit: number;
}

export interface QuizInfoV2 {
  quizId: number;
  name: string;
  timeCreated: number;
  timeLastEdited: number;
  description: string;
  numQuestions: number;
  questions: QuestionInfoV2[];
  timeLimit: number;
  thumbnailUrl: string;
}

interface QuestionInfo {
  questionId: number;
  question: string;
  timeLimit: number;
  points: number;
  answerOptions: AnswerOptionInfo[];
}

interface AnswerOptionInfo {
  answerId: number;
  answer: string;
  colour: string;
  correct: boolean;
}

export interface QuestionCreate {
  question: string;
  timeLimit: number;
  points: number;
  answerOptions: AnswerOptionCreate[];
}

interface AnswerOptionCreate {
  answer: string;
  correct: boolean;
}

export interface QuestionCreateV2 {
  question: string;
  timeLimit: number;
  points: number;
  answerOptions: AnswerOptionCreate[];
  thumbnailUrl?: string;
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

export enum Action {
  NEXT_QUESTION,
  SKIP_COUNTDOWN,
  GO_TO_ANSWER,
  GO_TO_FINAL_RESULTS,
  END,
}

export interface GameStatus {
  state: GameState;
  atQuestion: number;
  players: string[];
  metadata: Metadata;
}

interface Metadata {
  quizId: number;
  name: string;
  timeCreated: number;
  timeLastEdited: number;
  description: string;
  numQuestions: number;
  questions: Question[];
  timeLimit: number;
  thumbnailUrl: string;
}

interface Question {
  questionId: number;
  question: string;
  timeLimit: number;
  thumbnailUrl: string;
  points: number;
  answerOptions: AnswerOption[];
}

interface AnswerOption {
  answerId: number;
  answer: string;
  colour: string;
  correct: boolean;
}

export interface GameFinalResults {
  usersRankedByScore: PlayerResults[];
  questionResults: QuestionResults[];
}

interface PlayerResults {
  playerName: string;
  score: number;
  rank: number;
}

interface QuestionResults {
  questionId: number;
  playersCorrect: string[];
  averageAnswerTime: number;
  percentCorrect: number;
}

export interface QuestionResultInfo {
  questionId: number,
  playersCorrect: string[],
  averageAnswerTime: number,
  percentCorrect: number,
}

export interface QuestionInfoV2 {
  questionId: number;
  question: string;
  timeLimit: number;
  thumbnailUrl?: string;
  points: number;
  answerOptions: AnswerOptionInfo[];
  fileAttachments?: string[];
}
