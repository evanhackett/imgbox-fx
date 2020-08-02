const request = require('supertest')
const test = require('tape')
const db = require('rocket-store')

const config = {
  uploadDir: 'tests/fixtures/uploads',
  transformDir: 'tests/fixtures/transformed',
  db: db
}

const app = require('../app')(config)

test('GET / should respond with 200', t => {
  request(app)
    .get('/')
    .expect(200, t.end)
})
