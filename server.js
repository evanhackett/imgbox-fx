const express = require('express')
const app = express()
const morgan = require('morgan')
const multer  = require('multer')
const upload = multer({ dest: 'uploads/' })
const port = 3000

app.use(express.static('public'))
app.use(morgan('dev'))

app.post('/images', upload.single('pic'), function (req, res) {
  console.log('req.file:', req.file)
  res.send('POST request to /images')
})


app.listen(port, () => console.log(`App listening at http://localhost:${port}`))
