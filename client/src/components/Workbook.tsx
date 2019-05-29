import * as React from 'react'

import {loadWorksheet} from '../store'
import { Workbook, Worksheet, UUID, AppState } from '../store'
import { connect } from 'react-redux';

import WorksheetView from './Worksheet'

interface WorkbookProps {
  workbook: Workbook,
  sheets: Worksheet[],
  worksheet?: UUID,
  loadWorksheet?: any,
  loading: boolean,
}

// TODO if worksheet is selected but still waiting on fetch, show spinner
class WorkbookView extends React.Component<WorkbookProps, any> {

  render() {
    if (this.props.loading) {
      return <div>Loading...</div>
    }

    const { worksheet, loadWorksheet, sheets } = this.props
    return (
      <div className="container">
        <div className="columns">
          <aside className="menu column is-narrow sidebar box">
            <p className="menu-label">
              Worksheets
            </p>
            <ul className="menu-list">
              {sheets.map((it) =>
                // eslint-disable-next-line
                <a key={it.uuid} className={it.uuid === worksheet? "is-active" : ""} onClick={() => loadWorksheet(it.uuid)}>
                  <li>{it.name}</li>
                </a>
              )}
            </ul>
          </aside>
          <div className="column">
            {worksheet && <WorksheetView uuid={worksheet}/> }
          </div>
        </div>
      </div>
    )
  }
}

function mapState(state: AppState, ownProps: any) {
  const uuid = ownProps.uuid
  const workbook = state.workbooks[uuid]
  const sheets = workbook.sheets.map((it) => state.worksheets[it])
  const loading = false

  return ({
    uuid,
    workbook,
    sheets,
    loading,
    worksheet: state.view.worksheet,
  })
}

const mapDispatch = (dispatch:any) => ({
  loadWorksheet: (uuid: any) => dispatch(loadWorksheet(uuid))
})

export default connect(mapState, mapDispatch)(WorkbookView)