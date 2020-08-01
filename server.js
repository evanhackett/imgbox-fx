const express = require('express')
const app = express()
const morgan = require('morgan')
const multer  = require('multer')
const upload = multer({ dest: 'uploads/' })
const port = 3000
const gm = require('gm')

app.use(express.static('public'))
app.use(express.static('uploads'))
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
  res.render('images', { src: `../${req.params.id}`, title: `image ${req.params.id}` })
})

function transformImage(pathToImage, cb) {
  gm(pathToImage)
    .rotate('green', 20)
    .blur(7, 3)
    .edge(3)
    .write(`${pathToImage}-transformed`, cb)
}


app.listen(port, () => console.log(`App listening at http://localhost:${port}`))
