import React from 'react';
import { connect } from 'react-redux';
import './styles/global.scss'
import './styles/App.scss';

import Workbook from './components/Workbook'
import { AppState, clearError } from './store';

export interface AppProps {
  uuid: string | null
  clearError: typeof clearError
  errMsg?: string
}

export class App extends React.Component<AppProps, {}>{
  renderError() {
    const { errMsg, clearError } = this.props
    if (!errMsg) {
      return null
    }

    // TODO autofocus
    const keyHandler = (e: React.KeyboardEvent<HTMLDivElement>) => {
      console.log("Event", e)
      if (e.key === 'Escape') {
        clearError()
      }
    }

    return (
      <div className="modal is-active" onKeyDown={keyHandler}>
        <div className="modal-background" onClick={clearError} ></div>
        <div className="modal-content">
          <div className="message is-danger">
            <div className="message-header">
              Error
            </div>
            <div className="message-body">
              {errMsg}
            </div>
          </div>
        </div>
        <button className="modal-close is-large" onClick={clearError} aria-label="close"></button>
      </div>
    )
  }

  render() {
    const { uuid } = this.props
    return (
      <div>
        {this.renderError()}
        {uuid && <Workbook uuid={uuid} />}
      </div>
    );
  }
}

// TODO set initial workbook from cookie

function mapState(state: AppState) {
  const bookid = state.view.workbook || ""
  const uuid = bookid in state.workbooks ? bookid : null
  const { errMsg } = state.view

  return {
    uuid,
    errMsg
  }
}

const mapDispatch = {
  clearError,
}

export default connect(mapState, mapDispatch)(App)