import React from 'react';
import { Editor } from '@tiptap/react';
import { 
  Grid3X3, 
  Combine, 
  Scissors, 
  ArrowRight, 
  ArrowLeft,
  Settings2
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
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent
} from '@/components/ui/dropdown-menu';
import './tablecell.css';

interface TableCellButtonProps {
  editor: Editor;
  variant?: 'button' | 'dropdown';
}

const TableCellButton: React.FC<TableCellButtonProps> = ({ editor, variant = 'dropdown' }) => {
  if (!editor) return null;

  // Verificar si estamos dentro de una tabla
  const isInTable = editor.isActive('table');
  
  // Funciones de manipulación de celdas
  const mergeCells = () => {
    editor.chain().focus().mergeCells().run();
  };

  const splitCell = () => {
    editor.chain().focus().splitCell().run();
  };

  const mergeOrSplit = () => {
    editor.chain().focus().mergeOrSplit().run();
  };

  const goToNextCell = () => {
    editor.chain().focus().goToNextCell().run();
  };

  const goToPreviousCell = () => {
    editor.chain().focus().goToPreviousCell().run();
  };

  const toggleHeaderCell = () => {
    editor.chain().focus().toggleHeaderCell().run();
  };

  const setCellColspan = (colspan: number) => {
    editor.chain().focus().setCellAttribute('colspan', colspan).run();
  };

  const setCellRowspan = (rowspan: number) => {
    editor.chain().focus().setCellAttribute('rowspan', rowspan).run();
  };

  const setCellBackgroundColor = (color: string) => {
    editor.chain().focus().setCellAttribute('style', `background-color: ${color}`).run();
  };

  // Verificar capacidades
  const canMergeCells = editor.can().mergeCells();
  const canSplitCell = editor.can().splitCell();
  const canGoToNextCell = editor.can().goToNextCell();
  const canGoToPreviousCell = editor.can().goToPreviousCell();

  if (variant === 'button') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={mergeOrSplit}
              disabled={!isInTable}
              className={`table-cell-button ${!isInTable ? 'table-cell-button--disabled' : ''}`}
              aria-label="Combinar o dividir celda"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="table-cell-tooltip">
              <p className="table-cell-tooltip__title">Celda</p>
              <p className="table-cell-tooltip__shortcut">
                {isInTable ? 'Combinar/Dividir' : 'Solo en tablas'}
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
                className="table-cell-dropdown-button"
                aria-label="Opciones de celda"
                disabled={!isInTable}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <div className="table-cell-tooltip">
              <p className="table-cell-tooltip__title">Opciones de celda</p>
              <p className="table-cell-tooltip__shortcut">
                {isInTable ? 'Manipular celdas' : 'Solo en tablas'}
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DropdownMenuContent className="table-cell-dropdown-content" align="start" sideOffset={5}>
        <DropdownMenuLabel className="table-cell-dropdown-label">
          Celdas de Tabla
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Navegación entre celdas */}
        <DropdownMenuItem
          onClick={goToPreviousCell}
          className="table-cell-dropdown-item"
          disabled={!canGoToPreviousCell}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          <span>Celda anterior</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={goToNextCell}
          className="table-cell-dropdown-item"
          disabled={!canGoToNextCell}
        >
          <ArrowRight className="h-4 w-4 mr-2" />
          <span>Celda siguiente</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Combinar y dividir */}
        <DropdownMenuItem
          onClick={mergeCells}
          className="table-cell-dropdown-item"
          disabled={!canMergeCells}
        >
          <Combine className="h-4 w-4 mr-2" />
          <span>Combinar celdas</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={splitCell}
          className="table-cell-dropdown-item"
          disabled={!canSplitCell}
        >
          <Scissors className="h-4 w-4 mr-2" />
          <span>Dividir celda</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={mergeOrSplit}
          className="table-cell-dropdown-item"
          disabled={!isInTable}
        >
          <Grid3X3 className="h-4 w-4 mr-2" />
          <span>Auto combinar/dividir</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Tipo de celda */}
        <DropdownMenuItem
          onClick={toggleHeaderCell}
          className="table-cell-dropdown-item"
          disabled={!isInTable}
        >
          <Settings2 className="h-4 w-4 mr-2" />
          <span>Alternar encabezado</span>
        </DropdownMenuItem>

        {/* Submenu para colspan */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="table-cell-dropdown-item">
            <div className="flex items-center">
              <Grid3X3 className="h-4 w-4 mr-2" />
              <span>Colspan</span>
            </div>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem onClick={() => setCellColspan(1)}>
              Colspan 1
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setCellColspan(2)}>
              Colspan 2
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setCellColspan(3)}>
              Colspan 3
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setCellColspan(4)}>
              Colspan 4
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {/* Submenu para rowspan */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="table-cell-dropdown-item">
            <div className="flex items-center">
              <Grid3X3 className="h-4 w-4 mr-2" />
              <span>Rowspan</span>
            </div>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem onClick={() => setCellRowspan(1)}>
              Rowspan 1
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setCellRowspan(2)}>
              Rowspan 2
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setCellRowspan(3)}>
              Rowspan 3
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setCellRowspan(4)}>
              Rowspan 4
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {/* Submenu para colores de fondo */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="table-cell-dropdown-item">
            <div className="flex items-center">
              <div className="h-4 w-4 mr-2 rounded border bg-gray-200"></div>
              <span>Color de fondo</span>
            </div>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem onClick={() => setCellBackgroundColor('transparent')}>
              <div className="h-4 w-4 mr-2 rounded border bg-transparent"></div>
              Sin color
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setCellBackgroundColor('#f3f4f6')}>
              <div className="h-4 w-4 mr-2 rounded bg-gray-100"></div>
              Gris claro
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setCellBackgroundColor('#dbeafe')}>
              <div className="h-4 w-4 mr-2 rounded bg-blue-100"></div>
              Azul claro
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setCellBackgroundColor('#dcfce7')}>
              <div className="h-4 w-4 mr-2 rounded bg-green-100"></div>
              Verde claro
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setCellBackgroundColor('#fef3c7')}>
              <div className="h-4 w-4 mr-2 rounded bg-yellow-100"></div>
              Amarillo claro
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setCellBackgroundColor('#fecaca')}>
              <div className="h-4 w-4 mr-2 rounded bg-red-100"></div>
              Rojo claro
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default TableCellButton;
