import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search, X, Edit3, Trash2, CheckCircle, PieChart, LayoutDashboard } from 'lucide-react'; // Added CheckCircle, PieChart, LayoutDashboard
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  closestCorners,
  useDroppable
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { TaskCard } from './TaskCard';
import { TaskForm, type TaskFormData } from './TaskForm';
import { ProjectForm, type ProjectFormData } from './ProjectForm';
import { useToast } from '@/hooks/use-toast';
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
import { KpiCard } from './KpiCard'; // Import the new KpiCard component
import { useAuth } from '../../AuthPage'; // Import useAuth

// Define Project interface with new fields
interface Project {
  id: string;
  name: string;
  description?: string;
  deadline?: string;    // YYYY-MM-DD format
  status: 'Not Started' | 'In Progress' | 'Completed' | 'On Hold' | 'Cancelled';
  assignee?: string | null; // New: Project Lead/Assignee
  progress_percentage: number; // New: Calculated project progress
}

// Extend Task interface to include project information
interface Task {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  status: 'To Do' | 'In Progress' | 'Review' | 'Done';
  priority: 'Low' | 'Medium' | 'High';
  due_date?: string;
  progress_percentage: number;
  created_at: string;
  updated_at: string;
  assignee?: string;
  project_id?: string | null;
  project_name?: string | null; // Name of the project for display
}

interface Column {
  id: string;
  title: string;
  tasks: Task[];
  color: string;
}

// Initial columns (will be populated from backend) - IDs must be static for hooks
const staticColumns: Column[] = [
  { id: 'todo', title: 'To Do', color: 'bg-gray-50', tasks: [] },
  { id: 'inprogress', title: 'In Progress', color: 'bg-blue-50', tasks: [] },
  { id: 'done', title: 'Done', color: 'bg-green-50', tasks: [] },
];

