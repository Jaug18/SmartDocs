import React from 'react';
import { Editor } from '@tiptap/react';
import { PilcrowIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import './paragraph.css';

interface ParagraphButtonProps {
  editor: Editor;
}

const ParagraphButton: React.FC<ParagraphButtonProps> = ({ editor }) => {
  if (!editor) return null;

  const setParagraph = () => {
    editor.chain().focus().setParagraph().run();
  };

  const canSetParagraph = editor.can().setParagraph();
  const isParagraph = editor.isActive('paragraph');

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={setParagraph}
            disabled={!canSetParagraph}
            className={`paragraph-button ${isParagraph ? 'paragraph-button--active' : ''}`}
            aria-label="Convertir a párrafo"
          >
            <PilcrowIcon className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <div className="paragraph-tooltip">
            <p className="paragraph-tooltip__title">Párrafo</p>
            <p className="paragraph-tooltip__shortcut">
              Texto normal
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ParagraphButton;
