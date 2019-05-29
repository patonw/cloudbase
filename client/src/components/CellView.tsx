import * as React from 'react'

import { connect } from 'react-redux';
import { AppState, Cell, isGraphCell } from '../store'
import GraphCell from './GraphCell';
import CodeCell from './CodeCell'

interface CellViewProps {
  cell: Cell
}

class CellView extends React.Component<CellViewProps, {}> {
  render() {
    const { cell } = this.props

    if (isGraphCell(cell)) {
      return <GraphCell uuid={cell.uuid}/>
    }

    return <CodeCell uuid={cell.uuid}/>
  }
}

function mapState(state: AppState, ownProps: any): CellViewProps {
  const { uuid } = ownProps
  const cell = state.cells[uuid]

  return {
    cell
  }
}

export default connect(mapState, {})(CellView)