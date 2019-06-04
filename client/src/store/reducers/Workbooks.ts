import { Action } from "redux"
import { Workbook } from '../types'
import produce from "immer"
import { LOAD_TOC, AsyncStatus, LoadTOCAction, LoadTOCActionData } from '../actions'

interface WorkbooksState {
  [key: string]: Workbook
}

export default function workbooksReducer(state: WorkbooksState = {}, action: Action) {
  return produce(state, draft => {
    if (action.type === LOAD_TOC) {
      const _action = action as LoadTOCAction
      switch (_action.status) {
        case AsyncStatus.Success:
          const toc = _action.data as LoadTOCActionData
          toc.workbooks.forEach(it => {
            const { uuid } = it
            draft[uuid] = it
          })
      }
    }
  })
}