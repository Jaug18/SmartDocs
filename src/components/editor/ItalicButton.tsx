import React from 'react';
import { Editor } from '@tiptap/react';
import { Italic } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import './italic.css';

interface ItalicButtonProps {
  editor: Editor;
  variant?: 'toggle' | 'button';
}

const ItalicButton: React.FC<ItalicButtonProps> = ({ editor, variant = 'toggle' }) => {
  if (!editor) return null;

  const toggleItalic = () => {
    editor.chain().focus().toggleItalic().run();
  };

  const setItalic = () => {
    editor.chain().focus().setItalic().run();
  };

  const unsetItalic = () => {
    editor.chain().focus().unsetItalic().run();
  };

  const isActive = editor.isActive('italic');
  const canToggle = editor.can().toggleItalic();

  if (variant === 'button') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="italic-button"
              onClick={toggleItalic}
              disabled={!canToggle}
              aria-label="Cursiva"
            >
              <Italic className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          {/* <TooltipContent>
            <div className="italic-tooltip">
              <p className="italic-tooltip__title">Cursiva</p>
              <p className="italic-tooltip__shortcut">
                <kbd>Ctrl+I</kbd>
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
            onPressedChange={toggleItalic}
            aria-label="Cursiva"
            disabled={!canToggle}
            size="sm"
            className={`italic-toggle ${isActive ? 'italic-toggle--active' : ''}`}
          >
            <Italic className="h-4 w-4" />
          </Toggle>
        </TooltipTrigger>
        {/* <TooltipContent>
          <div className="italic-tooltip">
            <p className="italic-tooltip__title">Cursiva</p>
            <p className="italic-tooltip__shortcut">
              <kbd>Ctrl+I</kbd>
            </p>
          </div>
        </TooltipContent> */}
      </Tooltip>
    </TooltipProvider>
  );
};

export default ItalicButton;
