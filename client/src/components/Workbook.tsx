import * as React from 'react'

import { loadWorksheet, createWorksheet } from '../store'
import { Workbook, Worksheet, UUID, AppState } from '../store'
import { connect } from 'react-redux';

import WorkbookItem from './WorkbookItem'
import WorksheetView from './Worksheet'

interface WorkbookProps {
  workbook: Workbook,
  sheets: Worksheet[],
  worksheet?: UUID,
  loadWorksheet: typeof loadWorksheet,
  createWorksheet: typeof createWorksheet,
  loading: boolean,
}

interface WorkbookViewState {
  showCreateWorksheet: boolean
}

class WorkbookView extends React.Component<WorkbookProps, WorkbookViewState> {
  constructor(props: any) {

    super(props)
    this.state = {
      showCreateWorksheet: false,
    }
  }

  renderNameModal() {
    const { workbook, createWorksheet } = this.props
    const { showCreateWorksheet } = this.state
    const nameRef = React.createRef<HTMLInputElement>()

    const closeModal = () => {
      this.setState({
        ...this.state,
        showCreateWorksheet: false,
      })
    }

    const submit = (ev: React.FormEvent<HTMLFormElement>) => {
      ev.preventDefault()
      const nameField = nameRef.current

      if (!nameField)
        return

      createWorksheet(workbook.uuid, nameField.value)

      nameField.value = ""
      closeModal()
    }

    return (
      <div className={`modal ${showCreateWorksheet && "is-active"}`}>
        <div className="modal-background"></div>
        <div className="modal-content">
          <article className="message">
            <div className="message-header">
              <p>Create Worksheet</p>
              <button className="delete" aria-label="delete"></button>
            </div>
            <div className="message-body">
              <form onSubmit={submit}>
                <div className="field">
                  <label className="label">Name</label>
                  <div className="control">
                    <input className="input" type="text" placeholder="Worksheet Name" ref={nameRef} />
                  </div>
                </div>

                <div className="field is-grouped has-text-right">
                  <div className="control">
                    <button className="button is-link" type="submit">Submit</button>
                  </div>
                  <div className="control">
                    <button className="button is-text" type="button" onClick={closeModal}>Cancel</button>
                  </div>
                </div>
              </form>
            </div>
          </article>
        </div>
        <button className="modal-close is-large" aria-label="close" onClick={closeModal}></button>
      </div>
    )
  }

  render() {
    if (this.props.loading) {
      return <progress className={`is-info progress`} max="100">60%</progress>
    }

    const openModal = () => {
      this.setState({
        ...this.state,
        showCreateWorksheet: true,
      })
    }

    const { worksheet, sheets } = this.props

    return (
      <div className="container">
        <div className="columns">
          <div className="column is-narrow">
            <aside className="menu box">
              <p className="menu-label">
                Worksheets
            </p>
              <ul className="menu-list">
                {
                  sheets.map((it) => <WorkbookItem key={it.uuid} uuid={it.uuid} />)
                }
              </ul>
              <hr />
              <button className="button" onClick={openModal}>New...</button>
            </aside>
          </div>
          <div className="column">
            {this.renderNameModal()}
            {worksheet && <WorksheetView uuid={worksheet} />}
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

const mapDispatch = {
  loadWorksheet,
  createWorksheet,
}

export default connect(mapState, mapDispatch)(WorkbookView)