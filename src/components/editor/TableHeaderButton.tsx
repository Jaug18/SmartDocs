import React from 'react';
import { Editor } from '@tiptap/react';
import { 
  TableProperties, 
  ToggleLeft,
  ToggleRight,
  Columns,
  Rows
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
import './tableheader.css';

interface TableHeaderButtonProps {
  editor: Editor;
}

const TableHeaderButton: React.FC<TableHeaderButtonProps> = ({ editor }) => {
  if (!editor) return null;

  const isInTable = editor.isActive('table');
  const isHeaderCell = editor.isActive('tableHeader');
  const hasHeaderRow = editor.isActive('table') && editor.getAttributes('table').hasHeaderRow;
  const hasHeaderColumn = editor.isActive('table') && editor.getAttributes('table').hasHeaderColumn;

  // Solo mostrar el botón cuando estamos dentro de una tabla
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
                className={`h-8 w-8 p-0 hover:bg-accent table-header-button ${
                  isHeaderCell ? 'bg-accent text-accent-foreground' : ''
                }`}
                type="button"
              >
                <TableProperties className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <DropdownMenuContent align="start" className="w-52 table-header-dropdown-content">
            <DropdownMenuLabel className="table-header-dropdown-label">
              Opciones de header
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {/* Toggle Header Row */}
            <DropdownMenuItem 
              onClick={() => editor.chain().focus().toggleHeaderRow().run()}
              className="table-header-dropdown-item"
              disabled={!editor.can().toggleHeaderRow()}
            >
              {hasHeaderRow ? (
                <ToggleRight className="mr-2 h-4 w-4 text-green-600" />
              ) : (
                <ToggleLeft className="mr-2 h-4 w-4" />
              )}
              <div className="flex flex-col">
                <span>Header de fila</span>
                <span className="text-xs text-muted-foreground">
                  {hasHeaderRow ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </DropdownMenuItem>
            
            {/* Toggle Header Column */}
            <DropdownMenuItem 
              onClick={() => editor.chain().focus().toggleHeaderColumn().run()}
              className="table-header-dropdown-item"
              disabled={!editor.can().toggleHeaderColumn()}
            >
              {hasHeaderColumn ? (
                <ToggleRight className="mr-2 h-4 w-4 text-green-600" />
              ) : (
                <ToggleLeft className="mr-2 h-4 w-4" />
              )}
              <div className="flex flex-col">
                <span>Header de columna</span>
                <span className="text-xs text-muted-foreground">
                  {hasHeaderColumn ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            {/* Toggle Header Cell */}
            <DropdownMenuItem 
              onClick={() => editor.chain().focus().toggleHeaderCell().run()}
              className="table-header-dropdown-item"
              disabled={!editor.can().toggleHeaderCell()}
            >
              <TableProperties className="mr-2 h-4 w-4" />
              <div className="flex flex-col">
                <span>Alternar celda actual</span>
                <span className="text-xs text-muted-foreground">
                  {isHeaderCell ? 'Header → Celda normal' : 'Celda normal → Header'}
                </span>
              </div>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            {/* Advanced operations */}
            <DropdownMenuItem 
              onClick={() => {
                // Convertir toda la primera fila a headers
                editor.chain().focus().setCellAttribute('colspan', 1).run();
                editor.chain().focus().toggleHeaderRow().run();
              }}
              className="table-header-dropdown-item"
              disabled={!editor.can().toggleHeaderRow()}
            >
              <Rows className="mr-2 h-4 w-4" />
              <div className="flex flex-col">
                <span>Formatear primera fila</span>
                <span className="text-xs text-muted-foreground">
                  Como fila de headers
                </span>
              </div>
            </DropdownMenuItem>
            
            <DropdownMenuItem 
              onClick={() => {
                // Convertir toda la primera columna a headers
                editor.chain().focus().setCellAttribute('rowspan', 1).run();
                editor.chain().focus().toggleHeaderColumn().run();
              }}
              className="table-header-dropdown-item"
              disabled={!editor.can().toggleHeaderColumn()}
            >
              <Columns className="mr-2 h-4 w-4" />
              <div className="flex flex-col">
                <span>Formatear primera columna</span>
                <span className="text-xs text-muted-foreground">
                  Como columna de headers
                </span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {/* <TooltipContent side="bottom">
          <div className="table-header-tooltip">
            <p className="table-header-tooltip__title">
              Opciones de header de tabla
            </p>
            <p className="table-header-tooltip__shortcut">
              <kbd>Mod+Shift+H</kbd>
            </p>
          </div>
        </TooltipContent> */}
      </Tooltip>
    </TooltipProvider>
  );
};

export default TableHeaderButton;
