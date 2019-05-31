import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux'
import { createStore, applyMiddleware } from 'redux'
import { createEpicMiddleware } from 'redux-observable';
import { ajax } from 'rxjs/ajax'

import './styles/index.scss';
import App from './App';
import * as serviceWorker from './serviceWorker';
import { rootReducer, rootEpic, startApp } from './store';

import { makeAjaxClient } from './store/graphql'

const epicWare = createEpicMiddleware({
  dependencies: {
    graphql: makeAjaxClient(ajax),
  }
})

const store = createStore(rootReducer, applyMiddleware(epicWare))
epicWare.run(rootEpic)
store.subscribe(() => console.log(store.getState()))
store.dispatch(startApp())
//store.dispatch(loadTableOfContents() as any)

ReactDOM.render(
  <Provider store={store}><App /></Provider>,
  document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
