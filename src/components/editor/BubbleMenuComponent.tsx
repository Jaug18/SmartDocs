import { BubbleMenu, Editor } from '@tiptap/react';
import { 
  Bold, Italic, Underline, Strikethrough, Code, Link as LinkIcon, Palette, Type,
  Copy, Scissors, AlignLeft, AlignCenter, AlignRight, AlignJustify, 
  MoreHorizontal, Trash2, Share2, Download, X, Check, File, Eraser
} from 'lucide-react';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { DocumentSelector } from './DocumentSelector';

// Error Boundary para capturar errores en el BubbleMenu
class BubbleMenuErrorBoundary extends React.Component<
  { children: React.ReactNode; onError?: (error: Error, errorInfo: React.ErrorInfo) => void },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; onError?: (error: Error, errorInfo: React.ErrorInfo) => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    console.warn('BubbleMenu error caught by boundary:', error);
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.warn('BubbleMenu error details:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return null; // No renderizar nada si hay error
    }

    return this.props.children;
  }
}

// Define constantes para colores y fuentes
const COLORS = [
  '#000000', '#262626', '#595959', '#8c8c8c',
  '#f5222d', '#fa8c16', '#fadb14', '#52c41a', '#1890ff', '#722ed1', '#eb2f96'
];

const FONT_FAMILIES = [
  { label: 'Sans', value: 'Inter, sans-serif' },
  { label: 'Serif', value: 'Georgia, serif' },
  { label: 'Mono', value: 'Menlo, monospace' },
];

interface BubbleMenuComponentProps {
  editor: Editor;
}

interface LinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (url: string) => void;
  initialUrl?: string;
}

