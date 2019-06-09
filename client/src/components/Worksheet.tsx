import * as React from 'react'

import { connect } from 'react-redux';
import { AppState, Worksheet, insertCodeCell, insertGraphCell } from '../store'

import CellView from './CellView'

interface WorksheetProps extends Worksheet {
  locked: boolean,
  loading: boolean,
  name: string,
  insertCodeCellDispatch: typeof insertCodeCell
  insertGraphCellDispatch: typeof insertGraphCell
}

class WorksheetView extends React.Component<WorksheetProps, {}> {
  render() {
    const { uuid, cells, loading, insertCodeCellDispatch, insertGraphCellDispatch } = this.props

    const appendCodeHandler = () => insertCodeCellDispatch(uuid)
    const appendGraphHandler = () => insertGraphCellDispatch(uuid)

    // TODO if worksheet is selected but still waiting on fetch, show spinner
    if (loading) {
      return (
        <progress className={`is-info progress`} max="100">60%</progress>
      )
    }

    return (
      <div>
        {cells.map((it) => <CellView key={it} uuid={it} />)}
        <button className="button" onClick={appendCodeHandler}>Append Cell</button>
        <button className="button" onClick={appendGraphHandler}>Append Graph</button>
      </div>
    )
  }
}

function mapState(state: AppState, ownProps: any) {
  const { uuid } = ownProps
  const worksheet = state.worksheets[uuid]
  const { name, workbook, cells, process } = worksheet
  const loading = state.view.loading

  return {
    uuid,
    name,
    workbook,
    locked: state.view.locked,
    cells,
    process,
    loading,
  }
}

const mapDispatch = {
  insertCodeCellDispatch: insertCodeCell,
  insertGraphCellDispatch: insertGraphCell,
}

export default connect(mapState, mapDispatch)(WorksheetView)