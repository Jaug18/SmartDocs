import { useState } from "react";
import { Editor } from '@tiptap/react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, 
  ColumnsIcon, 
  RowsIcon, 
  Trash2, 
  MoveHorizontal, 
  MoveVertical, 
  Combine, 
  Scissors, 
  Grid, 
  GripVertical
} from "lucide-react";

interface TableMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editor: Editor;
}

export const TableMenu = ({ open, onOpenChange, editor }: TableMenuProps) => {
  const [rows, setRows] = useState("3");
  const [cols, setCols] = useState("3");
  const isInsideTable = editor?.isActive('table');

  const handleInsert = () => {
    const rowsNum = parseInt(rows, 10);
    const colsNum = parseInt(cols, 10);
    
    if (rowsNum > 0 && colsNum > 0) {
      editor.chain().focus().insertTable({ rows: rowsNum, cols: colsNum, withHeaderRow: true }).run();
      setRows("3");
      setCols("3");
      onOpenChange(false);
    }
  };

  const TableActionButton = ({ onClick, label, icon: Icon }) => (
    <Button 
      variant="outline" 
      size="sm"
      onClick={onClick}
      className="h-8 text-xs"
    >
      <Icon className="h-3.5 w-3.5 mr-1" />
      {label}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Tabla</DialogTitle>
          <DialogDescription>
            {isInsideTable 
              ? "Modifica la tabla actual" 
              : "Crea una nueva tabla o modifica la existente"}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue={isInsideTable ? "modify" : "create"}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create" disabled={isInsideTable}>Crear tabla</TabsTrigger>
            <TabsTrigger value="modify" disabled={!isInsideTable}>Modificar tabla</TabsTrigger>
          </TabsList>
          
          <TabsContent value="create" className="py-4">
            <div className="grid grid-cols-2 items-center gap-4">
              <div className="space-y-2">
                <Label htmlFor="rows">Filas</Label>
                <Input
                  id="rows"
                  value={rows}
                  onChange={(e) => setRows(e.target.value.replace(/[^0-9]/g, ''))}
                  className="col-span-1"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cols">Columnas</Label>
                <Input
                  id="cols"
                  value={cols}
                  onChange={(e) => setCols(e.target.value.replace(/[^0-9]/g, ''))}
                  className="col-span-1"
                />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="button" onClick={handleInsert}>Insertar</Button>
            </DialogFooter>
          </TabsContent>
          
          <TabsContent value="modify" className="py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-3 border-r pr-3">
                <h3 className="text-sm font-medium mb-2">Columnas</h3>
                <div className="flex flex-col gap-2">
                  <TableActionButton
                    onClick={() => editor.chain().focus().addColumnBefore().run()}
                    label="Añadir columna antes"
                    icon={ColumnsIcon}
                  />
                  <TableActionButton
                    onClick={() => editor.chain().focus().addColumnAfter().run()}
                    label="Añadir columna después"
                    icon={ColumnsIcon}
                  />
                  <TableActionButton
                    onClick={() => editor.chain().focus().deleteColumn().run()}
                    label="Eliminar columna"
                    icon={Trash2}
                  />
                  <TableActionButton
                    onClick={() => editor.chain().focus().toggleHeaderColumn().run()}
                    label="Cambiar a columna de cabecera"
                    icon={GripVertical}
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                <h3 className="text-sm font-medium mb-2">Filas</h3>
                <div className="flex flex-col gap-2">
                  <TableActionButton
                    onClick={() => editor.chain().focus().addRowBefore().run()}
                    label="Añadir fila antes"
                    icon={RowsIcon}
                  />
                  <TableActionButton
                    onClick={() => editor.chain().focus().addRowAfter().run()}
                    label="Añadir fila después"
                    icon={RowsIcon}
                  />
                  <TableActionButton
                    onClick={() => editor.chain().focus().deleteRow().run()}
                    label="Eliminar fila"
                    icon={Trash2}
                  />
                  <TableActionButton
                    onClick={() => editor.chain().focus().toggleHeaderRow().run()}
                    label="Cambiar a fila de cabecera"
                    icon={Grid}
                  />
                </div>
              </div>
            </div>
            
            <div className="border-t mt-4 pt-4">
              <h3 className="text-sm font-medium mb-2">Celdas y tabla</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-2">
                  <TableActionButton
                    onClick={() => editor.chain().focus().mergeCells().run()}
                    label="Combinar celdas"
                    icon={Combine}
                  />
                  <TableActionButton
                    onClick={() => editor.chain().focus().splitCell().run()}
                    label="Dividir celda"
                    icon={Scissors}
                  />
                  <TableActionButton
                    onClick={() => editor.chain().focus().toggleHeaderCell().run()}
                    label="Cambiar a celda de cabecera"
                    icon={Grid}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <TableActionButton
                    onClick={() => editor.chain().focus().mergeOrSplit().run()}
                    label="Combinar o dividir"
                    icon={MoveHorizontal}
                  />
                  <TableActionButton
                    onClick={() => editor.chain().focus().fixTables().run()}
                    label="Arreglar tabla"
                    icon={Table}
                  />
                  <TableActionButton
                    onClick={() => editor.chain().focus().deleteTable().run()}
                    label="Eliminar tabla"
                    icon={Trash2}
                  />
                </div>
              </div>
            </div>
            
            <DialogFooter className="mt-4">
              <Button type="button" onClick={() => onOpenChange(false)}>Cerrar</Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
