export type NoteType = "nota" | "tarefa";

export interface Task {
  id: string;
  text: string;
  completed: boolean;
}

export interface Note {
  id: string;
  title: string;
  description: string;
  type: NoteType;
  tasks?: Task[];
  arquivada: boolean;
  createdAt: string;
}

export interface NoteFormValues {
  title: string;
  description: string;
  type: NoteType;
  tasks?: Task[];
}
