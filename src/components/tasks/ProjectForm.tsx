import React, { useState, useEffect } from 'react';
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
// ProjectForm itself doesn't make API calls directly, but it's good practice
// to ensure it's rendered within an authenticated context if needed.
// No direct 'useAuth' or 'token' needed here unless it were to fetch dynamic data.

export type ProjectFormData = {
  name: string;
  description?: string;
  deadline?: string;
  status: 'Not Started' | 'In Progress' | 'Completed' | 'On Hold' | 'Cancelled';
  assignee?: string | null; // New: Project Lead/Assignee
};

export type ProjectFormProps = {
  project?: ProjectFormData; // Optional prop for editing existing projects
  onSave: (data: ProjectFormData) => void;
  onCancel: () => void;
};

const projectStatusOptions = [
  'Not Started',
  'In Progress',
  'Completed',
  'On Hold',
  'Cancelled',
];

const assignees = [ // Reusing assignees from TaskForm for consistency
  'Zinhle Mpo',
  'Audrey Van Wyk',
  'Mike Johnson',
  'Sarah Wilson',
  'Tom Brown',
];
const assigneePlaceholderValue = 'unassigned';

export function ProjectForm({ project, onSave, onCancel }: ProjectFormProps) {
  const [formData, setFormData] = useState<ProjectFormData>({
    name: project?.name || '',
    description: project?.description || '',
    deadline: project?.deadline || '',
    status: project?.status || 'Not Started',
    assignee: project?.assignee ?? assigneePlaceholderValue, // Initialize assignee
  });

  // Update form data if a project prop is passed (for editing)
  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || '',
        description: project.description || '',
        deadline: project.deadline || '',
        status: project.status || 'Not Started',
        assignee: project.assignee ?? assigneePlaceholderValue,
      });
    }
  }, [project]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSave: ProjectFormData = {
      ...formData,
      assignee: formData.assignee === assigneePlaceholderValue ? null : formData.assignee,
    };
    onSave(dataToSave);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="projectName">Project Name *</Label>
        <Input
          id="projectName"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="projectDescription">Description</Label>
        <Textarea
          id="projectDescription"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="projectDeadline">Deadline</Label>
        <Input
          id="projectDeadline"
          type="date"
          value={formData.deadline || ''}
          onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="projectStatus">Status</Label>
        <Select
          value={formData.status}
          onValueChange={(value) =>
            setFormData({ ...formData, status: value as ProjectFormData['status'] })
          }
        >
          <SelectTrigger id="projectStatus">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {projectStatusOptions.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* New: Project Assignee/Lead */}
      <div>
        <Label htmlFor="projectAssignee">Project Lead</Label>
        <Select
          value={formData.assignee ?? assigneePlaceholderValue}
          onValueChange={(value) => setFormData({ ...formData, assignee: value })}
        >
          <SelectTrigger id="projectAssignee">
            <SelectValue placeholder="Select project lead" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={assigneePlaceholderValue}>Unassigned</SelectItem>
            {assignees.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DialogFooter>
        <Button type="submit">
          {project ? 'Update Project' : 'Create Project'}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </DialogFooter>
    </form>
  );
}
