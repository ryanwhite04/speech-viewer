import React from 'react'
import ReactDOM from 'react-dom'
import './index.css'
import App from './App'
import registerServiceWorker from './registerServiceWorker'

// import { BrowserRouter as Router, Route, Redirect, Switch } from 'react-router-dom'

// {/* <Router basename={process.env.PUBLIC_URL}>
//   <Switch>
//     <Redirect from="/" exact to="/0/0"/>
//     <Redirect from="/:speaker" exact to="/0/0"/>
//     <Route path="/:speaker/:sentence" component={App}/>
//   </Switch>
// </Router> */}

ReactDOM.render(<App/>, document.getElementById('root'))
registerServiceWorker()
