import React, { useState } from 'react';
import { Editor } from '@tiptap/react';
import { FileText, Trash2, RotateCcw } from 'lucide-react';
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
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import './document.css';

interface DocumentButtonProps {
  editor: Editor;
}

const DocumentButton: React.FC<DocumentButtonProps> = ({ editor }) => {
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  if (!editor) return null;

  const clearDocument = () => {
    editor.commands.clearContent();
    setIsAlertOpen(false);
  };

  const resetDocument = () => {
    editor.commands.setContent('<p></p>');
  };

  const insertNewParagraph = () => {
    editor.commands.insertContent('<p></p>');
  };

  const getWordCount = () => {
    const text = editor.getText();
    return text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
  };

  const getCharacterCount = () => {
    return editor.storage.characterCount?.characters() || editor.getText().length;
  };

  return (
    <TooltipProvider>
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="document-button h-7 w-7 p-0"
                aria-label="Opciones de documento"
              >
                <FileText className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          {/* <TooltipContent>
            <div className="document-tooltip">
              <p className="document-tooltip__title">Opciones de documento</p>
              <p className="document-tooltip__stats">
                {getWordCount()} palabras · {getCharacterCount()} caracteres
              </p>
            </div>
          </TooltipContent> */}
        </Tooltip>

        <DropdownMenuContent align="start" className="document-dropdown">
          <DropdownMenuItem
            onClick={insertNewParagraph}
            className="document-dropdown__item"
          >
            <FileText className="h-4 w-4 mr-2" />
            <div>
              <div className="font-medium">Nuevo párrafo</div>
              <div className="text-xs text-muted-foreground">Insertar párrafo vacío</div>
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={resetDocument}
            className="document-dropdown__item"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            <div>
              <div className="font-medium">Reiniciar documento</div>
              <div className="text-xs text-muted-foreground">Volver al estado inicial</div>
            </div>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => setIsAlertOpen(true)}
            className="document-dropdown__item document-dropdown__item--danger"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            <div>
              <div className="font-medium">Limpiar todo</div>
              <div className="text-xs text-muted-foreground">Eliminar todo el contenido</div>
            </div>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <div className="px-2 py-1.5 text-xs text-muted-foreground">
            <div>Estadísticas del documento:</div>
            <div>{getWordCount()} palabras</div>
            <div>{getCharacterCount()} caracteres</div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Limpiar todo el documento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará todo el contenido del documento y no se puede deshacer.
              ¿Estás seguro de que quieres continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={clearDocument}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Limpiar documento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
};

export default DocumentButton;
