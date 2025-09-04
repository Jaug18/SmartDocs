import React from 'react';
import { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Undo, Redo } from 'lucide-react';

interface HistoryButtonProps {
  type: 'undo' | 'redo';
  editor: Editor;
}

const HistoryButton: React.FC<HistoryButtonProps> = ({ type, editor }) => {

  if (!editor) return null;

  const isUndo = type === 'undo';
  
  const canExecute = isUndo 
    ? editor.can().undo()
    : editor.can().redo();

  const handleClick = () => {
    if (isUndo) {
      editor.chain().focus().undo().run();
    } else {
      editor.chain().focus().redo().run();
    }
  };

  const Icon = isUndo ? Undo : Redo;
  const label = isUndo ? 'Deshacer' : 'Rehacer';
  const shortcut = isUndo ? 'Ctrl+Z' : 'Ctrl+Y';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClick}
          disabled={!canExecute}
          className={`history-button history-button-${type}`}
        >
          <Icon className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <div className="text-sm">
          <p>{label}</p>
          <p className="text-xs text-muted-foreground">{shortcut}</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

// Convenience components for individual buttons
export const UndoButton = React.forwardRef<HTMLButtonElement, { editor: Editor }>(({ editor }, ref) => (
  <Button
    ref={ref}
    variant="ghost"
    size="sm"
    onClick={() => editor.chain().focus().undo().run()}
    disabled={!editor.can().undo()}
    className="history-button history-button-undo h-6 w-6 p-0"
  >
    <Undo className="h-3 w-3" />
  </Button>
));

export const RedoButton = React.forwardRef<HTMLButtonElement, { editor: Editor }>(({ editor }, ref) => (
  <Button
    ref={ref}
    variant="ghost"
    size="sm"
    onClick={() => editor.chain().focus().redo().run()}
    disabled={!editor.can().redo()}
    className="history-button history-button-redo h-6 w-6 p-0"
  >
    <Redo className="h-3 w-3" />
  </Button>
));

UndoButton.displayName = 'UndoButton';
RedoButton.displayName = 'RedoButton';

export default HistoryButton;
