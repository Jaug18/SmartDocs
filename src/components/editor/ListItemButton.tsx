import React from 'react';
import { Editor } from '@tiptap/react';
import { 
  Indent, 
  Outdent, 
  SplitSquareHorizontal, 
  ArrowDown, 
  ArrowUp 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import './listitem.css';

interface ListItemButtonProps {
  editor: Editor;
  variant?: 'buttons' | 'dropdown';
}

const ListItemButton: React.FC<ListItemButtonProps> = ({ editor, variant = 'dropdown' }) => {
  if (!editor) return null;

  const splitListItem = () => {
    editor.commands.splitListItem('listItem');
    editor.commands.focus();
  };

  const sinkListItem = () => {
    editor.commands.sinkListItem('listItem');
    editor.commands.focus();
  };

  const liftListItem = () => {
    editor.commands.liftListItem('listItem');
    editor.commands.focus();
  };

  const canSplit = editor.can().splitListItem('listItem');
  const canSink = editor.can().sinkListItem('listItem');
  const canLift = editor.can().liftListItem('listItem');
  const isInList = editor.isActive('listItem');

  if (variant === 'buttons') {
    return (
      <div className="list-item-buttons">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={splitListItem}
                disabled={!canSplit}
                className="list-item-button"
                aria-label="Dividir elemento de lista"
              >
                <SplitSquareHorizontal className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <div className="list-item-tooltip">
                <p className="list-item-tooltip__title">Dividir elemento</p>
                <p className="list-item-tooltip__shortcut">Enter</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={sinkListItem}
                disabled={!canSink}
                className="list-item-button"
                aria-label="Anidar elemento de lista"
              >
                <Indent className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <div className="list-item-tooltip">
                <p className="list-item-tooltip__title">Anidar elemento</p>
                <p className="list-item-tooltip__shortcut">Tab</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={liftListItem}
                disabled={!canLift}
                className="list-item-button"
                aria-label="Desanidar elemento de lista"
              >
                <Outdent className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <div className="list-item-tooltip">
                <p className="list-item-tooltip__title">Desanidar elemento</p>
                <p className="list-item-tooltip__shortcut">Shift+Tab</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`list-item-dropdown-button ${isInList ? 'list-item-dropdown-button--active' : ''}`}
                aria-label="Opciones de elemento de lista"
                disabled={!isInList}
              >
                <SplitSquareHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <div className="list-item-tooltip">
              <p className="list-item-tooltip__title">Opciones de lista</p>
              {!isInList && (
                <p className="list-item-tooltip__note">
                  Requiere estar en una lista
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DropdownMenuContent className="list-item-dropdown-content" align="start" sideOffset={5}>
        <DropdownMenuLabel className="list-item-dropdown-label">
          Opciones de Elemento de Lista
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          onClick={splitListItem}
          disabled={!canSplit}
          className="list-item-dropdown-item"
        >
          <SplitSquareHorizontal className="h-4 w-4 mr-2" />
          <span className="list-item-item__text">
            <span className="list-item-item__label">Dividir elemento</span>
            <span className="list-item-item__shortcut">Enter</span>
          </span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={sinkListItem}
          disabled={!canSink}
          className="list-item-dropdown-item"
        >
          <Indent className="h-4 w-4 mr-2" />
          <span className="list-item-item__text">
            <span className="list-item-item__label">Anidar elemento</span>
            <span className="list-item-item__shortcut">Tab</span>
          </span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={liftListItem}
          disabled={!canLift}
          className="list-item-dropdown-item"
        >
          <Outdent className="h-4 w-4 mr-2" />
          <span className="list-item-item__text">
            <span className="list-item-item__label">Desanidar elemento</span>
            <span className="list-item-item__shortcut">Shift+Tab</span>
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ListItemButton;
