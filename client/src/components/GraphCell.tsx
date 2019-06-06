import * as React from 'react'
import fp from 'lodash/fp'

import { produce } from 'immer'
import ErrorBoundary from 'react-error-boundary'
import { connect } from 'react-redux';
import { UnControlled as CodeMirror } from 'react-codemirror2';
import VegaLite from 'react-vega-lite'

import { AppState, GraphCell, CellResult, executeCell, dirtyGraph, UUID } from '../store'
import CodeCell from './CodeCell'

import styles from './CodeCell.module.scss'

import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/darcula.css';
import 'codemirror/addon/edit/matchbrackets';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/clike/clike';


const jsonParse = fp.memoize((spec: string) => {
  try {
    return JSON.parse(spec)
  }
  catch (error) {
    return error
  }
})

interface ComponentState {
  showGraph: boolean,
  runCount: number,
}

interface GraphCellViewProps extends GraphCell {
  result: CellResult,
  executeCell: typeof executeCell,
  dirtyGraph: typeof dirtyGraph,
  process: UUID,
}
/*eslint-disable jsx-a11y/anchor-is-valid */
// On script execute, render result using Vega with spec
// Result must be a list or array of objects
class GraphCellView extends React.Component<GraphCellViewProps, ComponentState> {
  constructor(props: any) {
    super(props)
    this.state = {
      showGraph: true,
      runCount: 0,
    }
  }

  componentWillReceiveProps(nextProps: GraphCellViewProps) {
    if (nextProps.spec === this.props.spec) {
      return
    }

    this.setState(produce(this.state, draft => {
      draft.runCount += 1
    }))
  }

  runHandler() {
    const { uuid, process, executeCell } = this.props

    executeCell(process, uuid)
  }

  renderCodeTab() {
    const { uuid } = this.props
    return (<div>
      <CodeCell embed={true} uuid={uuid} />
    </div>)
  }

  renderGraphResult() {
    const { runCount } = this.state
    const { spec, result } = this.props
    const jsonSpec = jsonParse(spec)

    if (fp.isError(jsonSpec)) {
      return <div>Invalid spec <pre>{spec} </pre></div>
    }

    if (result.json) {
      const data = {
        values: result.json()
      }

      return (
        <div className={styles.graphResult}>
          <ErrorBoundary key={runCount}>
            <VegaLite spec={jsonSpec} data={data} />
          </ErrorBoundary>
        </div>
      )
    }

    return null
  }

  renderGraphTab() {
    const { uuid, spec, dirtyGraph } = this.props
    const changeHandler = (cm: any, data: any, value: any) => {
      if (this.props.spec !== value) {
        dirtyGraph(uuid, value)
      }
    }

    return (
      <div>

        <CodeMirror value={spec}
          options={{
            lineNumbers: true,
            matchBrackets: true,
            mode: "application/json",
            theme: "darcula",
            extraKeys: {
              "Ctrl-Enter": () => this.runHandler()
            }
          }}
          onChange={changeHandler}
        />
        {this.renderGraphResult()}
      </div>
    )
  }

  // TODO commit script/spec when switching tabs or at least use dirty data for display
  graphTab = () => { this.setState({ ...this.state, showGraph: true }) }
  codeTab = () => { this.setState({ ...this.state, showGraph: false }) }

  // TODO redraw button that skips script execution and rerenders graph
  render() {
    const { showGraph } = this.state

    return (
      <div>
        <div className="tabs">
          <ul>
            <li className={showGraph ? "is-active" : ""}><a onClick={this.graphTab}>Graph</a></li>
            <li className={!showGraph ? "is-active" : ""}><a onClick={this.codeTab}>Data</a></li>
          </ul>
        </div>
        {
          showGraph ?
            this.renderGraphTab()
            : this.renderCodeTab()
        }
      </div>
    )
  }
}
/*eslint-enable */

function mapState(state: AppState, ownProps: any) {
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
  dirtyGraph,
}

export default connect(mapState, mapDispatch)(GraphCellView)