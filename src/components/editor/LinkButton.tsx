import React, { useState } from 'react';
import { Editor } from '@tiptap/react';
import { Link, ExternalLink, Unlink, Edit } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import './link.css';

interface LinkButtonProps {
  editor: Editor;
  variant?: 'toggle' | 'button' | 'dropdown';
}

const LinkButton: React.FC<LinkButtonProps> = ({ editor, variant = 'dropdown' }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTarget, setLinkTarget] = useState('_blank');

  if (!editor) return null;

  const setLink = (url?: string, target?: string) => {
    const href = url || linkUrl;
    if (!href || !editor) return;

    try {
      // Asegurar que el editor tenga foco antes de aplicar el enlace
      editor.chain().focus().extendMarkRange('link').setLink({ 
        href: href,
        target: target || linkTarget,
      }).run();
      setIsDialogOpen(false);
      setLinkUrl('');
    } catch (error) {
      console.warn('Error setting link with extendMarkRange:', error);
      // Si falla con extendMarkRange, intentar con setLink directo
      try {
        editor.chain().focus().setLink({ 
          href: href,
          target: target || linkTarget,
        }).run();
        setIsDialogOpen(false);
        setLinkUrl('');
      } catch (fallbackError) {
        console.error('Failed to set link:', fallbackError);
      }
    }
  };

  const setLinkPrompt = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL:', previousUrl);

    if (url === null) return;

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    setLink(url);
  };

  const toggleLink = () => {
    const { href } = editor.getAttributes('link');
    
    if (href) {
      editor.chain().focus().unsetLink().run();
    } else {
      setLinkPrompt();
    }
  };

  const unsetLink = () => {
    editor.chain().focus().unsetLink().run();
  };

  const editLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    setLinkUrl(previousUrl || '');
    setLinkTarget('_blank'); // Reset target to default
    setIsDialogOpen(true);
  };

  const isActive = editor.isActive('link');
  // Siempre habilitar el botón si el editor existe, en lugar de verificar la capacidad específica
  const canSetLink = !!editor;
  const currentHref = editor.getAttributes('link').href;

  if (variant === 'toggle') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Toggle
              pressed={isActive}
              onPressedChange={toggleLink}
              aria-label="Enlace"
              disabled={!canSetLink}
              size="sm"
              className={`link-toggle ${isActive ? 'link-toggle--active' : ''}`}
            >
              <Link className="h-4 w-4" />
            </Toggle>
          </TooltipTrigger>
          <TooltipContent>
            <div className="link-tooltip">
              <p className="link-tooltip__title">
                {isActive ? 'Quitar enlace' : 'Agregar enlace'}
              </p>
              <p className="link-tooltip__shortcut">
                <kbd>Ctrl+K</kbd>
              </p>
              {isActive && currentHref && (
                <p className="link-tooltip__url">{currentHref}</p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (variant === 'button') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="link-button"
              onClick={toggleLink}
              disabled={!canSetLink}
              aria-label="Enlace"
            >
              <Link className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="link-tooltip">
              <p className="link-tooltip__title">
                {isActive ? 'Quitar enlace' : 'Agregar enlace'}
              </p>
              <p className="link-tooltip__shortcut">
                <kbd>Ctrl+K</kbd>
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <DropdownMenu>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`h-8 w-8 p-0 hover:bg-accent link-button ${
                  isActive ? 'bg-accent text-accent-foreground' : ''
                }`}
                type="button"
                disabled={!canSetLink}
              >
                <Link className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <DropdownMenuContent 
            align="start" 
            side="bottom"
            sideOffset={5}
            alignOffset={0}
            className="w-52 link-dropdown-content max-h-[50vh] overflow-y-auto"
            style={{ 
              position: 'fixed',
              zIndex: 999,
              maxHeight: '50vh',
              overflowY: 'auto'
            }}
          >
            <DropdownMenuLabel className="link-dropdown-label">
              Gestión de enlaces
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {/* Inserción rápida */}
            <DropdownMenuItem 
              onClick={setLinkPrompt}
              className="link-dropdown-item"
              disabled={!canSetLink}
            >
              <Link className="mr-2 h-4 w-4" />
              <div className="flex flex-col">
                <span>Enlace rápido</span>
                <span className="text-xs text-muted-foreground">Prompt para URL</span>
              </div>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            {/* Inserción con opciones */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <DropdownMenuItem 
                  onSelect={(e) => {
                    e.preventDefault();
                    const currentUrl = editor.getAttributes('link').href;
                    setLinkUrl(currentUrl || '');
                    setLinkTarget('_blank');
                    setIsDialogOpen(true);
                  }}
                  className="link-dropdown-item"
                  disabled={!canSetLink}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span>Enlace avanzado</span>
                    <span className="text-xs text-muted-foreground">Configurar opciones</span>
                  </div>
                </DropdownMenuItem>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>
                    {isActive ? 'Editar enlace' : 'Insertar enlace'}
                  </DialogTitle>
                  <DialogDescription>
                    Configura la URL y las opciones del enlace
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="link-url">URL del enlace</Label>
                    <Input
                      id="link-url"
                      placeholder="https://ejemplo.com"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      className="link-url-input"
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="link-target">Comportamiento</Label>
                    <select
                      id="link-target"
                      value={linkTarget}
                      onChange={(e) => setLinkTarget(e.target.value)}
                      className="link-target-select rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="_blank">Abrir en nueva pestaña</option>
                      <option value="_self">Abrir en la misma pestaña</option>
                      <option value="_parent">Abrir en ventana padre</option>
                      <option value="_top">Abrir en ventana superior</option>
                    </select>
                  </div>
                </div>
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="button" 
                    onClick={() => setLink()}
                    disabled={!linkUrl.trim()}
                  >
                    {isActive ? 'Actualizar' : 'Insertar'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            {isActive && (
              <>
                <DropdownMenuSeparator />
                
                {/* Editar enlace existente */}
                <DropdownMenuItem 
                  onClick={editLink}
                  className="link-dropdown-item"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span>Editar enlace</span>
                    <span className="text-xs text-muted-foreground truncate">
                      {currentHref}
                    </span>
                  </div>
                </DropdownMenuItem>
                
                {/* Abrir enlace */}
                <DropdownMenuItem 
                  onClick={() => currentHref && window.open(currentHref, '_blank')}
                  className="link-dropdown-item"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span>Abrir enlace</span>
                    <span className="text-xs text-muted-foreground">Nueva pestaña</span>
                  </div>
                </DropdownMenuItem>
                
                {/* Quitar enlace */}
                <DropdownMenuItem 
                  onClick={unsetLink}
                  className="link-dropdown-item text-destructive"
                >
                  <Unlink className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span>Quitar enlace</span>
                    <span className="text-xs text-muted-foreground">Eliminar enlace</span>
                  </div>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        
        <TooltipContent>
          <div className="link-tooltip">
            <p className="link-tooltip__title">Enlaces</p>
            <p className="link-tooltip__shortcut">
              <kbd>Ctrl+K</kbd>
            </p>
            {isActive && currentHref && (
              <p className="link-tooltip__url">{currentHref}</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default LinkButton;
