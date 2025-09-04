import React from 'react';
import { Editor } from '@tiptap/react';
import { Quote } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipTrigger 
} from '@/components/ui/tooltip';

interface BlockquoteButtonProps {
  editor: Editor;
  size?: 'sm' | 'lg' | 'default';
  className?: string;
}

const BlockquoteButton: React.FC<BlockquoteButtonProps> = ({ 
  editor, 
  size = 'sm',
  className = ''
}) => {
  const isActive = editor.isActive('blockquote');
  
  const toggleBlockquote = () => {
    editor.chain().focus().toggleBlockquote().run();
  };

  const buttonSizeClass = size === 'sm' ? 'h-7 w-7 p-0' : size === 'lg' ? 'h-10 w-10 p-0' : 'h-9 w-9 p-0';
  const iconSizeClass = size === 'sm' ? 'h-3.5 w-3.5' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Toggle
          pressed={isActive}
          onPressedChange={toggleBlockquote}
          size={size}
          className={`${buttonSizeClass} ${className}`}
        >
          <Quote className={iconSizeClass} />
        </Toggle>
      </TooltipTrigger>
      {/* <TooltipContent>
        <div className="flex justify-between w-full gap-6">
          <p>{isActive ? 'Quitar cita' : 'Cita'}</p>
          <kbd className="px-2 py-0.5 text-xs bg-muted rounded">Ctrl+Shift+B</kbd>
        </div>
      </TooltipContent> */}
    </Tooltip>
  );
};

export default BlockquoteButton;
