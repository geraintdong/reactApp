import React from 'react';
import ReactDOM from 'react-dom';
import App from '../components/App.jsx';

// Stylesheets
 require('../scss/style.scss');

ReactDOM.render(<App header='Header from props' content='Content from props' />, document.getElementById('app'));