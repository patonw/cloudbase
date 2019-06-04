import * as fp from 'lodash/fp'
import produce from "immer"

import { UUID } from '../types'
import { Action } from "redux"

import { isAsyncAction, LoadWorksheetAction, LOAD_WORKSHEET, AsyncStatus, LOAD_TOC, LoadTOCAction, LoadTOCActionData, CLEAR_ERROR } from '../actions'

interface ViewState {
  workbook?: UUID,
  worksheet?: UUID,
  loading: boolean,
  errMsg?: string,
}

const initialViewState = {
  loading: false,
}

function loadWorksheetReducer(draft: ViewState, action: LoadWorksheetAction) {
  draft.worksheet = action.uuid
  switch (action.status) {
    case AsyncStatus.Pending:
      draft.loading = true
      break
    case AsyncStatus.Failure:
      draft.loading = false
      break
    case AsyncStatus.Cached:
    case AsyncStatus.Success:
      draft.loading = false
      break
  }
}

function loadTOCReducer(draft: ViewState, action: LoadTOCAction) {
  switch (action.status) {
    case AsyncStatus.Pending:
      draft.loading = true
      break
    case AsyncStatus.Failure:
      draft.loading = false
      break
    case AsyncStatus.Cached:
    case AsyncStatus.Success:
      const data = action.data as LoadTOCActionData
      const {uuid} = data.workbooks[0] // TODO null safety
      draft.workbook = uuid

      draft.loading = false
      break
  }
}

export default function viewStateReducer(state: ViewState = initialViewState, action: Action) {
  return produce(state, draft => {
    if (isAsyncAction(action)) {
      if (action.status === AsyncStatus.Failure) {
        console.error("Async error", action)
        const { error } = action

        if (!error.message) {
          error.message = fp.flow(
            fp.map((it: Error) => it.message),
            fp.join("\n\n")
          )(error)
        }
        draft.errMsg = error.message
      }
    }

    switch (action.type) {
      case CLEAR_ERROR:
        delete draft.errMsg
        break
      case LOAD_WORKSHEET:
        return loadWorksheetReducer(draft, action as LoadWorksheetAction)
      case LOAD_TOC:
        return loadTOCReducer(draft, action as LoadTOCAction)
    }
  })
}