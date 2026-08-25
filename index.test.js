const request = require('supertest');
const app = require('./index');

describe('API de pesquisa cientifica', () => {
  test('GET / deve responder com status 200', async () => {
    const resposta = await request(app).get('/');
    expect(resposta.status).toBe(200);
  });

  test('GET /buscar sem tema deve responder com status 400', async () => {
    const resposta = await request(app).get('/buscar');
    expect(resposta.status).toBe(400);
  });

  test('GET /perfil sem token deve responder com status 401', async () => {
    const resposta = await request(app).get('/perfil');
    expect(resposta.status).toBe(401);
  });

  test('POST /login com dados invalidos deve responder com status 400', async () => {
    const resposta = await request(app).post('/login').send({});
    expect(resposta.status).toBe(400);
  });
});