const generate = require('./generate')
const debug = require('debug')
const { Matrix } = require('ml-matrix')
const [{ sentences }] = require('speech-samples/index.json')
const fs = require('fs')
require('console.table')

main(...process.argv.slice(2)).catch(err => console.log({ err }))

// returns an array of normalized values describing a syllable, feature array
function extract(syllable) {
  // console.log('extract')
  
  // This is the logistic function, "A sigmoid function".
  // Scaled the input to a result between 0 and 1
  function squash(x) {
    return 1 / (1 + Math.E**(-x))
  }

  const { coefficients, max, min } = syllable
  return [...coefficients, max - min].map(squash)
}

// returns syllable data generated from sentence frames and tags
function refine(sentences, generate) {
  console.log('refine')
  return sentences.reduce((syllables, sentence, i) => {
    return syllables.concat(generate(sentence).syllables.map(syllable => ({ ...syllable, sentence: i })))
  }, [])
}

// trains a given model with the given syllables
function train(model, syllables) {
  console.log('train')
  let x = syllables.map(extract)
  let y = syllables.map(({ tone }) => tone)

  // const data = model.name === 'LogisticRegression' ? [
  //   new Matrix(x),
  //   Matrix.columnVector(y)
  // ] : [x, y]

  const data = [new Matrix(x), Matrix.columnVector(y)]

  model.train(...data)
  
  return model
}

// Shows useful information about how well the model predicted the values
function analyse(actual, predicted) {
  console.log('analyse')
  return actual.reduce((samples, tone, i) => {
    samples[tone -1][predicted[i] -1]++;
    return samples
  }, [...new Array(5)].map(() => new Array(5).fill(0)))
}

// start and end define which portion of the sentences to analyse
async function main(type, start, end = undefined) {

  const models = {
    SVM: await require('libsvm-js'),
    LOG: require('ml-logistic-regression'),
    FNN: require('ml-fnn'),
  }

  const options = {
  
    regression: {
      order: 4,
      type: 'robust',
    },
  
    LOG: {
      numSteps: 1000,
      learningRate: 5e-3,
    },
  
    SVM: {
      kernel: 2, // [ LINEAR, POLYNOMIAL, RGF, SIGMOID, PRECOMPUTED ]
      type: 0,   // [ C_SVC, NU_SVC, ONE_CLASS, EPSILON_SVR, NU_SVR ]
      gamma: 1,  // RBF kernel gamma parameter
      cost: 1,   // C_SVC cost parameter
      quiet: false,
    },
  
    FNN: {
      hiddenLayers: [100],
      iterations: 50,
      learningRate: 0.01, // Also known as epsilon
      reglarization: 0.001,
      activation: 'logistic', // 'tanh'(default), 'identity', 'logistic', 'arctan', 'softsign', 'relu', 'softplus', 'bent', 'sinusoid', 'sinc', 'gaussian'). (single-parametric options: 'parametric-relu', 'exponential-relu', 'soft-exponential').
      activationParam: 1,
    }
  
  }
  const syllables = {
    train: refine(sentences.slice(0, start), generate(options.regression)),
    test: refine(sentences.slice(start, end), generate(options.regression))
  }
  
  const Model = models[type];
  // console.log({ Model }, syllables.train)
  let model = train(new Model(options[type]), syllables.train)
  console.log('model')

  let test = syllables.test
    .map(({ tone }) => tone)
    .filter(tone => tone !== 4)
  console.log('test')
  
  let extracted = syllables.test.map(extract);

  console.log('extracted')
  let predict = model.predict(new Matrix(extracted));
  console.log('predict')
  const analysis = analyse(test, predict)
  console.log(analysis)
  console.table(['Actual', 'Tone 1', 'Tone 2', 'Tone 3', 'Tone 4', 'Tone 5'], analysis.map((list, key) => [`Tone ${key + 1}`, ...list]))
  return analysis
}
