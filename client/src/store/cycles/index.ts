import { Action } from 'redux';
import * as fp from 'lodash/fp'

import { Stream } from 'most'
import * as most from 'most'

import { combineCycles } from 'redux-cycles';
import { RequestInput } from '@cycle/http';

import * as gql from '../graphql'
import { AppState } from '../reducers';
import {
  AsyncAction, AsyncStatus,
  START_APP, loadToc,
  LOAD_WORKSHEET, LoadWorksheetAction,
  EXECUTE_CELL, ExecuteCellAction, afterCommit,
  DELETE_CELL, DeleteCellAction, deleteCell,
  INSERT_CODE_CELL, InsertCodeCellAction, InsertCellResult,
  INSERT_GRAPH_CELL, InsertGraphCellAction,
  REORDER_WORKSHEET, ReorderWorksheetAction, reorderWorksheet,
  CREATE_WORKSHEET, CreateWorksheetAction, createWorksheet,
  CREATE_PROCESS, createProcess, CreateProcessAction
} from '../actions';

function ofType(tag: any) {
  return (action: Action) => action.type === tag
}

function ofStatus(tag: AsyncStatus) {
  return (action: AsyncAction) => action.status === tag
}

interface ResponseSuccess {
  body: any
  request: any
}

interface ResponseError {
  response: ResponseSuccess
}

type Response = ResponseSuccess | ResponseError
const isOK = (resp: Response): resp is ResponseSuccess => !fp.isError(resp)

function flatCatch(resp$$: Stream<Stream<Response>>): Stream<Response> {
  return resp$$
    .flatMap((resp$) =>
      resp$
        .recoverWith((err: ResponseError) => most.of(err))
    )
}

function loggerCycle(sources: any) {
  const action$: Stream<Action> = sources.ACTION
  const dummy$ = action$
    .tap(act => { console.debug("ACTION", act) })
    .flatMap(act => most.empty())
  return {
    ACTION: dummy$
  }
}

function processCycle(sources: any) {
  const action$: Stream<Action> = sources.ACTION
  const state$: Stream<AppState> = sources.STATE

  const wsReq$: Stream<LoadWorksheetAction> = action$
    .filter(ofType(LOAD_WORKSHEET))
    .map(action => action as LoadWorksheetAction)
    .filter(ofStatus(AsyncStatus.Pending))

  const fromLoadSheet$ = wsReq$
    .sample((action, state) => ({ action, state }),
      wsReq$,
      state$)
    .filter(({ action, state }) => action.uuid! in state.worksheets)
    .map(({ action }) => createProcess(action.uuid))

  const request$: Stream<RequestInput> = action$
    .filter(ofType(CREATE_PROCESS))
    .map(it => it as CreateProcessAction)
    .filter(ofStatus(AsyncStatus.Pending))
    .map((act) => gql.createProcess(act.data.sheetId))
    .map(body => ({
      url: '/graphql',
      category: CREATE_PROCESS,
      method: "POST",
      send: body,
    }))

  const resp$: Stream<Response> = sources.HTTP
    .select(CREATE_PROCESS)
    .thru(flatCatch)


  const reaction$ = resp$.flatMap(resp => {
    // TODO handle errors
    if (!isOK(resp))
      return most.empty()

    const body = resp.body as gql.CreateProcessResponse
    const sheetId = body.data.createProcess.sheet.uuid
    const procId = body.data.createProcess.uuid

    return most.of(createProcess(sheetId, procId, AsyncStatus.Success))
  })

  return {
    ACTION: reaction$.merge(fromLoadSheet$),
    HTTP: request$,
  }
}

