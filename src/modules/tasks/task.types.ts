export interface CreateTaskInput {
  title: string;
  description?: string;
  dueDate?: string;
  projectId?: string;
  assigneeId?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  dueDate?: string | null;
  assigneeId?: string | null;
}
