import { Settings, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from "./ui/dialog"
import {Button} from "./ui/button";
import { Label } from "./ui/label";
import { useTheme } from "@/hooks/useTheme";
import { log } from "@/lib/logger";
import { Theme } from "@/types/themeTypes";


export default function SettingsDialog(){
    const { currentTheme, allThemes, switchTheme } = useTheme();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleThemeChange = (newThemeId: string) => {
        const newTheme = allThemes.find((t: Theme) => t.id === newThemeId);
        log.info('User changing theme', {
            from: currentTheme?.name,
            to: newTheme?.name
        });

        // Close dropdown immediately
        setIsDropdownOpen(false);

        // Switch theme directly without delays
        switchTheme(newThemeId);
    };
    return (
        <Dialog>
            <DialogTrigger className="w-full h-full">
                <Settings className="w-full h-full p-1 cursor-pointer"/>
            </DialogTrigger>
            <DialogContent className="theme-explorer-background theme-explorer-item-text">
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
                        <div className="w-1/2 relative" ref={dropdownRef}>
                            {/* Custom Dropdown Trigger */}
                            <button
                                type="button"
                                className="w-full px-3 py-2 text-left border rounded-md shadow-sm focus:outline-none focus:ring-2 flex items-center justify-between transition-colors"
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            >
                                <span>{currentTheme?.name || 'Select theme'}</span>
                                <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Custom Dropdown Content */}
                            {isDropdownOpen && (
                                <div className="absolute z-50 w-full mt-1 theme-explorer-background theme-explorer-item-text border rounded-md shadow-lg max-h-60 overflow-auto">
                                    {allThemes.map((theme: Theme) => (
                                        <button
                                            key={theme.id}
                                            type="button"
                                            className={`w-full px-3 py-2 text-left focus:outline-none transition-colors ${
                                                currentTheme?.id === theme.id ? 'theme-sidebar-background' : ''
                                            }`}
                                            onClick={() => handleThemeChange(theme.id)}
                                        >
                                            {theme.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button type="submit">Save</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}