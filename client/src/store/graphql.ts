import { ajax, AjaxResponse } from 'rxjs/ajax';
import { Observable } from 'rxjs';
import { UUID } from './types'
import { LoadWorksheetActionData } from './actions';

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
export const updateAndExecute = (processId: UUID, cellId: UUID, script: string) => ({
  query: `
  mutation updateAndExecute($processId:ID!, $cellId:ID!, $script: String!) {
    setCellScript(cellId: $cellId, script: $script) {
      uuid
    }
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
    script,
  }
})

export const executeCell = (processId: UUID, cellId: UUID, script?: string) => (script? updateAndExecute(processId, cellId, script) : {
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