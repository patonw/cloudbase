import * as React from 'react'

import { connect } from 'react-redux';
import { UUID, AppState, Cell } from '../store'

import CodeCell from './CodeCell'

interface WorksheetProps {
  uuid: UUID,
  workbook: UUID,
  name: string,
  cells: Cell[],
  loading: boolean,
}

class WorksheetView extends React.Component<WorksheetProps, {}> {
  render() {
    const { workbook, cells, name, loading } = this.props

    // TODO if worksheet is selected but still waiting on fetch, show spinner
    if (loading) {
      return (
        <div>Loading...</div>
      )
    }

    return (
      <div>
        Worksheet "{name}" from workbook {workbook}
        {cells.map((it) =>
          <CodeCell key={it.uuid} {...it}/>
        )}
      </div>
    )
  }
}

function mapState(state: AppState, ownProps: any) {
  const { uuid } = ownProps
  const worksheet = state.worksheets[uuid]
  const { name, workbook, cells } = worksheet

  const cellData = cells.map((it) => state.cells[it])
  const loading = false

  return {
    uuid,
    name,
    workbook,
    cells: cellData,
    loading,
  }
}

function mapDispatch(dispatch: any) {
  return {}
}

export default connect(mapState, mapDispatch)(WorksheetView)