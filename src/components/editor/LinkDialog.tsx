import { useState, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LinkDialogProps {
  editor: Editor;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LinkDialog = ({ editor, open, onOpenChange }: LinkDialogProps) => {
  const [url, setUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [linkTarget, setLinkTarget] = useState('_blank');
  const [hasSelection, setHasSelection] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');

  useEffect(() => {
    if (open && editor) {
      const { from, to } = editor.state.selection;
      const selectedText = editor.state.doc.textBetween(from, to);
      const isSelection = from !== to;
      
      setHasSelection(isSelection);
      setLinkText(selectedText);
      
      // Si hay un enlace activo, obtener su URL y target
      const linkAttrs = editor.getAttributes('link');
      setCurrentUrl(linkAttrs.href || '');
      setUrl(linkAttrs.href || '');
      setLinkTarget(linkAttrs.target || '_blank');
    }
  }, [open, editor]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) return;

    // Formatear URL - asegurar que tenga protocolo
    let formattedUrl = url.trim();
    if (!formattedUrl.match(/^https?:\/\//)) {
      formattedUrl = `https://${formattedUrl}`;
    }

    try {
      if (hasSelection) {
        // Si hay texto seleccionado, solo cambiar/agregar el enlace
        editor.chain()
          .focus()
          .extendMarkRange('link')
          .setLink({ href: formattedUrl, target: linkTarget })
          .run();
      } else {
        // Si no hay selección, insertar nuevo enlace con texto
        const textToInsert = linkText.trim() || formattedUrl;
        editor
          .chain()
          .focus()
          .insertContent(`<a href="${formattedUrl}" target="${linkTarget}">${textToInsert}</a>`)
          .run();
      }

      // Limpiar y cerrar
      setUrl('');
      setLinkText('');
      setLinkTarget('_blank');
      setCurrentUrl('');
      onOpenChange(false);
    } catch (error) {
      console.error('Error setting link:', error);
    }
  };

  const handleRemoveLink = () => {
    try {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      setUrl('');
      setLinkText('');
      setLinkTarget('_blank');
      setCurrentUrl('');
      onOpenChange(false);
    } catch (error) {
      console.error('Error removing link:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {currentUrl ? 'Editar enlace' : 'Insertar enlace'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  placeholder="https://ejemplo.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  autoFocus
                />
              </div>
              
              {!hasSelection && (
                <div className="grid gap-2">
                  <Label htmlFor="linkText">Texto del enlace</Label>
                  <Input
                    id="linkText"
                    placeholder="Texto que se mostrará"
                    value={linkText}
                    onChange={(e) => setLinkText(e.target.value)}
                  />
                </div>
              )}
              
              <div className="grid gap-2">
                <Label htmlFor="linkTarget">Comportamiento</Label>
                <Select value={linkTarget} onValueChange={setLinkTarget}>
                  <SelectTrigger id="linkTarget">
                    <SelectValue placeholder="Seleccionar comportamiento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_blank">Abrir en nueva pestaña</SelectItem>
                    <SelectItem value="_self">Abrir en la misma pestaña</SelectItem>
                    <SelectItem value="_parent">Abrir en ventana padre</SelectItem>
                    <SelectItem value="_top">Abrir en ventana superior</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex justify-between">
            <div>
              {currentUrl && (
                <Button 
                  type="button" 
                  variant="destructive" 
                  onClick={handleRemoveLink}
                >
                  Quitar enlace
                </Button>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={!url.trim()}>
                {currentUrl ? 'Actualizar' : 'Insertar'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LinkDialog;