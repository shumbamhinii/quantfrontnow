import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { MoreHorizontal, Edit, Trash2, Calendar, User, Folder, Info } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TaskForm, type TaskFormData } from './TaskForm';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface Task {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  status: 'To Do' | 'In Progress' | 'Done';
  priority: 'Low' | 'Medium' | 'High';
  due_date?: string;
  progress_percentage: number;
  created_at: string;
  updated_at: string;
  assignee_id?: string | null;     // <-- id
  assignee_name?: string | null;   // <-- display name
  project_id?: string | null;
  project_name?: string | null;
}

const priorityColors = {
  Low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Medium: 'bg-amber-50 text-amber-700 border-amber-200',
  High: 'bg-red-50 text-red-700 border-red-200',
};

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  priority: Task['priority'];
  progressPercentage: number;
  project_name?: string | null;
  projects: { id: string; name: string; }[];
}

export function TaskCard({
  task,
  onEdit,
  onDelete,
  priority,
  progressPercentage,
  project_name,
  projects
}: TaskCardProps) {
  const [showEditForm, setShowEditForm] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [showOverviewDialog, setShowOverviewDialog] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 0,
    opacity: isDragging ? 0.8 : 1,
  };

  const handleEditSave = (updatedFormTask: TaskFormData) => {
    onEdit({
      ...task,
      title: updatedFormTask.title,
      description: updatedFormTask.description,
      priority: updatedFormTask.priority,
      assignee_id: updatedFormTask.assignee_id ?? null,
      // NOTE: assignee_name will be refreshed from backend on refetch; keep existing until then
      due_date: updatedFormTask.due_date,
      progress_percentage: updatedFormTask.progress_percentage,
      project_id: updatedFormTask.project_id ?? null,
    });
    setShowEditForm(false);
  };

  const handleDeleteConfirm = () => {
    onDelete(task.id);
    setAlertOpen(false);
  };

  const handleDragHandleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleEditButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowEditForm(true);
  };

  const handleOverviewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowOverviewDialog(true);
  };

  // "Done" compact card
  if (task.status === 'Done') {
    return (
      <motion.div
        ref={setNodeRef}
        style={style}
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        whileHover={{ scale: 1.02 }}
        className="cursor-default"
      >
        <Card className="hover:shadow-lg transition-all duration-200 bg-white border border-gray-200 flex items-center justify-between p-2">
          <CardContent className="flex-1 p-0 flex items-center gap-2 cursor-pointer" onClick={handleOverviewClick}>
            <Info className="h-4 w-4 text-blue-500" />
            <span className="font-medium text-sm text-gray-800 line-clamp-1">
              {task.title}
            </span>
          </CardContent>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 cursor-grab"
              {...listeners}
              {...attributes}
              onClick={handleDragHandleClick}
              aria-label="Drag task"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>

            <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 hover:bg-red-50 hover:text-red-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAlertOpen(true);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Task</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{task.title}"? This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteConfirm}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </Card>

        {/* Overview Dialog */}
        <Dialog open={showOverviewDialog} onOpenChange={setShowOverviewDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" /> Task Overview: {task.title}
              </DialogTitle>
              <DialogDescription>Detailed information about this task.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Title</Label>
                <Input defaultValue={task.title} readOnly className="col-span-3" />
              </div>
              {task.description && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Description</Label>
                  <Textarea defaultValue={task.description} readOnly className="col-span-3" />
                </div>
              )}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Status</Label>
                <Input defaultValue={task.status} readOnly className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Priority</Label>
                <Input defaultValue={task.priority} readOnly className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Progress</Label>
                <Input defaultValue={`${task.progress_percentage}%`} readOnly className="col-span-3" />
              </div>
              {task.assignee_name && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Assignee</Label>
                  <Input defaultValue={task.assignee_name} readOnly className="col-span-3" />
                </div>
              )}
              {task.due_date && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Due Date</Label>
                  <Input defaultValue={new Date(task.due_date).toLocaleDateString()} readOnly className="col-span-3" />
                </div>
              )}
              {task.project_name && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Project</Label>
                  <Input defaultValue={task.project_name} readOnly className="col-span-3" />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={() => setShowOverviewDialog(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    );
  }

  // Default detailed card
  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ scale: 1.02 }}
      className="cursor-default"
    >
      <Card className="hover:shadow-lg transition-all duration-200 bg-white border border-gray-200 flex flex-col h-fit">
        <CardContent className="p-3 space-y-3 flex-1 flex-col">
          <div className="flex justify-between items-center gap-2">
            <h4 className="font-semibold text-sm text-gray-900 line-clamp-2 leading-5 flex-1">
              {task.title}
            </h4>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 cursor-grab"
              {...listeners}
              {...attributes}
              onClick={handleDragHandleClick}
              aria-label="Drag task"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>

          {task.description && (
            <p className="text-xs text-gray-600 line-clamp-2 leading-4">{task.description}</p>
          )}

          <div className="flex flex-wrap gap-1">
            <Badge variant="outline" className={`text-xs font-medium border ${priorityColors[priority]}`}>
              {priority}
            </Badge>
            {project_name && (
              <Badge variant="outline" className="text-xs font-medium border bg-purple-50 text-purple-700 border-purple-200 flex items-center gap-1">
                <Folder className="h-3 w-3" />
                {project_name}
              </Badge>
            )}
          </div>

          <div className="space-y-1 mt-auto">
            {task.due_date && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Calendar className="h-3 w-3" />
                <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
              </div>
            )}
            {task.assignee_name && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <User className="h-3 w-3" />
                <span>{task.assignee_name}</span>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Progress</span>
              <span className="font-medium text-gray-700">{progressPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div className="bg-blue-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${progressPercentage}%` }} />
            </div>
          </div>

          <div className="flex items-center justify-end gap-1 pt-1 border-t border-gray-100">
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-blue-50 hover:text-blue-600" onClick={handleEditButtonClick}>
              <Edit className="h-3 w-3" />
            </Button>

            <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Edit Task</DialogTitle>
                  <DialogDescription>Update your task details.</DialogDescription>
                </DialogHeader>
                <TaskForm
                  task={{
                    title: task.title,
                    description: task.description || '',
                    priority: task.priority,
                    assignee_id: task.assignee_id ?? null,  // <-- pass id here
                    due_date: task.due_date,
                    progress_percentage: task.progress_percentage,
                    project_id: task.project_id ?? null,
                  }}
                  onSave={handleEditSave}
                  onCancel={() => setShowEditForm(false)}
                  projects={projects}
                  users={[]} // Will be replaced by parent in edit dialog (KanbanBoard supplies users there)
                />
              </DialogContent>
            </Dialog>

            <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 hover:bg-red-50 hover:text-red-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAlertOpen(true);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Task</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{task.title}"? This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteConfirm}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
