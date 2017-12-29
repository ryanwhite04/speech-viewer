import React, { Component } from 'react';
import './App.css';
import debug from 'debug'
import speakers from 'speech-samples/index.json'
import { PolynomialRegression } from 'ml-regression'
import {
  LineChart,
  Line,
  Label,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
  XAxis,
  YAxis,
 } from 'recharts';

export default class App extends Component {

  // At the moment, the app is just for visualization
  // To speed things up in future, all non-react/ui parts will move elsewhere
  // That way it can process sentences on NODE.js backend
  // TODO migrate the following to own file, probs in speech-samples repo
  // - debug, speakers, and regression imports
  // - curves, syllables, data, and constants from render
  // - format, clean, get{Range|Tone|Syllable|Curve}, normalize, and train functions
  // In speech samples repo, if done correctly, can still be imported and visualized

  state = {
    width: 1440,
    height: 360,
    offset: 20,
    sentence: 0,
    speaker: 0,
    tones: 0,
    domain: [0, 'auto'],
    log: debug('app'),
  }

  render() {

    const { width, height, offset, speaker, sentence, tones, domain, log } = this.state;
    const { age, languages, gender, parents, sentences } = speakers[speaker];
    const { frames, transcript: [hanzi, pinyin], tags } = sentences[sentence];

    log('state', { width, height, offset, speaker, sentence, tones, domain, log })
    log('speaker', { age, languages, gender, parents, sentences })
    log('sentence', { frames, transcript: [hanzi, pinyin], tags })

    const data = frames.map(format).reduce(clean, [])
    const syllables = tags.reduce(getRange(data), []).map(getSyllable(pinyin))
    const lines = tags.map(getLine(pinyin))
    const areas = syllables.map(getArea(data))
    const curves = syllables.map(getCurve(data))

    log({ data, syllables, lines, areas, curves })

    return (
      <div className="App">
        <pre className="Speaker">Speaker: {JSON.stringify({ age, languages, gender, parents }, null, 2)}</pre>
        <pre className="Sentence">Sentence: {JSON.stringify({ hanzi, pinyin }, null, 2)}</pre>
        <LineChart className="LineChart" width={width} height={height} data={data}>
          <CartesianGrid />
          <Tooltip cursor={{strokeDasharray: '3 3'}} />
          <Line dot={false} type="monotone" dataKey="frequency" stroke="#8884d8" animationDuration={300} />
          <XAxis allowDataOverflow={true} domain={domain} dataKey="name" type="number" name="Time" unit="0ms" />
          <YAxis allowDataOverflow={true} dataKey="frequency" type="number" name="Frequency" unit="Hz" />
          {lines.map(({ label, ...props }) => <ReferenceLine {...props}><Label position="top">{label}</Label></ReferenceLine>)}
          {areas.map(({ label, ...props }) => <ReferenceArea {...props}><Label>{label}</Label></ReferenceArea>)}
        </LineChart>
      </div>
    )
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

function getTone(pinyin) {
  // TODO just put this back where it's used, or convert the pinyin at the beginning to "tones"
  return key => +pinyin.split(' ')[key].slice('-1')
}

function getSyllable(pinyin) {
  // This just bundles the tone with the range in a format more easily consumed by everything else
  const keyToTone = getTone(pinyin)
  return ([{ name: x1 }, { name: x2 }], key) => ({
    x: [x1, x2],
    tone: keyToTone(key)
  })
}

function getLine(pinyin) {
  // These show when the clicks took place
  // As you can see, she didn't tag them "mid" syllable as she was suppose to
  // If a sentence has all these lines mid syllable, the "getRange" function would need to be updated
  const keyToTone = getTone(pinyin);
  return (x, key) => {
    const tone = keyToTone(key)
    return ({
      x, key,
      label: key,

      // The colors are suppose to be conventional colors for the tones apparently
      // I learnt them from Michel Thomas audio tapes when I was learning Mandarin
      // Not sure if they are actually conventions though, might make them better
      stroke: [
        null,
        'yellow',
        'blue',
        'red',
        'black',
        'green',
      ][tone] || "#82ca9d",
    })
  }
}

function getArea(data) {
  // These are the boxes that border the tone contour of each syllable
  return ({ x, tone }, key) => {

    const region = data.slice(...x).map(({ frequency }) => frequency)
    const y = [Math.min(...region), Math.max(...region)]
    
    return {
      x1: x[0],
      x2: x[1] - 1,
      y1: y[0],
      y2: y[1],
      label: tone,
      key: 'area' + key,
      stroke: [
        null,
        'yellow',
        'blue',
        'red',
        'black',
        'green',
      ][tone],
      strokeOpacity: 0.3,
    }
  }
}

function normalize(min, max) {

  // https://en.wikipedia.org/wiki/Feature_scaling
  // Just makes the data a little better
  // Not actually sure if this is necessary
  // Might be better to scaled after the regression
  return x => (x - min) / (max - min)
}

function getCurve(data, order = 3) {
  // This regression isn't for prediction,
  // It's just to get meaningful variables from each contour
  // I can put the coefficients into the actual ML later
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
    const { coefficients } = new PolynomialRegression(x, y, order)

    return { coefficients, tone }
  }
}

// function train() {
//   // https://github.com/mljs/regression
//   // https://www.npmjs.com/package/js-regression
//   // Still needs to be written
//   // Will probably use one of the libraries above to train MLA based on curve coefficients
// }
          