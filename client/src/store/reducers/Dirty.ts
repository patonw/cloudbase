import { Action } from "redux"
import produce from "immer"

import { Cell } from '../types'
import { DIRTY_CELL, DirtyCellAction, EXECUTE_CELL, ExecuteCellAction, AsyncStatus } from "../actions";

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

      case EXECUTE_CELL: {
        const act = action as ExecuteCellAction
        if (act.status === AsyncStatus.Success) {
          const { uuid } = act
          delete draft[uuid]
        }
        break
      }
    }
  })
}