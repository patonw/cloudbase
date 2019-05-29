import { Action, Dispatch } from "redux"
import { UUID, Cell } from './types'
import axios from 'axios'
import * as fp from 'lodash/fp'

export enum AsyncStatus {
  Cached,
  Pending,
  Success,
  Failure,
}

export const LOAD_TOC = 'LOAD_TOC'
export const LOAD_WORKSHEET = 'LOAD_WORKSHEET'
export const EXECUTE_CELL = 'EXECUTE_CELL'

export interface LoadTOCACtionData {
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

export interface LoadTOCAction extends Action {
  type: typeof LOAD_TOC
  status: AsyncStatus
  data?: LoadTOCACtionData
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
  }[]
}

export interface LoadWorksheetAction extends Action {
  type: typeof LOAD_WORKSHEET
  uuid: UUID
  status: AsyncStatus
  data?: LoadWorksheetActionData
  error?: any
}

export interface CreateCellAction extends Action {
  type: typeof EXECUTE_CELL
  status: AsyncStatus
  worksheet: UUID
  cells?: UUID[] // New cell ordering
  data?: Cell
}

export interface ExecuteCellAction extends Action {
  type: typeof EXECUTE_CELL
  status: AsyncStatus
  uuid: UUID
  data?: string
  json?: () => any
  error?: any
}

export function later(delay: number, value: any = null) {
  return new Promise(resolve => setTimeout(resolve, delay, value));
}

export function loadTableOfContents() {
  return async (dispatch: Dispatch) => {
    dispatch({
      type: LOAD_TOC,
      status: AsyncStatus.Pending,
    })

    type ResponseType = {
      uuid: UUID
      name: string
      sheets: {
        uuid: UUID
        name: string
      }[]
    }[]

    type ProcessResponse = {
      uuid: UUID
      sheet: {
        uuid: UUID
      }
    }[]

    const resp = await axios.post('/graphql', {
      query: `
        query loadTOC {
          allWorkbooks {
            uuid
            name
            sheets {
              uuid
              name
            }
          }

          allProcesses {
            uuid
            sheet {
              uuid
            }
          }
        }
        `
    })

    // TODO use normalizr
    const data = fp.getOr([], 'data.allWorkbooks')(resp.data) as ResponseType
    const procs = fp.getOr([], 'data.allProcesses')(resp.data) as ProcessResponse
    const workbooks = data.map(wb => ({
      uuid: wb.uuid,
      name: wb.name,
      sheets: wb.sheets.map(it => it.uuid)
    }))

    const sheets = data.map(wb =>
      wb.sheets.map(it => ({
        uuid: it.uuid,
        name: it.name,
        workbook: wb.uuid,
      }))
    ).flat()

    const processes = fp.fromPairs(procs.map(it => [it.uuid, it.sheet.uuid]))

    dispatch({
      type: LOAD_TOC,
      status: AsyncStatus.Success,
      data: {
        workbooks,
        sheets,
        processes
      }
    })
  }
}

// Worksheet metadata should already have been loaded by loadWorkbook
// This will load the worksheet body: cells etc
export function loadWorksheet(uuid: UUID) {
  return async (dispatch: Dispatch, getState: any) => {
    const { worksheets } = getState()
    if (uuid in worksheets) {
      // Should check for staleness first
      // dispatch({
      //   type: LOAD_WORKSHEET,
      //   status: AsyncStatus.Cached,
      //   uuid,
      // })
    }

    // TODO from graphql instead
    const worksheet = worksheets[uuid] || {}
    const { workbook } = worksheet

    // TODO if all cells loaded already then dispatch Cached
    // Otherwise construct graphql query and await answer

    dispatch({
      type: LOAD_WORKSHEET,
      status: AsyncStatus.Pending,
      uuid,
    })

    type ResponseType = LoadWorksheetActionData
    const resp = await axios.post('/graphql', {
      query: `
      query loadSheet($sheetId: ID!) {
        worksheet(sheetId: $sheetId) {
          uuid
          name
          cells {
            __typename
            uuid
            script
          }
        }
      }`,
      variables: {
        sheetId: uuid
      }
    })

    const data = fp.get("data.worksheet")(resp.data) as ResponseType

    dispatch({
      type: LOAD_WORKSHEET,
      status: AsyncStatus.Success,
      uuid,
      data: {
        ...data,
        workbook
      }
    })

    // TODO getOrCreateProcess
  }
}

// TODO getOrCreateProcess
// TODO restartProcess
// TODO createCodeCell
// TODO createGraphCell


export function executeCell(processId: UUID, cellId: UUID) {
  return async (dispatch: Dispatch, getState: any) => {
    console.log(`Executing cell ${cellId} with process ${processId}`)
    // TODO First check if dirty
    // Construct mutation request with updateScript and executeCell clauses
    // Wait for response and unpack
    // Unmark cell as dirty
    // Update results

    dispatch({
      type: EXECUTE_CELL,
      status: AsyncStatus.Pending,
      uuid: cellId,
    })

    await later(2000)

    type ResponseType = {
      executeCell: {
        cell: {
          uuid: UUID
        }
        data: string
        json: string
      }
    }

    const query = `
      mutation justExecute($processId:ID!, $cellId:ID!) {
        executeCell(processId: $processId, cellId: $cellId) {
          cell {
            uuid
          }
          data
          json
        }
      }`

    const variables = {
      processId,
      cellId,
    }

    const resp = await axios.post('/graphql', {
      query,
      variables,
    })

    console.log("Execute cell", resp)

    const errors = fp.getOr([], "errors")(resp.data) as any[]
    const error = errors.map((it) => it.message).join()

    if (error) {
      dispatch({
        type: EXECUTE_CELL,
        status: AsyncStatus.Failure,
        uuid: cellId,
        error
      })
    }
    else {
      const data = resp.data.data as ResponseType

      // Memoized parsing
      const json = data.executeCell.json &&
        fp.memoize(() => JSON.parse(data.executeCell.json))

      dispatch({
        type: EXECUTE_CELL,
        status: AsyncStatus.Success,
        uuid: cellId,
        data: data.executeCell.data,
        json,
      })
    }
  }
}