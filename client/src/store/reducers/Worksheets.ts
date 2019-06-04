import produce from "immer"
import { Action } from "redux"
import { Worksheet } from '../types'

import { LoadWorksheetAction, LOAD_WORKSHEET, AsyncStatus, LoadTOCAction, LOAD_TOC, LoadTOCActionData, LoadWorksheetActionData } from '../actions'
import fp from 'lodash/fp'
interface WorksheetsState {
  [key: string]: Worksheet
}

function loadWorksheetReducer(draft: WorksheetsState, action: LoadWorksheetAction) {
  switch (action.status) {
    case AsyncStatus.Success:
      // TODO normalize etc,
      const data = action.data as LoadWorksheetActionData
      const {uuid} = action

      draft[uuid] = fp.merge(draft[uuid] || {},{
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

      fp.toPairs(data.processes).forEach(([pid,wsid]) => {
        draft[wsid].process = pid
      })
  }
}

export default function worksheetsReducer(state: WorksheetsState = {}, action: Action) {
  return produce(state, draft => {
    switch (action.type) {
      case LOAD_WORKSHEET:
        return loadWorksheetReducer(draft, action as LoadWorksheetAction)
      case LOAD_TOC:
        return loadTOCReducer(draft, action as LoadTOCAction)
    }
  })
}