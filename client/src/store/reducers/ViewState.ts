import produce from "immer"
import { UUID } from '../types'
import { Action } from "redux"

import { isAsyncAction, LoadWorksheetAction, LOAD_WORKSHEET, AsyncStatus, LOAD_TOC, LoadTOCAction, LoadTOCACtionData } from '../actions'

interface ViewState {
  workbook?: UUID,
  worksheet?: UUID,
  loading: boolean,
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
      const data = action.data as LoadTOCACtionData
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
        // TODO show an error
        console.log("Some kind of error", action.error)
      }
    }
    switch (action.type) {
      case LOAD_WORKSHEET:
        return loadWorksheetReducer(draft, action as LoadWorksheetAction)
      case LOAD_TOC:
        return loadTOCReducer(draft, action as LoadTOCAction)
    }
  })
}