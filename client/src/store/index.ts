import { combineReducers } from "redux"

import cellsReducer from './reducers/Cells'
import viewStateReducer from './reducers/ViewState'
import workbooksReducer from './reducers/Workbooks'
import worksheetsReducer from './reducers/Worksheets'
import resultsReducer from "./reducers/Results";

export * from './types'
export * from './actions'

export const rootReducer = combineReducers({
  view: viewStateReducer,
  workbooks: workbooksReducer,
  worksheets: worksheetsReducer,
  cells: cellsReducer,
  results: resultsReducer,
})

export type AppState = ReturnType<typeof rootReducer>
