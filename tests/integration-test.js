const request = require('supertest')
const test = require('tape')
const db = require('rocket-store')
const getFileName = require('../utils/getFileName')
const fs = require('fs')

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

let id;
let doc;

test('POST /images should respond with 302 and create image document', t => {
  request(app)
    .post('/images')
    .field('title', 'my fractal')
    .attach('pic', 'tests/fixtures/fractal.png')
    .expect(302)
    .end(async (err, res) => {
      if (err) return t.end(err)
      id = getFileName(res.text) // assign to global for future tests
      const result = await db.get('images', id)
      doc = result.result[0] // assign to global for future tests
      t.equals(doc.title, 'my fractal')
      t.equals((new Date(doc.created)).getFullYear() === (new Date()).getFullYear() , true)

      // also need to check if image file is saved to transformed dir
      const files = fs.readdirSync(config.transformDir)
      t.equals(files.includes(id), true)
      t.end()
    })
})

test('GET /images/<valid-id> should respond with image view', t => {
  request(app)
    .get(`/images/${id}`)
    .expect(200)
    .end((err, res) => {
      if (err) return t.end(err)
      t.equals(res.text.includes(`<img src="../${id}"`), true)
      t.end()
    })
})

test('GET /images should respond with all-images view', t => {
  request(app)
    .get('/images')
    .expect(200)
    .end((err, res) => {
      if (err) return t.end(err)
      t.equals(res.text.includes(`<li><a href="images/${id}">${doc.title}`), true)
      t.end()
    })
})
