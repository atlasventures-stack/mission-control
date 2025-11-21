import React from 'react';
import { Task } from '../types';

interface TaskItemProps {
  task: Task;
  onToggle: (taskId: string) => void;
  isBacklog?: boolean;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  onCategoryClick?: (task: Task) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, onToggle, isBacklog = false, onEdit, onDelete, onCategoryClick }) => {
  return (
    <div className="transition-colors">
      <div className="flex items-start gap-4">
        <input
          type="checkbox"
          checked={task.completed}
          onChange={() => onToggle(task.id)}
          className="mt-1 h-5 w-5 text-indigo-600 rounded border-2 border-gray-500 bg-gray-600 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={`text-sm font-medium ${task.completed ? 'line-through text-gray-500' : 'text-white'}`}>
              {task.title}
            </p>
            {task.isFromCalendar && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-900/30 text-indigo-300">
                Calendar
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
            {onCategoryClick ? (
              <button
                onClick={() => onCategoryClick(task)}
                className="inline-flex items-center px-2 py-0.5 rounded bg-indigo-900/30 text-indigo-400 hover:bg-indigo-900/50 font-medium cursor-pointer transition-all border border-indigo-900"
                title="Click to change category"
              >
                {task.category}
              </button>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-700 text-gray-300 border border-gray-600">
                {task.category}
              </span>
            )}
            <span>{new Date(task.date).toLocaleDateString()}</span>
            {isBacklog && (
              <span className="text-red-400 font-medium">Overdue</span>
            )}
          </div>
        </div>
        {(onEdit || onDelete) && (
          <div className="flex gap-1">
            {onEdit && (
              <button
                onClick={() => onEdit(task)}
                className="p-2 text-blue-400 hover:bg-blue-900/30 rounded-lg transition-all"
                title="Edit task"
              >
               
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(task.id)}
                className="p-2 text-red-400 hover:bg-red-900/30 rounded-lg transition-all"
                title="Delete task"
              >
               
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskItem;
