import { combineReducers } from "redux"

import cellsReducer from './Cells'
import viewStateReducer from './ViewState'
import workbooksReducer from './Workbooks'
import worksheetsReducer from './Worksheets'
import resultsReducer from "./Results";
import dirtyReducer from "./Dirty";

export const rootReducer = combineReducers({
  view: viewStateReducer,
  workbooks: workbooksReducer,
  worksheets: worksheetsReducer,
  cells: cellsReducer,
  results: resultsReducer,
  dirty: dirtyReducer,
})

export type AppState = ReturnType<typeof rootReducer>