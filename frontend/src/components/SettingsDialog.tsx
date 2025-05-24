import { Settings } from "lucide-react";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from "./ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "./ui/select"
import {Button} from "./ui/button";
import { Label } from "./ui/label";
import { RootState } from "@/store";
import { useSelector } from "react-redux";
import { useAppDispatch, useLocalStorage } from "@/hooks";
import { setTheme } from "@/store/slices/themeSlice";
import { THEME_CONFIG, ThemeType, STORAGE_KEYS } from "@/config/constants";
import { log } from "@/lib/logger";

interface UserPreferences {
    autoSave: boolean;
    showLineNumbers: boolean;
    fontSize: number;
}

export default function SettingsDialog(){
    const dispatch = useAppDispatch();
    const theme: ThemeType = useSelector((state: RootState) => state.theme.theme);

    // Use localStorage hook for user preferences
    const [preferences, setPreferences] = useLocalStorage<UserPreferences>(
        STORAGE_KEYS.USER_PREFERENCES,
        {
            autoSave: true,
            showLineNumbers: false,
            fontSize: 14,
        }
    );

    const handleThemeChange = (newTheme: string) => {
        const themeValue = newTheme as ThemeType;
        log.info('User changing theme', { from: theme, to: themeValue });
        dispatch(setTheme(themeValue));
    };

    const handlePreferenceChange = (key: keyof UserPreferences, value: any) => {
        const newPreferences = { ...preferences, [key]: value };
        setPreferences(newPreferences);
        log.info('User preference changed', { key, value, preferences: newPreferences });
    };
    return (
        <Dialog>
            <DialogTrigger className="w-full h-full">
                <Settings className="w-full h-full p-1"/>
            </DialogTrigger>
            <DialogContent className="w-100 h-50 bg-skin-primary text-skin-primary">
                <DialogHeader>
                    <DialogTitle>Settings</DialogTitle>
                    <DialogDescription>
                        Customize your application preferences
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Theme Setting */}
                    <div className="flex flex-row items-center justify-between">
                        <Label className="text-right">Theme</Label>
                        <div className="w-1/2">
                            <Select value={theme} onValueChange={handleThemeChange}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Theme" />
                                </SelectTrigger>
                                <SelectContent className="bg-skin-primary text-skin-primary">
                                    {THEME_CONFIG.AVAILABLE_THEMES.map((themeOption) => (
                                        <SelectItem key={themeOption} value={themeOption}>
                                            {themeOption.charAt(0).toUpperCase() + themeOption.slice(1)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Auto-save Setting */}
                    <div className="flex flex-row items-center justify-between">
                        <Label className="text-right">Auto-save</Label>
                        <input
                            type="checkbox"
                            checked={preferences.autoSave}
                            onChange={(e) => handlePreferenceChange('autoSave', e.target.checked)}
                            className="w-4 h-4"
                        />
                    </div>

                    {/* Show Line Numbers Setting */}
                    <div className="flex flex-row items-center justify-between">
                        <Label className="text-right">Show Line Numbers</Label>
                        <input
                            type="checkbox"
                            checked={preferences.showLineNumbers}
                            onChange={(e) => handlePreferenceChange('showLineNumbers', e.target.checked)}
                            className="w-4 h-4"
                        />
                    </div>

                    {/* Font Size Setting */}
                    <div className="flex flex-row items-center justify-between">
                        <Label className="text-right">Font Size</Label>
                        <input
                            type="number"
                            min="10"
                            max="24"
                            value={preferences.fontSize}
                            onChange={(e) => handlePreferenceChange('fontSize', parseInt(e.target.value))}
                            className="w-20 px-2 py-1 border rounded"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button type="submit">Save</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}