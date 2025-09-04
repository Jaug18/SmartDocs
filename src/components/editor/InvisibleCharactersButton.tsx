import React from 'react';
import { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Eye, EyeOff } from 'lucide-react';
import './invisiblecharacters.css';

interface InvisibleCharactersButtonProps {
  editor: Editor | null;
}

const InvisibleCharactersButton: React.FC<InvisibleCharactersButtonProps> = ({ editor }) => {
  if (!editor) {
    return null;
  }

  // Verificar si la extensión InvisibleCharacters está disponible
  const hasInvisibleCharacters = editor.extensionManager.extensions.some(
    ext => ext.name === 'invisibleCharacters'
  );

  if (!hasInvisibleCharacters) {
    return null;
  }

  const isVisible = editor.storage.invisibleCharacters?.visibility?.() || false;

  const showInvisibleCharacters = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const commands = editor.commands as any;
    if (commands.showInvisibleCharacters) {
      commands.showInvisibleCharacters();
    }
  };

  const hideInvisibleCharacters = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const commands = editor.commands as any;
    if (commands.hideInvisibleCharacters) {
      commands.hideInvisibleCharacters();
    }
  };

  const toggleInvisibleCharacters = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const commands = editor.commands as any;
    if (commands.toggleInvisibleCharacters) {
      commands.toggleInvisibleCharacters();
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`invisible-characters-button ${isVisible ? 'is-active' : ''}`}
          aria-label="Caracteres invisibles"
          // title={`${isVisible ? 'Ocultar' : 'Mostrar'} caracteres invisibles (espacios, saltos de línea, etc.)`}
        >
          {isVisible ? (
            <Eye className="h-4 w-4" />
          ) : (
            <EyeOff className="h-4 w-4" />
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="invisible-characters-dropdown-content" align="start">
        <DropdownMenuItem
          onClick={showInvisibleCharacters}
          className={isVisible ? 'is-selected' : ''}
        >
          <Eye className="h-4 w-4 mr-2" />
          <div className="flex flex-col items-start">
            <span className="font-medium">Mostrar caracteres</span>
            <span className="text-xs text-muted-foreground">
              Ver espacios, saltos de línea y tabulaciones
            </span>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={hideInvisibleCharacters}
          className={!isVisible ? 'is-selected' : ''}
        >
          <EyeOff className="h-4 w-4 mr-2" />
          <div className="flex flex-col items-start">
            <span className="font-medium">Ocultar caracteres</span>
            <span className="text-xs text-muted-foreground">
              Ocultar caracteres invisibles
            </span>
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={toggleInvisibleCharacters}
        >
          <div className="flex flex-col items-start">
            <span className="font-medium">Alternar visibilidad</span>
            <span className="text-xs text-muted-foreground">
              Cambiar entre mostrar/ocultar
            </span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default InvisibleCharactersButton;
