const log = require('debug')('generator');
const speakers = require('speech-samples/index.json');
const { PolynomialRegression } = require('ml-regression');
module.exports = order => (speaker, sentence) => {

  const { age, languages, gender, parents, sentences } = speakers[speaker];
  const { frames, transcript: [hanzi, pinyin], tags } = sentences[sentence];

  const data = frames.map(format).reduce(clean, [])
  const syllables = tags.reduce(getRange(data), []).map(getSyllable(pinyin))
  const curves = syllables.map(getCurve(data))

  return {
    speaker: { age, languages, gender, parents, sentences },
    sentence: { frames, transcript: [hanzi, pinyin], tags },
    data, syllables, curves,
  }
}

function format({ frequency }, name) {
  // This will probably get changed in future, when only frequency is passed in
  // TODO input will become (frequency, name) instead
  return ({
    frequency,
    name,
  })
}

function clean(data, { frequency, name }, i, frames) {
  // Just removes small spikes of sounds that interfere with getRange
  // any sounds spike less than 40ms will get flattened to 0hz
  // TODO Not done well, could definitely be refactored
  let value = { frequency, name };
  if (i && i < frames.length - 2) {
    if (!data.slice(-1)[0].frequency) {
      if (!frames[i + 1].frequency || !frames[i+2].frequency) {
        value = { frequency: 0, name }
      }
    }
  } 
  data.push(value);
  return data; 
}

function getRange(data, buffer = 20) {
  // This can definitely be fine-tuned
  // given an x value, the position of a click in a stream of frame frequencies
  // it should return the correct bounds of the syllable
  // The main speaker clicked "before" the syllable, so it is quite difficult to get it right
  // Still seems to work quite well, as you can see in sentence 1, but has a few errors here and there for other sentences
  // If things turn out badly, come back here to fine tune, and make it more robust, to end up with less errors for the ML

  // TODO Update, the range being returned quite often has a start which comes after it's end, needs to be fixed
  return (scanned, x, i, tags) => {

    const prev = tags[i-1];
    const next = tags[i+1];

    // Adds a little but onto the end incase the following click came before this one ended
    const region = data.slice(...[prev, next ? next + buffer : next]);

    // This is the end of the previously calculated region, so it can't start before this
    const wall = i ? scanned[i - 1][1].name : 0

    const start = region.find(({ frequency, name }, i, data) => {

      // There are still some improvements to be made here, and some other attempts as you can see.
      // TODO check out this code and scavenge anything useful.
      // first0InFirstHalf is the first 0 frequency value encountered before the midpoint of the previous and next click
      // if there is a 0 here at all, it probably means that the click was before the end of the previous click
      // const first0InFirstHalf = data.slice(0, data.length / 2).indexOf(({ frequency }) => !frequency);
      // if (data[0].frequency && first0InFirstHalf > -1) {
      //   return frequency !== 0 && i > first0InFirstHalf
      // } else {
      //   return frequency !== 0 && name > x
      // }

        return frequency !== 0 && name > x && name > wall
    }) || data[x]

    const end = region.find(({ frequency, name }, i, data) => {

      // This isn't especially smart, there are probably a few weird cases where this doesn't work
      // TODO make this smarter to account for more "weird" clicks
      return name > start.name && frequency === 0
    }) || data[next]

    return [...scanned, [start, end]]
  }
}
function getSyllable(pinyin) {
  // This just bundles the tone with the range in a format more easily consumed by everything else
  const keyToTone = key => +pinyin.split(' ')[key].slice('-1')
  return ([{ name: x1 }, { name: x2 }], key) => ({
    x: [x1, x2],
    tone: keyToTone(key)
  })
}

function getCurve(data, order = 3) {
  // This regression isn't for prediction,
  // It's just to get meaningful variables from each contour
  // I can put the coefficients into the actual ML later

  function normalize(min, max) {

    // https://en.wikipedia.org/wiki/Feature_scaling
    // Just makes the data a little better
    // Not actually sure if this is necessary
    // Might be better to scaled after the regression
    return x => (x - min) / (max - min)
  }

  return ({ x: [start, end], tone }, key) => {

    let y = data.slice(start, end)

      // Don't need "name" property anymore, finally!
      .map(({ frequency }) => frequency)

      // Remove any 0 frequencies
      .filter(frequency => frequency)


    y = y.map(normalize(Math.min(...y), Math.max(...y)))

    // Make new x values in case 0 frequencies were removed
    // Scaled to values between 0 and 1
    const x = [...new Array(y.length).keys()].map(x => x / y.length)
    
    // This is where the magic happens.
    // 3rd order seems to work well,

    log({ start, end, order })

    const { coefficients } = new PolynomialRegression(x, y, order)

    return { coefficients, tone }
  }
}

function train() {
  // https://github.com/mljs/regression
  // https://www.npmjs.com/package/js-regression
  // Still needs to be written
  // Will probably use one of the libraries above to train MLA based on curve coefficients
}