import * as React from 'react'
import fp from 'lodash/fp'

import { connect } from 'react-redux';
import { AppState, CodeCell, executeCell, UUID } from '../store'

interface CodeCellViewProps extends CodeCell {
  executeCell: typeof executeCell
  process: UUID
}

class CodeCellView extends React.Component<CodeCellViewProps, {}> {
  render() {
    const { uuid, script, result, process, executeCell } = this.props

    return (
      <div>
        <div>This is a Code cell</div>
        <code>{script}</code>
        <button disabled={!process} onClick={() => executeCell(process, uuid)}>Execute</button>
        {result && <div>Result = {result}</div>}
      </div>
    )
  }
}

function mapState(state: AppState, ownProps: any): CodeCellViewProps {
  const { uuid } = ownProps
  const data = state.cells[uuid]
  const {worksheet} = data
  const { process } = state.worksheets[worksheet]

  return fp.merge(ownProps, {
    ...data,
    process
  })
}

const mapDispatch = {
  executeCell
}

export default connect(mapState, mapDispatch)(CodeCellView)