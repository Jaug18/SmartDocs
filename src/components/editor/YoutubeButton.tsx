import React, { useState } from 'react';
import { Editor } from '@tiptap/react';
import { Youtube, Play, Settings } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import './youtube.css';

interface YoutubeButtonProps {
  editor: Editor;
  variant?: 'button' | 'dropdown';
}

const YoutubeButton: React.FC<YoutubeButtonProps> = ({ editor, variant = 'dropdown' }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [width, setWidth] = useState(640);
  const [height, setHeight] = useState(360);
  const [controls, setControls] = useState(true);
  const [nocookie, setNocookie] = useState(true);
  const [autoplay, setAutoplay] = useState(false);
  const [loop, setLoop] = useState(false);

  if (!editor) return null;

  const insertYoutubeVideo = (customOptions?: { 
    src: string; 
    width?: number; 
    height?: number; 
    controls?: boolean;
    nocookie?: boolean;
    autoplay?: boolean;
    loop?: boolean;
  }) => {
    const options = customOptions || {
      src: youtubeUrl,
      width: Math.max(320, width) || 640,
      height: Math.max(180, height) || 360,
      controls,
      nocookie,
      autoplay,
      loop,
    };

    if (options.src && editor) {
      try {
        // Asegurar que el editor tenga foco antes de insertar
        editor.chain().focus().setYoutubeVideo(options).run();
        setIsDialogOpen(false);
        setYoutubeUrl('');
      } catch (error) {
        console.warn('Error inserting YouTube video:', error);
        // Si falla, intentar insertar en la posición actual o al final
        try {
          const { from } = editor.state.selection;
          editor.chain().insertContentAt(from, {
            type: 'youtube',
            attrs: options
          }).run();
          setIsDialogOpen(false);
          setYoutubeUrl('');
        } catch (fallbackError) {
          console.error('Failed to insert YouTube video:', fallbackError);
        }
      }
    }
  };

  const insertQuickYoutube = () => {
    const url = prompt('Ingresa la URL de YouTube:');
    if (url) {
      insertYoutubeVideo({ src: url });
    }
  };

  // Siempre habilitar el botón si el editor existe, en lugar de verificar la capacidad específica
  const canInsertYoutube = !!editor;

  if (variant === 'button') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="youtube-button"
              onClick={insertQuickYoutube}
              disabled={!canInsertYoutube}
              aria-label="Insertar video de YouTube"
            >
              <Youtube className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="youtube-tooltip">
              <p className="youtube-tooltip__title">Video de YouTube</p>
              <p className="youtube-tooltip__shortcut">
                Insertar video directamente
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
                className="h-8 w-8 p-0 hover:bg-accent youtube-button"
                type="button"
                disabled={!canInsertYoutube}
              >
                <Youtube className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <DropdownMenuContent 
            align="start" 
            side="bottom"
            sideOffset={5}
            alignOffset={0}
            className="w-52 youtube-dropdown-content max-h-[50vh] overflow-y-auto"
            style={{ 
              position: 'fixed',
              zIndex: 999,
              maxHeight: '50vh',
              overflowY: 'auto'
            }}
          >
            <DropdownMenuLabel className="youtube-dropdown-label">
              Videos de YouTube
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {/* Inserción rápida */}
            <DropdownMenuItem 
              onClick={insertQuickYoutube}
              className="youtube-dropdown-item"
              disabled={!canInsertYoutube}
            >
              <Play className="mr-2 h-4 w-4" />
              <div className="flex flex-col">
                <span>Insertar rápido</span>
                <span className="text-xs text-muted-foreground">URL desde prompt</span>
              </div>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            {/* Inserción con opciones */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <DropdownMenuItem 
                  onSelect={(e) => {
                    e.preventDefault();
                    setIsDialogOpen(true);
                  }}
                  className="youtube-dropdown-item"
                  disabled={!canInsertYoutube}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span>Insertar con opciones</span>
                    <span className="text-xs text-muted-foreground">Configurar tamaño y opciones</span>
                  </div>
                </DropdownMenuItem>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Insertar Video de YouTube</DialogTitle>
                  <DialogDescription>
                    Configura las opciones del video antes de insertarlo
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="youtube-url">URL del video</Label>
                    <Input
                      id="youtube-url"
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      className="youtube-url-input"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="youtube-width">Ancho (px)</Label>
                      <Input
                        id="youtube-width"
                        type="number"
                        min="320"
                        max="1920"
                        value={width}
                        onChange={(e) => setWidth(parseInt(e.target.value) || 640)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="youtube-height">Alto (px)</Label>
                      <Input
                        id="youtube-height"
                        type="number"
                        min="180"
                        max="1080"
                        value={height}
                        onChange={(e) => setHeight(parseInt(e.target.value) || 360)}
                      />
                    </div>
                  </div>
                  
                  <div className="grid gap-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="youtube-controls"
                        checked={controls}
                        onCheckedChange={(checked) => setControls(checked as boolean)}
                      />
                      <Label htmlFor="youtube-controls">Mostrar controles</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="youtube-nocookie"
                        checked={nocookie}
                        onCheckedChange={(checked) => setNocookie(checked as boolean)}
                      />
                      <Label htmlFor="youtube-nocookie">Sin cookies (privacy-enhanced)</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="youtube-autoplay"
                        checked={autoplay}
                        onCheckedChange={(checked) => setAutoplay(checked as boolean)}
                      />
                      <Label htmlFor="youtube-autoplay">Reproducción automática</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="youtube-loop"
                        checked={loop}
                        onCheckedChange={(checked) => setLoop(checked as boolean)}
                      />
                      <Label htmlFor="youtube-loop">Reproducir en bucle</Label>
                    </div>
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
                    onClick={() => insertYoutubeVideo()}
                    disabled={!youtubeUrl}
                  >
                    Insertar Video
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            {/* Presets rápidos */}
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="youtube-dropdown-label">
              Tamaños predefinidos
            </DropdownMenuLabel>
            
            <DropdownMenuItem 
              onClick={() => {
                const url = prompt('URL del video:');
                if (url) insertYoutubeVideo({ src: url, width: 320, height: 180 });
              }}
              className="youtube-dropdown-item"
              disabled={!canInsertYoutube}
            >
              <Youtube className="mr-2 h-4 w-4" />
              Pequeño (320x180)
            </DropdownMenuItem>
            
            <DropdownMenuItem 
              onClick={() => {
                const url = prompt('URL del video:');
                if (url) insertYoutubeVideo({ src: url, width: 640, height: 360 });
              }}
              className="youtube-dropdown-item"
              disabled={!canInsertYoutube}
            >
              <Youtube className="mr-2 h-4 w-4" />
              Mediano (640x360)
            </DropdownMenuItem>
            
            <DropdownMenuItem 
              onClick={() => {
                const url = prompt('URL del video:');
                if (url) insertYoutubeVideo({ src: url, width: 854, height: 480 });
              }}
              className="youtube-dropdown-item"
              disabled={!canInsertYoutube}
            >
              <Youtube className="mr-2 h-4 w-4" />
              Grande (854x480)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <TooltipContent>
          <div className="youtube-tooltip">
            <p className="youtube-tooltip__title">Videos de YouTube</p>
            <p className="youtube-tooltip__shortcut">
              Insertar y configurar videos
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default YoutubeButton;
