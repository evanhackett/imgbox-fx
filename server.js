const express = require('express')
const app = express()
const morgan = require('morgan')
const multer  = require('multer')
const upload = multer({ dest: 'uploads/' })
const port = 3000
const gm = require('gm')

app.use(express.static('public'))
app.use(morgan('dev'))

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

function transformImage(pathToImage, cb) {
  gm(pathToImage)
    .rotate('green', 20)
    .blur(7, 3)
    .edge(3)
    .write(`${pathToImage}-transformed`, cb)
}


app.listen(port, () => console.log(`App listening at http://localhost:${port}`))
