const { Matrix } = require('ml-matrix')
const debug = require('debug')
const extract = require('./extract')
const log = debug('predict')
module.exports = ({  name, tone, ...model }) => syllables => {
  log({ type, tone, model })
  // return models[type].load(model).predict(syllables.map(extract))
  return model.predict(syllables.map(extract))
}

