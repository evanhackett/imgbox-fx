const getFileName = path => {
  const n = path.lastIndexOf('/')
  return path.substring(n + 1)
}

module.exports = getFileName
