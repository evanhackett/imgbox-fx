const app = require('./app')
const db = require('rocket-store')
const port = process.env.PORT || 3000

const connectDb = async () => {
  await db.options({ data_storage_area : './db' })
  console.log('Connected to database.')
}

const main = async () => {
  await connectDb()

  const config = {
    uploadDir: 'uploads',
    transformDir: 'transformed',
    db: db
  }

  app(config).listen(port, err => {
    if (err) return console.error(err)
    console.log(`App listening at http://localhost:${port}`)
  })
}

main()
