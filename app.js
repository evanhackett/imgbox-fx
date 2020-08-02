module.exports = function (cfg) {
  const express = require('express')
  const app = express()
  const morgan = require('morgan')
  const multer  = require('multer')
  const upload = multer({ dest: cfg.uploadDir })
  const gm = require('gm')
  const fs = require('fs')
  const db = cfg.db
  const getFileName = require('./utils/getFileName')

  app.use(express.static('public'))
  app.use(express.static(cfg.transformDir))
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
      .write(`${cfg.transformDir}/${fileName}`, cb)
  }

  return app
}
