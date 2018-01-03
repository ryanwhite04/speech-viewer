import React, { Component } from 'react';
import './App.css';
import debug from 'debug'
import generator from './generator'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
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

 import {
  Table,
  TableBody,
  TableHeader,
  TableHeaderColumn,
  TableRow,
  TableRowColumn,
} from 'material-ui/Table';

import {List, ListItem} from 'material-ui/List';


export default class App extends Component {

  state = {
    width: 1440,
    height: 360,
    domain: [0, 'auto'],
    sentence: 0,
    speaker: 0,
    key: 'time',
    order: 2
  }

  render() {

    const { width, height, domain, key, speaker, sentence, order } = this.state
    const { speaker: info , syllables, contour, model } = generator(order)(speaker, sentence);
    const log = debug('App')
    
    log('render', this.state, info, syllables, model)

    return <MuiThemeProvider><div className="App">
      <List>{display(info, 'Speaker')}</List>
      <LineChart className="LineChart" width={width} height={height} data={contour}>
        <CartesianGrid />
        <Tooltip cursor={{strokeDasharray: '3 3'}} />
        <Line dot={false} type="monotone" dataKey="frequency" stroke="#8884d8" animationDuration={300} />
        <XAxis allowDataOverflow={true} domain={domain} dataKey="name" type="number" name="Time" unit="0ms" />
        <YAxis allowDataOverflow={true} dataKey="frequency" type="number" name="Frequency" unit="Hz" />
        {syllables.map(line)}
        {syllables.map(area)}
      </LineChart>
      <Table selectable={false}>
        <TableHeader>
        {row({
          time: 'Time',
          name: 'Name',
          tone: 'Tone',
          coefficients: [...new Array(order +1).keys()].map(key => `Coefficients.${key}`),
        }, true)}
        </TableHeader>
        <TableBody>{syllables.sort(sortBy(key)).map(row)}</TableBody>
      </Table>
    </div></MuiThemeProvider>
  }
}

function display(data, label = 'Data') {
  const other = ['string', 'number'].includes(typeof data) ?
    { secondaryText: data } : typeof data === 'object' ?
    { nestedItems: Object.entries(data).map(([key, value]) => display(value, key)) } : {}
  return <ListItem className="ListItem" key={label} primaryText={`${label}`} {...other}/>
}

function sortBy(key, pivot = '.') {
  key = key.toLowerCase()
  return (a, b) => key.includes(pivot) ?
    a[key.split(pivot)[0]][key.split(pivot)[1]] > b[key.split(pivot)[0]][key.split(pivot)[1]] ? 1 : -1 :
    a[key] > b[key] ? 1 : -1
}

function row({ time, tone, name, coefficients }, header) {
  
  function column(header = false) {
    return (datum, key) => {
      return header ?
        <TableRowColumn key={key}>{datum}</TableRowColumn> :
        <TableHeaderColumn key={key}>{datum}</TableHeaderColumn>
    }
  }
  const columns = [time, tone, name, ...coefficients].map(column(header))
  
  return <TableRow key={name}>{columns}</TableRow>
}

function line({ time, name, tone }) {
  // These show when the clicks took place
  // As you can see, she didn't tag them "mid" syllable as she was suppose to
  // If a sentence has all these lines mid syllable, the "getRange" function would need to be updated
  return <ReferenceLine {...{
    x: time,
    key: 'line_' + name,
    stroke: [
      null,
      'yellow',
      'blue',
      'red',
      'black',
      'green',
    ][tone] || "#82ca9d",
  }}><Label>{name}: {tone}</Label></ReferenceLine>
}

function area({ tone, name, x, min, max }) {
  // These are the boxes that border the tone contour of each syllable
  return <ReferenceArea {...{
    x1: x[0],
    x2: x[1] - 1,
    y1: min,
    y2: max,
    key: 'area_' + name,
    stroke: [
      null,
      'yellow',
      'blue',
      'red',
      'black',
      'green',
    ][tone],
    strokeOpacity: 0.3,
  }}><Label>{name}: {tone}</Label></ReferenceArea>
}
          