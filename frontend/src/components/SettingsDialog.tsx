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
import { getBackendURL, setBackendURL, getSyncEnabled, setSyncEnabled } from "@/lib/settings";
import { ServerHealthStatusType, useServerHealth } from "@/hooks/useServerHealth";
import { Checkbox } from "./ui/checkbox";
import { clearAllLocalData } from "@/repository";
import { fetchEntities } from "@/store/slices/entitySlice";
import { useAppDispatch } from "@/hooks";
import { toast } from "sonner";


export default function SettingsDialog(){
    const dispatch = useAppDispatch();
    const [backendURL, setBackendURLState] = useState(getBackendURL());
    const [syncEnabled, setSyncEnabledState] = useState(getSyncEnabled());
    const { status: serverStatus, checkHealth, triggerSync, triggerFullSync } = useServerHealth({ enabled: syncEnabled });
    const [isTesting, setIsTesting] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isFullSyncing, setIsFullSyncing] = useState(false);
    const [isClearing, setIsClearing] = useState(false);

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

    const handleClearLocalData = async () => {
        if (!confirm('Are you sure you want to erase all local data? This cannot be undone.')) {
            return;
        }

        setIsClearing(true);
        try {
            await clearAllLocalData();
            await dispatch(fetchEntities()); // Refresh Redux to show empty state
            toast.success('All local data has been cleared');
            log.info('Local data cleared successfully');
        } catch (error) {
            toast.error('Failed to clear local data');
            log.error('Failed to clear local data', error as Error);
        } finally {
            setIsClearing(false);
        }
    };

    const handleSave = () => {
        const url = backendURL.trim();
        let finalUrl = url;
        try { new URL(url); } catch { finalUrl = 'http://localhost:8000'; }
        setBackendURL(finalUrl);
        setSyncEnabled(syncEnabled);
        log.info('Updated settings', { url: finalUrl, syncEnabled });
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
                    <div className="flex flex-row items-center justify-left gap-2">
                        <Checkbox
                            checked={syncEnabled}
                            onCheckedChange={(checked) => setSyncEnabledState(checked as boolean)}
                        />
                        <Label className="cursor-pointer" onClick={() => setSyncEnabledState(!syncEnabled)}>
                            Sync with Server
                        </Label>
                    </div>

                    {syncEnabled && (
                        <div className="flex flex-col gap-2">
                            {/* Server URL Input - Full width on all devices */}
                            <Input
                                placeholder="Server URL (e.g., http://localhost:8000)"
                                value={backendURL}
                                onChange={(e) => setBackendURLState(e.target.value)}
                                className="w-full"
                            />

                            {/* Buttons Row */}
                            <div className="flex gap-2 items-center flex-wrap">
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
                                <div className="flex flex-col items-center gap-1 ml-auto">
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
                    )}
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

                    {/* Danger Zone */}
                    <div className="pt-4 border-t">
                        <Label className="text-red-500 font-semibold mb-2 block">Danger Zone</Label>
                        <div className="flex flex-row items-center justify-between gap-2">
                            <div className="flex-1">
                                <p className="text-sm">Clear all local data (entities, tags, sync state)</p>
                                <p className="text-xs text-gray-500">This will erase everything stored locally. Cannot be undone.</p>
                            </div>
                            <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={handleClearLocalData}
                                disabled={isClearing}
                            >
                                {isClearing ? 'Clearing...' : 'Clear Local Data'}
                            </Button>
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