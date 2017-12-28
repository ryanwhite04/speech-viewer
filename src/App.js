import React, { Component } from 'react';
import './App.css';
import debug from 'debug'
import Mousetrap from 'mousetrap'
import speakers from 'speech-samples'
import { PolynomialRegression } from 'ml-regression'
// https://github.com/mljs/regression
// https://www.npmjs.com/package/js-regression
// https://en.wikipedia.org/wiki/Feature_scaling
// import Chart from './Chart.jsx';
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


function slice(data) {
  return (x, i, tags) => {

    const prev = tags[i = 1];
    const next = tags[i + 1];
    const context = data.slice(prev, next);

    // you've got the x 

    const x1 = (data.slice(x, next).find(({ frequency, name }) => {
      return frequency !== 0 && name > x + 2
    }) || { name: x }).name;

    const x2 = (data.slice(x1, x2).reverse().find(({ frequency, name }) => {
      return frequency === 0
    }) || { name: x2 }).name;

    console.log(x1, x2, data.slice(x1, x2))
    
    return [x1, x2]
  }

}

export default class App extends Component { 
  state = {
    offset: 20,
    sentence: 0,
    speaker: 0,
    tones: 0,
    start: 0,
    end: undefined,
    log: debug('app'),
  }
  
  render() {

  // Declare all the variables to be used
  const {
    offset,
    speaker,
    sentence,
    tones,
    start,
    end,  
    log,
  } = this.state;

  const {
    email, name, age, nationality, gender, proficiency,
    sentences,
  } = speakers[speaker];

  const {
    frames = [],
    transcript: [hanzi = '', pinyin = ''],
    tags = [],
    ceiling,
    maxnCandidates
  } = sentences[sentence];

  // Make the contour nicer
  const data = frames
    // .map(({ frequency }) => frequency)
    .map((frequency, name) => ({ frequency, name }))
    .slice(start, end)

  // For showing when the clicks took place
  const lines = tags.map((x, key) => ({ x, key, 
    position: 'top',
    value: key,
  }))

  // Make the tags nice, want { start, end, tone, key } for each
  const syllables = tags.map(slice(data))
    .map((x, i) => ({ x, tone: pinyin.split(' ')[i].slice('-1')}))

  const areas = [
    null,
    'yellow',
    'blue',
    'red',
    'black',
    'green',
  ].map((stroke, i) => syllables

    // get only ith tones
    .filter(({ tone }) => !i || tone === i)

    .map(({ x, tone }, key) => {

      const y = ['min', 'max'].map(v => Math[v](data.slice(...x).map(({ frequency }) => frequency)))
      
      return {
        x1: x[0],
        x2: x[1],
        y1: y[0],
        y2: y[1],
        label: tone,
        key: 'area' + key,
        stroke,
        strokeOpacity: 0.3,
      }
    })
  )

  // const curves = syllables

  //   // get only 4th tones
  //   .filter(({ tone }) => tone === 4)

  //   // try on just the first one for testing
  //   .slice(0, 1)

  //   .map((({ x, tone }), i) => {
  //     let y = data
  //       .slice(x, x[i+1] || 10)
  //       .map(({ frequency }) => frequency)
  //       .filter(frequency => frequency)

  //     const max = Math.max(y)
  //     const min = Math.min(y)

  //     y = y.map(x => (x - min) / (max - min))


  //     log({ y })

  //     const x = [...new Array(y.length).keys()]
  //     const regression = new PolynomialRegression(x, y, 3)
  //     const syllable = pinyin.split(' ')[i]
  //     const tone = parseInt(syllable.slice(-1))
  //     return {
  //       ...regression,
  //       string: regression.toString(),
  //       syllable,
  //       tone,
  //     }
  //   })

  return (
    <div className="App">
      <header className="App-header">
        <h1 className="App-title">{hanzi}</h1>
      </header>
      <pre className="App-intro">Speaker: {JSON.stringify({
        email, name, age, nationality, gender, proficiency,
      }, null, 2)}</pre>
      <LineChart width={1440} height={400} data={data}>
        <CartesianGrid />
        <Tooltip cursor={{strokeDasharray: '3 3'}} />
        <XAxis dataKey="x" type="number" name="frame" unit="cs" />
        <YAxis dataKey="y" type="number" name="frequency" unit="Hz" />
        {lines.map(({ key, x, value, position }) => {
          return (
            <ReferenceLine key={'line' + key} x={x} stroke="green">
              <Label position={position} offset={20}>{value}</Label>
            </ReferenceLine>
          )
        })}
        {areas[tones].map(props => <ReferenceArea {...props} />)}
        <Line dot={false} type="monotone" dataKey="frequency" stroke="black" />
        {/* <Line dot={false} type="monotone" dataKey="strength" stroke="yellow" /> */}
        {/* <Line dot={false} type="monotone" dataKey="candidates" stroke="cyan" /> */}
      </LineChart>
    </div>
  )
}}