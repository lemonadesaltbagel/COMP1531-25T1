import { getData, setData } from './dataStore';

export function clear() {
  const dataStore = getData();
  dataStore.users = [];
  dataStore.quizzes = [];
  dataStore.sessions = {};
  dataStore.games = [];

  // Persist the reset data back to the file or persistent storage
  setData(dataStore);
  return {}; // Return empty object as expected
}
