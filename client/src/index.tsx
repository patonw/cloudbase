import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux'
import { createStore, applyMiddleware } from 'redux'
import thunk from 'redux-thunk'

import './styles/index.scss';
import App from './App';
import * as serviceWorker from './serviceWorker';
import { rootReducer, loadTableOfContents } from './store';

const store = createStore(rootReducer, applyMiddleware(thunk))
store.subscribe(() => console.log(store.getState()))
store.dispatch(loadTableOfContents() as any)

ReactDOM.render(
  <Provider store={store}><App /></Provider>,
  document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
