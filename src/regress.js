import PolynomialRegression from 'ml-regression-polynomial';

export default function regress(data, order) {
  // This regression isn't for prediction,
  // It's just to get meaningful variables from each contour
  // I can put the coefficients into the actual ML later

  function round(number, precision) {
    var factor = Math.pow(10, precision);
    var tempNumber = number * factor;
    var roundedTempNumber = Math.round(tempNumber);
    return roundedTempNumber / factor;
  }

  function normalize(min, max) {

    // https://en.wikipedia.org/wiki/Feature_scaling
    // Just makes the data a little better
    // Not actually sure if this is necessary
    // Might be better to scaled after the regression
    return x => (x - min) / (max - min)
  }

  return (syllable, key) => {

    const { x: [start, end] } = syllable

    let y = data.slice(start, end)
      .map(({ frequency }) => frequency)
      .filter(frequency => frequency)

    y = y.map(normalize(Math.min(...y), Math.max(...y)))

    // Make new x values in case 0 frequencies were removed
    // Scaled to values between 0 and 1
    const x = [...new Array(y.length).keys()].map(x => x / y.length)
    
    // This is where the magic happens.
    // 3rd order seems to work well,

    const { coefficients } = new PolynomialRegression(x, y, order)

    return Object.assign(syllable, {
      coefficients: coefficients.map(coefficient => round(coefficient, 3))
    })
  }
}