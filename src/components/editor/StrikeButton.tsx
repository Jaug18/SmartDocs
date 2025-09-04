import React from 'react';
import { Editor } from '@tiptap/react';
import { Strikethrough } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import './strike.css';

interface StrikeButtonProps {
  editor: Editor;
  variant?: 'toggle' | 'button';
}

const StrikeButton: React.FC<StrikeButtonProps> = ({ editor, variant = 'toggle' }) => {
  if (!editor) return null;

  const toggleStrike = () => {
    editor.chain().focus().toggleStrike().run();
  };

  const setStrike = () => {
    editor.chain().focus().setStrike().run();
  };

  const unsetStrike = () => {
    editor.chain().focus().unsetStrike().run();
  };

  const isActive = editor.isActive('strike');
  const canToggle = editor.can().toggleStrike();

  if (variant === 'button') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="strike-button"
              onClick={toggleStrike}
              disabled={!canToggle}
              aria-label="Tachado"
            >
              <Strikethrough className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          {/* <TooltipContent>
            <div className="strike-tooltip">
              <p className="strike-tooltip__title">Tachado</p>
              <p className="strike-tooltip__shortcut">
                <kbd>Ctrl+Shift+X</kbd>
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
            onPressedChange={toggleStrike}
            aria-label="Tachado"
            disabled={!canToggle}
            size="sm"
            className={`strike-toggle ${isActive ? 'strike-toggle--active' : ''}`}
          >
            <Strikethrough className="h-4 w-4" />
          </Toggle>
        </TooltipTrigger>
        {/* <TooltipContent>
          <div className="strike-tooltip">
            <p className="strike-tooltip__title">Tachado</p>
            <p className="strike-tooltip__shortcut">
              <kbd>Ctrl+Shift+X</kbd>
            </p>
          </div>
        </TooltipContent> */}
      </Tooltip>
    </TooltipProvider>
  );
};
export default StrikeButton;
