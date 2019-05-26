import produce from "immer"
import { UUID } from '../types'

import {LoadWorksheetAction, LOAD_WORKSHEET} from '../actions'

interface ActiveState {
  workbook: UUID,
  worksheet: UUID | null,
}

const initialActiveState = {
  workbook: "1234-345345",
  worksheet: null,
}

export default function viewStateReducer(state: ActiveState = initialActiveState, action: LoadWorksheetAction) {
  return produce(state, draft => {
    switch (action.type) {
      case LOAD_WORKSHEET:
        draft.worksheet = action.uuid
    }
  })
}
