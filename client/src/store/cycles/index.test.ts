import {loadWorksheetCycle } from './index'
import cycles from './index'

import * as most from 'most'
import { Stream } from 'most'

import { Action } from 'redux';

import { AppState } from '../reducers';
import * as act from '../actions'

const sourceEmpty = {
  ACTION: most.empty(),
  STATE: most.empty(),
  HTTP: {
    select: jest.fn((tag: string) => most.empty())
  },
}

async function dumpStream(stream: Stream<any>) {
  const init: any[] = []
  return await most.reduce((xs, x) => [...xs, x], init, stream)
}

describe('processCycle', () =>{
  it('creates a new process when none exists for a worksheet being loaded', () => {
    const state$: Stream<AppState> = most.empty()
    const action$: Stream<Action> = most.empty()

    // TODO
  })
})

describe('loadWorksheetCycle', () =>{
  it('issues a worksheet request from a LOAD_WORKSHEET action', () => {
    const action$: Stream<Action> = most.of(act.loadWorksheet('theWorksheetId'))
    const sources = {
      ...sourceEmpty,
      ACTION: action$,
    }
    const result = loadWorksheetCycle(sources)
    most.observe((req) => expect(req).toMatchSnapshot(), result.HTTP)
  })

  it('processes GraphQL response', async () => {
    const httpSelector = jest.fn((selector) => most.of(most.of({
      body: {
        data: {
          worksheet: {
            uuid: "theWorksheetId"
          }
        }
      }
    })))

    const sources = {
      ...sourceEmpty,
      HTTP: {
        select: httpSelector,
      }
    }

    const result = loadWorksheetCycle(sources)
    expect(httpSelector.mock.calls).toMatchSnapshot()

    const actions = await dumpStream(result.ACTION)
    expect(actions).toMatchSnapshot()
  })

  it('handles errors by dispatching async failure', async() => {
    const httpSelector = jest.fn((selector) => most.of(most.throwError({
      response: {
        request: {
          uuid: "badUUID"
        }
      }

    } as any)))

    const sources = {
      ...sourceEmpty,
      HTTP: {
        select: httpSelector,
      }
    }

    const result = loadWorksheetCycle(sources)
    expect(httpSelector.mock.calls).toMatchSnapshot()

    const actions = await dumpStream(result.ACTION)
    expect(actions).toMatchSnapshot()
  })
})