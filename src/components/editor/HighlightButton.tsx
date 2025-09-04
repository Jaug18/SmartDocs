import React from 'react';
import { Editor } from '@tiptap/react';
import { Highlighter, Palette } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
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
import './highlight.css';

interface HighlightButtonProps {
  editor: Editor;
  variant?: 'toggle' | 'button' | 'dropdown';
}

const HIGHLIGHT_COLORS = [
  { name: 'Amarillo', color: '#ffc078', label: 'Amarillo clásico' },
  { name: 'Verde', color: '#8ce99a', label: 'Verde suave' },
  { name: 'Azul', color: '#74c0fc', label: 'Azul claro' },
  { name: 'Púrpura', color: '#b197fc', label: 'Púrpura pastel' },
  { name: 'Rosa', color: '#ffa8a8', label: 'Rosa suave' },
  { name: 'Naranja', color: '#ffb366', label: 'Naranja brillante' },
  { name: 'Lime', color: '#c0eb75', label: 'Verde lima' },
  { name: 'Cian', color: '#66d9ef', label: 'Cian brillante' },
];

const HighlightButton: React.FC<HighlightButtonProps> = ({ editor, variant = 'dropdown' }) => {
  if (!editor) return null;

  const toggleHighlight = (color?: string) => {
    if (color) {
      // Para colores específicos, verificar si ya está activo ese color
      const isColorActive = editor.isActive('highlight', { color });
      if (isColorActive) {
        editor.chain().focus().unsetHighlight().run();
      } else {
        editor.chain().focus().setHighlight({ color }).run();
      }
    } else {
      // Toggle del resaltado por defecto
      editor.chain().focus().toggleHighlight().run();
    }
  };

  const setHighlight = (color?: string) => {
    if (color) {
      // Usar setHighlight directamente con el color
      editor.chain().focus().setHighlight({ color }).run();
    } else {
      // Usar el resaltado por defecto
      editor.chain().focus().setHighlight().run();
    }
  };

  const unsetHighlight = () => {
    editor.chain().focus().unsetHighlight().run();
  };

  const isActive = editor.isActive('highlight');
  const canToggle = editor.can().toggleHighlight();

  if (variant === 'toggle') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Toggle
              pressed={isActive}
              onPressedChange={() => toggleHighlight()}
              aria-label="Resaltar texto"
              disabled={!canToggle}
              size="sm"
              className={`highlight-toggle ${isActive ? 'highlight-toggle--active' : ''}`}
            >
              <Highlighter className="h-4 w-4" />
            </Toggle>
          </TooltipTrigger>
          {/* <TooltipContent>
            <div className="highlight-tooltip">
              <p className="highlight-tooltip__title">Resaltar texto</p>
              <p className="highlight-tooltip__shortcut">
                <kbd>Ctrl+Shift+H</kbd>
              </p>
            </div>
          </TooltipContent> */}
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (variant === 'button') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="highlight-button"
              onClick={() => toggleHighlight()}
              disabled={!canToggle}
              aria-label="Resaltar texto"
            >
              <Highlighter className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          {/* <TooltipContent>
            <div className="highlight-tooltip">
              <p className="highlight-tooltip__title">Resaltar texto</p>
              <p className="highlight-tooltip__shortcut">
                <kbd>Ctrl+Shift+H</kbd>
              </p>
            </div>
          </TooltipContent> */}
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <DropdownMenu>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`h-8 w-8 p-0 hover:bg-accent highlight-button ${
                  isActive ? 'bg-accent text-accent-foreground' : ''
                }`}
                type="button"
                disabled={!canToggle}
              >
                <Highlighter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <DropdownMenuContent 
            align="start" 
            side="bottom"
            sideOffset={5}
            alignOffset={0}
            className="w-52 highlight-dropdown-content max-h-[50vh] overflow-y-auto"
            style={{ 
              position: 'fixed',
              zIndex: 999,
              maxHeight: '50vh',
              overflowY: 'auto'
            }}
          >
            <DropdownMenuLabel className="highlight-dropdown-label">
              Colores de resaltado
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {/* Resaltado por defecto */}
            <DropdownMenuItem 
              onClick={() => {
                const isDefaultActive = isActive && !editor.getAttributes('highlight').color;
                if (isDefaultActive) {
                  unsetHighlight();
                } else {
                  editor.chain().focus().setHighlight().run();
                }
              }}
              className={`highlight-dropdown-item ${
                isActive && !editor.getAttributes('highlight').color ? 'highlight-dropdown-item--active' : ''
              }`}
              disabled={!canToggle}
            >
              <Highlighter className="mr-2 h-4 w-4" />
              <div className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded border border-gray-300" 
                  style={{ backgroundColor: '#faf594' }}
                />
                <div className="flex flex-col">
                  <span>Por defecto</span>
                  <span className="text-xs text-muted-foreground">Amarillo estándar</span>
                </div>
              </div>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            {/* Colores personalizados */}
            {HIGHLIGHT_COLORS.map((colorOption) => {
              const isColorActive = editor.isActive('highlight', { color: colorOption.color });
              
              return (
                <DropdownMenuItem 
                  key={colorOption.color}
                  onClick={() => {
                    const isColorActive = editor.isActive('highlight', { color: colorOption.color });
                    if (isColorActive) {
                      // Si el color ya está activo, quitamos el resaltado
                      unsetHighlight();
                    } else {
                      // Aplicar el color seleccionado
                      setHighlight(colorOption.color);
                    }
                  }}
                  className={`highlight-dropdown-item ${
                    isColorActive ? 'highlight-dropdown-item--active' : ''
                  }`}
                  disabled={!canToggle}
                >
                  <Palette className="mr-2 h-4 w-4" />
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded border border-gray-300" 
                      style={{ backgroundColor: colorOption.color }}
                    />
                    <div className="flex flex-col">
                      <span>{colorOption.name}</span>
                      <span className="text-xs text-muted-foreground">{colorOption.label}</span>
                    </div>
                  </div>
                </DropdownMenuItem>
              );
            })}
            
            <DropdownMenuSeparator />
            
            {/* Quitar resaltado */}
            <DropdownMenuItem 
              onClick={unsetHighlight}
              className="highlight-dropdown-item"
              disabled={!isActive}
            >
              <div className="mr-2 h-4 w-4 border border-gray-300 rounded bg-white dark:bg-gray-800" />
              <div className="flex flex-col">
                <span>Quitar resaltado</span>
                <span className="text-xs text-muted-foreground">Eliminar color de fondo</span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* <TooltipContent>
          <div className="highlight-tooltip">
            <p className="highlight-tooltip__title">Resaltar texto</p>
            <p className="highlight-tooltip__shortcut">
              <kbd>Ctrl+Shift+H</kbd>
            </p>
          </div>
        </TooltipContent> */}
      </Tooltip>
    </TooltipProvider>
  );
};

export default HighlightButton;
