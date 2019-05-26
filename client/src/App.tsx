import React from 'react';
import { connect } from 'react-redux';
import './styles/global.scss'
import './styles/App.scss';

import Workbook from './components/Workbook'
import { AppState } from './store';

export interface AppProps {
  uuid: string | null
}

class App extends React.Component<AppProps, {}>{
  render() {
    const { uuid } = this.props
    return (
      <div>
        { uuid && <Workbook uuid={uuid} />}
      </div>
    );
  }
}

// TODO set initial workbook from cookie

function mapState(state: AppState) {
  const bookid = state.view.workbook || ""
  const uuid = bookid in state.workbooks ? bookid : null
  return {
    uuid
  }
}

export default connect(mapState, {})(App)