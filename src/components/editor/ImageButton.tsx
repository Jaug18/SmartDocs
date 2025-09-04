import React, { useState, useRef } from 'react';
import { Editor } from '@tiptap/react';
import { Image as ImageIcon, Upload, Link, FileImage } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import './image.css';

interface ImageButtonProps {
  editor: Editor;
  variant?: 'button' | 'dropdown';
}

const ImageButton: React.FC<ImageButtonProps> = ({ editor, variant = 'dropdown' }) => {
  const [isUrlDialogOpen, setIsUrlDialogOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [imageTitle, setImageTitle] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!editor) return null;

  const insertImageFromUrl = () => {
    if (imageUrl.trim()) {
      editor.commands.setResizableImage({
        src: imageUrl.trim(),
        alt: imageAlt.trim() || undefined,
        title: imageTitle.trim() || undefined,
      });
      editor.commands.focus();
      
      // Reset form
      setImageUrl('');
      setImageAlt('');
      setImageTitle('');
      setIsUrlDialogOpen(false);
    }
  };

  // Quick insert predefined placeholder images (based on official examples)
  const insertPlaceholderImage = (type: 'landscape' | 'portrait' | 'square') => {
    const dimensions = {
      landscape: '800x400',
      portrait: '400x600', 
      square: '400x400'
    };
    
    const placeholderUrl = `https://placehold.co/${dimensions[type]}/6A00F5/white`;
    
    editor.commands.setResizableImage({
      src: placeholderUrl,
      alt: `Placeholder image (${type})`,
      title: `Placeholder ${type} image`
    });
    editor.commands.focus();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          editor.commands.setResizableImage({
            src: result,
            alt: file.name,
            title: file.name,
          });
          editor.commands.focus();
        }
      };
      reader.readAsDataURL(file);
    }
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const openUrlDialog = () => {
    setIsUrlDialogOpen(true);
  };

  if (variant === 'button') {
    return (
      <>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={openUrlDialog}
                className="image-button"
                aria-label="Insertar imagen"
              >
                <ImageIcon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            {/* <TooltipContent>
              <div className="image-tooltip">
                <p className="image-tooltip__title">Insertar imagen</p>
                <p className="image-tooltip__shortcut">
                  URL o archivo local
                </p>
              </div>
            </TooltipContent> */}
          </Tooltip>
        </TooltipProvider>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />

        <Dialog open={isUrlDialogOpen} onOpenChange={setIsUrlDialogOpen}>
          <DialogContent className="image-dialog">
            <DialogHeader>
              <DialogTitle>Insertar imagen desde URL</DialogTitle>
            </DialogHeader>
            <div className="image-form">
              <div className="image-form__field">
                <Label htmlFor="image-url">URL de la imagen *</Label>
                <Input
                  id="image-url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://ejemplo.com/imagen.jpg"
                  className="image-input"
                />
              </div>
              <div className="image-form__field">
                <Label htmlFor="image-alt">Texto alternativo</Label>
                <Input
                  id="image-alt"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  placeholder="Descripción de la imagen"
                  className="image-input"
                />
              </div>
              <div className="image-form__field">
                <Label htmlFor="image-title">Título</Label>
                <Input
                  id="image-title"
                  value={imageTitle}
                  onChange={(e) => setImageTitle(e.target.value)}
                  placeholder="Título de la imagen"
                  className="image-input"
                />
              </div>
            </div>
            <DialogFooter className="image-dialog__footer">
              <Button
                variant="outline"
                onClick={() => setIsUrlDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={insertImageFromUrl}
                disabled={!imageUrl.trim()}
              >
                Insertar imagen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <DropdownMenu>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="image-dropdown-button"
                  aria-label="Opciones de imagen"
                >
                  <ImageIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            {/* <TooltipContent>
              <div className="image-tooltip">
                <p className="image-tooltip__title">Insertar imagen</p>
                <p className="image-tooltip__shortcut">
                  Desde URL o archivo local
                </p>
              </div>
            </TooltipContent> */}
          </Tooltip>
        </TooltipProvider>

        <DropdownMenuContent className="image-dropdown-content" align="start" sideOffset={5}>
          <DropdownMenuLabel className="image-dropdown-label">
            Insertar Imagen
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem
            onClick={openUrlDialog}
            className="image-dropdown-item"
          >
            <Link className="h-4 w-4 mr-2" />
            <span>Desde URL</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={openFileDialog}
            className="image-dropdown-item"
          >
            <Upload className="h-4 w-4 mr-2" />
            <span>Subir archivo</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          
          <DropdownMenuLabel className="image-dropdown-label">
            Placeholders
          </DropdownMenuLabel>
          
          <DropdownMenuItem
            onClick={() => insertPlaceholderImage('landscape')}
            className="image-dropdown-item"
          >
            <FileImage className="h-4 w-4 mr-2" />
            <span>Landscape (800x400)</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => insertPlaceholderImage('portrait')}
            className="image-dropdown-item"
          >
            <FileImage className="h-4 w-4 mr-2" />
            <span>Portrait (400x600)</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => insertPlaceholderImage('square')}
            className="image-dropdown-item"
          >
            <FileImage className="h-4 w-4 mr-2" />
            <span>Square (400x400)</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      <Dialog open={isUrlDialogOpen} onOpenChange={setIsUrlDialogOpen}>
        <DialogContent className="image-dialog">
          <DialogHeader>
            <DialogTitle>Insertar imagen desde URL</DialogTitle>
          </DialogHeader>
          <div className="image-form">
            <div className="image-form__field">
              <Label htmlFor="image-url">URL de la imagen *</Label>
              <Input
                id="image-url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://ejemplo.com/imagen.jpg"
                className="image-input"
              />
            </div>
            <div className="image-form__field">
              <Label htmlFor="image-alt">Texto alternativo</Label>
              <Input
                id="image-alt"
                value={imageAlt}
                onChange={(e) => setImageAlt(e.target.value)}
                placeholder="Descripción de la imagen"
                className="image-input"
              />
            </div>
            <div className="image-form__field">
              <Label htmlFor="image-title">Título</Label>
              <Input
                id="image-title"
                value={imageTitle}
                onChange={(e) => setImageTitle(e.target.value)}
                placeholder="Título de la imagen"
                className="image-input"
              />
            </div>
          </div>
          <DialogFooter className="image-dialog__footer">
            <Button
              variant="outline"
              onClick={() => setIsUrlDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={insertImageFromUrl}
              disabled={!imageUrl.trim()}
            >
              Insertar imagen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ImageButton;
