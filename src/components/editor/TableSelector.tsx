
import { Editor } from '@tiptap/react';
import { Table } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { useState } from 'react';

interface TableSelectorProps {
  editor: Editor;
  isActive: boolean;
}

const TableSelector = ({ editor, isActive }: TableSelectorProps) => {
  const [rows, setRows] = useState(0);
  const [cols, setCols] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  // Function to create a table with specified dimensions
  const createTable = (rows: number, cols: number) => {
    
    // Ensure we have valid dimensions
    if (rows < 1 || cols < 1) return;
    
    editor
      .chain()
      .focus()
      .insertTable({ rows, cols, withHeaderRow: true })
      .run();
      
    // Close the menu after creating the table
    setIsOpen(false);
  };

  // Function to handle mouse hover for size selection
  const handleMouseOver = (r: number, c: number) => {
    setRows(r);
    setCols(c);
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <Button 
          variant="ghost" 
          size="sm"
          className={isActive ? 'bg-accent' : ''}
          onClick={(e) => {
            e.preventDefault();
            setIsOpen(true);
          }}
        >
          <Table className="h-4 w-4" />
        </Button>
      </ContextMenuTrigger>
      <ContextMenuContent 
        className="w-64 p-2" 
        // Fix: Remove the onOpenAutoFocus prop as it doesn't exist in this implementation
        // Instead, use onPointerDownOutside to prevent focus issues
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <div className="text-sm font-medium text-center mb-2">
          Insertar tabla: {rows + 1}x{cols + 1}
        </div>
        <div className="grid grid-cols-5 gap-1">
          {Array.from({ length: 5 }).map((_, r) => (
            Array.from({ length: 5 }).map((_, c) => (
              <div 
                key={`${r}-${c}`}
                className={`aspect-square border border-border hover:bg-primary/20 cursor-pointer transition-colors w-10 h-10 ${r <= rows && c <= cols ? 'bg-primary/30' : ''}`}
                onClick={() => createTable(r + 1, c + 1)}
                onMouseOver={() => handleMouseOver(r, c)}
              />
            ))
          ))}
        </div>
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default TableSelector;
