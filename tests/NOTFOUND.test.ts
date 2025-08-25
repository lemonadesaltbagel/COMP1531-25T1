import request from 'sync-request-curl';
import config from '../src/config.json';

const PORT: number = parseInt(process.env.PORT || config.port);
const HOST: string = process.env.IP || '127.0.0.1';
const SERVER_URL = `http://${HOST}:${PORT}`;
const TIMEOUT_MS = 10000;

describe('Catch-all 404 route', () => {
  test('returns 404 with detailed error message for unknown route', () => {
    const res = request(
      'GET',
      `${SERVER_URL}/nonexistent-endpoint`,
      {
        timeout: TIMEOUT_MS,
      }
    );
    const body = JSON.parse(res.body.toString());

    expect(body).toHaveProperty('error');
    expect(res.statusCode).toBe(404);
  });
});
