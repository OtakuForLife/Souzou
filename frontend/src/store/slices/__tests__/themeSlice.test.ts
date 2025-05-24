import { expect, test, vi, afterEach } from "vitest"
import * as ThemeSlice from "@/store/slices/themeSlice";
import { THEME_CONFIG, ThemeType } from "@/config/constants";

const reducer = ThemeSlice.default;
const { setTheme, loadTheme } = ThemeSlice;
type themeState = ThemeSlice.ThemeState;


const getItemSpy = vi.spyOn(Storage.prototype, 'getItem')
const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')

test('should set the theme to light', () => {

    const previousState: themeState = {
        theme: "dark" as ThemeType,
    }
    const newTheme: ThemeType = "light"

    const nextState = reducer(previousState, setTheme(newTheme))

    expect(nextState).toEqual(
        { theme: newTheme },
    )
    expect(setItemSpy).toHaveBeenCalledWith(THEME_CONFIG.LOCAL_STORAGE_KEY, newTheme)
})

test('should get the theme from storage', () => {

    const previousState: themeState = {
        theme: THEME_CONFIG.DEFAULT_THEME,
    }
    const newTheme: ThemeType = "light"
    getItemSpy.mockReturnValue(newTheme)

    expect(reducer(previousState, loadTheme())).toEqual(
        { theme: newTheme },
    )
    expect(getItemSpy).toHaveBeenCalledWith(THEME_CONFIG.LOCAL_STORAGE_KEY)
})

afterEach(async () => {
    getItemSpy.mockClear()
    setItemSpy.mockClear()
})