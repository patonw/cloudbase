import { ajax, AjaxResponse } from 'rxjs/ajax';
import { Observable } from 'rxjs';
import { UUID, Cell, isGraphCell } from './types'
import { LoadWorksheetActionData } from './actions';
import * as fp from 'lodash/fp'

type Ajax = typeof ajax

export interface GraphQLRequest {
  query: string
  variables?: {
    [key: string]: any
  }
}

export type GraphQLClient = (body: GraphQLRequest) => Observable<AjaxResponse>

export function makeAjaxClient(ajax: Ajax): GraphQLClient {
  return (body: GraphQLRequest) => ajax({
    url: '/graphql',
    responseType: 'json',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'rxjs-custom-header': 'Rxjs'
    },
    body
  })
}

export interface GraphQLResponse {
  errors?: any
}

export interface LoadTOCResponse extends GraphQLResponse {
  data: {
    allWorkbooks: {
      uuid: UUID
      name: string
      sheets: {
        uuid: UUID
        name: string
      }[]
    }[],

    allProcesses: {
      uuid: UUID
      sheet: {
        uuid: UUID
      }
    }[],
  }
}

export const loadTOC = () => ({
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
`})

export interface LoadWorksheetResponse extends GraphQLResponse {
  data: {
    worksheet: LoadWorksheetActionData
  }
}

export const loadWorksheet = (uuid: UUID) => ({
  query: `
  query loadSheet($sheetId: ID!) {
    worksheet(sheetId: $sheetId) {
      uuid
      name
      cells {
        __typename
        uuid
        script
        ... on GraphCell {
          spec
        }
      }
    }
  }`,
  variables: {
    sheetId: uuid
  }
})

export interface ExecuteCellResponse extends GraphQLResponse {
  data: {
    setCellScript?: {
      uuid: UUID
    },
    executeCell: {
      cell: {
        uuid: UUID
      }
      data: string
      json: string
    }
  }
}
export const updateAndExecute = (processId: UUID, cellId: UUID, dirty: Cell) => {
  let updates = ""
  let args = ""
  let variables: any = {
    processId,
    cellId,
  }

  if (dirty.script) {
    updates += `
      setCellScript(cellId: $cellId, script: $script) {
        uuid
      }`
    args += ', $script: String!'
    variables.script = dirty.script
  }

  if (isGraphCell(dirty)) {
    updates += `
      setGraphSpec(cellId: $cellId, spec: $spec) {
        uuid
      }
    `
    args += ', $spec: String!'
    variables.spec = dirty.spec
  }

  return ({
    query: `
    mutation updateAndExecute($processId:ID!, $cellId:ID! ${args}) {
      ${updates}
      executeCell(processId: $processId, cellId: $cellId) {
        cell {
          uuid
        }
        data
        json
      }
    }`,
    variables,
  })
}

export const executeCell = (processId: UUID, cellId: UUID, dirty?: Cell) => (dirty? updateAndExecute(processId, cellId, dirty) : {
  query: `
  mutation justExecute($processId:ID!, $cellId:ID!) {
    executeCell(processId: $processId, cellId: $cellId) {
      cell {
        uuid
      }
      data
      json
    }
  }`,
  variables: {
    processId,
    cellId,
  }
})

export interface InsertCodeCellResponse extends GraphQLResponse {
  data: {
    insertCodeCell: {
      sheet: {
        uuid: string
        cells: {
          uuid: string
        }[]
      }
      cell: {
        __typename: string
        uuid: string
        script: string
        spec?: string
      }
    }
  }

}
export function insertCell(sheetId: UUID, index?: number, cellType: string = "CODE") {
  let variables: any = {
    sheetId,
    cellType,
  }

  if (!fp.isUndefined(index))
    variables.index = index

  return {
    query: `
      mutation InsertCell($sheetId: ID!, $index: Int, $cellType: CellType) {
        insertCell(sheetId: $sheetId, index: $index, cellType: $cellType) {
          sheet {
            uuid
            cells {
              uuid
            }
          }
          cell {
            __typename
            uuid
            script
            ... on GraphCell {
              spec
            }
          }
        }
      }
    `,
    variables,
  }
}

export const insertCodeCell = (sheetId: UUID, index?: number) => insertCell(sheetId, index)

export const insertGraphCell = (sheetId: UUID, index?: number) => insertCell(sheetId, index, "GRAPH")

export function deleteCell(sheetId: UUID, cellId: UUID) {
  return {
    query:`
      mutation Apoptosis($sheetId: ID!, $cellId: ID!) {
        deleteCell(sheetId: $sheetId, cellId: $cellId) {
          sheet {
            uuid
          }
          cell {
            uuid
          }
        }
      }
    `,
    variables: {
      sheetId,
      cellId,
    }
  }
}
export interface ReorderWorksheetResponse {
  data: {
    reorderWorksheet: {
      uuid: string
      cells: {
        uuid: string
      }[]
    }
  }
}
export function reorderWorksheet(sheetId: UUID, cells: UUID[]) {
  return {
    query: `
      mutation Disorder($sheetId: ID!, $cells: [ID!]!) {
        reorderWorksheet(sheetId: $sheetId, cells: $cells) {
          uuid
          cells {
            uuid
          }
        }
      }
    `,
    variables: {
      sheetId,
      cells,
    }
  }
}