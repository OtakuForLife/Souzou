import { combineReducers, configureStore } from '@reduxjs/toolkit'
import themeReducer from './slices/themeSlice'
import notesReducer from './slices/entiySlice'
import tabsReducer from './slices/tabsSlice'

const rootReducer = combineReducers({
  themes: themeReducer,
  notes: notesReducer,
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
