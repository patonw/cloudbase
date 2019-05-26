import { Action, Dispatch } from "redux"
import { UUID } from './types'
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
        }
        `
    })

    // TODO use normalizr
    const data = fp.getOr([], 'data.allWorkbooks')(resp.data) as ResponseType
    const workbooks = data.map(wb => ({
      uuid: wb.uuid,
      name: wb.name,
      sheets: wb.sheets.map(it => it.uuid)
    }))

    const sheets = data.map( wb =>
      wb.sheets.map( it => ({
        uuid: it.uuid,
        name: it.name,
        workbook: wb.uuid,
      }))
      ).flat()

    dispatch({
      type: LOAD_TOC,
      status: AsyncStatus.Success,
      data: {
        workbooks,
        sheets
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
    const {workbook} = worksheets[uuid]

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
  }
}