import React from 'react';
import { Editor } from '@tiptap/react';
import { Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import './horizontalrule.css';

interface HorizontalRuleButtonProps {
  editor: Editor;
}

const HorizontalRuleButton: React.FC<HorizontalRuleButtonProps> = ({ editor }) => {
  if (!editor) return null;

  const insertHorizontalRule = () => {
    editor.commands.setHorizontalRule();
    editor.commands.focus();
  };

  const canInsertHorizontalRule = editor.can().setHorizontalRule();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={insertHorizontalRule}
            disabled={!canInsertHorizontalRule}
            className="horizontal-rule-button"
            aria-label="Insertar línea horizontal"
          >
            <Minus className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        {/* <TooltipContent>
          <div className="horizontal-rule-tooltip">
            <p className="horizontal-rule-tooltip__title">
              Insertar línea horizontal
            </p>
            <p className="horizontal-rule-tooltip__shortcut">
              Escribe --- y presiona Enter
            </p>
          </div>
        </TooltipContent> */}
      </Tooltip>
    </TooltipProvider>
  );
};

export default HorizontalRuleButton;
