import * as React from 'react'

import { connect } from 'react-redux';
import { AppState, Cell } from '../store'

class CodeCellView extends React.Component<Cell, {}> {
  render() {
    return (
      <div>
        <div>This is a cell</div>
        <code>{this.props.script}</code>

      </div>
    )
  }
}


function mapState(state: AppState, ownProps: any) {
  return ownProps
}

function mapDispatch(dispatch: any) {
  return {}
}

export default connect(mapState, mapDispatch)(CodeCellView)