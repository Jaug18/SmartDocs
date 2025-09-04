import React from 'react';
import { Editor } from '@tiptap/react';
import { Underline } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import './underline.css';

interface UnderlineButtonProps {
  editor: Editor;
  variant?: 'toggle' | 'button';
}

const UnderlineButton: React.FC<UnderlineButtonProps> = ({ editor, variant = 'toggle' }) => {
  if (!editor) return null;

  const toggleUnderline = () => {
    editor.chain().focus().toggleUnderline().run();
  };

  const setUnderline = () => {
    editor.chain().focus().setUnderline().run();
  };

  const unsetUnderline = () => {
    editor.chain().focus().unsetUnderline().run();
  };

  const isActive = editor.isActive('underline');
  const canToggle = editor.can().toggleUnderline();

  if (variant === 'button') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="underline-button"
              onClick={toggleUnderline}
              disabled={!canToggle}
              aria-label="Subrayado"
            >
              <Underline className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          {/* <TooltipContent>
            <div className="underline-tooltip">
              <p className="underline-tooltip__title">Subrayado</p>
              <p className="underline-tooltip__shortcut">
                <kbd>Ctrl+U</kbd>
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
            onPressedChange={toggleUnderline}
            aria-label="Subrayado"
            disabled={!canToggle}
            size="sm"
            className={`underline-toggle ${isActive ? 'underline-toggle--active' : ''}`}
          >
            <Underline className="h-4 w-4" />
          </Toggle>
        </TooltipTrigger>
        {/* <TooltipContent>
          <div className="underline-tooltip">
            <p className="underline-tooltip__title">Subrayado</p>
            <p className="underline-tooltip__shortcut">
              <kbd>Ctrl+U</kbd>
            </p>
          </div>
        </TooltipContent> */}
      </Tooltip>
    </TooltipProvider>
  );
};

export default UnderlineButton;
