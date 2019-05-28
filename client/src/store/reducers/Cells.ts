import { Action } from "redux"
import produce from "immer"
import fp from 'lodash/fp'

import { LoadWorksheetAction, LOAD_WORKSHEET, AsyncStatus, LoadWorksheetActionData, EXECUTE_CELL, ExecuteCellAction } from '../actions'

import { Cell } from '../types'

interface CellsState {
  [key: string]: Cell
}

function loadWorksheetReducer(draft: CellsState, action: LoadWorksheetAction) {
  switch (action.status) {
    case AsyncStatus.Success:
      const data = action.data as LoadWorksheetActionData
      data.cells.forEach(cell => {
        const { uuid, script } = cell
        draft[uuid] = fp.merge(draft[uuid] || {}, {
          uuid,
          script,
          worksheet: data.uuid,
          lang: "kotlin",
        })
      })

      break
  }
}

function executeCellReducer(draft: CellsState, action: ExecuteCellAction) {
  switch (action.status) {
    case AsyncStatus.Success:
      const { uuid, data } = action
      draft[uuid].result = data
  }
}

export default function cellsReducer(state: CellsState = {}, action: Action) {
  return produce(state, draft => {
    switch (action.type) {
      case LOAD_WORKSHEET:
        return loadWorksheetReducer(draft, action as LoadWorksheetAction)
      case EXECUTE_CELL:
        return executeCellReducer(draft, action as ExecuteCellAction)
    }
  })
}