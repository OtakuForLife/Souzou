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
import { useAppDispatch } from "@/hooks";
import { setTheme } from "@/store/slices/themeSlice";
  
export default function SettingsDialog(){
    const dispatch = useAppDispatch();
    const theme: string = useSelector((state: RootState) => state.theme.theme);
    return (
        <Dialog>
            <DialogTrigger className="w-full h-full">
                <Settings className="w-full h-full p-1"/>
            </DialogTrigger>
            <DialogContent className="w-100 h-50 bg-skin-primary text-skin-primary">
                <DialogHeader>
                    <DialogTitle>Settings</DialogTitle>
                    <DialogDescription>
                        Change the theme of the app
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-row items-center justify-between">
                    <Label className="text-right">Theme</Label>
                    <div className="w-1/2">
                        <Select value={theme} onValueChange={(theme: string)=>{dispatch(setTheme(theme))}}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Theme" />
                            </SelectTrigger>
                            <SelectContent className="bg-skin-primary text-skin-primary">
                                <SelectItem value="light">Light</SelectItem>
                                <SelectItem value="dark">Dark</SelectItem>
                                <SelectItem value="red">Red</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button type="submit">Save</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}