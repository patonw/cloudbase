import { Action } from "redux"
import produce from "immer"
import fp from 'lodash/fp'

import { LoadWorksheetAction, LOAD_WORKSHEET, AsyncStatus, LoadWorksheetActionData, AFTER_COMMIT, AfterCommitAction } from '../actions'

import { Cell, isGraphCell } from '../types'

interface CellsState {
  [key: string]: Cell
}

function loadWorksheetReducer(draft: CellsState, action: LoadWorksheetAction) {
  switch (action.status) {
    case AsyncStatus.Success:
      const data = action.data as LoadWorksheetActionData
      data.cells.forEach(cell => {
        const { uuid, script, spec } = cell
        draft[uuid] = fp.merge(draft[uuid] || {}, {
          uuid,
          script,
          worksheet: data.uuid,
          lang: "kotlin",
          spec
        })
      })

      break
  }
}

export default function cellsReducer(state: CellsState = {}, action: Action) {
  return produce(state, draft => {
    switch (action.type) {
      case LOAD_WORKSHEET:
        return loadWorksheetReducer(draft, action as LoadWorksheetAction)
      case AFTER_COMMIT: {
        const { data } = (action as AfterCommitAction)
        const { uuid } = data
        const target = draft[uuid]
        if (data.script) {
          target.script = data.script
        }

        if (isGraphCell(data) && isGraphCell(target)) {
          if (data.spec) {
            target.spec = data.spec
          }
        }
      }
    }
  })
}