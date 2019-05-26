import { Action } from "redux"
import produce from "immer"

import { LoadWorksheetAction, LOAD_WORKSHEET, AsyncStatus, LoadWorksheetActionData } from '../actions'

import { Cell } from '../types'

interface CellsState {
  [key: string]: Cell
}

function loadWorksheetReducer(draft: CellsState, action: LoadWorksheetAction) {
  switch (action.status) {
    case AsyncStatus.Success:
      const data = action.data as LoadWorksheetActionData
      data.cells.forEach(cell => {
        const {uuid, script} = cell
        draft[uuid] = {
          uuid,
          script,
          worksheet: data.uuid,
          lang: "kotlin",
        }
      })

      break
  }
}
export default function cellsReducer(state: CellsState = {}, action: Action) {
  return produce(state, draft => {
    switch (action.type) {
      case LOAD_WORKSHEET:
        return loadWorksheetReducer(draft, action as LoadWorksheetAction)
    }
  })
}