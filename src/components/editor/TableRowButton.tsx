import React from 'react';
import { Editor } from '@tiptap/react';
import { 
  TableProperties,
  Plus,
  Minus,
  ArrowUp,
  ArrowDown,
  MoreHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import './tablerow.css';

interface TableRowButtonProps {
  editor: Editor;
}

const TableRowButton: React.FC<TableRowButtonProps> = ({ editor }) => {
  if (!editor) return null;

  const isInTable = editor.isActive('table');
  const canAddRowBefore = editor.can().addRowBefore();
  const canAddRowAfter = editor.can().addRowAfter();
  const canDeleteRow = editor.can().deleteRow();

  // Solo mostrar el botón si estamos dentro de una tabla
  if (!isInTable) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <DropdownMenu>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-accent tablerow-button"
                type="button"
              >
                <TableProperties className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <DropdownMenuContent align="start" className="w-48 tablerow-dropdown-content">
            <DropdownMenuLabel className="tablerow-dropdown-label">
              Operaciones de fila
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {/* Agregar filas */}
            <DropdownMenuItem 
              onClick={() => editor.chain().focus().addRowBefore().run()}
              className="tablerow-dropdown-item"
              disabled={!canAddRowBefore}
            >
              <ArrowUp className="mr-2 h-4 w-4" />
              Agregar fila arriba
            </DropdownMenuItem>
            
            <DropdownMenuItem 
              onClick={() => editor.chain().focus().addRowAfter().run()}
              className="tablerow-dropdown-item"
              disabled={!canAddRowAfter}
            >
              <ArrowDown className="mr-2 h-4 w-4" />
              Agregar fila abajo
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            {/* Eliminar fila */}
            <DropdownMenuItem 
              onClick={() => editor.chain().focus().deleteRow().run()}
              className="tablerow-dropdown-item text-destructive focus:text-destructive"
              disabled={!canDeleteRow}
            >
              <Minus className="mr-2 h-4 w-4" />
              Eliminar fila actual
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {/* <TooltipContent side="bottom">
          <div className="tablerow-tooltip">
            <p className="tablerow-tooltip__title">Opciones de fila</p>
            <p className="tablerow-tooltip__shortcut">
              <kbd>Alt+F</kbd> - Menú de fila
            </p>
          </div>
        </TooltipContent> */}
      </Tooltip>
    </TooltipProvider>
  );
};

export default TableRowButton;
