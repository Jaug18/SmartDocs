import React from 'react';
import { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Focus } from 'lucide-react';
import './focus.css';

interface FocusButtonProps {
  editor: Editor | null;
}

const FocusButton: React.FC<FocusButtonProps> = ({ editor }) => {
  if (!editor) {
    return null;
  }

  const setFocusMode = (mode: 'all' | 'deepest' | 'shallowest') => {
    // Reconfigurar la extensión Focus
    editor.extensionManager.extensions.forEach((ext) => {
      if (ext.name === 'focus') {
        ext.options.mode = mode;
      }
    });
    
    // Forzar una actualización del editor
    editor.view.dispatch(editor.view.state.tr);
  };

  const toggleFocus = () => {
    const currentFocus = editor.isFocused;
    if (currentFocus) {
      editor.commands.blur();
    } else {
      editor.commands.focus();
    }
  };

  const currentMode = editor.extensionManager.extensions.find(ext => ext.name === 'focus')?.options?.mode || 'all';
  const isFocused = editor.isFocused;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`focus-button ${isFocused ? 'is-focused' : ''}`}
          aria-label="Configurar focus"
          title={`Configurar focus del editor - Modo actual: ${currentMode}`}
        >
          <Focus className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

        <DropdownMenuContent className="focus-dropdown-content" align="start">
          <DropdownMenuItem onClick={toggleFocus}>
            <Focus className="h-4 w-4 mr-2" />
            {isFocused ? 'Quitar focus' : 'Enfocar editor'}
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onClick={() => setFocusMode('all')}
            className={currentMode === 'all' ? 'bg-accent' : ''}
          >
            <div className="flex flex-col items-start">
              <span className="font-medium">Modo: Todos</span>
              <span className="text-xs text-muted-foreground">
                Resalta todos los nodos en el foco
              </span>
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={() => setFocusMode('deepest')}
            className={currentMode === 'deepest' ? 'bg-accent' : ''}
          >
            <div className="flex flex-col items-start">
              <span className="font-medium">Modo: Más profundo</span>
              <span className="text-xs text-muted-foreground">
                Solo resalta el nodo más anidado
              </span>
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={() => setFocusMode('shallowest')}
            className={currentMode === 'shallowest' ? 'bg-accent' : ''}
          >
            <div className="flex flex-col items-start">
              <span className="font-medium">Modo: Más superficial</span>
              <span className="text-xs text-muted-foreground">
                Solo resalta el nodo padre
              </span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default FocusButton;
