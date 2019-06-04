import { Action } from "redux"
import produce from "immer"

import { Cell } from '../types'
import { DIRTY_CELL, DirtyCellAction,  DIRTY_GRAPH, DirtyGraphAction, AFTER_COMMIT, AfterCommitAction } from "../actions";

interface DirtyState {
  [key: string]: Cell
}

export default function dirtyReducer(state: DirtyState = {}, action: Action) {
  return produce(state, draft => {
    switch (action.type) {
      case DIRTY_CELL: {
        const act = action as DirtyCellAction
        const { uuid, script } = act

        draft[uuid] = {
          ...draft[uuid],
          uuid,
          script,
        }

        break
      }

      case DIRTY_GRAPH: {
        const act = action as DirtyGraphAction
        const { uuid, spec } = act

        draft[uuid] = {
          ...draft[uuid],
          uuid,
          spec,
        }

        break
      }

      case AFTER_COMMIT: {
        const act = action as AfterCommitAction
          const { uuid } = act.data
          delete draft[uuid]
        break
      }
    }
  })
}