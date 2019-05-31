import * as fp from 'lodash/fp'

import { Action } from 'redux'
import { combineEpics as combineObservers, ofType, StateObservable } from "redux-observable";
import { catchError, map, mergeMap, pluck, filter, switchMap, delay, flatMap } from 'rxjs/operators'

import { AppState } from './reducers'
import { Observable, of } from 'rxjs';
import { START_APP, AsyncStatus, LOAD_TOC, AsyncAction, LOAD_WORKSHEET, LoadWorksheetAction, EXECUTE_CELL, ExecuteCellAction } from './actions';

import * as gql from './graphql'
import { UUID } from './types';

const ofStatus = (status: AsyncStatus) => filter((action: AsyncAction) => action.status === status)

interface ObserverDeps {
  graphql: gql.GraphQLClient,
}

class LoadTOC {
  // TODO handle graphql errors
  static success(resp: gql.LoadTOCResponse) {
    if (resp.errors) {
      throw resp.errors
    }
    
    const data = resp.data.allWorkbooks
    const procs = resp.data.allProcesses
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

    return {
      type: LOAD_TOC,
      status: AsyncStatus.Success,
      data: {
        workbooks,
        sheets,
        processes
      }
    }
  }

  static failure = (err: any) => of({
    type: LOAD_TOC,
    status: AsyncStatus.Failure,
    error: err,
  })

  static observer = (action$: Observable<Action>, state$: Observable<AppState>, { graphql }: ObserverDeps) => action$.pipe(
    ofType(START_APP),
    switchMap(() =>
      graphql(gql.loadTOC()).pipe(
        pluck('response'),
        map(LoadTOC.success),
        catchError(LoadTOC.failure)
      )
    )
  )
}

class LoadWorksheet {
  // TODO handle graphql errors
  static success(resp: gql.LoadWorksheetResponse) {
    if (resp.errors) {
      throw resp.errors
    }

    const sheet = resp.data.worksheet

    return {
      type: LOAD_WORKSHEET,
      status: AsyncStatus.Success,
      uuid: sheet.uuid,
      data: sheet,
    }
  }

  static failure = (uuid: UUID) => (error: any) => of({
    type: LOAD_WORKSHEET,
    status: AsyncStatus.Failure,
    uuid,
    error,
  })

  static observer = (action$: Observable<Action>, state$: Observable<AppState>, { graphql }: ObserverDeps) => action$.pipe(
    ofType(LOAD_WORKSHEET),
    ofStatus(AsyncStatus.Pending),
    map(req => req as LoadWorksheetAction),
    mergeMap(({ uuid }) =>
      graphql(gql.loadWorksheet(uuid)).pipe(
        pluck('response'),
        map(LoadWorksheet.success),
        catchError(LoadWorksheet.failure(uuid))
      )
    ),
  )
}

class ExecuteCell {
  static success = (pid: UUID, uuid: UUID) => (resp: gql.ExecuteCellResponse) => {
    if (resp.errors) {
      throw resp.errors
    }

    const data = resp.data

    // TODO fire a secondary event if data.setCellScript is defined

    // Memoized parsing
    const json = data.executeCell.json &&
      fp.memoize(() => JSON.parse(data.executeCell.json))

    return of({
      type: EXECUTE_CELL,
      status: AsyncStatus.Success,
      uuid,
      pid,
      data: data.executeCell.data,
      json,
    })
  }

  static failure = (pid: UUID, uuid: UUID) => (error: any) => of({
    type: EXECUTE_CELL,
    status: AsyncStatus.Failure,
    uuid,
    pid,
    error,
  })

  static getDirty(state: AppState, uuid: UUID) {
    if (uuid in state.dirty) {
      return state.dirty[uuid].script
    }

    return undefined
  }

  static observer = (action$: Observable<Action>, state$: StateObservable<AppState>, { graphql }: ObserverDeps) => action$.pipe(
    ofType(EXECUTE_CELL),
    ofStatus(AsyncStatus.Pending),
    map(req => req as ExecuteCellAction),
    delay(0),
    switchMap(({ pid, uuid }) =>
      graphql(gql.executeCell(pid, uuid, ExecuteCell.getDirty(state$.value, uuid))).pipe(
        pluck('response'),
        flatMap(ExecuteCell.success(pid, uuid)),
        catchError(ExecuteCell.failure(pid, uuid))
      )
    )
  )
}

export const rootObserver = combineObservers(
  LoadTOC.observer as any,
  LoadWorksheet.observer,
  ExecuteCell.observer,
)