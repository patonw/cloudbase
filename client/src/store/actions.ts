import { Action } from "redux"
import { UUID } from './types'

export enum AsyncStatus {
  Start,
  Pending,
  Success,
  Failure,
}

export const LOAD_WORKSHEET = 'LOAD_WORKSHEET'

export interface LoadWorksheetAction extends Action {
  type: typeof LOAD_WORKSHEET
  uuid: UUID
  status?: AsyncStatus
  error?: any
  data?: any
}

export function loadWorksheet(uuid: UUID): LoadWorksheetAction {
  return {
    type: LOAD_WORKSHEET,
    status: AsyncStatus.Start,
    uuid,
  }
}