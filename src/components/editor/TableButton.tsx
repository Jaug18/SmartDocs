import React from 'react';
import { Editor } from '@tiptap/react';
import { 
  Table, 
  Grid3X3, 
  Plus, 
  Minus, 
  Trash2, 
  Split, 
  Merge,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  TableProperties
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
import './table.css';

interface TableButtonProps {
  editor: Editor;
}

const TableButton: React.FC<TableButtonProps> = ({ editor }) => {
  if (!editor) return null;

  const insertTable = (rows: number, cols: number, withHeaderRow: boolean = true) => {
    editor.chain().focus().insertTable({ rows, cols, withHeaderRow }).run();
  };

  const isInTable = editor.isActive('table');
  const canInsertTable = editor.can().insertTable({ rows: 3, cols: 3, withHeaderRow: true });

  return (
    <TooltipProvider>
      <Tooltip>
        <DropdownMenu>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`h-8 w-8 p-0 hover:bg-accent table-button ${
                  isInTable ? 'bg-accent text-accent-foreground' : ''
                }`}
                type="button"
                disabled={!isInTable && !canInsertTable}
              >
                <Table className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <DropdownMenuContent 
            align="start" 
            side="bottom"
            sideOffset={5}
            alignOffset={0}
            className="w-56 table-dropdown-content max-h-[50vh] overflow-y-auto"
            style={{ 
              position: 'fixed',
              zIndex: 999,
              maxHeight: '50vh',
              overflowY: 'auto'
            }}
          >
            {!isInTable ? (
              <>
                <DropdownMenuLabel className="table-dropdown-label">
                  Insertar tabla
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <DropdownMenuItem 
                  onClick={() => insertTable(2, 2, false)}
                  className="table-dropdown-item"
                  disabled={!canInsertTable}
                >
                  <Grid3X3 className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span>Tabla 2x2</span>
                    <span className="text-xs text-muted-foreground">Sin encabezado</span>
                  </div>
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  onClick={() => insertTable(3, 3, true)}
                  className="table-dropdown-item"
                  disabled={!canInsertTable}
                >
                  <Grid3X3 className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span>Tabla 3x3</span>
                    <span className="text-xs text-muted-foreground">Con encabezado</span>
                  </div>
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  onClick={() => insertTable(4, 4, true)}
                  className="table-dropdown-item"
                  disabled={!canInsertTable}
                >
                  <Grid3X3 className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span>Tabla 4x4</span>
                    <span className="text-xs text-muted-foreground">Con encabezado</span>
                  </div>
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  onClick={() => insertTable(5, 3, true)}
                  className="table-dropdown-item"
                  disabled={!canInsertTable}
                >
                  <Grid3X3 className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span>Tabla 5x3</span>
                    <span className="text-xs text-muted-foreground">Lista con encabezado</span>
                  </div>
                </DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuLabel className="table-dropdown-label">
                  Operaciones de tabla
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {/* Operaciones de columnas */}
                <DropdownMenuItem 
                  onClick={() => editor.chain().focus().addColumnBefore().run()}
                  className="table-dropdown-item"
                  disabled={!editor.can().addColumnBefore()}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar columna antes
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  onClick={() => editor.chain().focus().addColumnAfter().run()}
                  className="table-dropdown-item"
                  disabled={!editor.can().addColumnAfter()}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar columna después
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  onClick={() => editor.chain().focus().deleteColumn().run()}
                  className="table-dropdown-item"
                  disabled={!editor.can().deleteColumn()}
                >
                  <Minus className="mr-2 h-4 w-4" />
                  Eliminar columna
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                {/* Operaciones de filas */}
                <DropdownMenuItem 
                  onClick={() => editor.chain().focus().addRowBefore().run()}
                  className="table-dropdown-item"
                  disabled={!editor.can().addRowBefore()}
                >
                  <ArrowUp className="mr-2 h-4 w-4" />
                  Agregar fila arriba
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  onClick={() => editor.chain().focus().addRowAfter().run()}
                  className="table-dropdown-item"
                  disabled={!editor.can().addRowAfter()}
                >
                  <ArrowDown className="mr-2 h-4 w-4" />
                  Agregar fila abajo
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  onClick={() => editor.chain().focus().deleteRow().run()}
                  className="table-dropdown-item"
                  disabled={!editor.can().deleteRow()}
                >
                  <Minus className="mr-2 h-4 w-4" />
                  Eliminar fila
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                {/* Operaciones de celdas */}
                <DropdownMenuItem 
                  onClick={() => editor.chain().focus().mergeCells().run()}
                  className="table-dropdown-item"
                  disabled={!editor.can().mergeCells()}
                >
                  <Merge className="mr-2 h-4 w-4" />
                  Fusionar celdas
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  onClick={() => editor.chain().focus().splitCell().run()}
                  className="table-dropdown-item"
                  disabled={!editor.can().splitCell()}
                >
                  <Split className="mr-2 h-4 w-4" />
                  Dividir celda
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                {/* Navegación entre celdas */}
                <DropdownMenuItem 
                  onClick={() => editor.chain().focus().goToNextCell().run()}
                  className="table-dropdown-item"
                  disabled={!editor.can().goToNextCell()}
                >
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Siguiente celda
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  onClick={() => editor.chain().focus().goToPreviousCell().run()}
                  className="table-dropdown-item"
                  disabled={!editor.can().goToPreviousCell()}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Celda anterior
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                {/* Operaciones de header */}
                <DropdownMenuItem 
                  onClick={() => editor.chain().focus().toggleHeaderColumn().run()}
                  className="table-dropdown-item"
                  disabled={!editor.can().toggleHeaderColumn()}
                >
                  <TableProperties className="mr-2 h-4 w-4" />
                  Alternar header columna
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  onClick={() => editor.chain().focus().toggleHeaderRow().run()}
                  className="table-dropdown-item"
                  disabled={!editor.can().toggleHeaderRow()}
                >
                  <TableProperties className="mr-2 h-4 w-4" />
                  Alternar header fila
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  onClick={() => editor.chain().focus().toggleHeaderCell().run()}
                  className="table-dropdown-item"
                  disabled={!editor.can().toggleHeaderCell()}
                >
                  <TableProperties className="mr-2 h-4 w-4" />
                  Alternar header celda
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                {/* Eliminar tabla */}
                <DropdownMenuItem 
                  onClick={() => editor.chain().focus().deleteTable().run()}
                  className="table-dropdown-item text-destructive focus:text-destructive"
                  disabled={!editor.can().deleteTable()}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar tabla
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        {/* <TooltipContent side="bottom">
          <div className="table-tooltip">
            <p className="table-tooltip__title">
              {isInTable ? 'Opciones de tabla' : 'Insertar tabla'}
            </p>
            <p className="table-tooltip__shortcut">
              <kbd>Mod+Alt+T</kbd>
            </p>
          </div>
        </TooltipContent> */}
      </Tooltip>
    </TooltipProvider>
  );
};

export default TableButton;
