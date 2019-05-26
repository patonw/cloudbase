import { Action } from "redux"
import { Workbook } from '../types'

interface WorkbooksState {
  [key: string]: Workbook
}

const initialWorkbookState = {
  "1234-345345": {
    name: "Default workbook",
    uuid: "1234-345345",
    sheets: ["w049tu34589", "76m9rj8678r"],
  }
}

export default function workbooksReducer(state: WorkbooksState = initialWorkbookState, action: Action) {
  return state
}