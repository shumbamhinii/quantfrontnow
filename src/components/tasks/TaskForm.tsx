import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DialogFooter } from '@/components/ui/dialog';

interface Project {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string;
  email?: string | null;
}

export type TaskFormData = {
  title: string;
  description?: string;
  priority: 'Low' | 'Medium' | 'High';
  assignee_id?: string | null;     // <-- use id
  due_date?: string;
  progress_percentage: number;
  project_id?: string | null;
};

export type TaskFormProps = {
  task?: TaskFormData;
  onSave: (data: TaskFormData) => void | Promise<void>;
  onCancel: () => void;
  projects: Project[];
  users: User[];                    // <-- pass users in
};

const assigneePlaceholderValue = 'unassigned';
const projectPlaceholderValue = 'unassigned';

export function TaskForm({ task, onSave, onCancel, projects, users }: TaskFormProps) {
  const [formData, setFormData] = useState<TaskFormData>({
    title: task?.title || '',
    description: task?.description || '',
    priority: task?.priority || 'Medium',
    assignee_id: task?.assignee_id ?? null,
    due_date: task?.due_date || '',
    progress_percentage: task?.progress_percentage ?? 0,
    project_id: task?.project_id ?? null,
  });

  useEffect(() => {
    setFormData({
      title: task?.title || '',
      description: task?.description || '',
      priority: task?.priority || 'Medium',
      assignee_id: task?.assignee_id ?? null,
      due_date: task?.due_date || '',
      progress_percentage: task?.progress_percentage ?? 0,
      project_id: task?.project_id ?? null,
    });
  }, [task]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      assignee_id: formData.assignee_id || null,
      project_id: formData.project_id || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="priority">Priority</Label>
        <Select
          value={formData.priority}
          onValueChange={(value) => setFormData({ ...formData, priority: value as 'Low' | 'Medium' | 'High' })}
        >
          <SelectTrigger id="priority">
            <SelectValue placeholder="Select priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Low">Low</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="High">High</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="assignee">Assignee</Label>
        <Select
          value={formData.assignee_id ?? assigneePlaceholderValue}
          onValueChange={(value) =>
            setFormData({
              ...formData,
              assignee_id: value === assigneePlaceholderValue ? null : value,
            })
          }
        >
          <SelectTrigger id="assignee">
            <SelectValue placeholder="Select assignee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={assigneePlaceholderValue}>Unassigned</SelectItem>
            {users.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.name} {u.email ? `— ${u.email}` : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="project">Project</Label>
        <Select
          value={formData.project_id ?? projectPlaceholderValue}
          onValueChange={(value) =>
            setFormData({
              ...formData,
              project_id: value === projectPlaceholderValue ? null : value,
            })
          }
        >
          <SelectTrigger id="project">
            <SelectValue placeholder="Select project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={projectPlaceholderValue}>Unassigned</SelectItem>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="due_date">Due Date</Label>
        <Input
          id="due_date"
          type="date"
          value={formData.due_date || ''}
          onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="progress_percentage">Progress Percentage</Label>
        <Input
          id="progress_percentage"
          type="number"
          min={0}
          max={100}
          value={formData.progress_percentage}
          onChange={(e) => setFormData({ ...formData, progress_percentage: Number(e.target.value) })}
          required
        />
      </div>

      <DialogFooter>
        <Button type="submit">Save And Update</Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </DialogFooter>
    </form>
  );
}
