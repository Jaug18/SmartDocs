import React from 'react';
import { Editor } from '@tiptap/react';
import { ListOrdered } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { Toggle } from '@/components/ui/toggle';
import './orderedlist.css';

interface OrderedListButtonProps {
  editor: Editor;
  variant?: 'button' | 'toggle';
}

const OrderedListButton: React.FC<OrderedListButtonProps> = ({ editor, variant = 'toggle' }) => {
  if (!editor) return null;

  const toggleOrderedList = () => {
    editor.chain().focus().toggleOrderedList().run();
  };

  const isActive = editor.isActive('orderedList');
  const canToggle = editor.can().toggleOrderedList();

  if (variant === 'button') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isActive ? 'default' : 'ghost'}
              size="sm"
              onClick={toggleOrderedList}
              disabled={!canToggle}
              className={`ordered-list-button ${isActive ? 'ordered-list-button--active' : ''}`}
              aria-label="Lista ordenada"
            >
              <ListOrdered className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="ordered-list-tooltip">
              <p className="ordered-list-tooltip__title">Lista ordenada</p>
              <p className="ordered-list-tooltip__shortcut">
                Ctrl+Shift+9
              </p>
            </div>
          </TooltipContent>
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
            onPressedChange={toggleOrderedList}
            disabled={!canToggle}
            size="sm"
            className={`ordered-list-toggle ${isActive ? 'ordered-list-toggle--active' : ''}`}
            aria-label="Lista ordenada"
          >
            <ListOrdered className="h-4 w-4" />
          </Toggle>
        </TooltipTrigger>
        <TooltipContent>
          <div className="ordered-list-tooltip">
            <p className="ordered-list-tooltip__title">Lista ordenada</p>
            <p className="ordered-list-tooltip__shortcut">
              Ctrl+Shift+9 | 1. 2. 3.
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default OrderedListButton;