function loadWorksheetCycle(sources: any) {
  const request$: Stream<RequestInput> = sources.ACTION
    .filter(ofType(LOAD_WORKSHEET))
    .filter(ofStatus(AsyncStatus.Pending))
    .map((action: LoadWorksheetAction) => ({
      url: '/graphql',
      category: LOAD_WORKSHEET,
      method: "POST",
      send: gql.loadWorksheet(action.uuid),
      uuid: action.uuid,
      ok: (resp: any) => resp.ok && !!fp.get("body.data.worksheet", resp)
    }))

  const result$ = (sources.HTTP)
    .select(LOAD_WORKSHEET)
    .flatMap((response$: Stream<Response>) =>
      response$
        .recoverWith((err: ResponseError) => most.of(err))
    )
    .map((resp: Response) => {
      let uuid = fp.get("body.data.worksheet.uuid", resp)

      if (isOK(resp) && !!uuid) {
        return {
          type: LOAD_WORKSHEET,
          status: AsyncStatus.Success,
          uuid,
          data: fp.get("body.data.worksheet", resp)
        }
      }

      uuid = uuid || fp.get("response.request.uuid", resp)
      let error = fp.get("body.errors", resp) || fp.get("response.body.errors", resp) || resp
      return {
        type: LOAD_WORKSHEET,
        status: AsyncStatus.Failure,
        uuid: uuid,
        error,
      }
    })

  return {
    HTTP: request$,
    ACTION: result$
  }
}

function afterCommitCycle(sources: any) {
  const state$: Stream<AppState> = sources.STATE
  const action$: Stream<Action> = sources.ACTION

  const dirtyCells$ = state$.map(state => state.dirty)
  const execSuccess$ = action$
    .filter(ofType(EXECUTE_CELL))
    .map(it => it as ExecuteCellAction)
    .filter(ofStatus(AsyncStatus.Success))

  const resolved$ = execSuccess$
    .sample(
      (action, dirty) => dirty[action.uuid],
      execSuccess$,
      dirtyCells$
    )
    .filter(fp.identity)
    .map(dirtyCell => afterCommit(dirtyCell))

  return {
    ACTION: resolved$
  }
}

function deleteCellCycle(sources: any) {
  const action$: Stream<Action> = sources.ACTION

  const request$: Stream<RequestInput> = action$
    .filter(ofType(DELETE_CELL))
    .map(act => act as DeleteCellAction)
    .filter(ofStatus(AsyncStatus.Pending))
    .map(act => act.data)
    .map(({ sheetId, cellId }) => gql.deleteCell(sheetId, cellId))
    .map(body => ({
      url: '/graphql',
      category: DELETE_CELL,
      method: "POST",
      send: body,
      ok: (resp: any) => resp.ok && !!fp.get("body.data.deleteCell.cell.uuid", resp)
    }))

  const resp$: Stream<Response> = sources.HTTP
    .select(DELETE_CELL)
    .thru(flatCatch)

  const reaction$ = resp$
    .flatMap(resp => {
      const cellId: string | undefined = fp.get("body.data.deleteCell.cell.uuid", resp)
      const sheetId: string | undefined = fp.get("body.data.deleteCell.sheet.uuid", resp)

      // TODO handle errors

      if (cellId && sheetId)
        return most.of(deleteCell(sheetId, cellId, AsyncStatus.Success))

      return most.empty()
    })

  return {
    HTTP: request$,
    ACTION: reaction$,
  }
}

function insertCellCycle(sources: any) {
  const action$: Stream<Action> = sources.ACTION

  const codeReq$: Stream<RequestInput> = action$
    .filter(ofType(INSERT_CODE_CELL))
    .map(act => act as InsertCodeCellAction)
    .filter(ofStatus(AsyncStatus.Pending))
    .map(act => act.data)
    .map(({ sheetId, index }) => gql.insertCodeCell(sheetId, index))
    .map(body => ({
      url: '/graphql',
      category: INSERT_CODE_CELL,
      method: "POST",
      send: body,
      ok: (resp: any) => resp.ok && !!fp.get("body.data.insertCell.cell.uuid", resp)
    }))

  const graphReq$: Stream<RequestInput> = action$
    .filter(ofType(INSERT_GRAPH_CELL))
    .map(act => act as InsertGraphCellAction)
    .filter(ofStatus(AsyncStatus.Pending))
    .map(act => act.data)
    .map(({ sheetId, index }) => gql.insertGraphCell(sheetId, index))
    .map(body => ({
      url: '/graphql',
      category: INSERT_CODE_CELL,
      method: "POST",
      send: body,
      ok: (resp: any) => resp.ok && !!fp.get("body.data.insertCell.cell.uuid", resp)
    }))

  const request$ = most.merge(codeReq$, graphReq$)

  const resp$: Stream<Response> = sources.HTTP
    .select(INSERT_CODE_CELL)
    .thru(flatCatch)

  const reaction$: Stream<InsertCellResult> = resp$
    .flatMap(resp => {
      if (isOK(resp)) {
        const body = resp.body as gql.InsertCodeCellResponse

        const data = fp.get("data.insertCell", body)

        const action: InsertCellResult = {
          type: INSERT_CODE_CELL,
          status: AsyncStatus.Success,
          data: {
            sheetId: data.sheet.uuid,
            cells: data.sheet.cells.map((it: any) => it.uuid),
            cell: {
              worksheet: data.sheet.uuid,
              uuid: data.cell.uuid,
              script: data.cell.script,
              lang: "kotlin",
              spec: data.cell.spec
            }
          }
        }

        return most.of(action)
      }

      return most.empty()
    })

  return {
    HTTP: request$,
    ACTION: reaction$
  }
}

