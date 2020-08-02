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

  transformImage(req.file.path, function (err) {
    if (err) { 
      console.log(err)
      return res.send('ERROR')
    }

    return res.send('POST to /images success!')
  })
})

app.get('/images/:id', function (req, res) {
  res.render('images', {
    src: `../${req.params.id}`,
    title: `image ${req.params.id}`
  })
})

function transformImage(pathToImage, cb) {
  const fileName = getFileName(pathToImage)

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
