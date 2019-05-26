import { Action } from "redux"

import { Cell } from '../types'

interface CellsState {
  [key: string]: Cell
}

const initialCellsState = {
  "45bn892vn90": {
    uuid: "45bn892vn90",
    worksheet: "w049tu34589",
    lang: "kotlin",
    script: "listOf(1,2,3)",
    result: null,
  },
  "endnut56nnd56u": {
    uuid: "endnut56nnd56u",
    worksheet: "w049tu34589",
    lang: "kotlin",
    script: "listOf(1,8,3)",
    result: null,
  },
  "r6rm68r76m8r76m8": {
    uuid: "r6rm68r76m8r76m8",
    worksheet: "w049tu34589",
    lang: "kotlin",
    script: "data class Foobar(val x)",
    result: null,
  },
  "q34v4qb4q3456w467n": {
    uuid: "q34v4qb4q3456w467n",
    worksheet: "w049tu34589",
    lang: "kotlin",
    script: "listOf(1,2,3)",
    result: null,
  },
}

export default function cellsReducer(state: CellsState = initialCellsState, action: Action) {
  return state
}