const { Matrix } = require('ml-matrix')
const [{ sentences }] = require('speech-samples/index.json')
const extract = require('./extract')
const debug = require('debug')
const fs = require('fs')

module.exports = (syllables, { save, tone, name, ...options }) => {
  const start = Date.now()
  const log = debug('model')
  let x = syllables.map(extract)
  let y = syllables.map(({ tone }) => tone)
  const data =  name === 'LogisticRegression' ? [
    new Matrix(x),
    Matrix.columnVector(y)
  ] : [x, y]

  return require('libsvm-js').then(SVM => { // https://github.com/mljs/libsvm
    const models = {
      LogisticRegression: require('ml-logistic-regression'),
      FNN: require('ml-fnn'),
      SVM,
    };

    let model = new models[name](options)

    model.train(...data)
  
    log({ model })
    model.name = name
    model.tone = tone
    // model = { type, tone, ...model }
    save && fs.writeFileSync(`./${save}.json`, JSON.stringify(model, null, 2))
  
    log(Date.now() - start)
    return model
  }, log);
}


