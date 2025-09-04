import React from 'react';
import { Editor } from '@tiptap/react';
import { Type, FileText, Heading } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import './detailssummary.css';

interface DetailsSummaryButtonProps {
  editor: Editor;
}

const DetailsSummaryButton: React.FC<DetailsSummaryButtonProps> = ({ editor }) => {
  if (!editor) return null;

  const toggleDetailsSummary = () => {
    // Verificar si estamos dentro de un elemento details
    if (editor.isActive('details')) {
      // Si ya estamos en un summary, cambiar a párrafo normal
      if (editor.isActive('detailsSummary')) {
        editor.commands.setParagraph();
      } else {
        // Cambiar el nodo actual a summary si estamos en details
        editor.commands.setNode('detailsSummary');
      }
    } else {
      // Si no estamos en details, crear un details completo
      editor.commands.setDetails();
    }
  };

  const isActive = editor.isActive('detailsSummary');
  const isInDetails = editor.isActive('details');

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Toggle
            className={`details-summary-button ${isActive ? 'details-summary-button--active' : ''}`}
            pressed={isActive}
            onPressedChange={toggleDetailsSummary}
            size="sm"
            aria-label="Resumen del elemento desplegable"
            disabled={!isInDetails && !isActive}
          >
            <Heading className="h-4 w-4" />
          </Toggle>
        </TooltipTrigger>
        <TooltipContent>
          <div className="details-summary-tooltip">
            <p className="details-summary-tooltip__title">
              {isActive ? 'Salir del resumen' : 'Editar resumen del elemento desplegable'}
            </p>
            <p className="details-summary-tooltip__shortcut">
              Ctrl+Shift+S
            </p>
            {!isInDetails && !isActive && (
              <p className="details-summary-tooltip__note">
                Requiere estar dentro de un elemento desplegable
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default DetailsSummaryButton;
