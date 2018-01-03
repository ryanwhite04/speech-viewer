const log = require('debug')('generator');
const speakers = require('speech-samples/index.json');
const { PolynomialRegression } = require('ml-regression');

module.exports = (order = 3) => (speaker = 0, sentence = 0) => {

  log('generate', { order, speaker, sentence })

  const { sentences, ...rest } = speakers[speaker];
  const { tags, frames } = sentences[sentence];

  const contour = frames.map(format).reduce(clean(4), [])
  const syllables = tags
    .reduce(outline(contour), [])
    .filter(({ x }) => x)
    .filter(({ x: [start, end] }) => start && end && end - start > 1)
    .map(regress(contour, order))
  
  log('generate', { contour, syllables })

  return { speaker: rest, contour, syllables }
}

function format(frequency, name) {
  // This will probably get changed in future, when only frequency is passed in
  // TODO input will become (frequency, name) instead
  return ({
    frequency,
    name,
  })
}

function clean(window) {
  // Just removes small spikes of sounds that interfere with getRange
  // any sounds spike less than window * 10ms will get flattened to 0hz
  return (data, { frequency, name }, i, frames) => [...data, {
    name, 
    frequency: (i && i < frames.length - 2 && frequency && !data.slice(-1)[0].frequency && frames.slice(i + 1).slice(0, window).map(({ frequency }) => frequency).includes(0)) ? 0 : frequency
  }];
}

function outline(data, buffer = 20) {
  // This can definitely be fine-tuned
  // given an x value, the position of a click in a stream of frame frequencies
  // it should return the correct bounds of the syllable
  // The main speaker clicked "before" the syllable, so it is quite difficult to get it right
  // Still seems to work quite well, as you can see in sentence 1, but has a few errors here and there for other sentences
  // If things turn out badly, come back here to fine tune, and make it more robust, to end up with less errors for the ML

  // TODO Update, the range being returned quite often has a start which comes after it's end, needs to be fixed
  return (reduced, tag, i, tags) => {

    // function getAverage(reduced) {
    //   debugger
    //   return ~~(reduced.reduce((sum, { x: [ start, end] }) => sum + (end - start), 0) / reduced.length)
    // }

    // const average = getAverage(reduced);

    const region = data.slice(i ? reduced[i - 1].x[1] : tag.time, tags[i + 1] ? (buffer + tags[i+1].time) : undefined)
    const start = (region.find(({ frequency, name }) => frequency && name > tag.time) || data[tag.time]).name
    const end = (region.find(({ frequency, name }) => name > start && !frequency) || region.slice(-1)[0]).name
    const [min, max] = ['min', 'max'].map(func => Math[func](...data.slice(start, end).map(({ frequency }) => frequency)))

    return [...reduced, { ...tag, name: i, x: [start, end], min, max }]
  }
}

function regress(data, order) {
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

    return { ...syllable,
      coefficients: coefficients.map(coefficient => round(coefficient, 3))
    }
  }
}