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

test('GET /images/<invalid-id> should respond with 404', t => {
  request(app)
    .get('/images/this-should-404')
    .expect(404)
    .end((err, res) => {
      if (err) return t.end(err)
      console.log(res.text)
      t.end()
    })
})

test('POST /images should respond with 400 if image is over 10MB', t => {
  request(app)
    .post('/images')
    .field('title', 'this is a big file')
    .attach('pic', 'tests/fixtures/large-file.jpg')
    .expect(400)
    .end((err, res) => {
      if (err) return t.end(err)
      t.equal(res.text.includes('Image file should be less than 10MB'), true)
      t.end()
    })
})

test('POST /images should respond with 400 if title field is invalid', t => {
  t.plan(3)

  // no title field at all
  request(app)
    .post('/images')
    .attach('pic', 'tests/fixtures/fractal.png')
    .expect(400)
    .end((err, res) => {
      if (err) return t.end(err)
      t.equal(res.text.includes('Title field should be between 1 and 100 characters'), true)
    })

  // title is empty string
  request(app)
    .post('/images')
    .field('title', '')
    .attach('pic', 'tests/fixtures/fractal.png')
    .expect(400)
    .end((err, res) => {
      if (err) return t.end(err)
      t.equal(res.text.includes('Title field should be between 1 and 100 characters'), true)
    })

  // title is greater than 100 chars
  const title = Array.from({length: 102}).join('a')
  request(app)
    .post('/images')
    .field('title', title)
    .attach('pic', 'tests/fixtures/fractal.png')
    .expect(400)
    .end((err, res) => {
      if (err) return t.end(err)
      t.equal(res.text.includes('Title field should be between 1 and 100 characters'), true)
    })
})

test('POST /images should respond with 400 if no image is attached', t => {
  request(app)
    .post('/images')
    .field('title', 'test')
    .expect(400)
    .end((err, res) => {
      if (err) return t.end(err)
      t.equal(res.text.includes('Image file must be selected'), true)
      t.end()
    })
})

test('POST /images should respond with 400 if file is not an image', t => {
  request(app)
    .post('/images')
    .field('title', 'test')
    .attach('pic', 'tests/fixtures/not-an-image.txt')
    .expect(400)
    .end((err, res) => {
      if (err) return t.end(err)
      t.equal(res.text.includes('The chosen file must be a valid image'), true)
      t.end()
    })
})

