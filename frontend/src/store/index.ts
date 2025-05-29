import { combineReducers, configureStore } from '@reduxjs/toolkit'
import themeReducer from './slices/themeSlice'
import entityReducer from './slices/entitySlice'
import tabsReducer from './slices/tabsSlice'

const rootReducer = combineReducers({
  themes: themeReducer,
  entities: entityReducer,
  tabs: tabsReducer,
})

export function setupStore(preloadedState?: Partial<RootState>) {
  return configureStore({
    reducer: rootReducer,
    preloadedState
  })
}


export type RootState = ReturnType<typeof rootReducer>
export type AppStore = ReturnType<typeof setupStore>
export type AppDispatch = AppStore['dispatch']
