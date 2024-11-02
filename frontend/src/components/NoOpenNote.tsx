import { Button } from "./ui/button";
import { useAppDispatch } from "@/lib/hooks";
import { createNote } from "@/lib/slices/notesSlice";

export default function NoOpenNote(){
    const dispatch = useAppDispatch();
    return (
        <div className="flex justify-center items-center h-full bg-gray-800 text-neutral-400">
            <Button variant="ghost" onClick={()=>{
                dispatch(createNote({title:"New Note", content:"", parent:null}));
            }}>
                Create a Note
            </Button>
        </div>
    );
}