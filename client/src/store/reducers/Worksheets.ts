import { Action } from "redux"
import { Worksheet } from '../types'

interface WorksheetsState {
  [key: string]: Worksheet
}

const initialWorksheetsState = {
  "w049tu34589": {
    uuid: "w049tu34589",
    workbook: "1234-345345",
    name: "First worksheet",
    cells: ["45bn892vn90", "endnut56nnd56u"],
  },
  "76m9rj8678r": {
    uuid: "76m9rj8678r",
    workbook: "1234-345345",
    name: "Second worksheet",
    cells: ["r6rm68r76m8r76m8", "q34v4qb4q3456w467n"],
  },
}

export default function worksheetsReducer(state: WorksheetsState = initialWorksheetsState, action: Action) {
  return state
}