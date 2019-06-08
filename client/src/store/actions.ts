import { Action } from "redux"
import { UUID, Cell } from './types'

export enum AsyncStatus {
  Cached,
  Pending,
  Success,
  Failure,
}

export const CLEAR_ERROR = 'CLEAR_ERROR'
export const START_APP = 'START_APP'
export const CREATE_WORKSHEET = 'CREATE_WORKSHEET'
export const CREATE_PROCESS = 'CREATE_PROCESS'
export const LOAD_TOC = 'LOAD_TOC'
export const LOAD_WORKSHEET = 'LOAD_WORKSHEET'
export const EXECUTE_CELL = 'EXECUTE_CELL'
export const CREATE_CELL = 'CREATE_CELL'
export const DIRTY_CELL = 'DIRTY_CELL'
export const DIRTY_GRAPH = 'DIRTY_GRAPH'
export const COMMIT_CELL = 'COMMIT_CELL'
export const AFTER_COMMIT = 'AFTER_COMMIT'
export const INSERT_CODE_CELL = 'INSERT_CODE_CELL'
export const INSERT_GRAPH_CELL = 'INSERT_GRAPH_CELL'
export const DELETE_CELL = 'DELETE_CELL'
export const REORDER_WORKSHEET = 'REORDER_WORKSHEET'

export const LOCK_WORKSHEET = 'LOCK_WORKSHEET'
export const UNLOCK_WORKSHEET = 'UNLOCK_WORKSHEET'

// TODO Use generics for concrete actions
export interface ActionOf<T> extends Action {
  data: T
}

export interface AsyncActionOf<T> extends ActionOf<T> {
  status: AsyncStatus
  error?: any
}

export interface LoadTOCActionData {
  workbooks: {
    uuid: UUID
    name: string
    sheets: UUID[]
  }[]
  sheets: {
    uuid: UUID
    name: string
    workbook: UUID
  }[]
  processes: {
    [key: string]: UUID
  }
}

export interface AsyncAction extends Action {
  type: string
  status: AsyncStatus
  error?: any
}

export const isAsyncAction = (action: Action): action is AsyncAction => (action as AsyncAction).status !== undefined

export interface LoadTOCAction extends AsyncAction {
  type: typeof LOAD_TOC
  status: AsyncStatus
  data?: LoadTOCActionData
  error?: any
}

export type CreateWorksheetAction = AsyncActionOf<{
  bookId: UUID,
  name: string
}>

export interface LoadWorksheetActionData {
  uuid: UUID
  name: string
  workbook: UUID
  cells: {
    __typename: string
    uuid: UUID
    script: string
    spec?: string
  }[]
}

export interface LoadWorksheetAction extends AsyncAction {
  type: string
  uuid: UUID
  status: AsyncStatus
  data?: LoadWorksheetActionData
  error?: any
}

export interface CreateCellAction extends AsyncAction {
  type: string
  status: AsyncStatus
  worksheet: UUID
  cells?: UUID[] // New cell ordering
  data?: Cell
}

export interface ExecuteCellAction extends AsyncAction {
  type: string
  status: AsyncStatus
  uuid: UUID
  pid: UUID
  data?: string
  json?: () => any
  error?: any
}

export interface DirtyCellAction extends Action {
  type: string
  uuid: UUID
  script: string
}

export interface DirtyGraphAction extends Action {
  type: string
  uuid: UUID
  spec: string
}

export interface CommitCellAction extends Action {
  type: string
  status: AsyncStatus
  uuid: UUID
}

export type CreateProcessAction = AsyncActionOf<{
  sheetId: UUID,
  procId?: UUID,
}>

export type InsertGraphCellAction = AsyncActionOf<{
  sheetId: UUID
  index?: number
}>

export type InsertCodeCellAction = AsyncActionOf<{
  sheetId: UUID
  index?: number
  script?: string
}>


export type InsertCellResult = AsyncActionOf<{
  sheetId: UUID
  cells: UUID[]
  cell: Cell
}>

export type DeleteCellAction = AsyncActionOf<{
  sheetId: UUID
  cellId: UUID
}>

export type AfterCommitAction = ActionOf<Cell>

export type ReorderWorksheetAction = AsyncActionOf<{
  sheetId: UUID
  cells: UUID[]
}>

export function later(delay: number, value: any = null) {
  return new Promise(resolve => setTimeout(resolve, delay, value));
}

export function clearError(): Action {
  return {
    type: CLEAR_ERROR,
  }
}

export const startApp = () => ({ type: START_APP })

export const loadToc = (status = AsyncStatus.Pending) => ({
  type: LOAD_TOC,
  status,
})

export const createWorksheet = (bookId: UUID, name: string, status = AsyncStatus.Pending) => ({
  type: CREATE_WORKSHEET,
  status,
  data: {
    bookId,
    name,
  }
})

export const loadWorksheet = (uuid: UUID, status = AsyncStatus.Pending) => ({
  type: LOAD_WORKSHEET,
  status,
  uuid,
})

export const executeCell = (processId: UUID, cellId: UUID, status = AsyncStatus.Pending) => ({
  type: EXECUTE_CELL,
  uuid: cellId,
  pid: processId,
  status,
})

export const dirtyCell = (uuid: UUID, script: string) => ({
  type: DIRTY_CELL,
  uuid,
  script
})

export const dirtyGraph = (uuid: UUID, spec: string) => ({
  type: DIRTY_GRAPH,
  uuid,
  spec,
})

export const commitCell = (uuid: UUID, status = AsyncStatus.Pending) => ({
  type: COMMIT_CELL,
  uuid,
  status
})

export const afterCommit = (data: Cell) => ({
  type: AFTER_COMMIT,
  data,
})

export function insertCodeCell(sheetId: UUID, index?: number, status = AsyncStatus.Pending): InsertCodeCellAction {
  return {
    type: INSERT_CODE_CELL,
    status,
    data: {
      sheetId,
      index,
    }
  }
}

export function insertGraphCell(sheetId: UUID, index?: number, status = AsyncStatus.Pending): InsertGraphCellAction {
  return {
    type: INSERT_GRAPH_CELL,
    status,
    data: {
      sheetId,
      index,
    }
  }
}
export function deleteCell(sheetId: UUID, cellId: UUID, status = AsyncStatus.Pending): DeleteCellAction {
  return {
    type: DELETE_CELL,
    status,
    data: {
      sheetId,
      cellId,
    }
  }
}

export function reorderWorksheet(sheetId: UUID, cells: UUID[], status = AsyncStatus.Pending): ReorderWorksheetAction {
  return {
    type: REORDER_WORKSHEET,
    status,
    data: {
      sheetId,
      cells,
    }
  }

}

export function createProcess(sheetId: UUID, procId?: UUID,status = AsyncStatus.Pending) {
  return {
    type: CREATE_PROCESS,
    status,
    data: {
      sheetId,
      procId,
    }
  }
}

export function lockWorksheet() {
  return {
    type: LOCK_WORKSHEET
  }
}

export function unlockWorksheet() {
  return {
    type: UNLOCK_WORKSHEET
  }
}