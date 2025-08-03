import FileUpload from "./FileUpload";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { openTab } from "@/store/slices/tabsSlice";
import { useAppDispatch } from "@/hooks";
import { useDialog } from "@/contexts/DialogContext";




function FileUploadDialog() {
    const dispatch = useAppDispatch();
    const { fileUpload, closeFileUpload } = useDialog();

    const handleFileUploadComplete = (entityId: string) => {
        closeFileUpload();
        dispatch(openTab(entityId));
    };
    return (
        <Dialog open={fileUpload.isOpen} onOpenChange={closeFileUpload}>
            <DialogContent
                className="max-w-lg theme-explorer-background theme-explorer-item-text"
            >
                <DialogHeader>
                    <DialogTitle>Upload Media Files</DialogTitle>
                </DialogHeader>
                <FileUpload
                    parentId={fileUpload.parentId}
                    onUploadComplete={handleFileUploadComplete}
                />
            </DialogContent>
        </Dialog>
    );
}

export default FileUploadDialog;