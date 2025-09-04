import React from 'react';
import { Editor } from '@tiptap/react';
import { Superscript } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import './superscript.css';

interface SuperscriptButtonProps {
  editor: Editor;
  variant?: 'toggle' | 'button';
}

const SuperscriptButton: React.FC<SuperscriptButtonProps> = ({ editor, variant = 'toggle' }) => {
  if (!editor) return null;

  const toggleSuperscript = () => {
    editor.chain().focus().toggleSuperscript().run();
  };

  const setSuperscript = () => {
    editor.chain().focus().setSuperscript().run();
  };

  const unsetSuperscript = () => {
    editor.chain().focus().unsetSuperscript().run();
  };

  const isActive = editor.isActive('superscript');
  const canToggle = editor.can().toggleSuperscript();

  if (variant === 'button') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="superscript-button"
              onClick={toggleSuperscript}
              disabled={!canToggle}
              aria-label="Superíndice"
            >
              <Superscript className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          {/* <TooltipContent>
            <div className="superscript-tooltip">
              <p className="superscript-tooltip__title">Superíndice</p>
              <p className="superscript-tooltip__shortcut">
                <kbd>Ctrl+.</kbd>
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
            onPressedChange={toggleSuperscript}
            aria-label="Superíndice"
            disabled={!canToggle}
            size="sm"
            className={`superscript-toggle ${isActive ? 'superscript-toggle--active' : ''}`}
          >
            <Superscript className="h-4 w-4" />
          </Toggle>
        </TooltipTrigger>
        {/* <TooltipContent>
          <div className="superscript-tooltip">
            <p className="superscript-tooltip__title">Superíndice</p>
            <p className="superscript-tooltip__shortcut">
              <kbd>Ctrl+.</kbd>
            </p>
          </div>
        </TooltipContent> */}
      </Tooltip>
    </TooltipProvider>
  );
};

export default SuperscriptButton;