const LinkModal = ({ isOpen, onClose, onConfirm, initialUrl = '' }: LinkModalProps) => {
  const [url, setUrl] = useState(initialUrl);

  useEffect(() => {
    setUrl(initialUrl);
  }, [initialUrl]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onConfirm(url.trim());
      setUrl('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-background border rounded-lg p-6 w-96 shadow-lg" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-4">Insertar enlace</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">URL del enlace</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://ejemplo.com"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border rounded-md hover:bg-accent"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Insertar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const BubbleMenuComponent = ({ editor }: BubbleMenuComponentProps) => {
  // Estados para controlar la interfaz
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showFontPicker, setShowFontPicker] = useState(false);
  const [isDocSelectorOpen, setIsDocSelectorOpen] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [isMounted, setIsMounted] = useState(true);

  // Función para verificar si el editor está en un estado válido
  const isEditorValid = useCallback(() => {
    try {
      return isMounted &&
             editor && 
             !editor.isDestroyed && 
             editor.view && 
             editor.view.dom && 
             editor.view.dom.isConnected &&
             editor.state &&
             editor.commands;
    } catch {
      return false;
    }
  }, [editor, isMounted]);

  // Función segura para ejecutar comandos del editor
  const safeExecuteCommand = useCallback((command: () => boolean | void) => {
    try {
      if (!isEditorValid()) return;
      return command();
    } catch (error) {
      console.warn('Error executing editor command:', error);
      return false;
    }
  }, [isEditorValid]);

  // Cleanup al desmontar el componente
  useEffect(() => {
    return () => {
      setIsMounted(false);
    };
  }, []);

  // Manejar clic derecho para mostrar menú contextual
  useEffect(() => {
    const handleContextMenu = (event: MouseEvent) => {
      try {
        // Verificar que el editor esté disponible y tenga una selección
        if (!isEditorValid()) return;
        
        // Solo mostrar si hay texto seleccionado
        if (!editor.state.selection.empty) {
          event.preventDefault();
          setContextMenuPosition({ x: event.clientX, y: event.clientY });
          setShowContextMenu(true);
          setShowColorPicker(false);
          setShowFontPicker(false);
        }
      } catch (error) {
        console.warn('Error handling context menu:', error);
      }
    };

    const handleClick = () => {
      try {
        setShowContextMenu(false);
        setShowColorPicker(false);
        setShowFontPicker(false);
      } catch (error) {
        console.warn('Error handling click:', error);
      }
    };

    // Verificar que el editor y su DOM estén disponibles
    if (!editor || !editor.view || !editor.view.dom || editor.isDestroyed) {
      return;
    }

    // Agregar un pequeño delay para asegurar que el DOM esté listo
    const timeoutId = setTimeout(() => {
      try {
        const editorElement = editor.view?.dom;
        if (editorElement && 
            typeof editorElement.addEventListener === 'function' && 
            !editor.isDestroyed) {
          editorElement.addEventListener('contextmenu', handleContextMenu);
          document.addEventListener('click', handleClick);
        }
      } catch (error) {
        console.warn('Error adding event listeners:', error);
      }
    }, 50);

    return () => {
      clearTimeout(timeoutId);
      try {
        const editorElement = editor.view?.dom;
        if (editorElement && 
            typeof editorElement.removeEventListener === 'function') {
          editorElement.removeEventListener('contextmenu', handleContextMenu);
        }
        document.removeEventListener('click', handleClick);
      } catch (error) {
        console.warn('Error removing event listeners:', error);
      }
    };
  }, [editor, isEditorValid]);

  // Copia/Corta el texto seleccionado al portapapeles
  const handleCopyText = () => {
    safeExecuteCommand(() => {
      const selectedText = editor.state.doc.textBetween(
        editor.state.selection.from,
        editor.state.selection.to,
        '\n'
      );
      navigator.clipboard.writeText(selectedText);
      setShowContextMenu(false);
      return true;
    });
  };

  const handleCutText = () => {
    safeExecuteCommand(() => {
      const selectedText = editor.state.doc.textBetween(
        editor.state.selection.from,
        editor.state.selection.to,
        '\n'
      );
      navigator.clipboard.writeText(selectedText);
      editor.chain().focus().deleteSelection().run();
      setShowContextMenu(false);
      return true;
    });
  };

  // Insertar enlace externo
  const handleInsertLink = (url: string) => {
    safeExecuteCommand(() => {
      if (url) {
        editor.chain().focus().setLink({ href: url }).run();
      }
      return true;
    });
  };

  // Insertar enlace a documento interno
  const handleSelectDocument = (documentId: string, documentTitle: string) => {
    safeExecuteCommand(() => {
      const docUrl = `doc://${documentId}`;
      editor.chain().focus().setLink({ href: docUrl }).run();
      setIsDocSelectorOpen(false);
      setShowContextMenu(false);
      return true;
    });
  };

  // Guarda la selección actual como imagen (captura de texto)
  const handleShareSelection = () => {
    try {
      alert("Función de compartir selección implementada pronto");
      setShowContextMenu(false);
    } catch (error) {
      console.warn('Error sharing selection:', error);
    }
  };

  // Limpiar estilos de texto vacíos
  const handleCleanTextStyles = () => {
    safeExecuteCommand(() => {
      if (editor && editor.commands) {
        editor.commands.removeEmptyTextStyle();
      }
      setShowContextMenu(false);
      return true;
    });
  };

  const handleDownloadSelection = () => {
    safeExecuteCommand(() => {
      const selectedText = editor.state.doc.textBetween(
        editor.state.selection.from,
        editor.state.selection.to,
        '\n'
      );
      
      const blob = new Blob([selectedText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'seleccion.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setShowContextMenu(false);
      return true;
    });
  };

  const MenuButton = ({ 
    onClick, 
    icon: Icon, 
    label, 
    isActive = false, 
    shortcut = '',
    className = ''
  }: {
    onClick: () => void;
    icon: React.ComponentType<{className?: string}>;
    label: string;
    isActive?: boolean;
    shortcut?: string;
    className?: string;
  }) => (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      className={`flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent w-full text-left rounded-sm ${
        isActive ? 'bg-accent/60 font-medium' : ''
      } ${className}`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="flex-1">{label}</span>
      {shortcut && (
        <span className="text-xs text-muted-foreground">{shortcut}</span>
      )}
    </button>
  );

  // No renderizar si el editor no está disponible o está destruido
  if (!isEditorValid()) {
    return null;
  }

  return (
    <BubbleMenuErrorBoundary>
      {/* Menú contextual estilo Word */}
      {showContextMenu && (
        <div 
          className="fixed z-50 bg-background border rounded-lg shadow-lg py-2 min-w-[200px]"
          style={{ 
            left: contextMenuPosition.x, 
            top: contextMenuPosition.y,
            maxHeight: '80vh',
            overflowY: 'auto'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Grupo de Formato */}
          <div className="px-2 py-1 text-xs font-medium text-muted-foreground border-b mb-1">
            Formato
          </div>
          
          <MenuButton
            onClick={() => safeExecuteCommand(() => {
              editor.chain().focus().toggleBold().run();
              return true;
            })}
            icon={Bold}
            label="Negrita"
            isActive={isEditorValid() ? editor.isActive('bold') : false}
            shortcut="Ctrl+B"
          />
          
          <MenuButton
            onClick={() => safeExecuteCommand(() => {
              editor.chain().focus().toggleItalic().run();
              return true;
            })}
            icon={Italic}
            label="Cursiva"
            isActive={isEditorValid() ? editor.isActive('italic') : false}
            shortcut="Ctrl+I"
          />
          
          <MenuButton
            onClick={() => safeExecuteCommand(() => {
              editor.chain().focus().toggleUnderline().run();
              return true;
            })}
            icon={Underline}
            label="Subrayado"
            isActive={isEditorValid() ? editor.isActive('underline') : false}
            shortcut="Ctrl+U"
          />
          
          <MenuButton
            onClick={() => safeExecuteCommand(() => {
              editor.chain().focus().toggleStrike().run();
              return true;
            })}
            icon={Strikethrough}
            label="Tachado"
            isActive={isEditorValid() ? editor.isActive('strike') : false}
            shortcut="Ctrl+Shift+X"
          />
          
          <MenuButton
            onClick={() => safeExecuteCommand(() => {
              editor.chain().focus().toggleCode().run();
              return true;
            })}
            icon={Code}
            label="Código"
            isActive={isEditorValid() ? editor.isActive('code') : false}
            shortcut="Ctrl+E"
          />

          {/* Separador */}
          <div className="border-t my-2"></div>

          {/* Grupo de Color y Fuente */}
          <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
            Estilo
          </div>
          
          <MenuButton
            onClick={() => {
              setShowColorPicker(!showColorPicker);
              setShowFontPicker(false);
            }}
            icon={Palette}
            label="Color de texto"
            isActive={showColorPicker}
          />
          
          <MenuButton
            onClick={() => {
              setShowFontPicker(!showFontPicker);
              setShowColorPicker(false);
            }}
            icon={Type}
            label="Tipo de letra"
            isActive={showFontPicker}
          />

          {/* Selector de colores */}
          {showColorPicker && (
            <div className="border-t border-border/20 pt-2 mt-1 mx-2">
              <div className="flex flex-wrap gap-1 max-w-[180px]">
                {COLORS.map(color => (
                  <button
                    key={color}
                    className="w-6 h-6 rounded border border-muted-foreground/30 transition-transform hover:scale-110"
                    style={{ background: color }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      safeExecuteCommand(() => {
                        editor.chain().focus().setColor(color).run();
                        setShowColorPicker(false);
                        return true;
                      });
                    }}
                    title={`Color ${color}`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Selector de fuentes */}
          {showFontPicker && (
            <div className="border-t border-border/20 pt-2 mt-1 mx-2">
              {FONT_FAMILIES.map(font => (
                <button
                  key={font.value}
                  className={`w-full text-left px-2 py-1 rounded text-sm hover:bg-accent ${
                    isEditorValid() && editor.isActive('textStyle', { fontFamily: font.value }) 
                      ? 'bg-accent/60 font-medium' 
                      : ''
                  }`}
                  style={{ fontFamily: font.value }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    safeExecuteCommand(() => {
                      editor.chain().focus().setFontFamily(font.value).run();
                      setShowFontPicker(false);
                      return true;
                    });
                  }}
                >
                  {font.label}
                </button>
              ))}
            </div>
          )}

          {/* Separador */}
          <div className="border-t my-2"></div>

          {/* Grupo de Alineación */}
          <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
            Alineación
          </div>
          
          <MenuButton
            onClick={() => safeExecuteCommand(() => {
              editor.chain().focus().setTextAlign('left').run();
              return true;
            })}
            icon={AlignLeft}
            label="Alinear a la izquierda"
            isActive={isEditorValid() ? editor.isActive({ textAlign: 'left' }) : false}
          />
          
          <MenuButton
            onClick={() => safeExecuteCommand(() => {
              editor.chain().focus().setTextAlign('center').run();
              return true;
            })}
            icon={AlignCenter}
            label="Centrar"
            isActive={isEditorValid() ? editor.isActive({ textAlign: 'center' }) : false}
          />
          
          <MenuButton
            onClick={() => safeExecuteCommand(() => {
              editor.chain().focus().setTextAlign('right').run();
              return true;
            })}
            icon={AlignRight}
            label="Alinear a la derecha"
            isActive={isEditorValid() ? editor.isActive({ textAlign: 'right' }) : false}
          />

          {/* Separador */}
          <div className="border-t my-2"></div>

          {/* Grupo de Enlaces */}
          <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
            Enlaces
          </div>
          
          <MenuButton
            onClick={() => setShowLinkModal(true)}
            icon={LinkIcon}
            label="Insertar enlace"
          />
          
          <MenuButton
            onClick={() => {
              setIsDocSelectorOpen(true);
              setShowContextMenu(false);
            }}
            icon={File}
            label="Enlazar documento"
          />

          {/* Separador */}
          <div className="border-t my-2"></div>

          {/* Grupo de Acciones */}
          <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
            Acciones
          </div>
          
          <MenuButton
            onClick={handleCopyText}
            icon={Copy}
            label="Copiar"
            shortcut="Ctrl+C"
          />
          
          <MenuButton
            onClick={handleCutText}
            icon={Scissors}
            label="Cortar"
            shortcut="Ctrl+X"
          />
          
          <MenuButton
            onClick={handleDownloadSelection}
            icon={Download}
            label="Descargar como texto"
          />
          
          <MenuButton
            onClick={handleShareSelection}
            icon={Share2}
            label="Compartir selección"
          />
          
          <MenuButton
            onClick={handleCleanTextStyles}
            icon={Eraser}
            label="Limpiar formato"
          />
        </div>
      )}

      {/* Modal para insertar enlaces */}
      <LinkModal
        isOpen={showLinkModal}
        onClose={() => setShowLinkModal(false)}
        onConfirm={handleInsertLink}
      />

      {/* Selector de documentos para enlaces internos */}
      <DocumentSelector 
        open={isDocSelectorOpen}
        onOpenChange={setIsDocSelectorOpen}
        onSelectDocument={handleSelectDocument}
      />
    </BubbleMenuErrorBoundary>
  );
};

export default BubbleMenuComponent;
