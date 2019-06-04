import * as React from 'react'
import fp from 'lodash/fp'
import { connect } from 'react-redux';
import { UnControlled as CodeMirror } from 'react-codemirror2';
import { AppState, CodeCell, executeCell, UUID, CellResult, dirtyCell } from '../store'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlay } from '@fortawesome/free-solid-svg-icons'

import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/darcula.css';
import 'codemirror/addon/edit/matchbrackets';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/clike/clike';

import styles from './CodeCell.module.scss'

interface CodeCellViewProps extends CodeCell {
  embed?: boolean,
  executeCell: typeof executeCell,
  dirtyCell: typeof dirtyCell,
  process: UUID,
  result: CellResult,
}

// TODO toggle for JSON formatted results
class CodeCellView extends React.Component<CodeCellViewProps, {}> {
  render() {
    const { uuid, script, result, process, executeCell, dirtyCell } = this.props
    const scriptHandler = () => executeCell(process, uuid)
    const changeHandler = (cm: any, data: any, value: any) => {
      const { script } = this.props
      if (script !== value){
        return dirtyCell(uuid, value)
      }
    }

    return (
      <div className={styles.cellContainer}>
        <div className="columns">
          {
            !this.props.embed &&
            <div className="column is-narrow has-text-centered">
              <button className={`button is-small ${result.progress && "is-loading"}`} onClick={scriptHandler}>
                <FontAwesomeIcon icon={faPlay} />
              </button>
            </div>
          }

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
              onChange={changeHandler}
            />

            {result.progress &&
              <progress className={`${styles.progressbar} is-info progress`} max="100">60%</progress>
            }

            <div className={styles.resultBlock}>
              {result.data &&
                <pre>{result.data}</pre>
              }

              {result.error &&
                <article className="message is-danger">
                  <div className="message-header">
                    <p>Error</p>
                  </div>
                  <pre className="message-body">
                    {
                      (result.error as Error).message
                    }
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
  executeCell,
  dirtyCell,
}

export default connect(mapState, mapDispatch)(CodeCellView)