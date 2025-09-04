import React from 'react';
import { Editor } from '@tiptap/react';
import { List, Indent, Outdent, Split } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { Button } from '@/components/ui/button';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';

interface BulletListButtonProps {
  editor: Editor;
  variant?: 'toggle' | 'dropdown';
  size?: 'sm' | 'lg' | 'default';
  className?: string;
}

const BulletListButton: React.FC<BulletListButtonProps> = ({ 
  editor, 
  variant = 'toggle',
  size = 'sm',
  className = ''
}) => {
  const isActive = editor.isActive('bulletList');
  
  const toggleBulletList = () => {
    editor.chain().focus().toggleBulletList().run();
  };

  const splitListItem = () => {
    editor.chain().focus().splitListItem('listItem').run();
  };

  const sinkListItem = () => {
    editor.chain().focus().sinkListItem('listItem').run();
  };

  const liftListItem = () => {
    editor.chain().focus().liftListItem('listItem').run();
  };

  const buttonSizeClass = size === 'sm' ? 'h-7 w-7 p-0' : size === 'lg' ? 'h-10 w-10 p-0' : 'h-9 w-9 p-0';
  const iconSizeClass = size === 'sm' ? 'h-3.5 w-3.5' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5';

  if (variant === 'dropdown') {
    const DropdownButton = (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size={size}
            className={`${buttonSizeClass} ${className}`}
          >
            <List className={iconSizeClass} />
            <ChevronDown className="h-3 w-3 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem
            onClick={toggleBulletList}
          >
            <List className="h-4 w-4 mr-2" />
            {isActive ? 'Quitar lista de viñetas' : 'Lista de viñetas'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={splitListItem}
            disabled={!editor.can().splitListItem('listItem')}
          >
            <Split className="h-4 w-4 mr-2" />
            Dividir elemento
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={sinkListItem}
            disabled={!editor.can().sinkListItem('listItem')}
          >
            <Indent className="h-4 w-4 mr-2" />
            Aumentar sangría
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={liftListItem}
            disabled={!editor.can().liftListItem('listItem')}
          >
            <Outdent className="h-4 w-4 mr-2" />
            Reducir sangría
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {DropdownButton}
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p>Opciones de lista de viñetas</p>
            <p className="text-xs text-muted-foreground">
              Gestiona listas con viñetas y su formato
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  // Variant toggle (default)
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Toggle
          pressed={isActive}
          onPressedChange={toggleBulletList}
          size={size}
          className={`${buttonSizeClass} ${className}`}
        >
          <List className={iconSizeClass} />
        </Toggle>
      </TooltipTrigger>
      {/* <TooltipContent>
        <div className="flex justify-between w-full gap-6">
          <p>{isActive ? 'Quitar viñetas' : 'Lista con viñetas'}</p>
          <kbd className="px-2 py-0.5 text-xs bg-muted rounded">Ctrl+Shift+8</kbd>
        </div>
      </TooltipContent> */}
    </Tooltip>
  );
};

export default BulletListButton;
