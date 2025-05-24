
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { THEME_CONFIG, ThemeType } from '@/config/constants';
import { log } from '@/lib/logger';

interface ThemeState {
  theme: ThemeType;
}

const initialState: ThemeState = {
  theme: THEME_CONFIG.DEFAULT_THEME,
}

const themeSlice = createSlice({
    name: 'theme',
    initialState,
    reducers: {
        setTheme: (state, action: PayloadAction<ThemeType>) => {
            const newTheme: ThemeType = action.payload || THEME_CONFIG.DEFAULT_THEME;

            try {
                localStorage.setItem(THEME_CONFIG.LOCAL_STORAGE_KEY, newTheme);
                document.querySelector('body')?.setAttribute('data-theme', newTheme);
                state.theme = newTheme;
                log.info('Theme changed', { theme: newTheme });
            } catch (error) {
                log.error('Failed to set theme', error as Error, { theme: newTheme });
            }
        },
        loadTheme: (state) => {
            try {
                const theme: ThemeType = (localStorage.getItem(THEME_CONFIG.LOCAL_STORAGE_KEY) as ThemeType) || THEME_CONFIG.DEFAULT_THEME;
                document.querySelector('body')?.setAttribute('data-theme', theme);
                state.theme = theme;
                log.info('Theme loaded', { theme });
            } catch (error) {
                log.error('Failed to load theme', error as Error);
                state.theme = THEME_CONFIG.DEFAULT_THEME;
            }
        }
    },
})

export const {setTheme, loadTheme} = themeSlice.actions;
export default themeSlice.reducer;
export type {ThemeState};