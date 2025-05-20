import { expect, test, vi, afterEach } from "vitest"
import * as ThemeSlice from "@/store/slices/themeSlice";

const reducer = ThemeSlice.default;
const { setTheme, loadTheme, LOCAL_STORAGE_KEY } = ThemeSlice;
type themeState = ThemeSlice.ThemeState;


const getItemSpy = vi.spyOn(Storage.prototype, 'getItem')
const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')

test('should set the theme to light', () => {

    const previousState: themeState = {
        theme: "dark",
    }
    const newTheme = "light"

    const nextState = reducer(previousState, setTheme(newTheme))

    expect(nextState).toEqual(
        { theme: newTheme },
    )
    expect(setItemSpy).toHaveBeenCalledWith(LOCAL_STORAGE_KEY, newTheme)
})

test('should get the theme from storage', () => {

    const previousState: themeState = {
        theme: "",
    }
    const newTheme = "light"
    getItemSpy.mockReturnValue(newTheme)

    expect(reducer(previousState, loadTheme())).toEqual(
        { theme: newTheme },
    )
    expect(getItemSpy).toHaveBeenCalledWith(LOCAL_STORAGE_KEY)
})

afterEach(async () => {
    getItemSpy.mockClear()
    setItemSpy.mockClear()
})