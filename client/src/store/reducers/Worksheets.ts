import produce from "immer"
import fp from 'lodash/fp'

import { Action } from "redux"
import { Worksheet } from '../types'

import {
  AsyncStatus,
  LOAD_TOC, LoadTOCAction, LoadTOCActionData,
  DELETE_CELL, DeleteCellAction,
  INSERT_CODE_CELL, InsertCellResult,
  REORDER_WORKSHEET, ReorderWorksheetAction,
  CREATE_PROCESS, CreateProcessAction,
  LOAD_WORKSHEET, LoadWorksheetAction, LoadWorksheetActionData,
} from '../actions'

interface WorksheetsState {
  [key: string]: Worksheet
}

function loadWorksheetReducer(draft: WorksheetsState, action: LoadWorksheetAction) {
  switch (action.status) {
    case AsyncStatus.Success:
      // TODO normalize etc,
      const data = action.data as LoadWorksheetActionData
      const { uuid } = action

      draft[uuid] = fp.merge(draft[uuid] || {}, {
        ...data,
        cells: data.cells.map(it => it.uuid)
      })
      break
  }
}

function loadTOCReducer(draft: WorksheetsState, action: LoadTOCAction) {
  switch (action.status) {
    case AsyncStatus.Success:
      const data = action.data as LoadTOCActionData
      data.sheets.forEach(it => {
        const { uuid, name, workbook } = it
        draft[it.uuid] = {
          uuid,
          name,
          workbook,
          cells: []
        }
      })

      fp.toPairs(data.processes).forEach(([pid, wsid]) => {
        draft[wsid].process = pid
      })
  }
}

function deleteCellReducer(draft: WorksheetsState, action: DeleteCellAction) {
  const { sheetId, cellId } = action.data
  switch (action.status) {
    case AsyncStatus.Success:
      draft[sheetId].cells = draft[sheetId].cells.filter(it => it !== cellId)
  }
}

function insertCellReducer(draft: WorksheetsState, action: InsertCellResult) {
  if (action.status !== AsyncStatus.Success)
    return
  console.log("Insert cell worksheet reducer", action)

  const { sheetId, cells } = action.data

  // TODO check sheetId exists first

  const sheet = draft[sheetId]
  sheet.cells = cells
}

function reorderWorksheetReducer(draft: WorksheetsState, action: ReorderWorksheetAction) {
  if (action.status !== AsyncStatus.Success)
    return

  const { sheetId, cells } = action.data
  const sheet = draft[sheetId]
  if (!!sheet)
    sheet.cells = cells
}

export default function worksheetsReducer(state: WorksheetsState = {}, action: Action) {
  return produce(state, draft => {
    switch (action.type) {
      case LOAD_WORKSHEET:
        return loadWorksheetReducer(draft, action as LoadWorksheetAction)
      case LOAD_TOC:
        return loadTOCReducer(draft, action as LoadTOCAction)
      case DELETE_CELL:
        return deleteCellReducer(draft, action as DeleteCellAction)
      case INSERT_CODE_CELL:
        return insertCellReducer(draft, action as InsertCellResult)
      case REORDER_WORKSHEET:
        return reorderWorksheetReducer(draft, action as ReorderWorksheetAction)
      case CREATE_PROCESS: {
        const act = action as CreateProcessAction
        if (act.status === AsyncStatus.Success) {
          const { sheetId, procId } = act.data
          draft[sheetId].process = procId
        }
      }
    }
  })
}