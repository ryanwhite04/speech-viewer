import React, { Component } from 'react';
import './App.css';
import debug from 'debug'
// import Mousetrap from 'mousetrap'
import speakers from 'speech-samples/index.json'
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

// function getAxisYDomain(from, to, ref, offset) {
// 	const refData = data.slice(from-1, to);
//   let [ bottom, top ] = [ refData[0][ref], refData[0][ref] ];
//   refData.forEach( d => {
//   	if ( d[ref] > top ) top = d[ref];
//     if ( d[ref] < bottom ) bottom = d[ref];
//   });
  
//   return [ (bottom|0) - offset, (top|0) + offset ]
// }

export default class App extends Component {

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

// initialState = {
//   data,
//   left : 'dataMin',
//   right : 'dataMax',
//   refAreaLeft : '',
//   refAreaRight : '',
//   top : 'dataMax+1',
//   bottom : 'dataMin-1',
//   animation : true
// }

// zoom() {  
//   let { refAreaLeft, refAreaRight, data } = this.state;

//   if ( refAreaLeft === refAreaRight || refAreaRight === '' ) {
//     this.setState( () => ({
//       refAreaLeft : '',
//       refAreaRight : ''
//     }) );
//     return;
//   }

//   // xAxis domain
//   if ( refAreaLeft > refAreaRight ) 
//       [ refAreaLeft, refAreaRight ] = [ refAreaRight, refAreaLeft ];

//   // yAxis domain
//   const [ bottom, top ] = getAxisYDomain( refAreaLeft, refAreaRight, 'cost', 1 );
  
//   this.setState( () => ({
//     refAreaLeft : '',
//     refAreaRight : '',
//     data : data.slice(),
//     left : refAreaLeft,
//     right : refAreaRight,
//     bottom, top
//   } ) );
// };

// zoomOut() {
//   const { data } = this.state;
//   this.setState( () => ({
//     data : data.slice(),
//     refAreaLeft : '',
//     refAreaRight : '',
//     left: 'dataMin',
//     right: 'dataMax',
//     top: 'dataMax+1',
//     bottom: 'dataMin',
//   }) );
// }

render() {

  // Declare functions to be used
  // const {
  //   zoomOut,
  //   setState,
  //   zoom,
  // } = this;

  // Declare all the variables to be used
  const {
    width,
    height,
    offset,
    speaker,
    sentence,
    tones,
    domain,
    log,

    // For zoomable
    // data, barIndex, left, right, refAreaLeft, refAreaRight, top, bottom
  } = this.state;

  const {
    age, languages, gender, parents,
    sentences,
  } = speakers[speaker];

  const {
    frames = [],
    transcript: [hanzi = '', pinyin = ''],
    tags = [],
    ceiling,
    maxnCandidates
  } = sentences[sentence];

  const data = frames.map(format).reduce(clean, [])
  const syllables = tags.reduce(getRange(data), []).map(getSyllable(pinyin))
  const lines = tags.map(getLine(pinyin))
  const areas = syllables.map(getArea(data))

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

  // Log Everything!!!
  log({ data, lines, syllables, areas })

  return (
    <div className="App">
      {/* <header className="App-header">
        <h1 className="App-title">{hanzi}</h1>
      </header> */}
      {/* <a href="javascript: void(0);" onClick={zoomOut}>Zoom Out</a> */}
      <pre className="Speaker">Speaker: {JSON.stringify({ age, languages, gender, parents }, null, 2)}</pre>
      <pre className="Sentence">Sentence: {JSON.stringify({ hanzi, pinyin }, null, 2)}</pre>
      <LineChart className="LineChart"
        width={width}
        height={height}
        data={data}
        // onMouseDown={({ activeLabel }) => setState({ refAreaLeft: activeLabel }) }
        // onMouseMove={({ activeLabel }) => refAreaLeft && setState({ refAreaRight: activeLabel }) }
        // onMouseUp={zoom}
        >
        <CartesianGrid />
        <Tooltip cursor={{strokeDasharray: '3 3'}} />
        <Line dot={false} type="monotone" dataKey="frequency" stroke="#8884d8" animationDuration={300} />
        <XAxis allowDataOverflow={true} domain={domain} dataKey="name" type="number" name="frame" unit="cs" />
        <YAxis allowDataOverflow={true} dataKey="frequency" type="number" name="frequency" unit="Hz" />

        {/* {(refAreaLeft && refAreaRight) ? (<ReferenceArea yAxisId="1" x1={refAreaLeft} x2={refAreaRight}  strokeOpacity={0.3} /> ) : null } */}
        {lines.map(({ label, ...props }) =>
          <ReferenceLine {...props}>
            <Label position="top">{label}</Label>
          </ReferenceLine>
        )}
        {areas.map(({ label, ...props }) =>
          <ReferenceArea {...props}>
            <Label>{label}</Label>
          </ReferenceArea>
        )}
      </LineChart>
    </div>
  )
}
}

function format({ frequency }, name) {
  return ({
    frequency,
    name,
  })
}

function clean(data, { frequency, name }, i, frames) {
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
  return (scanned, x, i, tags) => {

    const prev = tags[i-1];
    const next = tags[i+1];
    const region = data.slice(...[prev, next ? next + buffer : next]);

    // console.log('getRange', scanned, i)
    const wall = i ? scanned[i - 1][1].name : 0

    const start = region.find(({ frequency, name }, i, data) => {

      const first0InFirstHalf = data.slice(0, data.length / 2).indexOf(({ frequency }) => !frequency);
      // if (data[0].frequency && first0InFirstHalf > -1) {
      //   return frequency !== 0 && i > first0InFirstHalf
      // } else {
      //   return frequency !== 0 && name > x
      // }
        return frequency !== 0 && name > x && name > wall
    }) || data[x]

    const end = region.find(({ frequency, name }, i, data) => {
      // console.log('getEnd', { frequency, name, start })
      return name > start.name && frequency === 0
    }) || data[next]

    return [...scanned, [start, end]]
  }
}

function getSyllable(pinyin) {
  const keyToTone = getTone(pinyin)
  return ([{ name: x1 }, { name: x2 }], key) => ({
    x: [x1, x2],
    tone: keyToTone(key)
  })
}
function getTone(pinyin) {
  return key => +pinyin.split(' ')[key].slice('-1')
}

function getLine(pinyin) {
  const keyToTone = getTone(pinyin);
  return (x, key) => {
    const tone = keyToTone(key)
    return ({
      x, key,
      label: key,
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
          