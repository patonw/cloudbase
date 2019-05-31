import { AppState } from './reducers'

export { rootReducer } from './reducers'
export { rootObserver as rootEpic } from './observers'

export * from './types'
export * from './actions'

export type AppState = AppState