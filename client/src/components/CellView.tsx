import * as React from 'react'

import { connect } from 'react-redux';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlay, faTrashAlt, faArrowCircleDown, faArrowCircleUp } from '@fortawesome/free-solid-svg-icons'

import { AppState, Cell, isGraphCell, executeCell, deleteCell, CellResult, Worksheet, reorderWorksheet } from '../store'
import GraphCell from './GraphCell';
import CodeCell from './CodeCell'

import styles from './CodeCell.module.scss'

interface CellViewProps {
  cell: Cell
  process: string,

  worksheet: Worksheet,
  executeCell: typeof executeCell,
  deleteCell: typeof deleteCell,
  reorderWorksheet: typeof reorderWorksheet,
  result: CellResult,
}

class CellView extends React.Component<CellViewProps, {}> {
  render() {
    const { cell, result, worksheet } = this.props
    const { process, executeCell, deleteCell, reorderWorksheet } = this.props
    const { uuid, } = cell

    const moveUp = () => {
      let order = worksheet.cells
      const pos = order.findIndex(it => it === uuid)

      if (pos > 0) {
        [order[pos-1], order[pos]] = [order[pos], order[pos-1]]
        reorderWorksheet(worksheet.uuid, order)
      }
    }

    const moveDown = () => {
      let order = worksheet.cells
      const pos = order.findIndex(it => it === uuid)

      if (pos >= 0 && pos < order.length-2) {
        [order[pos+1], order[pos]] = [order[pos], order[pos+1]]
        reorderWorksheet(worksheet.uuid, order)
      }
    }

    const scriptHandler = () => executeCell(process, uuid)
    const trashHandler = () => deleteCell(worksheet.uuid, uuid)

    return <div className={styles.cellContainer}>
      <div className="columns">
        <div className="column is-narrow has-text-centered is-flex-touch">
          <button className={`button is-block is-small ${result.progress && "is-loading"}`} onClick={scriptHandler}>
            <FontAwesomeIcon icon={faPlay} />
          </button>
          <button className={`button is-block is-small`} onClick={trashHandler}>
            <FontAwesomeIcon icon={faTrashAlt} />
          </button>
          <button className={`button is-block is-small`} onClick={moveUp}>
            <FontAwesomeIcon icon={faArrowCircleUp} />
          </button>
          <button className={`button is-block is-small`} onClick={moveDown}>
            <FontAwesomeIcon icon={faArrowCircleDown} />
          </button>
        </div>
        <div className="column">
          {
            isGraphCell(cell) ?
              <GraphCell uuid={cell.uuid} />
              : <CodeCell uuid={cell.uuid} />
          }
        </div>
      </div>
    </div>
  }
}

function mapState(state: AppState, ownProps: any): CellViewProps {
  const { uuid } = ownProps
  const cell = state.cells[uuid]
  const worksheet = state.worksheets[cell.worksheet]
  const { process } = worksheet


  const result = state.results[uuid]
  return {
    ...ownProps,
    cell,
    reorderWorksheet,
    worksheet,
    process,
    result,
  }
}

const mapDispatch = {
  executeCell,
  deleteCell,
  reorderWorksheet,
}

export default connect(mapState, mapDispatch)(CellView)