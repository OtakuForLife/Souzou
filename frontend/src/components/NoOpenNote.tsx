import { Button } from "./ui/button";
import { useAppDispatch } from "@/hooks";
import { createNote } from "@/store/slices/notesSlice";

export default function NoOpenNote(){
    const dispatch = useAppDispatch();
    return (
        <div className="flex justify-center items-center h-full w-full bg-skin-secondary text-skin-primary">
            <Button variant="ghost" onClick={()=>{
                dispatch(createNote({title:"New Note", content:"", parent:null}));
            }}>
                Create a Note
            </Button>
        </div>
    );
}