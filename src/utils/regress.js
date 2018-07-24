const debug = require('debug')
const PolynomialRegression = require('ml-regression-robust-polynomial')
const RobustPolynomialRegression = require('ml-regression-robust-polynomial') // https://link.springer.com/article/10.1007%2FBF00127126
const ExponentialRegression = require('ml-regression-exponential')

module.exports = function(data, {
  type = 'robust', //  or polynomial or exponential
  order = 3,
}) {

  const log = debug('regress')
  // This regression isn't for prediction,
  // It's just to get meaningful variables from each contour
  // I can put the coefficients into the actual ML later

  // function round(number, precision) {
  //   var factor = Math.pow(10, precision);
  //   var tempNumber = number * factor;
  //   var roundedTempNumber = Math.round(tempNumber);
  //   return roundedTempNumber / factor;
  // }

  function normalize(min, max) {

    // https://en.wikipedia.org/wiki/Feature_scaling
    // Just makes the data a little better
    // Not actually sure if this is necessary
    // Might be better to scaled after the regression
    return x => (x - min) / (max - min)
  }

  return syllable => {

    const { x: [start, end] } = syllable

    if (end - start < 3) {
      log('error', start, end)
    }
    let y = data.slice(start, end)
      .map(({ frequency }) => frequency)
      .filter(frequency => frequency)

    y = y.map(normalize(Math.min(...y), Math.max(...y)))

    // Make new x values in case 0 frequencies were removed
    // Scaled to values between 0 and 1

    const x = [...new Array(y.length).keys()].map(x => x / y.length)
    
    let regressor = {
      polynomial: PolynomialRegression,
      robust: RobustPolynomialRegression,
      exponential: ExponentialRegression,
    }[type]
    regressor = regressor.default ? regressor.default : regressor;
    const { coefficients, A, B } = new regressor(x, y, order)

    return Object.assign(syllable, {
      coefficients, A, B,
      // coefficients: coefficients.map(coefficient => round(coefficient, 3)),
    })
  }
}