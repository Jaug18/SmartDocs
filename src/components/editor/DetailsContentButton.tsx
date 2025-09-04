import React from 'react';
import { Editor } from '@tiptap/react';
import { FileText, Plus, Minus } from 'lucide-react';
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
} from '@/components/ui/dropdown-menu';
import './detailscontent.css';

interface DetailsContentButtonProps {
  editor: Editor;
  variant?: 'toggle' | 'dropdown';
}

const DetailsContentButton: React.FC<DetailsContentButtonProps> = ({ 
  editor, 
  variant = 'toggle' 
}) => {
  if (!editor) return null;

  const isInsideDetails = editor.isActive('details');
  const isDetailsContent = editor.isActive('detailsContent');
  const isDetailsSummary = editor.isActive('detailsSummary');

  const insertDetailsContent = () => {
    if (isInsideDetails) {
      // Si estamos dentro de details, insertar contenido
      editor.commands.insertContent('<div data-type="detailsContent"><p>Contenido del elemento desplegable</p></div>');
    } else {
      // Si no estamos en details, crear uno completo
      editor.commands.setDetails();
    }
  };

  const insertDetailsSummary = () => {
    if (isInsideDetails) {
      editor.commands.insertContent('<summary data-type="detailsSummary">Resumen</summary>');
    }
  };

  const toggleDetailsContent = () => {
    if (isDetailsContent) {
      // Salir del contenido de details
      editor.commands.lift('detailsContent');
    } else {
      insertDetailsContent();
    }
  };

  if (variant === 'dropdown') {
    return (
      <TooltipProvider>
        <Tooltip>
          <DropdownMenu>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Toggle
                  className={`details-content-button ${isDetailsContent ? 'details-content-button--active' : ''}`}
                  pressed={isDetailsContent}
                  size="sm"
                  aria-label="Contenido de elemento desplegable"
                >
                  <FileText className="h-4 w-4" />
                </Toggle>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem
                onClick={insertDetailsContent}
                disabled={!isInsideDetails}
                className="details-content-menu-item"
              >
                <Plus className="h-4 w-4 mr-2" />
                <div>
                  <div className="font-medium">Agregar contenido</div>
                  <div className="text-xs text-gray-500">Insertar contenido en details</div>
                </div>
              </DropdownMenuItem>
              
              <DropdownMenuItem
                onClick={insertDetailsSummary}
                disabled={!isInsideDetails}
                className="details-content-menu-item"
              >
                <FileText className="h-4 w-4 mr-2" />
                <div>
                  <div className="font-medium">Agregar resumen</div>
                  <div className="text-xs text-gray-500">Insertar summary en details</div>
                </div>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem
                onClick={() => editor.commands.setDetails()}
                className="details-content-menu-item"
              >
                <Plus className="h-4 w-4 mr-2" />
                <div>
                  <div className="font-medium">Crear elemento completo</div>
                  <div className="text-xs text-gray-500">Details con summary y content</div>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <TooltipContent>
            <div className="details-content-tooltip">
              <p className="details-content-tooltip__title">
                Gestionar contenido de elemento desplegable
              </p>
              <p className="details-content-tooltip__shortcut">
                Clic para opciones
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Toggle
            className={`details-content-button ${isDetailsContent ? 'details-content-button--active' : ''}`}
            pressed={isDetailsContent}
            onPressedChange={toggleDetailsContent}
            size="sm"
            aria-label="Contenido de elemento desplegable"
            disabled={!isInsideDetails}
          >
            <FileText className="h-4 w-4" />
          </Toggle>
        </TooltipTrigger>
        <TooltipContent>
          <div className="details-content-tooltip">
            <p className="details-content-tooltip__title">
              {isDetailsContent ? 'Salir del contenido' : 'Agregar contenido'}
            </p>
            <p className="details-content-tooltip__shortcut">
              Ctrl+Shift+C
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default DetailsContentButton;
