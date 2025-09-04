import React from 'react';
import { Editor } from '@tiptap/react';
import { Code } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import './code.css';

interface CodeButtonProps {
  editor: Editor;
  variant?: 'toggle' | 'button';
}

const CodeButton: React.FC<CodeButtonProps> = ({ editor, variant = 'toggle' }) => {
  if (!editor) return null;

  const toggleCode = () => {
    editor.chain().focus().toggleCode().run();
  };

  const setCode = () => {
    editor.chain().focus().setCode().run();
  };

  const unsetCode = () => {
    editor.chain().focus().unsetCode().run();
  };

  const isActive = editor.isActive('code');
  const canToggle = editor.can().toggleCode();

  if (variant === 'button') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="code-button"
              onClick={toggleCode}
              disabled={!canToggle}
              aria-label="Código en línea"
            >
              <Code className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          {/* <TooltipContent>
            <div className="code-tooltip">
              <p className="code-tooltip__title">Código en línea</p>
              <p className="code-tooltip__shortcut">
                <kbd>Ctrl+E</kbd>
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
            onPressedChange={toggleCode}
            aria-label="Código en línea"
            disabled={!canToggle}
            size="sm"
            className={`code-toggle ${isActive ? 'code-toggle--active' : ''}`}
          >
            <Code className="h-4 w-4" />
          </Toggle>
        </TooltipTrigger>
        {/* <TooltipContent>
          <div className="code-tooltip">
            <p className="code-tooltip__title">Código en línea</p>
            <p className="code-tooltip__shortcut">
              <kbd>Ctrl+E</kbd>
            </p>
          </div>
        </TooltipContent> */}
      </Tooltip>
    </TooltipProvider>
  );
};

export default CodeButton;