export function KanbanBoard() {
  const [columns, setColumns] = useState<Column[]>(staticColumns); // Use staticColumns initially
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [showDeleteProjectAlert, setShowDeleteProjectAlert] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [projects, setProjects] = useState<Project[]>([]); // Initialize as empty, fetch from backend
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true); // Loading state for initial fetch

  const { toast } = useToast();
  const { isAuthenticated } = useAuth(); // Get authentication status
  const token = localStorage.getItem('token'); // Retrieve the token

  // Helper to get authorization headers
  const getAuthHeaders = useCallback(() => {
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }, [token]);


  // Dynamically create droppable refs for each static column ID
  const droppableRefs = useRef<{ [key: string]: { setNodeRef: (node: HTMLElement | null) => void; isOver: boolean } }>({});
  staticColumns.forEach(column => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { setNodeRef, isOver } = useDroppable({ id: column.id });
    droppableRefs.current[column.id] = { setNodeRef, isOver };
  });


  // Helper function to determine task status based on progress percentage
  const getStatusFromProgress = (progress: number): Task['status'] => {
    if (progress === 100) {
      return 'Done';

    } else if (progress >= 25) {
      return 'In Progress';
    } else {
      return 'To Do';
    }
  };

  // Helper function to get column ID from status
  const getColumnIdFromStatus = (status: Task['status']): string => {
    switch (status) {
      case 'To Do':
        return 'todo';
      case 'In Progress':
        return 'inprogress';
      case 'Done':
        return 'done';
      default:
        return 'todo'; // Fallback
    }
  };

  // Calculate project progress based on tasks
  const calculateProjectProgress = useCallback((projectId: string) => {
    const projectTasks = columns.flatMap(column => column.tasks).filter(task => task.project_id === projectId);
    if (projectTasks.length === 0) {
      return 0;
    }
    const totalProgress = projectTasks.reduce((sum, task) => sum + task.progress_percentage, 0);
    return Math.round(totalProgress / projectTasks.length);
  }, [columns]);

  // Update project progress whenever tasks or projects change
  useEffect(() => {
    setProjects(prevProjects =>
      prevProjects.map(project => ({
        ...project,
        progress_percentage: calculateProjectProgress(project.id),
      }))
    );
  }, [columns, calculateProjectProgress]);


  // Fetch tasks and projects from the backend
  const fetchTasksAndProjects = useCallback(async () => {
    if (!isAuthenticated || !token) {
      console.warn('KanbanBoard: Not authenticated. Skipping data fetch.');
      setIsLoading(false);
      setColumns(staticColumns.map(col => ({ ...col, tasks: [] })));
      setProjects([]);
      toast({
        title: 'Authentication Required',
        description: 'Please log in to view and manage tasks and projects.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      // Fetch projects first
      const projectsResponse = await fetch('https://quantnow.onrender.com/api/projects', {
        headers: getAuthHeaders(),
      });
      if (!projectsResponse.ok) {
        throw new Error(`HTTP error! status: ${projectsResponse.status}`);
      }
      const projectsData: Project[] = await projectsResponse.json();
      setProjects(projectsData);

      // Fetch tasks
      const tasksResponse = await fetch('https://quantnow.onrender.com/api/tasks', {
        headers: getAuthHeaders(),
      });
      if (!tasksResponse.ok) {
        throw new Error(`HTTP error! status: ${tasksResponse.status}`);
      }
      const tasksData: Task[] = await tasksResponse.json();

      // Organize tasks into columns
      const newColumns = staticColumns.map(column => ({ // Use staticColumns here
        ...column,
        tasks: tasksData.filter(task => getColumnIdFromStatus(task.status) === column.id)
      }));
      setColumns(newColumns);

    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load tasks or projects. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, isAuthenticated, token, getAuthHeaders]);

  // Initial data fetch on component mount
  useEffect(() => {
    fetchTasksAndProjects();
  }, [fetchTasksAndProjects]);


  // Filter tasks based on search query AND selected project
  const filteredColumns = useMemo(() => {
    return columns.map((column) => ({
      ...column,
      tasks: column.tasks.filter((task) => {
        // Project filtering
        const matchesProject =
          selectedProjectId === 'all' ||
          (selectedProjectId === 'unassigned' && !task.project_id) ||
          (task.project_id && task.project_id === selectedProjectId);

        // Search query filtering
        const matchesSearch = searchQuery.trim()
          ? task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            task.assignee?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            task.project_name?.toLowerCase().includes(searchQuery.toLowerCase())
          : true;

        return matchesProject && matchesSearch;
      }),
    }));
  }, [columns, searchQuery, selectedProjectId]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = findTaskById(active.id as string);
    setDraggedTask(task);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggedTask(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    const activeTask = findTaskById(activeId);
    const activeColumn = findColumnByTaskId(activeId);
    let overColumn: Column | null = null;

    // Check if the overId is a column ID (from useDroppable)
    overColumn = findColumnById(overId);

    // If not a column ID, check if it's a task ID and find its column
    if (!overColumn) {
      overColumn = findColumnByTaskId(overId);
    }

    if (!activeTask || !activeColumn || !overColumn) return;

    if (activeColumn.id !== overColumn.id) {
      const statusMap: Record<string, Task['status']> = {
        todo: 'To Do',
        inprogress: 'In Progress',
        done: 'Done',
      };

      const newStatus = statusMap[overColumn.id] || activeTask.status;

      // Optimistic UI update
      setColumns(
        columns.map((column) => {
          if (column.id === activeColumn.id) {
            return {
              ...column,
              tasks: column.tasks.filter((task) => task.id !== activeId),
            };
          }
          if (column.id === overColumn.id) {
            return {
              ...column,
              tasks: [...column.tasks, { ...activeTask, status: newStatus }],
            };
          }
          return column;
        })
      );

      try {
        // API call to update task status
        const response = await fetch(`https://quantnow.onrender.com/api/tasks/${activeTask.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(), // Include auth headers
          },
          body: JSON.stringify({ ...activeTask, status: newStatus }),
        });

        if (!response.ok) {
          throw new Error('Failed to update task status on backend.');
        }

        toast({
          title: 'Task moved',
          description: `Task moved from ${activeColumn.title} to ${overColumn.title}`,
        });
        fetchTasksAndProjects(); // Re-fetch to ensure data consistency

      } catch (error) {
        console.error('Error updating task status:', error);
        toast({
          title: 'Error',
          description: 'Failed to move task. Please try again.',
          variant: 'destructive',
        });
        fetchTasksAndProjects(); // Revert optimistic update by re-fetching
      }
    }
  };

  const findTaskById = (id: string): Task | null => {
    for (const column of columns) {
      const task = column.tasks.find((task) => task.id === id);
      if (task) return task;
    }
    return null;
  };

  const findColumnById = (id: string): Column | null => {
    return columns.find((column) => column.id === id) || null;
  };

  const findColumnByTaskId = (taskId: string): Column | null => {
    return (
      columns.find((column) => column.tasks.some((task) => task.id === taskId)) ||
      null
    );
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const handleAddTask = () => {
    setShowNewTaskForm(true);
  };

  const handleSaveNewTask = async (taskData: TaskFormData) => {
    if (!isAuthenticated || !token) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to create tasks.',
        variant: 'destructive',
      });
      return;
    }

    const statusFromProgress = getStatusFromProgress(
      taskData.progress_percentage
    );

    try {
      const response = await fetch('https://quantnow.onrender.com/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(), // Include auth headers
        },
        body: JSON.stringify({
          ...taskData,
          status: statusFromProgress,
          user_id: 'frontend-user-123', // Ensure user_id is sent
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create task on backend.');
      }

      // We don't directly add to columns state here; we re-fetch to ensure data consistency
      fetchTasksAndProjects();
      setShowNewTaskForm(false);
      toast({ title: 'Task created successfully' });

    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: 'Error',
        description: 'Failed to create task. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleOpenEdit = (task: Task) => {
    setTaskToEdit(task);
  };

  const handleSubmitEdit = async (taskData: TaskFormData) => {
    if (!taskToEdit) return;
    if (!isAuthenticated || !token) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to edit tasks.',
        variant: 'destructive',
      });
      return;
    }

    const statusFromProgress = getStatusFromProgress(taskData.progress_percentage);

    try {
      const response = await fetch(`https://quantnow.onrender.com/api/tasks/${taskToEdit.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(), // Include auth headers
        },
        body: JSON.stringify({
          ...taskData,
          status: statusFromProgress,
          user_id: 'frontend-user-123', // Ensure user_id is sent
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update task on backend.');
      }

      // Re-fetch to ensure data consistency and correct column placement
      fetchTasksAndProjects();
      setTaskToEdit(null);
      toast({ title: 'Task updated successfully' });

    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: 'Error',
        description: 'Failed to update task. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!isAuthenticated || !token) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to delete tasks.',
        variant: 'destructive',
      });
      return;
    }
    try {
      const response = await fetch(`https://quantnow.onrender.com/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(), // Include auth headers
      });

      if (!response.ok) {
        throw new Error('Failed to delete task on backend.');
      }

      // Re-fetch to ensure data consistency
      fetchTasksAndProjects();
      toast({ title: 'Task deleted successfully' });

    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete task. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleSaveNewProject = async (projectData: ProjectFormData) => {
    if (!isAuthenticated || !token) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to create projects.',
        variant: 'destructive',
      });
      return;
    }
    try {
      const response = await fetch('https://quantnow.onrender.com/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(), // Include auth headers
        },
        body: JSON.stringify(projectData),
      });

      if (!response.ok) {
        throw new Error('Failed to create project on backend.');
      }

      // Re-fetch projects to update the list
      fetchTasksAndProjects(); // This will re-fetch both tasks and projects
      setShowNewProjectForm(false);
      toast({ title: `Project "${projectData.name}" created successfully!` });

    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: 'Error',
        description: 'Failed to create project. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleEditProject = async (projectData: ProjectFormData) => {
    if (!activeProject) return;
    if (!isAuthenticated || !token) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to edit projects.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch(`https://quantnow.onrender.com/api/projects/${activeProject.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(), // Include auth headers
        },
        body: JSON.stringify(projectData),
      });

      if (!response.ok) {
        throw new Error('Failed to update project on backend.');
      }

      // Re-fetch projects and tasks to update the list and task project names
      fetchTasksAndProjects();
      setActiveProject(null);
      toast({ title: `Project "${projectData.name}" updated successfully!` });

    } catch (error) {
      console.error('Error updating project:', error);
      toast({
        title: 'Error',
        description: 'Failed to update project. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;
    if (!isAuthenticated || !token) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to delete projects.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch(`https://quantnow.onrender.com/api/projects/${projectToDelete.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(), // Include auth headers
      });

      if (!response.ok) {
        throw new Error('Failed to delete project on backend.');
      }

      // Re-fetch projects and tasks to update the lists
      fetchTasksAndProjects();
      toast({ title: `Project "${projectToDelete.name}" and its tasks deleted.` });
      setProjectToDelete(null);
      setShowDeleteProjectAlert(false);

    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete project. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // KPI Calculations
  const allTasks = useMemo(() => columns.flatMap(column => column.tasks), [columns]);

  const completedTasksCount = useMemo(() => 
    allTasks.filter(task => task.status === 'Done').length
  , [allTasks]);

  const inProgressTasksCount = useMemo(() => 
    allTasks.filter(task => task.status === 'In Progress' || task.status === 'Review').length
  , [allTasks]);

  const completedProjectsCount = useMemo(() => 
    projects.filter(project => project.status === 'Completed').length
  , [projects]);

  const inProgressProjectsCount = useMemo(() => 
    projects.filter(project => project.status === 'In Progress' || project.status === 'On Hold').length
  , [projects]);


  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Tasks</h1>
        <p className="text-gray-600 mb-4">Manage your tasks efficiently</p>

        {/* KPI Cards Section */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <KpiCard
            title="Completed Tasks"
            value={completedTasksCount}
            icon={CheckCircle}
            description="Tasks marked as done"
          />
          <KpiCard
            title="In Progress Tasks"
            value={inProgressTasksCount}
            icon={PieChart}
            description="Tasks currently being worked on"
          />
          <KpiCard
            title="Completed Projects"
            value={completedProjectsCount}
            icon={CheckCircle}
            description="Projects that are finished"
          />
          <KpiCard
            title="In Progress Projects"
            value={inProgressProjectsCount}
            icon={LayoutDashboard} // Using LayoutDashboard for in-progress projects
            description="Projects currently active"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search tasks, descriptions, assignees, or projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 bg-white border-gray-200"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={selectedProjectId}
              onValueChange={setSelectedProjectId}
            >
              <SelectTrigger className="w-[220px] bg-white border-gray-200">
                <SelectValue placeholder="Filter by Project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                <SelectItem value="unassigned">Unassigned Tasks</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    <div className="flex justify-between items-center w-full">
                      <span>{project.name}</span>
                      {project.progress_percentage !== undefined && (
                        <span className="text-xs text-gray-500">
                          {project.progress_percentage}%
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedProjectId !== 'all' && selectedProjectId !== 'unassigned' && (
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => setActiveProject(projects.find(p => p.id === selectedProjectId) || null)}
                  aria-label="Edit Project"
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 text-red-500 hover:bg-red-50 hover:text-red-600"
                  onClick={() => {
                    setProjectToDelete(projects.find(p => p.id === selectedProjectId) || null);
                    setShowDeleteProjectAlert(true);
                  }}
                  aria-label="Delete Project"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>


          <Button
            onClick={handleAddTask}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" /> Add New Task
          </Button>

          <Button
            onClick={() => setShowNewProjectForm(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" /> Add New Project
          </Button>
        </div>

        {searchQuery && (
          <p className="text-sm text-gray-500 mt-2">
            Showing results for "{searchQuery}"
          </p>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Loading tasks and projects...</div>
      ) : (
        <DndContext
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {columns.map((column, columnIndex) => {
              const { setNodeRef, isOver } = droppableRefs.current[column.id];

              const columnTasks = column.tasks.filter((task) => {
                const matchesProject =
                  selectedProjectId === 'all' ||
                  (selectedProjectId === 'unassigned' && !task.project_id) ||
                  (task.project_id && task.project_id === selectedProjectId);

                const matchesSearch = searchQuery.trim()
                  ? task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    task.assignee?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    task.project_name?.toLowerCase().includes(searchQuery.toLowerCase())
                  : true;

                return matchesProject && matchesSearch;
              });

              return (
                <motion.div
                  key={column.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: columnIndex * 0.1 }}
                >
                  <Card className={`${column.color} border-0 shadow-sm`}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle className="text-base font-semibold text-gray-900">
                            {column.title}
                          </CardTitle>
                          <CardDescription className="text-gray-600">
                            {columnTasks.length} task
                            {columnTasks.length !== 1 ? 's' : ''}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <SortableContext
                        items={columnTasks.map((task) => task.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div
                          ref={setNodeRef}
                          className={`space-y-3 min-h-[400px] max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 ${
                            isOver ? 'border-2 border-blue-500 rounded-md' : ''
                          }`}
                        >
                          <AnimatePresence>
                            {columnTasks.map((task) => (
                              <TaskCard
                                key={task.id}
                                task={task}
                                onEdit={handleOpenEdit}
                                onDelete={handleDeleteTask}
                                priority={task.priority}
                                progressPercentage={task.progress_percentage}
                                project_name={task.project_name}
                                projects={projects}
                              />
                            ))}
                          </AnimatePresence>
                          {columnTasks.length === 0 && !searchQuery && (
                            <div
                              className="flex items-center justify-center h-full w-full py-8 text-gray-400 text-sm italic border-2 border-dashed border-gray-300 rounded-md"
                              style={{ minHeight: '100px' }}
                            >
                              Drag tasks here
                            </div>
                          )}
                          {columnTasks.length === 0 && searchQuery && (
                            <div className="text-center py-8 text-gray-500">
                              <p className="text-sm">No tasks found</p>
                            </div>
                          )}
                        </div>
                      </SortableContext>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          <DragOverlay>
            {draggedTask && (
              <TaskCard
                task={draggedTask}
                onEdit={() => {}}
                onDelete={() => {}}
                priority={draggedTask.priority}
                progressPercentage={draggedTask.progress_percentage}
                project_name={draggedTask.project_name}
                projects={projects}
              />
            )}
          </DragOverlay>

          {/* New Task Dialog */}
          <Dialog open={showNewTaskForm} onOpenChange={setShowNewTaskForm}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
              </DialogHeader>
              <TaskForm
                onSave={handleSaveNewTask}
                onCancel={() => setShowNewTaskForm(false)}
                projects={projects}
              />
            </DialogContent>
          </Dialog>

          {/* Edit Task Dialog */}
          <Dialog
            open={!!taskToEdit}
            onOpenChange={(open) => !open && setTaskToEdit(null)}
          >
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Edit Task</DialogTitle>
              </DialogHeader>
              {taskToEdit && (
                <TaskForm
                  task={taskToEdit}
                  onSave={handleSubmitEdit}
                  onCancel={() => setTaskToEdit(null)}
                  projects={projects}
                />
              )}
            </DialogContent>
          </Dialog>

          {/* New Project Dialog */}
          <Dialog open={showNewProjectForm} onOpenChange={setShowNewProjectForm}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
              </DialogHeader>
              <ProjectForm
                onSave={handleSaveNewProject}
                onCancel={() => setShowNewProjectForm(false)}
              />
            </DialogContent>
          </Dialog>

          {/* Edit Project Dialog */}
          <Dialog open={!!activeProject} onOpenChange={(open) => !open && setActiveProject(null)}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Edit Project</DialogTitle>
              </DialogHeader>
              {activeProject && (
                <ProjectForm
                  project={activeProject}
                  onSave={handleEditProject}
                  onCancel={() => setActiveProject(null)}
                />
              )}
            </DialogContent>
          </Dialog>

          {/* Delete Project Confirmation Dialog */}
          <AlertDialog open={showDeleteProjectAlert} onOpenChange={setShowDeleteProjectAlert}>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="hidden">Delete Project</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Project</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete project "{projectToDelete?.name}"?
                  This will also delete all associated tasks. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteProject}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

        </DndContext>
      )}
    </div>
  );
}
