import * as React from 'react'
import fp from 'lodash/fp'
import { connect } from 'react-redux';
import { UnControlled as CodeMirror } from 'react-codemirror2';
import { AppState, CodeCell, executeCell, UUID, CellResult } from '../store'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlay } from '@fortawesome/free-solid-svg-icons'

import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/darcula.css';
import 'codemirror/addon/edit/matchbrackets';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/clike/clike';

import styles from './CodeCell.module.scss'

interface CodeCellViewProps extends CodeCell {
  executeCell: typeof executeCell
  process: UUID,
  result: CellResult,
}

class CodeCellView extends React.Component<CodeCellViewProps, {}> {
  render() {
    const { uuid, script, result, process, executeCell } = this.props
    const scriptHandler = () => executeCell(process, uuid)

    return (
      <div className={styles.cellContainer}>
        <div className="columns">
          <div className="column is-narrow has-text-centered">
            <button className={`button is-small ${result.progress && "is-loading"}`} onClick={scriptHandler}>
              <FontAwesomeIcon icon={faPlay} />
            </button>

          </div>
          <div className="column">
            <CodeMirror value={script}
              options={{
                lineNumbers: true,
                matchBrackets: true,
                mode: "text/x-kotlin",
                theme: "darcula",
                extraKeys: {
                  "Ctrl-Enter": scriptHandler
                }
              }}
            />

            {result.progress &&
              <progress className={`${styles.progressbar} is-info progress`} max="100">60%</progress>
            }

            <div className={styles.resultBlock}>
              {result.data &&
                <pre>Result = {result.data}</pre>
              }

              {result.error &&
                <article className="message is-danger">
                  <div className="message-header">
                    <p>Error</p>
                  </div>
                  <pre className="message-body">
                    {result.error}
                  </pre>
                </article>
              }
            </div>
          </div>
        </div>

      </div>
    )
  }
}

function mapState(state: AppState, ownProps: any): CodeCellViewProps {
  const { uuid } = ownProps
  const data = state.cells[uuid]
  const { worksheet } = data
  const { process } = state.worksheets[worksheet]

  const result = state.results[uuid]

  return fp.merge(ownProps, {
    ...data,
    process,
    result,
  })
}

const mapDispatch = {
  executeCell
}

export default connect(mapState, mapDispatch)(CodeCellView)