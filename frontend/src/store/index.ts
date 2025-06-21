import { combineReducers, configureStore } from '@reduxjs/toolkit'
import themeReducer from './slices/themeSlice'
import entityReducer from './slices/entitySlice'
import tabsReducer from './slices/tabsSlice'
import entityLinkReducer from './slices/entityLinkSlice'
import tagReducer from './slices/tagSlice'
import { entityLinkMiddleware } from './middleware/entityLinkMiddleware'

const rootReducer = combineReducers({
  themes: themeReducer,
  entities: entityReducer,
  tabs: tabsReducer,
  entityLink: entityLinkReducer,
  tags: tagReducer,
})

export function setupStore(preloadedState?: Partial<RootState>) {
  return configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(entityLinkMiddleware),
    preloadedState
  })
}


export type RootState = ReturnType<typeof rootReducer>
export type AppStore = ReturnType<typeof setupStore>
export type AppDispatch = AppStore['dispatch']
