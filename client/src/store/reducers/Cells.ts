import { Action } from "redux"
import produce from "immer"
import fp from 'lodash/fp'

import { LoadWorksheetAction, LOAD_WORKSHEET, AsyncStatus, LoadWorksheetActionData, AFTER_COMMIT, AfterCommitAction, INSERT_CODE_CELL, InsertCellResult } from '../actions'

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

function insertCellReducer(draft: CellsState, action: InsertCellResult) {
  if (action.status !== AsyncStatus.Success)
    return

  const { cell } = action.data
  const { uuid } = cell
  draft[uuid] = cell
}

export default function cellsReducer(state: CellsState = {}, action: Action) {
  return produce(state, draft => {
    switch (action.type) {
      case LOAD_WORKSHEET:
        return loadWorksheetReducer(draft, action as LoadWorksheetAction)
      case INSERT_CODE_CELL:
        return insertCellReducer(draft, action as InsertCellResult)
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