import React, { Component } from 'react'
import './App.css'
import debug from 'debug'
import generate from './utils/generate'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'
import speakers from 'speech-samples/index.json'
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
 } from 'recharts'
 import {
  Table,
  TableBody,
  TableHeader,
  TableHeaderColumn,
  TableRow,
  TableRowColumn,
} from 'material-ui/Table'
import { List, ListItem } from 'material-ui/List'
// import getMuiTheme from 'material-ui/styles/getMuiTheme'
import {
  // red500,
  // green500,
  // cyan500,
  // green500,
} from 'material-ui/styles/colors'
import AppBar from 'material-ui/AppBar'
// import SnackBar from 'material-ui/Snackbar'
// import Paper from 'material-ui/Paper'
// import Dialog from 'material-ui/Dialog';
// import FlatButton from 'material-ui/FlatButton';
import IconButton from 'material-ui/IconButton'
import SvgIcon from 'material-ui/SvgIcon'
// import FloatingActionButton from 'material-ui/FloatingActionButton'
// import FileFileDownload from 'material-ui/svg-icons/file/file-download'
// import ContentClear from 'material-ui/svg-icons/content/clear'
// import ContentAdd from 'material-ui/svg-icons/content/add'
// import ActionHelp from 'material-ui/svg-icons/action/help'
// import ActionLock from 'material-ui/svg-icons/action/lock'
// import AvMic from 'material-ui/svg-icons/av/mic'
// import AvMicOff from 'material-ui/svg-icons/av/mic-off'
// import ImageNavigateBefore from 'material-ui/svg-icons/image/navigate-before'
// import ImageNavigateNext from 'material-ui/svg-icons/image/navigate-next'
import { Card,
  CardActions,
  // CardHeader,
  CardMedia,
  CardTitle,
  // CardText
} from 'material-ui/Card'
import TextField from 'material-ui/TextField'
import Plot from 'react-plotly.js'


export default class App extends Component {

  state = {
    width: 1440,
    height: 360,
    domain: [0, 'auto'],
    sentence: 0,
    speaker: 0,
    key: 'time',
    tone: 0,
    regression: {
      order: 3,
      type: 'robust',
    }
  }

  render() {

    const log = debug('app');
    const { width, height, domain, key, tone, speaker, sentence, regression } = this.state
    
    log({ speaker, speakers })
   
    const { sentences, ...rest } = speakers[speaker];

    // console.log(generate);
    const { syllables, contour, model } = generate(regression)(sentences[sentence]);
    
    const data = [
      { color: "rgb(127, 127, 127)" },
      { color: "rgb(0, 127, 0)" },
      { color: "rgb(0, 0, 127)" },
      { color: "rgb(127, 0, 0)" },
      { color: "rgb(0, 0, 0)" }
    ].map(unpack(syllables))

    const filtered = syllables.filter(tone ? ({ tone: t }) => tone === t : () => true)
    log('render', this.state, rest, syllables, filtered, model)

    const onChange = ({ target: { name } }, v) => {
      console.log('onChange', { [name]: v })
      this.setState({ [name]: parseInt(v, 10) })
    }
    const actions = [
      {
        key: 'sentence',
        floatingLabelText: "Sentence",
        type: "number",
        min: "0",
        max: "1000",
        value: sentence,
        onChange,
      },
      {
        key: 'tone',
        floatingLabelText: "Tone",
        type: "number",
        min: "0",
        max: "5",
        value: tone,
        onChange,
      },
      {
        key: 'width',
        floatingLabelText: "Width",
        type: "number",
        min: "360",
        max: "3000",
        value: width,
        onChange,
      },
      {
        key: 'start',
        floatingLabelText: "Start",
        type: "number",
        min: "0",
        max: domain[1],
        value: domain[0],
        onChange,
      },
      {
        key: 'end',
        floatingLabelText: "End",
        type: "number",
        min: domain[0],
        max: contour.length,
        value: typeof domain[1] === 'number' ? domain[1] : contour.length,
        onChange,
      }
    ]

    return <MuiThemeProvider><div className="App">
      <Header
        title="Speech Viewer"
        showMenuIconButton={false}
        href="https://github.com/ryanwhite04/speech-viewer"
        style={{ position: 'fixed', top: 0 }}
      />
      <List>{display(rest, 'Speaker')}</List>
      <Card className="Chart" depth={2}>
        <CardTitle title="Pitch Contour" subtitle={`Sentence ${sentence}`} />
        <CardMedia className="Graph">
          <LineChart className="LineChart" width={width} height={height} data={contour}>
            <CartesianGrid />
            <Tooltip cursor={{strokeDasharray: '3 3'}} />
            <Line dot={false} type="monotone" dataKey="frequency" stroke="#8884d8" animationDuration={300} />
            <XAxis allowDataOverflow={true} domain={domain} dataKey="name" type="number" name="Time" unit="0ms" />
            <YAxis allowDataOverflow={true} dataKey="frequency" type="number" name="Frequency" unit="Hz" />
            {filtered.map(line)}
            {filtered.map(area)}
          </LineChart>
        </CardMedia>
        <CardActions actAsExpander={true} showExpandableButton={true} >
          {actions.map(({ key, ...action }) => <TextField key={key} name={key} className="Input" {...action} />)}
        </CardActions>
        <CardMedia className="Table" expandable={true}>
          <Table selectable={false}>
            <TableHeader>{row({
              time: 'Time',
              name: 'Name',
              tone: 'Tone',
              coefficients: [...new Array(regression.order +1).keys()].map(key => `Coefficients.${key}`),
            }, true)}</TableHeader>
            <TableBody>{filtered.sort(sortBy(key)).map((data, key) => row(data, false))}</TableBody>
          </Table>
        </CardMedia>
      </Card>
      <Card className="Chart">
        <CardMedia className="Graph">
          <Plot
            data={data}
            layout={{
              title: "A Fancy Plot"
            }}
          />
        </CardMedia>
      </Card>
    </div></MuiThemeProvider>
  }
}

