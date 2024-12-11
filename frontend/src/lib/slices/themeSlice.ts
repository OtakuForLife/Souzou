
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { RootState } from '../store';

const DEFAULT_THEME = "dark";
const LOCAL_STORAGE_KEY = "theme";

interface themeState {
  theme: string;
}

const initialState: themeState = {
  theme: DEFAULT_THEME,
}

export const themeSlice = createSlice({
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
    
    extraReducers: builder => {
        
    },
})

export const theme = (state: RootState) => state.theme.theme;
export const {setTheme, loadTheme} = themeSlice.actions;
export default themeSlice.reducer;
export type {themeState};