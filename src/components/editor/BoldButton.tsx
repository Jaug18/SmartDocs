import React from 'react';
import { Editor } from '@tiptap/react';
import { Bold } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import './bold.css';

interface BoldButtonProps {
  editor: Editor;
  variant?: 'toggle' | 'button';
}

const BoldButton: React.FC<BoldButtonProps> = ({ editor, variant = 'toggle' }) => {
  if (!editor) return null;

  const toggleBold = () => {
    editor.chain().focus().toggleBold().run();
  };

  const setBold = () => {
    editor.chain().focus().setBold().run();
  };

  const unsetBold = () => {
    editor.chain().focus().unsetBold().run();
  };

  const isActive = editor.isActive('bold');
  const canToggle = editor.can().toggleBold();

  if (variant === 'button') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="bold-button"
              onClick={toggleBold}
              disabled={!canToggle}
              aria-label="Negrita"
            >
              <Bold className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          {/* <TooltipContent>
            <div className="bold-tooltip">
              <p className="bold-tooltip__title">Negrita</p>
              <p className="bold-tooltip__shortcut">
                <kbd>Ctrl+B</kbd>
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
        <TooltipTrigger asChild>
          <Toggle
            pressed={isActive}
            onPressedChange={toggleBold}
            aria-label="Negrita"
            disabled={!canToggle}
            size="sm"
            className={`bold-toggle ${isActive ? 'bold-toggle--active' : ''}`}
          >
            <Bold className="h-4 w-4" />
          </Toggle>
        </TooltipTrigger>
        {/* <TooltipContent>
          <div className="bold-tooltip">
            <p className="bold-tooltip__title">Negrita</p>
            <p className="bold-tooltip__shortcut">
              <kbd>Ctrl+B</kbd>
            </p>
          </div>
        </TooltipContent> */}
      </Tooltip>
    </TooltipProvider>
  );
};

export default BoldButton;
