import React from 'react';
import { Editor } from '@tiptap/react';
import { 
  CheckSquare,
  Square,
  Plus,
  Indent,
  Outdent,
  Split
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Toggle } from '@/components/ui/toggle';
import './tasklist.css';

interface TaskListButtonProps {
  editor: Editor;
  variant?: 'toggle' | 'dropdown';
}

const TaskListButton: React.FC<TaskListButtonProps> = ({ editor, variant = 'dropdown' }) => {
  if (!editor) return null;

  const isActive = editor.isActive('taskList');
  const canToggleTaskList = editor.can().toggleTaskList();
  const isInTaskList = editor.isActive('taskItem');

  // Variant Toggle - Botón simple para alternar lista de tareas
  if (variant === 'toggle') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Toggle
              pressed={isActive}
              onPressedChange={() => editor.chain().focus().toggleTaskList().run()}
              size="sm"
              className="h-8 w-8 p-0 tasklist-toggle"
              disabled={!canToggleTaskList}
            >
              <CheckSquare className="h-4 w-4" />
            </Toggle>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <div className="tasklist-tooltip">
              <p className="tasklist-tooltip__title">Lista de tareas</p>
              <p className="tasklist-tooltip__shortcut">
                <kbd>Ctrl+Shift+T</kbd>
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Variant Dropdown - Menú completo con operaciones avanzadas
  return (
    <TooltipProvider>
      <Tooltip>
        <DropdownMenu>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`h-8 w-8 p-0 hover:bg-accent tasklist-button ${
                  isActive ? 'bg-accent text-accent-foreground' : ''
                }`}
                type="button"
              >
                <CheckSquare className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <DropdownMenuContent 
            align="start" 
            side="bottom"
            sideOffset={5}
            alignOffset={0}
            className="w-52 tasklist-dropdown-content max-h-[50vh] overflow-y-auto"
            style={{ 
              position: 'fixed',
              zIndex: 999,
              maxHeight: '50vh',
              overflowY: 'auto'
            }}
          >
            <DropdownMenuLabel className="tasklist-dropdown-label">
              Lista de tareas
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {/* Toggle Task List */}
            <DropdownMenuItem 
              onClick={() => editor.chain().focus().toggleTaskList().run()}
              className="tasklist-dropdown-item"
              disabled={!canToggleTaskList}
            >
              {isActive ? (
                <>
                  <Square className="mr-2 h-4 w-4" />
                  Convertir a párrafo normal
                </>
              ) : (
                <>
                  <CheckSquare className="mr-2 h-4 w-4" />
                  Crear lista de tareas
                </>
              )}
            </DropdownMenuItem>
            
            {/* Operaciones específicas de TaskItem (solo si estamos en una lista de tareas) */}
            {isInTaskList && (
              <>
                <DropdownMenuSeparator />
                
                {/* Split Task Item */}
                <DropdownMenuItem 
                  onClick={() => editor.chain().focus().splitListItem('taskItem').run()}
                  className="tasklist-dropdown-item"
                  disabled={!editor.can().splitListItem('taskItem')}
                >
                  <Split className="mr-2 h-4 w-4" />
                  Dividir elemento
                </DropdownMenuItem>
                
                {/* Sink Task Item (Increase indentation) */}
                <DropdownMenuItem 
                  onClick={() => editor.chain().focus().sinkListItem('taskItem').run()}
                  className="tasklist-dropdown-item"
                  disabled={!editor.can().sinkListItem('taskItem')}
                >
                  <Indent className="mr-2 h-4 w-4" />
                  Aumentar sangría
                </DropdownMenuItem>
                
                {/* Lift Task Item (Decrease indentation) */}
                <DropdownMenuItem 
                  onClick={() => editor.chain().focus().liftListItem('taskItem').run()}
                  className="tasklist-dropdown-item"
                  disabled={!editor.can().liftListItem('taskItem')}
                >
                  <Outdent className="mr-2 h-4 w-4" />
                  Reducir sangría
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        <TooltipContent side="bottom">
          <div className="tasklist-tooltip">
            <p className="tasklist-tooltip__title">
              {isActive ? 'Opciones de lista de tareas' : 'Crear lista de tareas'}
            </p>
            <p className="tasklist-tooltip__shortcut">
              <kbd>Ctrl+Shift+T</kbd>
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default TaskListButton;