function GitHubIcon(props) {
  return (<SvgIcon {...props}>{
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
  }</SvgIcon>)
}

function Header({ title, href, showMenuIconButton, style }) {
  return (<AppBar title={title} style={style}
    showMenuIconButton={showMenuIconButton}
    iconElementRight={<IconButton href={href}><GitHubIcon/></IconButton>}
  />)
}

function round(number, precision) {
  var factor = Math.pow(10, precision);
  var tempNumber = number * factor;
  var roundedTempNumber = Math.round(tempNumber);
  return roundedTempNumber / factor;
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
        <TableHeaderColumn key={key}>{datum}</TableHeaderColumn> :
        <TableRowColumn key={key}>{round(datum, 3)}</TableRowColumn>
    }
  }
  const columns = [time, tone, name, ...coefficients].map(column(header))
  
  return <TableRow key={name}>{columns}</TableRow>
}

function line({ time, name, tone }) {
  // These show when the clicks took place
  // As you can see, she didn't tag them "mid" syllable as she was suppose to
  // If a sentence has all these lines mid syllable, the "getRange" function would need to be updated
  console.log('line', { name, tone })
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
  }}><Label position="top" offset={-24}>{name}</Label></ReferenceLine>
}

function area({ tone, name, x, min, max }) {
  // These are the boxes that border the tone contour of each syllable
  console.log('area', { name, tone })
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
  }}><Label position="bottom">{tone}</Label></ReferenceArea>
}

function unpack(syllables) {
  return (marker = {}, i = 0) => {
    const filtered = syllables.filter(({ tone }) => parseInt(tone, 10) === i);

    console.log(i, filtered);

    const reduced = filtered.reduce(
      ({ x, y, z }, { coefficients: [a, b, c] }) => ({
        x: [...x, a],
        y: [...y, b],
        z: [...z, c]
      }),
      { x: [], y: [], z: [] }
    );

    console.log(i, reduced);

    return {
      type: "scatter3d",
      mode: "markers",
      marker: {
        size: 12,
        line: {
          color: "rgba(217, 217, 217, 0.14)",
          width: 0.5
        },
        opacity: 0.8,
        ...marker
      },
      ...reduced
    };
  };
}