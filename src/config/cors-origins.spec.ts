import { DEFAULT_CORS_ORIGIN, parseCorsOrigins } from './cors-origins';

describe('parseCorsOrigins', () => {
  it('uses the Vite origin when nothing is configured', () => {
    expect(parseCorsOrigins(undefined)).toEqual([DEFAULT_CORS_ORIGIN]);
  });

  it('uses the Vite origin when the variable is empty, as in "CORS_ORIGIN=" of a .env file', () => {
    expect(parseCorsOrigins('')).toEqual([DEFAULT_CORS_ORIGIN]);
    expect(parseCorsOrigins('   ')).toEqual([DEFAULT_CORS_ORIGIN]);
    expect(parseCorsOrigins(' , ,')).toEqual([DEFAULT_CORS_ORIGIN]);
  });

  it('keeps a plain origin as it is', () => {
    expect(parseCorsOrigins('http://localhost:5173')).toEqual([
      'http://localhost:5173',
    ]);
  });

  it('removes a trailing slash, which a browser never sends in the Origin header', () => {
    expect(parseCorsOrigins('http://localhost:5173/')).toEqual([
      'http://localhost:5173',
    ]);
  });

  it('keeps only the origin when a path is written by mistake', () => {
    expect(parseCorsOrigins('http://localhost:5173/login')).toEqual([
      'http://localhost:5173',
    ]);
  });

  it('removes spaces around the value, which are easy to leave in a .env file', () => {
    expect(parseCorsOrigins('  http://localhost:5173  ')).toEqual([
      'http://localhost:5173',
    ]);
  });

  it('writes the scheme and the host in lowercase, like the browser does', () => {
    expect(parseCorsOrigins('HTTP://LocalHost:5173')).toEqual([
      'http://localhost:5173',
    ]);
  });

  it('drops the default port, which the browser leaves out of the Origin header', () => {
    expect(parseCorsOrigins('https://app.example.com:443')).toEqual([
      'https://app.example.com',
    ]);
  });

  it('accepts several origins separated by commas', () => {
    expect(parseCorsOrigins('http://a.test , http://b.test/')).toEqual([
      'http://a.test',
      'http://b.test',
    ]);
  });

  it('does not repeat an origin written in two ways', () => {
    expect(parseCorsOrigins('http://a.test,http://a.test/')).toEqual([
      'http://a.test',
    ]);
  });

  it('keeps a value that is not a URL as it is, so that it never matches by accident', () => {
    expect(parseCorsOrigins('not a url')).toEqual(['not a url']);
  });
});
