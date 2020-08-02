const express = require('express')
const app = express()
const morgan = require('morgan')
const multer  = require('multer')
const upload = multer({ dest: 'uploads/' })
const port = 3000
const gm = require('gm')

const fs = require('fs');

// make sure the transformed dir exists before trying to write to it.
// gm throws error when writing to a folder that doesn't exist.
const dir = './transformed'

if (!fs.existsSync(dir)){
    fs.mkdirSync(dir)
}

app.use(express.static('public'))
app.use(express.static('transformed'))
app.use(morgan('dev'))

app.set('views', './views')
app.set('view engine', 'pug')

app.post('/images', upload.single('pic'), function (req, res) {
  console.log('req.file:', req.file)

  const uploadedPath = req.file.path
  const fileName = getFileName(uploadedPath)

  transformImage(uploadedPath, fileName, function (err) {
    if (err) { 
      console.log(err)
      return res.send('ERROR')
    }

    return res.redirect(`/images/${fileName}`)
  })
})

app.get('/images/:id', function (req, res) {
  res.render('image', {
    src: `../${req.params.id}`,
    title: `image ${req.params.id}`
  })
})

app.get('/images', function (req, res) {
  fs.readdir('./transformed', (err, files) => {
    if (err) {
      console.log(err)
      return res.status(500).send('An error occurred while attempting to get images.')
    }

    res.render('all-images', {
      images: files.map(file => ({url: `images/${file}`}))
    })
  })
})

function transformImage(pathToImage, fileName, cb) {

  gm(pathToImage)
    .rotate('green', 20)
    .blur(7, 3)
    .edge(3)
    .write(`transformed/${fileName}`, cb)
}

function getFileName(path) {
  const n = path.lastIndexOf('/')
  return path.substring(n + 1)
}


app.listen(port, () => console.log(`App listening at http://localhost:${port}`))
