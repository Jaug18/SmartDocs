import React from 'react';
import { Editor } from '@tiptap/react';
import { Heading1, Heading2, Heading3, Heading4, Heading5, Heading6, Type } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import './heading.css';

interface HeadingButtonProps {
  editor: Editor;
  variant?: 'button' | 'dropdown';
  level?: 1 | 2 | 3 | 4 | 5 | 6;
}

const HEADING_CONFIGS = [
  { level: 1, icon: Heading1, label: 'Título 1', shortcut: 'Ctrl+Alt+1', size: 'text-3xl' },
  { level: 2, icon: Heading2, label: 'Título 2', shortcut: 'Ctrl+Alt+2', size: 'text-2xl' },
  { level: 3, icon: Heading3, label: 'Título 3', shortcut: 'Ctrl+Alt+3', size: 'text-xl' },
  { level: 4, icon: Heading4, label: 'Título 4', shortcut: 'Ctrl+Alt+4', size: 'text-lg' },
  { level: 5, icon: Heading5, label: 'Título 5', shortcut: 'Ctrl+Alt+5', size: 'text-base' },
  { level: 6, icon: Heading6, label: 'Título 6', shortcut: 'Ctrl+Alt+6', size: 'text-sm' },
];

const HeadingButton: React.FC<HeadingButtonProps> = ({ 
  editor, 
  variant = 'dropdown', 
  level 
}) => {
  if (!editor) return null;

  const toggleHeading = (headingLevel: number) => {
    editor.commands.toggleHeading({ level: headingLevel as 1 | 2 | 3 | 4 | 5 | 6 });
    editor.commands.focus();
  };

  const setParagraph = () => {
    editor.commands.setParagraph();
    editor.commands.focus();
  };

  // Si es un botón específico para un nivel
  if (variant === 'button' && level) {
    const config = HEADING_CONFIGS.find(h => h.level === level);
    if (!config) return null;

    const Icon = config.icon;
    const isActive = editor.isActive('heading', { level });

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Toggle
              className={`heading-button heading-button--level-${level} ${isActive ? 'heading-button--active' : ''}`}
              pressed={isActive}
              onPressedChange={() => toggleHeading(level)}
              size="sm"
              aria-label={config.label}
            >
              <Icon className="h-4 w-4" />
            </Toggle>
          </TooltipTrigger>
          <TooltipContent>
            <div className="heading-tooltip">
              <p className="heading-tooltip__title">{config.label}</p>
              <p className="heading-tooltip__shortcut">{config.shortcut}</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Dropdown con todos los niveles de encabezado
  const getCurrentHeading = () => {
    for (let i = 1; i <= 6; i++) {
      if (editor.isActive('heading', { level: i })) {
        return HEADING_CONFIGS.find(h => h.level === i);
      }
    }
    return null;
  };

  const currentHeading = getCurrentHeading();
  const isAnyHeadingActive = !!currentHeading;

  return (
    <DropdownMenu>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`heading-dropdown-button ${isAnyHeadingActive ? 'heading-dropdown-button--active' : ''}`}
                aria-label="Seleccionar nivel de encabezado"
              >
                {currentHeading ? (
                  <currentHeading.icon className="h-4 w-4" />
                ) : (
                  <Type className="h-4 w-4" />
                )}
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          {/* <TooltipContent>
            <div className="heading-tooltip">
              <p className="heading-tooltip__title">
                {currentHeading ? currentHeading.label : 'Seleccionar encabezado'}
              </p>
              <p className="heading-tooltip__shortcut">
                Ctrl+Alt+0 para párrafo
              </p>
            </div>
          </TooltipContent> */}
        </Tooltip>
      </TooltipProvider>

      <DropdownMenuContent 
        className="heading-dropdown-content max-h-[50vh] overflow-y-auto" 
        align="start" 
        side="bottom"
        sideOffset={5}
        alignOffset={0}
        style={{ 
          position: 'fixed',
          zIndex: 999,
          maxHeight: '50vh',
          overflowY: 'auto'
        }}
      >
        <DropdownMenuLabel className="heading-dropdown-label">
          Nivel de Encabezado
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Opción para párrafo normal */}
        <DropdownMenuItem
          onClick={setParagraph}
          className={`heading-item ${!isAnyHeadingActive ? 'heading-item--active' : ''}`}
        >
          <Type className="h-4 w-4 mr-2" />
          <span className="heading-item__text">
            <span className="heading-item__label">Párrafo normal</span>
            <span className="heading-item__shortcut">Ctrl+Alt+0</span>
          </span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        
        {/* Opciones de encabezados */}
        {HEADING_CONFIGS.map((config) => {
          const Icon = config.icon;
          const isActive = editor.isActive('heading', { level: config.level });
          
          return (
            <DropdownMenuItem
              key={config.level}
              onClick={() => toggleHeading(config.level)}
              className={`heading-item ${isActive ? 'heading-item--active' : ''}`}
            >
              <Icon className="h-4 w-4 mr-2" />
              <span className="heading-item__text">
                <span className={`heading-item__label ${config.size}`}>
                  {config.label}
                </span>
                <span className="heading-item__shortcut">
                  {config.shortcut}
                </span>
              </span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default HeadingButton;
