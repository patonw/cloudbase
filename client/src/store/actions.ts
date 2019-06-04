import { Action } from "redux"
import { UUID, Cell } from './types'

export enum AsyncStatus {
  Cached,
  Pending,
  Success,
  Failure,
}

export const CLEAR_ERROR = Symbol('CLEAR_ERROR')
export const START_APP = 'START_APP'
export const LOAD_TOC = 'LOAD_TOC'
export const LOAD_WORKSHEET = 'LOAD_WORKSHEET'
export const EXECUTE_CELL = 'EXECUTE_CELL'
export const CREATE_CELL = 'CREATE_CELL'
export const DIRTY_CELL = 'DIRTY_CELL'
export const DIRTY_GRAPH = 'DIRTY_GRAPH'
export const COMMIT_CELL = 'COMMIT_CELL'
export const AFTER_COMMIT = Symbol('AFTER_COMMIT')

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

export type AfterCommitAction = ActionOf<Cell>

export function later(delay: number, value: any = null) {
  return new Promise(resolve => setTimeout(resolve, delay, value));
}

export function clearError(): Action {
  return {
    type: CLEAR_ERROR,
  }
}

export const startApp = () => ({ type: START_APP })

export const loadWorksheet = (uuid: UUID, status = AsyncStatus.Pending) => ({
  type: LOAD_WORKSHEET,
  status,
  uuid,
})

// TODO getOrCreateProcess
// TODO restartProcess
// TODO createCodeCell
// TODO createGraphCell

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
