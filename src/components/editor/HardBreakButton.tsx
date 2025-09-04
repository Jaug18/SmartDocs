import React from 'react';
import { Editor } from '@tiptap/react';
import { CornerDownLeft, ArrowDown, ArrowDownToLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import './hardbreak.css';

interface HardBreakButtonProps {
  editor: Editor;
}

const HardBreakButton: React.FC<HardBreakButtonProps> = ({ editor }) => {
  if (!editor) return null;

  const insertHardBreak = () => {
    editor.commands.setHardBreak();
  };

  const canInsertHardBreak = editor.can().setHardBreak();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            className={`hard-break-button`}
            onClick={insertHardBreak}
            disabled={!canInsertHardBreak}
            size="sm"
            variant="ghost"
            aria-label="Insertar salto de línea"
          >
            <CornerDownLeft className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        {/* <TooltipContent>
          <div className="hard-break-tooltip">
            <p className="hard-break-tooltip__title">
              Insertar salto de línea
            </p>
            <p className="hard-break-tooltip__description">
              Agrega un salto de línea dentro del párrafo actual
            </p>
            <p className="hard-break-tooltip__shortcut">
              Shift+Enter
            </p>
          </div>
        </TooltipContent> */}
      </Tooltip>
    </TooltipProvider>
  );
};

export default HardBreakButton;
