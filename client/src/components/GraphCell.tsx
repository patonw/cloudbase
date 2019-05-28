import * as React from 'react'

import { connect } from 'react-redux';
import { AppState, GraphCell } from '../store'

// On script execute, render result using Vega with spec
// Result must be a list or array of objects
class GraphCellView extends React.Component<GraphCell, {}> {
  render() {
    return (
      <div>
        <div>This is a Graph cell</div>
        <code>{this.props.script}</code>
        <code>{this.props.spec}</code>

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

export default connect(mapState, mapDispatch)(GraphCellView)