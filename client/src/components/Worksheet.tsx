import * as React from 'react'

import { connect } from 'react-redux';
import { AppState, Worksheet } from '../store'

import CellView from './CellView'

interface WorksheetProps extends Worksheet {
  loading: boolean,
}

class WorksheetView extends React.Component<WorksheetProps, {}> {

  render() {
    const { cells, loading } = this.props

    // TODO if worksheet is selected but still waiting on fetch, show spinner
    if (loading) {
      return (
        <div>Loading...</div>
      )
    }

    return (
      <div>
        {cells.map((it) => <CellView key={it} uuid={it} />)}
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
    cells,
    process,
    loading,
  }
}

const mapDispatch = {
}

export default connect(mapState, mapDispatch)(WorksheetView)