import React, { Component } from 'react';
import './App.css';
import debug from 'debug'
import generator from './generator'
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

  state = {
    width: 1440,
    height: 360,
    domain: [0, 'auto'],
    sentence: 0,
    speaker: 0,
  }

  render() {

    const {
      width, height, domain,
      speaker, sentence,
      generate = generator(3),
      log = debug('app'),
    } = this.state

    const {
      speaker: { age, languages, gender, parents },
      sentence: { transcript: [hanzi, pinyin], tags },
      data, syllables, curves,
    } = generate(speaker, sentence);

    log(this.state)

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
          {tags.map(getLine(pinyin)).map(({ label, ...props }) => <ReferenceLine {...props}><Label position="top">{label}</Label></ReferenceLine>)}
          {syllables.map(getArea(data)).map(({ label, ...props }) => <ReferenceArea {...props}><Label>{label}</Label></ReferenceArea>)}
        </LineChart>
      </div>
    )
  }
}

function getLine(pinyin) {
  // These show when the clicks took place
  // As you can see, she didn't tag them "mid" syllable as she was suppose to
  // If a sentence has all these lines mid syllable, the "getRange" function would need to be updated
  const keyToTone = key => +pinyin.split(' ')[key].slice('-1');
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
          