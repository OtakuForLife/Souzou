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
import { useAppDispatch, useAppSelector } from "../lib/hooks";
import { themeState, setTheme } from "../lib/slices/themeSlice";
import { Label } from "./ui/label";
  
export default function SettingsDialog(){
    const dispatch = useAppDispatch();
    const theme: string = useAppSelector((state: { theme: themeState }) => state.theme.theme);
    return (
        <Dialog>
            <DialogTrigger className="w-full h-full">
                <Settings className="w-full h-full p-1"/>
            </DialogTrigger>
            <DialogContent className="w-50 h-50 bg-skin-primary text-skin-primary">
                <DialogHeader>
                    <DialogTitle>Settings</DialogTitle>
                </DialogHeader>
                <div>
                    <Label>Theme</Label>
                    <Select value={theme} onValueChange={(theme: string)=>{dispatch(setTheme(theme))}}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Theme" />
                        </SelectTrigger>
                        <SelectContent className="bg-skin-primary text-skin-primary">
                            <SelectItem value="light">Light</SelectItem>
                            <SelectItem value="dark">Dark</SelectItem>
                            <SelectItem value="red">Red</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <DialogFooter>
                    <Button type="submit">Save</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}