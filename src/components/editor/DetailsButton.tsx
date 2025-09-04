import React from 'react';
import { Editor } from '@tiptap/react';
import { PanelBottomOpen, PanelBottomClose, Columns, ChevronDown } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import './details.css';

interface DetailsButtonProps {
  editor: Editor;
}

const DetailsButton: React.FC<DetailsButtonProps> = ({ editor }) => {
  if (!editor) return null;

  const toggleDetails = () => {
    if (editor.isActive('details')) {
      // Si ya estamos en details, desarmar el elemento details
      editor.commands.unsetDetails();
    } else {
      // Crear un nuevo elemento details
      editor.commands.setDetails();
    }
  };

  const isActive = editor.isActive('details');

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Toggle
            className={`details-button ${isActive ? 'details-button--active' : ''}`}
            pressed={isActive}
            onPressedChange={toggleDetails}
            size="sm"
            aria-label="Elemento desplegable"
          >
            {isActive ? (
              <PanelBottomClose className="h-4 w-4" />
            ) : (
              <PanelBottomOpen className="h-4 w-4" />
            )}
          </Toggle>
        </TooltipTrigger>
        {/* <TooltipContent>
          <div className="details-tooltip">
            <p className="details-tooltip__title">
              {isActive ? 'Cerrar elemento desplegable' : 'Crear elemento desplegable'}
            </p>
            <p className="details-tooltip__shortcut">
              Ctrl+Alt+D
            </p>
          </div>
        </TooltipContent> */}
      </Tooltip>
    </TooltipProvider>
  );
};

export default DetailsButton;
