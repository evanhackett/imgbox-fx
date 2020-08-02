const express = require('express')
const app = express()
const morgan = require('morgan')
const multer  = require('multer')
const upload = multer({ dest: 'uploads/' })
const port = 3000
const gm = require('gm')
const fs = require('fs')
const db = require('rocket-store')

// make sure the transformed dir exists before trying to write to it.
// gm throws error when writing to a folder that doesn't exist.
const dir = './transformed'
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir)
}

const connectDb = async () => {
  await db.options({ data_storage_area : './db' })
  console.log('Connected to database.')
}

app.use(express.static('public'))
app.use(express.static('transformed'))
app.use(morgan('dev'))
app.set('views', './views')
app.set('view engine', 'pug')

const handleError = (err, res) => {
  console.error('got an error:', err)
  res.status(500).send('ERROR')
}

app.post('/images', upload.single('pic'), (req, res) => {
  const uploadedPath = req.file.path
  const fileName = getFileName(uploadedPath)

  transformImage(uploadedPath, fileName, async (err) => {
    if (err) return handleError(err, res)

    const doc = {
      fileName: fileName,
      created: new Date(),
      title: req.body.title
    }

    const result = await db.post('images', fileName, doc)
      
    return res.redirect(`/images/${fileName}`)
  })
})

app.get('/images/:id', async (req, res) => {
  const result = await db.get('images', req.params.id) 
  // todo: hand file not found.
  const doc = result.result[0]
  
  res.render('image', {
    src: `../${req.params.id}`,
    title: doc.title,
    created: new Date(doc.created.toString())
  })
})

app.get('/images', async (req, res) => {
  const result = await db.get('images', '*')
  const docs = result.result

  res.render('all-images', {
    images: docs.map(doc => ({
      url: `images/${doc.fileName}`,
      title: doc.title,
      created: new Date(doc.created.toString())
    }))
  })
})

const transformImage = (pathToImage, fileName, cb) => {
  gm(pathToImage)
    .rotate('green', 20)
    .blur(7, 3)
    .edge(3)
    .write(`transformed/${fileName}`, cb)
}

const getFileName = path => {
  const n = path.lastIndexOf('/')
  return path.substring(n + 1)
}


app.listen(port, async () => {
  await connectDb()
  console.log(`App listening at http://localhost:${port}`)
})

