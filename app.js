module.exports = function (cfg) {
  const express = require('express')
  const app = express()
  const morgan = require('morgan')
  const multer  = require('multer')
  const gm = require('gm')
  const fs = require('fs')
  const db = cfg.db
  const getFileName = require('./utils/getFileName')
  const asyncHandler = require('./utils/asyncHandler')

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

  const error400 = (msg, res) => res.status(400).render('error', {msg})

  app.post('/images', upload.single('pic'), (req, res, next) => {
    if (!req.body.title || req.body.title.length < 1) return error400('Title field should be between 1 and 100 characters.', res)
    if (!req.file) return error400('Image file must be selected', res)
    if (!req.file.mimetype.includes('image')) return error400('The chosen file must be a valid image format', res)

    const uploadedPath = req.file.path
    const fileName = getFileName(uploadedPath)

    transformImage(uploadedPath, fileName, async (err) => {
      try {
        if (err) return error400('Error attempting to transform image. The chosen file must be a valid image format', res)

        const doc = {
          fileName: fileName,
          created: new Date(),
          title: req.body.title
        }

        const result = await db.post('images', fileName, doc)
          
        return res.redirect(`/images/${fileName}`)

      } catch (err) {
        return next(err)
      }
    })
  })

  app.get('/images/:id', asyncHandler(async (req, res, next) => {
    const result = await db.get('images', req.params.id) 
    
    if (!result.count) return res.status(404).render('error', {msg: `image ${req.params.id} not found`})

    const doc = result.result[0]
    
    res.render('image', {
      src: `../${req.params.id}`,
      title: doc.title,
      created: new Date(doc.created.toString())
    })
  }))

  app.get('/images', asyncHandler(async (req, res, next) => {
    const result = await db.get('images', '*')
    const docs = result.result

    res.render('all-images', {
      images: docs.map(doc => ({
        url: `images/${doc.fileName}`,
        title: doc.title,
        created: new Date(doc.created.toString())
      }))
    })
  }))

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
      if (err.code === 'LIMIT_FILE_SIZE') return error400('File is too large. Image file should be less than 10MB.', res)
      if (err.code === 'LIMIT_FIELD_VALUE') return error400('Title field should be between 1 and 100 characters.', res)
      
      console.error(err)
    }

    console.error(err.stack)
    res.status(500).render('error', {msg: 'Unexpected Error occurred.'})
  })

  return app
}
