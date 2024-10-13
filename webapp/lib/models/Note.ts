import  mongoose, { Schema, model } from  "mongoose";

export interface NoteDocument {
  _id: string;
  title: string;
  icon: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const NoteSchema = new Schema<NoteDocument>();

const  Note  =  mongoose.models?.Note  ||  model<NoteDocument>('Note', NoteSchema);
export  default  Note;