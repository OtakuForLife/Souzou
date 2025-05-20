
import { createSlice } from '@reduxjs/toolkit'

const DEFAULT_THEME = "dark";
export const LOCAL_STORAGE_KEY = "theme";

interface ThemeState {
  theme: string;
}

const initialState: ThemeState = {
  theme: DEFAULT_THEME,
}

const themeSlice = createSlice({
    name: 'theme',
    initialState,
    reducers: {
        setTheme: (state, action) => {
            const newTheme: string = action.payload || DEFAULT_THEME;
            localStorage.setItem(LOCAL_STORAGE_KEY, newTheme);
            document.querySelector('body')?.setAttribute('data-theme', newTheme);
            state.theme = newTheme;
        },
        loadTheme: (state) => {
            const theme: string = localStorage.getItem(LOCAL_STORAGE_KEY) || DEFAULT_THEME;
            document.querySelector('body')?.setAttribute('data-theme', theme);
            state.theme = theme;
        }
    },
})

export const {setTheme, loadTheme} = themeSlice.actions;
export default themeSlice.reducer;
export type {ThemeState};