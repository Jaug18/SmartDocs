import React from 'react';
import { Editor } from '@tiptap/react';
import { Subscript } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import './subscript.css';

interface SubscriptButtonProps {
  editor: Editor;
  variant?: 'toggle' | 'button';
}

const SubscriptButton: React.FC<SubscriptButtonProps> = ({ editor, variant = 'toggle' }) => {
  if (!editor) return null;

  const toggleSubscript = () => {
    editor.chain().focus().toggleSubscript().run();
  };

  const setSubscript = () => {
    editor.chain().focus().setSubscript().run();
  };

  const unsetSubscript = () => {
    editor.chain().focus().unsetSubscript().run();
  };

  const isActive = editor.isActive('subscript');
  const canToggle = editor.can().toggleSubscript();

  if (variant === 'button') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="subscript-button"
              onClick={toggleSubscript}
              disabled={!canToggle}
              aria-label="Subíndice"
            >
              <Subscript className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          {/* <TooltipContent>
            <div className="subscript-tooltip">
              <p className="subscript-tooltip__title">Subíndice</p>
              <p className="subscript-tooltip__shortcut">
                <kbd>Ctrl+,</kbd>
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
            onPressedChange={toggleSubscript}
            aria-label="Subíndice"
            disabled={!canToggle}
            size="sm"
            className={`subscript-toggle ${isActive ? 'subscript-toggle--active' : ''}`}
          >
            <Subscript className="h-4 w-4" />
          </Toggle>
        </TooltipTrigger>
        {/* <TooltipContent>
          <div className="subscript-tooltip">
            <p className="subscript-tooltip__title">Subíndice</p>
            <p className="subscript-tooltip__shortcut">
              <kbd>Ctrl+,</kbd>
            </p>
          </div>
        </TooltipContent> */}
      </Tooltip>
    </TooltipProvider>
  );
};

export default SubscriptButton;
