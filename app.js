module.exports = function (cfg) {
  const express = require('express')
  const app = express()
  const morgan = require('morgan')
  const multer  = require('multer')
  const gm = require('gm')
  const fs = require('fs')
  const db = cfg.db
  const getFileName = require('./utils/getFileName')


  const upload = multer({
    dest: cfg.uploadDir,
    limits: {
      fileSize: 10485760, // 10MB
      fieldSize: 100,
      fieldNameSize: 100,
      fields: 1
    }
  })

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
    if (!req.body.title || req.body.title.length < 1) {
      return res.status(400).send('Title field should be between 1 and 100 characters.')
    }

    if (!req.file) {
      return res.status(400).send('Image file must be selected')
    }

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
    
    if (!result.count) {
      return res.status(404).send(`image ${req.params.id} not found`)
    }

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

  // error-handling middleware has to be last, after app.use() and routes calls
  app.use(function (err, req, res, next) {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).send('File is too large. Image file should be less than 10MB.')
      }
      if (err.code === 'LIMIT_FIELD_VALUE') {
        return res.status(400).send('Title field should be between 1 and 100 characters.')
      }
      
      console.log(err)
    }

    console.error(err.stack)
    res.status(500).send('Unexpected Error occurred.')
  })


  return app
}