function reorderWorksheetCycle(sources: any) {
  const action$: Stream<Action> = sources.ACTION

  const request$: Stream<RequestInput> = action$
    .filter(ofType(REORDER_WORKSHEET))
    .map(act => act as ReorderWorksheetAction)
    .filter(ofStatus(AsyncStatus.Pending))
    .map(act => act.data)
    .map(({ sheetId, cells }) => gql.reorderWorksheet(sheetId, cells))
    .map(body => ({
      url: '/graphql',
      category: REORDER_WORKSHEET,
      method: "POST",
      send: body,
      ok: (resp: any) => resp.ok && !fp.get("body.errors", resp)
    }))

  const resp$: Stream<Response> = sources.HTTP
    .select(REORDER_WORKSHEET)
    .thru(flatCatch)

  const reaction$: Stream<ReorderWorksheetAction> = resp$
    .flatMap(resp => {
      // TODO map errors
      if (!isOK(resp))
        return most.empty()

      const body = resp.body as gql.ReorderWorksheetResponse
      const sheet = body.data.reorderWorksheet

      // TODO handle missing worksheet
      const cells = sheet.cells.map(it => it.uuid)

      return most.of(reorderWorksheet(sheet.uuid, cells, AsyncStatus.Success))
    })

  return {
    HTTP: request$,
    ACTION: reaction$,
  }
}

export function createWorksheetCycle(sources: any) {
  const action$: Stream<Action> = sources.ACTION

  const request$: Stream<RequestInput> = action$
    .filter(ofType(CREATE_WORKSHEET))
    .map(act => act as CreateWorksheetAction)
    .filter(ofStatus(AsyncStatus.Pending))
    .map(act => act.data)
    .map(data => gql.createWorksheet(data.bookId, data.name))
    .map(body => ({
      url: '/graphql',
      category: CREATE_WORKSHEET,
      method: "POST",
      send: body,
    }))

  const resp$: Stream<Response> = sources.HTTP
    .select(CREATE_WORKSHEET)
    .thru(flatCatch)

  const reaction$: Stream<InsertCellResult> = resp$
    .flatMap(resp => {
      // TODO map errors
      if (!isOK(resp))
        return most.empty()

      const body = resp.body as gql.CreateWorksheetResponse
      const sheet = body.data.createWorksheet

      const bookId = fp.get("request.send.variables.bookId", resp)

      const action: CreateWorksheetAction = createWorksheet(bookId, sheet.name, AsyncStatus.Success)
      const tocAction = loadToc()

      return most.from([action, tocAction])
    })

  return {
    HTTP: request$,
    ACTION: reaction$,
  }
}

function startAppCycle(sources: any) {
  const action$: Stream<Action> = sources.ACTION

  const reaction$ = action$
    .filter(ofType(START_APP))
    .map(act => loadToc())

  return {
    ACTION: reaction$
  }
}

export default combineCycles(
  startAppCycle,
  loggerCycle,
  loadWorksheetCycle,
  afterCommitCycle,
  deleteCellCycle,
  insertCellCycle,
  reorderWorksheetCycle,
  createWorksheetCycle,
  processCycle,
)