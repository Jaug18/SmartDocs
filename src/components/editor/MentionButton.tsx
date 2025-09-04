import React from 'react';
import { Editor } from '@tiptap/react';
import { AtSign, Hash } from 'lucide-react';
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
import './mention.css';

interface MentionButtonProps {
  editor: Editor;
  variant?: 'button' | 'dropdown';
}

const MentionButton: React.FC<MentionButtonProps> = ({ editor, variant = 'dropdown' }) => {
  if (!editor) return null;

  const insertUserMention = () => {
    // Inserta el carácter @ para activar el sistema de sugerencias de usuarios
    editor.commands.insertContent('@');
    editor.commands.focus();
  };

  const insertTagMention = () => {
    // Inserta el carácter # para activar el sistema de sugerencias de tags
    editor.commands.insertContent('#');
    editor.commands.focus();
  };

  const canInsertMention = editor.can().insertContent('@');

  if (variant === 'button') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={insertUserMention}
              disabled={!canInsertMention}
              className="mention-button"
              aria-label="Insertar mención de usuario"
            >
              <AtSign className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="mention-tooltip">
              <p className="mention-tooltip__title">Mencionar usuario</p>
              <p className="mention-tooltip__shortcut">
                @ para mencionar usuarios
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
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
                className="mention-dropdown-button"
                aria-label="Opciones de mención"
                disabled={!canInsertMention}
              >
                <AtSign className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          {/* <TooltipContent>
            <div className="mention-tooltip">
              <p className="mention-tooltip__title">Insertar menciones</p>
              <p className="mention-tooltip__shortcut">
                @ usuarios | # tags
              </p>
            </div>
          </TooltipContent> */}
        </Tooltip>
      </TooltipProvider>

      <DropdownMenuContent className="mention-dropdown-content" align="start" sideOffset={5}>
        <DropdownMenuLabel className="mention-dropdown-label">
          Menciones
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          onClick={insertUserMention}
          className="mention-dropdown-item"
          disabled={!canInsertMention}
        >
          <AtSign className="h-4 w-4 mr-2" />
          <div className="flex flex-col">
            <span>Mencionar usuario</span>
            <span className="text-xs text-muted-foreground">@usuario</span>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={insertTagMention}
          className="mention-dropdown-item"
          disabled={!canInsertMention}
        >
          <Hash className="h-4 w-4 mr-2" />
          <div className="flex flex-col">
            <span>Mencionar tag</span>
            <span className="text-xs text-muted-foreground">#etiqueta</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default MentionButton;
