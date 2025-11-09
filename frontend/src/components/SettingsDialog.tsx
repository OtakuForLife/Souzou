import { Settings, ChevronDown, Circle } from "lucide-react";
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

import { Input } from "./ui/input";
import { DialogClose } from "./ui/dialog";
import { getBackendURL, setBackendURL } from "@/lib/settings";
import { ServerHealthStatusType, useServerHealth } from "@/hooks/useServerHealth";


export default function SettingsDialog(){
    const [backendURL, setBackendURLState] = useState("");
    const { status: serverStatus, checkHealth, triggerSync, triggerFullSync } = useServerHealth();
    const [isTesting, setIsTesting] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isFullSyncing, setIsFullSyncing] = useState(false);

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

    // Initialize server settings from storage
    useEffect(() => {
        setBackendURLState(getBackendURL());
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

    const handleTestConnection = async () => {
        setIsTesting(true);
        await checkHealth();
        setIsTesting(false);
    };

    const handleManualSync = async () => {
        setIsSyncing(true);
        try {
            await triggerSync();
            log.info('Manual sync completed');
        } catch (error) {
            log.error('Manual sync failed', error as Error);
        } finally {
            setIsSyncing(false);
        }
    };

    const handleFullSync = async () => {
        setIsFullSyncing(true);
        try {
            await triggerFullSync();
            log.info('Full sync completed');
        } catch (error) {
            log.error('Full sync failed', error as Error);
        } finally {
            setIsFullSyncing(false);
        }
    };

    const handleSave = () => {
        const url = backendURL.trim();
        let finalUrl = url;
        try { new URL(url); } catch { finalUrl = 'http://localhost:8000'; }
        setBackendURL(finalUrl);
        log.info('Updated backend URL', { url: finalUrl });
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
                    {/* Server Settings */}
                    <div className="flex flex-col gap-2">
                        <Label className="text-right">Server</Label>
                        <div className="flex gap-2 items-center">
                            <Input placeholder="Server URL (e.g., http://localhost:8000)" value={backendURL} onChange={(e) => setBackendURLState(e.target.value)} />
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleTestConnection}
                                disabled={isTesting}
                            >
                                {isTesting ? 'Testing...' : 'Test'}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleManualSync}
                                disabled={isSyncing || isFullSyncing || serverStatus !== ServerHealthStatusType.HEALTHY}
                            >
                                {isSyncing ? 'Syncing...' : 'Sync'}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleFullSync}
                                disabled={isSyncing || isFullSyncing || serverStatus !== ServerHealthStatusType.HEALTHY}
                                title="Reset sync cursor and pull all data from server"
                            >
                                {isFullSyncing ? 'Full Syncing...' : 'Full Sync'}
                            </Button>
                            <div className="flex flex-col items-center gap-1">
                                <Circle
                                    className={`w-4 h-4 flex-shrink-0 ${
                                        serverStatus === ServerHealthStatusType.HEALTHY
                                            ? 'fill-green-500 text-green-500'
                                            : serverStatus === ServerHealthStatusType.UNHEALTHY
                                            ? 'fill-yellow-500 text-yellow-500'
                                            : 'fill-gray-400 text-gray-400'
                                    }`}
                                />
                                <span className="text-xs whitespace-nowrap">
                                    {serverStatus === ServerHealthStatusType.HEALTHY
                                        ? 'Reachable'
                                        : serverStatus === ServerHealthStatusType.UNHEALTHY
                                        ? 'Not reachable'
                                        : 'Checking...'}
                                </span>
                            </div>
                        </div>
                    </div>

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
                                            className={`w-full px-3 py-2 text-left focus:outline-none transition-colors ${currentTheme?.id === theme.id ? 'theme-sidebar-background' : ''}`}
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
                    <DialogClose asChild>
                      <Button type="button" onClick={handleSave}>Save</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}