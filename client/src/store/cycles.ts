import { Action } from 'redux';
import { LOAD_WORKSHEET, AsyncAction, AsyncStatus, LoadWorksheetAction } from './actions';

import * as gql from './graphql'
import { combineCycles } from 'redux-cycles';
import * as fp from 'lodash/fp'
import { Stream } from 'most'
import * as most from 'most'

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

export function loadWorksheet(sources: any) {
  const request$ = sources.ACTION
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

export default combineCycles(loadWorksheet as any)