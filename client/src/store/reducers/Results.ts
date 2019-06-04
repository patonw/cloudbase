import { Action } from "redux"
import produce from "immer"

import { CellResult } from '../types'

import { LoadWorksheetAction, LOAD_WORKSHEET, AsyncStatus, LoadWorksheetActionData, EXECUTE_CELL, ExecuteCellAction } from '../actions'
import * as fp from 'lodash/fp'

interface ResultsState {
  [key: string]: CellResult
}

function loadWorksheetReducer(draft: ResultsState, action: LoadWorksheetAction) {
  switch (action.status) {
    case AsyncStatus.Success:
      const data = action.data as LoadWorksheetActionData
      data.cells.forEach(cell => {
        const { uuid } = cell
        draft[uuid] = draft[uuid] || {}
      })

      break
  }
}

function executeCellReducer(draft: ResultsState, action: ExecuteCellAction) {
  const { uuid, status, data, json, error } = action
  const cell = draft[uuid] = draft[uuid] || {}

  switch (status) {
    case AsyncStatus.Pending:
      cell.progress = 1
      delete cell.error
      break
    case AsyncStatus.Success:
      delete cell.progress
      draft[uuid] = {
        ...cell,
        data,
        json,
      }
      break
    case AsyncStatus.Failure:
      delete cell.progress
      if (!error.message) {
        error.message = fp.flow(
          fp.map((it: Error) => it.message),
          fp.join("\n\n")
        )(error)
      }

      cell.error = error
      break
  }
}

export default function resultsReducer(state: ResultsState = {}, action: Action) {
  return produce(state, draft => {
    switch (action.type) {
      case LOAD_WORKSHEET:
        return loadWorksheetReducer(draft, action as LoadWorksheetAction)
      case EXECUTE_CELL:
        return executeCellReducer(draft, action as ExecuteCellAction)
    }
  })
}