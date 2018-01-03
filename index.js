const LogisticRegression = require('ml-logistic-regression');
const { Matrix } = require('ml-matrix');
const generate = require('./src/generator')(3);
const syllables = [...new Array(10).keys()]
  .reduce((syllables, sentence) => syllables.concat(generate(0, sentence).syllables), [])

// let model = require('./src/model');

model = train(model)(syllables)

function train(model = new LogisticRegression({
  numSteps: 1000,
  learningRate: 5e-3,
})) {
  // https://github.com/mljs/regression
  // https://www.npmjs.com/package/js-regression
  // Still needs to be written
  // Will probably use one of the libraries above to train MLA based on curve coefficients
  
  return syllables => {
    const X = new Matrix(syllables.map(({ coefficients }) => coefficients))
    const Y = Matrix.columnVector(syllables.map(({ tone }) => tone))
    model.train(X, Y)
    return model
  }
}

fs.writeFileSync('./src/model.json', JSON.stringify(model.toJSON(), null, 2))

// DEBUG=generator node index [, speaker, sentence]




