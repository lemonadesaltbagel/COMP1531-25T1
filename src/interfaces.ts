import {
  GameState,
  GameMetadata,
  AnswerOption,
} from './dataStore';

export enum Action {
  NEXT_QUESTION,
  SKIP_COUNTDOWN,
  GO_TO_ANSWER,
  GO_TO_FINAL_RESULTS,
  END,
}

export interface GameStatus {
  state: GameState,
  atQuestion: number,
  players: string[],
  metadata: GameMetadata,
}

export interface GameFinalResults {
  usersRankedByScore: PlayerResults[];
  questionResults: QuestionResults[];
}

export interface PlayerResults {
  playerName: string;
  score: number;
  rank?: number;
}

export interface QuestionResults {
  questionId: number;
  playersCorrect: string[];
  averageAnswerTime: number;
  percentCorrect: number;
}

export interface PlayerStatus {
  state: GameState;
  numQuestions: number;
  atQuestion: number;
}

export interface AnswerInfoOption {
  answerId: number;
  answer: string;
  colour: string;
}

export interface UserDetails {
  userId: number;
  name: string;
  email: string;
  numSuccessfulLogins: number;
  numFailedPasswordsSinceLastLogin: number;
}

export interface QuestionCreate {
  question: string;
  timeLimit: number;
  points: number;
  answerOptions: AnswerOptionCreate[];
}

export interface QuestionCreateV2 {
  question: string;
  timeLimit: number;
  points: number;
  answerOptions: AnswerOptionCreate[];
  thumbnailUrl: string;
}

export interface AnswerOptionCreate {
  answer: string;
  correct: boolean;
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

export interface QuestionInfo {
  questionId: number;
  question: string;
  timeLimit: number;
  points: number;
  answerOptions: AnswerOption[];
}

export interface QuestionInfoV2 {
  questionId: number;
  question: string;
  timeLimit: number;
  thumbnailUrl?: string;
  points: number;
  answerOptions: AnswerOption[];
  fileAttachments?: string[];
}

export interface QuizzesFiltered {
  quizId: number;
  name: string;
}

export interface QuestionUpdate {
  question: string;
  timeLimit: number;
  points: number;
  answerOptions: AnswerOptionCreate[];
}

export interface AnswerOptionInfo {
  answerId: number;
  answer: string;
  colour: string;
  correct: boolean;
}

export interface PlayerQuestionInfo {
  questionId: number;
  question: string;
  timeLimit: number;
  thumbnailUrl?: string;
  points: number;
  answerOptions: PlayerAnswerInfo[];
}

export interface PlayerAnswerInfo {
  answerId: number;
  answer: string;
  colour: string;
}
