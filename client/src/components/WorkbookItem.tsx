import * as React from 'react'
import { connect } from 'react-redux';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLock, faLockOpen } from '@fortawesome/free-solid-svg-icons'
import { loadWorksheet, createWorksheet, lockWorksheet, unlockWorksheet } from '../store'
import { Worksheet, UUID, AppState } from '../store'

interface WorkbookItemProps {
  uuid: UUID,
  activeItem: boolean,
  locked: boolean,
  worksheet: Worksheet,
  loadWorksheet: typeof loadWorksheet,
  createWorksheet: typeof createWorksheet,
  lockWorksheet: typeof lockWorksheet,
  unlockWorksheet: typeof unlockWorksheet,
}

/*eslint-disable jsx-a11y/anchor-is-valid */
class WorkbookItem extends React.Component<WorkbookItemProps, {}> {
  renderSubmenu = () => {
    const { locked, unlockWorksheet, lockWorksheet } = this.props

    const lockable = (name: string, handler: () => void) => locked
      ? <li className="has-text-grey-light"><FontAwesomeIcon icon={faLock} /> {name}</li>
      : <li><a className="is-paddingless" onClick={handler}><FontAwesomeIcon icon={faLockOpen} /> {name}</a></li>

    return (
      <ul>
        <li>Restart</li>
        <li>
          {
            locked
            ? <a className="is-paddingless" onClick={unlockWorksheet}>Unlock</a>
            : <a className="is-paddingless" onClick={lockWorksheet}>Lock</a>
          }
        </li>
        <hr className="is-marginless" />
        {lockable("Rename", () => { })}
        {lockable("Delete", () => { })}
      </ul>
    )
  }

  render() {
    const { activeItem, worksheet, loadWorksheet } = this.props
    const styleClass = activeItem ? "is-active" : ""
    const loadHandler = () => loadWorksheet(worksheet.uuid)

    return (
      <li>
        <a className={styleClass} onClick={loadHandler}>
          {worksheet.name}
        </a>
        {activeItem && this.renderSubmenu()}
      </li>
    )
  }
}

function mapState(state: AppState, ownProps: any) {
  const uuid = ownProps.uuid
  const sheetId = state.view.worksheet
  const worksheet = state.worksheets[uuid]

  return ({
    uuid,
    locked: state.view.locked,
    activeItem: uuid === sheetId,
    worksheet,
  })
}

const mapDispatch = {
  loadWorksheet,
  createWorksheet,
  lockWorksheet,
  unlockWorksheet,
}

export default connect(mapState, mapDispatch)(WorkbookItem)