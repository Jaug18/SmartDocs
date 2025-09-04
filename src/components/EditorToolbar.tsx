import React, { useState, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import { 
  Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Quote, Code, Undo, Redo, Heading1, Heading2, Heading3, Heading, 
  Minus, Image as ImageIcon, Table as TableIcon, Youtube as YoutubeIcon, CheckSquare, AtSign,
  Text as TextIcon, Palette, Type, ArrowDown, Subscript, Superscript, MoreHorizontal,
  ArrowDownLeft, ArrowUpLeft, PenSquare, Layout, Keyboard, PanelBottomOpen, PanelBottomClose, 
  Link, Share2, FileText, Settings, Grid3X3, Zap, Eye, Calculator, Hash, Globe, Upload, Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Separator } from '@/components/ui/separator';

// Importar todos los componentes modulares
import BlockquoteButton from '@/components/editor/BlockquoteButton';
import BoldButton from '@/components/editor/BoldButton';
import CodeButton from '@/components/editor/CodeButton';
import HighlightButton from '@/components/editor/HighlightButton';
import ItalicButton from '@/components/editor/ItalicButton';
import BulletListButton from '@/components/editor/BulletListButton';
import CodeBlockButton from '@/components/editor/CodeBlockButton';
import CodeBlockLowlightButton from '@/components/editor/CodeBlockLowlightButton';
import DetailsButton from '@/components/editor/DetailsButton';
import DetailsSummaryButton from '@/components/editor/DetailsSummaryButton';
import DetailsContentButton from '@/components/editor/DetailsContentButton';
import DocumentButton from '@/components/editor/DocumentButton';
import EmojiButton from '@/components/editor/EmojiButton';
import HardBreakButton from '@/components/editor/HardBreakButton';
import HeadingButton from '@/components/editor/HeadingButton';
import HorizontalRuleButton from '@/components/editor/HorizontalRuleButton';
import ImageButton from '@/components/editor/ImageButton';
import ListItemButton from '@/components/editor/ListItemButton';
import MentionButton from '@/components/editor/MentionButton';
import OrderedListButton from '@/components/editor/OrderedListButton';
import ParagraphButton from '@/components/editor/ParagraphButton';
import TableButton from '@/components/editor/TableButton';
import TableCellButton from '@/components/editor/TableCellButton';
import TableHeaderButton from '@/components/editor/TableHeaderButton';
import TableRowButton from '@/components/editor/TableRowButton';
import TaskListButton from '@/components/editor/TaskListButton';
import YoutubeButton from '@/components/editor/YoutubeButton';
import LinkButton from '@/components/editor/LinkButton';
import StrikeButton from '@/components/editor/StrikeButton';
import SubscriptButton from '@/components/editor/SubscriptButton';
import SuperscriptButton from '@/components/editor/SuperscriptButton';
import UnderlineButton from '@/components/editor/UnderlineButton';
import ColorButton from '@/components/editor/ColorButton';
import FileHandlerButton from '@/components/editor/FileHandlerButton';
import FocusButton from '@/components/editor/FocusButton';
import FontFamilyButton from '@/components/editor/FontFamilyButton';
import InvisibleCharactersButton from '@/components/editor/InvisibleCharactersButton';
import MathematicsButton from '@/components/editor/MathematicsButton';
import PlaceholderButton from '@/components/editor/PlaceholderButton';
import TableOfContentsButton from '@/components/editor/TableOfContentsButton';
import TextAlignButton from '@/components/editor/TextAlignButton';
import TypographyButton from '@/components/editor/TypographyButton';
import { UndoButton, RedoButton } from '@/components/editor/HistoryButton';

// Importar estilos
import '@/components/editor/toolbar.css';
import '@/components/editor/textalign.css';
import '@/components/editor/typography.css';
import '@/components/editor/history.css';

interface EditorToolbarProps {
  editor: Editor;
  onSave?: () => void;
  canSave?: boolean;
  onShare?: () => void;
  canShare?: boolean;
  isCollaborating?: boolean;
  documentPermission?: 'owner' | 'editor' | 'viewer';
  // Nuevas props para importar/exportar
  onImport?: () => void;
  onExport?: (format: 'html' | 'markdown' | 'txt' | 'pdf' | 'docx') => void;
  onToggleWordCount?: () => void;
  showWordCount?: boolean;
}

// Definir atajos de teclado
const KEYBOARD_SHORTCUTS = {
  // Historial
  undo: 'Ctrl+Z',
  redo: 'Ctrl+Y',
  
  // Formato de texto
  bold: 'Ctrl+B',
  italic: 'Ctrl+I',
  underline: 'Ctrl+U',
  strikethrough: 'Ctrl+Shift+X',
  code: 'Ctrl+E',
  
  // Encabezados
  heading1: 'Ctrl+Alt+1',
  heading2: 'Ctrl+Alt+2',
  heading3: 'Ctrl+Alt+3',
  heading4: 'Ctrl+Alt+4',
  heading5: 'Ctrl+Alt+5',
  heading6: 'Ctrl+Alt+6',
  paragraph: 'Ctrl+Alt+0',
  
  // Listas
  bulletList: 'Ctrl+Shift+8',
  orderedList: 'Ctrl+Shift+7',
  taskList: 'Ctrl+Shift+9',
  
  // Bloques
  blockquote: 'Ctrl+Shift+B',
  codeBlock: 'Ctrl+Alt+C',
  codeBlockLowlight: 'Ctrl+Alt+Shift+C',
  horizontalRule: 'Ctrl+Shift+H',
  details: 'Ctrl+Alt+D',
  detailsSummary: 'Ctrl+Shift+S',
  
  // Alineación
  alignLeft: 'Ctrl+Shift+L',
  alignCenter: 'Ctrl+Shift+E',
  alignRight: 'Ctrl+Shift+R',
  alignJustify: 'Ctrl+Shift+J',
  
  // Insertar
  link: 'Ctrl+K',
  image: 'Ctrl+Shift+I',
  table: 'Ctrl+Shift+T',
  emoji: 'Ctrl+Shift+;',
  mathematics: 'Ctrl+Shift+M',
  youtube: 'Ctrl+Shift+Y',
  mention: 'Ctrl+Shift+@',
  
  // Scripts
  subscript: 'Ctrl+,',
  superscript: 'Ctrl+.',
  
  // Color y formato
  color: 'Ctrl+Shift+C',
  highlight: 'Ctrl+Shift+H',
  fontFamily: 'Ctrl+Shift+F',
  
  // Configuración
  invisibleCharacters: 'Ctrl+Shift+I',
  placeholder: 'Ctrl+Alt+P',
  tableOfContents: 'Ctrl+Alt+T',
  typography: 'Ctrl+Alt+Y',
  focus: 'Ctrl+Shift+F',
  
  // Otros
  save: 'Ctrl+S',
  hardBreak: 'Shift+Enter',
};

const EditorToolbar: React.FC<EditorToolbarProps> = ({ 
  editor, 
  onSave, 
  canSave = true, 
  onShare, 
  canShare = false,
  isCollaborating = false,
  documentPermission = 'editor',
  onImport,
  onExport,
  onToggleWordCount,
  showWordCount = true
}) => {
  const [activeTab, setActiveTab] = useState("archivo");

  // Effect para remover atributos title de todos los botones dentro del toolbar
  useEffect(() => {
    const toolbar = document.querySelector('.editor-toolbar-container');
    if (toolbar) {
      const elementsWithTitle = toolbar.querySelectorAll('[title]');
      elementsWithTitle.forEach(element => {
        element.removeAttribute('title');
      });
    }
  }, [activeTab]); // Re-ejecutar cuando cambie de pestaña

  if (!editor) return null;

  // Componente para tooltip con atajo de teclado
  const ToolbarTooltip: React.FC<{
    children: React.ReactNode;
    content: string;
    shortcut?: string;
  }> = ({ children, content, shortcut }) => (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild className="toolbar-tooltip-trigger">
        <div className="inline-flex" onMouseDown={(e) => e.preventDefault()}>
          {children}
        </div>
      </TooltipTrigger>
      <TooltipContent 
        side="bottom" 
        align="center"
        sideOffset={2}
        alignOffset={0}
        className="z-[9998] max-w-xs px-2 py-1 text-xs toolbar-tooltip-content"
      >
        <div className="flex flex-col gap-0.5">
          <p className="font-medium text-xs">{content}</p>
          {shortcut && (
            <p className="text-[10px] text-muted-foreground">
              <kbd className="px-1 py-0.5 text-[10px] bg-muted rounded border">{shortcut}</kbd>
            </p>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );

  return (
    <div className="editor-toolbar-container" onMouseDown={(e) => e.preventDefault()}>
      <TooltipProvider delayDuration={200} skipDelayDuration={50}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="editor-tabs-list h-9 w-full bg-muted/50 p-0 gap-0 flex">
            <TabsTrigger value="archivo" className="editor-tabs-trigger flex items-center gap-1 justify-center data-[state=active]:bg-background flex-1 min-w-0 px-2">
              <FileText className="h-3 w-3 flex-shrink-0" />
              <span className="text-xs font-medium truncate">Archivo</span>
            </TabsTrigger>
            <TabsTrigger value="formato" className="editor-tabs-trigger flex items-center gap-1 justify-center data-[state=active]:bg-background flex-1 min-w-0 px-2">
              <Type className="h-3 w-3 flex-shrink-0" />
              <span className="text-xs font-medium truncate">Formato</span>
            </TabsTrigger>
            <TabsTrigger value="estructura" className="editor-tabs-trigger flex items-center gap-1 justify-center data-[state=active]:bg-background flex-1 min-w-0 px-2">
              <Layout className="h-3 w-3 flex-shrink-0" />
              <span className="text-xs font-medium truncate">Estructura</span>
            </TabsTrigger>
            <TabsTrigger value="insertar" className="editor-tabs-trigger flex items-center gap-1 justify-center data-[state=active]:bg-background flex-1 min-w-0 px-2">
              <Grid3X3 className="h-3 w-3 flex-shrink-0" />
              <span className="text-xs font-medium truncate">Insertar</span>
            </TabsTrigger>
            <TabsTrigger value="avanzado" className="editor-tabs-trigger flex items-center gap-1 justify-center data-[state=active]:bg-background flex-1 min-w-0 px-2">
              <Settings className="h-3 w-3 flex-shrink-0" />
              <span className="text-xs font-medium truncate">Avanzado</span>
            </TabsTrigger>
            <TabsTrigger value="colaboracion" className="editor-tabs-trigger flex items-center gap-1 justify-center data-[state=active]:bg-background flex-1 min-w-0 px-2">
              <Zap className="h-3 w-3 flex-shrink-0" />
              <span className="text-xs font-medium truncate">Colaboración</span>
            </TabsTrigger>
          </TabsList>

          {/* PESTAÑA ARCHIVO */}
          <TabsContent value="archivo" className="editor-tabs-content">
            <div className="flex items-center gap-1">
              <span className="text-xs font-medium text-muted-foreground mr-1">Historial:</span>
              <ToolbarTooltip content="Deshacer última acción" shortcut={KEYBOARD_SHORTCUTS.undo}>
                <UndoButton editor={editor} />
              </ToolbarTooltip>
              <ToolbarTooltip content="Rehacer última acción" shortcut={KEYBOARD_SHORTCUTS.redo}>
                <RedoButton editor={editor} />
              </ToolbarTooltip>
              
              <Separator orientation="vertical" className="h-4 mx-1" />
              
              <span className="text-xs font-medium text-muted-foreground mr-1">Documento:</span>
              {onSave && (
                <ToolbarTooltip content="Guardar documento" shortcut={KEYBOARD_SHORTCUTS.save}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onSave}
                    disabled={!canSave}
                    className="h-6 w-6 p-0"
                  >
                    <PanelBottomClose className="h-3 w-3" />
                  </Button>
                </ToolbarTooltip>
              )}
              
              {/* Dropdown de exportar */}
              {onExport && (
                <DropdownMenu>
                  <ToolbarTooltip content="Exportar documento" shortcut="Ctrl+E">
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                  </ToolbarTooltip>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onExport('pdf')}>
                      <FileText className="h-4 w-4 mr-2" />
                      PDF (.pdf)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onExport('docx')}>
                      <FileText className="h-4 w-4 mr-2" />
                      Word (.docx)
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onExport('html')}>
                      <Globe className="h-4 w-4 mr-2" />
                      HTML (.html)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onExport('markdown')}>
                      <Hash className="h-4 w-4 mr-2" />
                      Markdown (.md)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onExport('txt')}>
                      <FileText className="h-4 w-4 mr-2" />
                      Texto (.txt)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              
              {/* Botón de importar */}
              {onImport && (
                <ToolbarTooltip content="Importar documento" shortcut="Ctrl+I">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onImport}
                    className="h-6 w-6 p-0"
                  >
                    <Upload className="h-3 w-3" />
                  </Button>
                </ToolbarTooltip>
              )}
              
              {onShare && canShare && (
                <ToolbarTooltip content="Compartir documento" shortcut="Ctrl+Shift+S">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onShare}
                    className="h-6 w-6 p-0"
                  >
                    <Share2 className="h-3 w-3" />
                  </Button>
                </ToolbarTooltip>
              )}
              
              <Separator orientation="vertical" className="h-4 mx-1" />
              
              <span className="text-xs font-medium text-muted-foreground mr-1">Vista:</span>
              {onToggleWordCount && (
                <ToolbarTooltip content="Alternar estadísticas" shortcut="Ctrl+Shift+W">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onToggleWordCount}
                    className={`h-6 w-6 p-0 ${showWordCount ? 'bg-muted' : ''}`}
                  >
                    <Calculator className="h-3 w-3" />
                  </Button>
                </ToolbarTooltip>
              )}
              <ToolbarTooltip content="Modo de enfoque" shortcut="Ctrl+Shift+F">
                <FocusButton editor={editor} />
              </ToolbarTooltip>
              
              {isCollaborating && (
                <>
                  <Separator orientation="vertical" className="h-4 mx-1" />
                  <span className="text-xs font-medium text-muted-foreground">
                    Colaboración • {documentPermission}
                  </span>
                  <div className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                </>
              )}
            </div>
          </TabsContent>

          {/* PESTAÑA FORMATO */}
          <TabsContent value="formato" className="editor-tabs-content">
            <div className="flex items-center gap-1">
              <span className="text-xs font-medium text-muted-foreground mr-1">Texto:</span>
              <ToolbarTooltip content="Texto en negrita" shortcut={KEYBOARD_SHORTCUTS.bold}>
                <BoldButton editor={editor} variant="toggle" />
              </ToolbarTooltip>
              <ToolbarTooltip content="Texto en cursiva" shortcut={KEYBOARD_SHORTCUTS.italic}>
                <ItalicButton editor={editor} variant="toggle" />
              </ToolbarTooltip>
              <ToolbarTooltip content="Texto subrayado" shortcut={KEYBOARD_SHORTCUTS.underline}>
                <UnderlineButton editor={editor} variant="toggle" />
              </ToolbarTooltip>
              <ToolbarTooltip content="Texto tachado" shortcut={KEYBOARD_SHORTCUTS.strikethrough}>
                <StrikeButton editor={editor} variant="toggle" />
              </ToolbarTooltip>
              <ToolbarTooltip content="Código en línea" shortcut={KEYBOARD_SHORTCUTS.code}>
                <CodeButton editor={editor} variant="toggle" />
              </ToolbarTooltip>
              
              <Separator orientation="vertical" className="h-4 mx-1" />
              
              <span className="text-xs font-medium text-muted-foreground mr-1">Color:</span>
              <ToolbarTooltip content="Color del texto" shortcut={KEYBOARD_SHORTCUTS.color}>
                <ColorButton editor={editor} />
              </ToolbarTooltip>
              <ToolbarTooltip content="Resaltar texto" shortcut={KEYBOARD_SHORTCUTS.highlight}>
                <HighlightButton editor={editor} variant="dropdown" />
              </ToolbarTooltip>
              
              <Separator orientation="vertical" className="h-4 mx-1" />
              
              <span className="text-xs font-medium text-muted-foreground mr-1">Fuente:</span>
              <ToolbarTooltip content="Familia de fuente" shortcut={KEYBOARD_SHORTCUTS.fontFamily}>
                <FontFamilyButton editor={editor} />
              </ToolbarTooltip>
              
              <Separator orientation="vertical" className="h-4 mx-1" />
              
              <span className="text-xs font-medium text-muted-foreground mr-1">Alineación:</span>
              <ToolbarTooltip content="Alineación de texto" shortcut="Ctrl+Shift+L/E/R/J">
                <TextAlignButton editor={editor} />
              </ToolbarTooltip>
          <ToolbarTooltip 
            content="Tipografía inteligente"
            shortcut={KEYBOARD_SHORTCUTS.typography}
          >
            <TypographyButton editor={editor} />
          </ToolbarTooltip>
            </div>
          </TabsContent>

          {/* PESTAÑA ESTRUCTURA */}
          <TabsContent value="estructura" className="editor-tabs-content">
            <div className="flex items-center gap-1">
              <span className="text-xs font-medium text-muted-foreground mr-1">Párrafos:</span>
              <ToolbarTooltip content="Párrafo normal" shortcut={KEYBOARD_SHORTCUTS.paragraph}>
                <ParagraphButton editor={editor} />
              </ToolbarTooltip>
              <ToolbarTooltip content="Encabezados" shortcut="Ctrl+Alt+1-6">
                <HeadingButton editor={editor} variant="dropdown" />
              </ToolbarTooltip>
              <ToolbarTooltip content="Encabezado 1" shortcut={KEYBOARD_SHORTCUTS.heading1}>
                <HeadingButton editor={editor} variant="button" level={1} />
              </ToolbarTooltip>
              <ToolbarTooltip content="Encabezado 2" shortcut={KEYBOARD_SHORTCUTS.heading2}>
                <HeadingButton editor={editor} variant="button" level={2} />
              </ToolbarTooltip>
              <ToolbarTooltip content="Encabezado 3" shortcut={KEYBOARD_SHORTCUTS.heading3}>
                <HeadingButton editor={editor} variant="button" level={3} />
              </ToolbarTooltip>
              <ToolbarTooltip content="Encabezado 4" shortcut={KEYBOARD_SHORTCUTS.heading4}>
                <HeadingButton editor={editor} variant="button" level={4} />
              </ToolbarTooltip>
              <ToolbarTooltip content="Encabezado 5" shortcut={KEYBOARD_SHORTCUTS.heading5}>
                <HeadingButton editor={editor} variant="button" level={5} />
              </ToolbarTooltip>
              <ToolbarTooltip content="Encabezado 6" shortcut={KEYBOARD_SHORTCUTS.heading6}>
                <HeadingButton editor={editor} variant="button" level={6} />
              </ToolbarTooltip>
              
              <Separator orientation="vertical" className="h-4 mx-1" />
              
              <span className="text-xs font-medium text-muted-foreground mr-1">Listas:</span>
              <ToolbarTooltip content="Lista con viñetas" shortcut={KEYBOARD_SHORTCUTS.bulletList}>
                <BulletListButton editor={editor} />
              </ToolbarTooltip>
              <ToolbarTooltip content="Lista numerada" shortcut={KEYBOARD_SHORTCUTS.orderedList}>
                <OrderedListButton editor={editor} variant="toggle" />
              </ToolbarTooltip>
              <ToolbarTooltip content="Lista de tareas" shortcut={KEYBOARD_SHORTCUTS.taskList}>
                <TaskListButton editor={editor} variant="toggle" />
              </ToolbarTooltip>
              <ToolbarTooltip content="Elemento de lista" shortcut="Tab / Shift+Tab">
                <ListItemButton editor={editor} variant="dropdown" />
              </ToolbarTooltip>
              
              <Separator orientation="vertical" className="h-4 mx-1" />
              
              <span className="text-xs font-medium text-muted-foreground mr-1">Bloques:</span>
              <ToolbarTooltip content="Cita en bloque" shortcut={KEYBOARD_SHORTCUTS.blockquote}>
                <BlockquoteButton editor={editor} />
              </ToolbarTooltip>
              <ToolbarTooltip content="Bloque de código" shortcut={KEYBOARD_SHORTCUTS.codeBlock}>
                <CodeBlockButton editor={editor} />
              </ToolbarTooltip>
              <ToolbarTooltip content="Código con sintaxis" shortcut={KEYBOARD_SHORTCUTS.codeBlockLowlight}>
                <CodeBlockLowlightButton editor={editor} variant="dropdown" />
              </ToolbarTooltip>
              <ToolbarTooltip content="Detalles desplegables" shortcut={KEYBOARD_SHORTCUTS.details}>
                <DetailsButton editor={editor} />
              </ToolbarTooltip>
              <ToolbarTooltip content="Resumen de detalles" shortcut={KEYBOARD_SHORTCUTS.detailsSummary}>
                <DetailsSummaryButton editor={editor} />
              </ToolbarTooltip>
              <ToolbarTooltip content="Contenido de detalles" shortcut="Contenido desplegable">
                <DetailsContentButton editor={editor} />
              </ToolbarTooltip>
              
              <Separator orientation="vertical" className="h-4 mx-1" />
              
              <span className="text-xs font-medium text-muted-foreground mr-1">Separadores:</span>
              <ToolbarTooltip content="Línea horizontal" shortcut={KEYBOARD_SHORTCUTS.horizontalRule}>
                <HorizontalRuleButton editor={editor} />
              </ToolbarTooltip>
              <ToolbarTooltip content="Salto de línea" shortcut={KEYBOARD_SHORTCUTS.hardBreak}>
                <HardBreakButton editor={editor} />
              </ToolbarTooltip>
            </div>
          </TabsContent>

          {/* PESTAÑA INSERTAR */}
          <TabsContent value="insertar" className="editor-tabs-content">
            <div className="flex items-center gap-1">
              <span className="text-xs font-medium text-muted-foreground mr-1">Enlaces:</span>
              <ToolbarTooltip content="Insertar enlace" shortcut={KEYBOARD_SHORTCUTS.link}>
                <LinkButton editor={editor} variant="dropdown" />
              </ToolbarTooltip>
              
              <Separator orientation="vertical" className="h-4 mx-1" />
              
              <span className="text-xs font-medium text-muted-foreground mr-1">Medios:</span>
              <ToolbarTooltip content="Insertar imagen" shortcut={KEYBOARD_SHORTCUTS.image}>
                <ImageButton editor={editor} variant="dropdown" />
              </ToolbarTooltip>
              <ToolbarTooltip content="Arrastrar archivos" shortcut="Arrastrar y soltar">
                <FileHandlerButton editor={editor} />
              </ToolbarTooltip>
              <ToolbarTooltip content="Video de YouTube" shortcut={KEYBOARD_SHORTCUTS.youtube}>
                <YoutubeButton editor={editor} variant="dropdown" />
              </ToolbarTooltip>
              
              <Separator orientation="vertical" className="h-4 mx-1" />
              
              <span className="text-xs font-medium text-muted-foreground mr-1">Tablas:</span>
              <ToolbarTooltip content="Insertar tabla" shortcut={KEYBOARD_SHORTCUTS.table}>
                <TableButton editor={editor} />
              </ToolbarTooltip>
              <ToolbarTooltip content="Encabezado de tabla" shortcut="Encabezado">
                <TableHeaderButton editor={editor} />
              </ToolbarTooltip>
              <ToolbarTooltip content="Fila de tabla" shortcut="Ctrl+Enter">
                <TableRowButton editor={editor} />
              </ToolbarTooltip>
              <ToolbarTooltip content="Celda de tabla" shortcut="Configurar celda">
                <TableCellButton editor={editor} />
              </ToolbarTooltip>
              
              <Separator orientation="vertical" className="h-4 mx-1" />
              
              <span className="text-xs font-medium text-muted-foreground mr-1">Especial:</span>
              <ToolbarTooltip content="Insertar emoji" shortcut={KEYBOARD_SHORTCUTS.emoji}>
                <EmojiButton editor={editor} variant="dropdown" />
              </ToolbarTooltip>
              <ToolbarTooltip content="Mencionar usuario" shortcut={KEYBOARD_SHORTCUTS.mention}>
                <MentionButton editor={editor} />
              </ToolbarTooltip>
              <ToolbarTooltip content="Fórmulas matemáticas" shortcut={KEYBOARD_SHORTCUTS.mathematics}>
                <MathematicsButton editor={editor} />
              </ToolbarTooltip>
              <ToolbarTooltip content="Tabla de contenidos" shortcut={KEYBOARD_SHORTCUTS.tableOfContents}>
                <TableOfContentsButton editor={editor} />
              </ToolbarTooltip>
            </div>
          </TabsContent>

          {/* PESTAÑA AVANZADO */}
          <TabsContent value="avanzado" className="editor-tabs-content">
            <div className="flex items-center gap-1">
              <span className="text-xs font-medium text-muted-foreground mr-1">Scripts:</span>
              <ToolbarTooltip content="Subíndice" shortcut={KEYBOARD_SHORTCUTS.subscript}>
                <SubscriptButton editor={editor} variant="toggle" />
              </ToolbarTooltip>
              <ToolbarTooltip content="Superíndice" shortcut={KEYBOARD_SHORTCUTS.superscript}>
                <SuperscriptButton editor={editor} variant="toggle" />
              </ToolbarTooltip>
              
              <Separator orientation="vertical" className="h-4 mx-1" />
              
              <span className="text-xs font-medium text-muted-foreground mr-1">Configuración:</span>
              <ToolbarTooltip content="Caracteres invisibles" shortcut={KEYBOARD_SHORTCUTS.invisibleCharacters}>
                <InvisibleCharactersButton editor={editor} />
              </ToolbarTooltip>
              <ToolbarTooltip content="Configurar placeholder" shortcut={KEYBOARD_SHORTCUTS.placeholder}>
                <PlaceholderButton editor={editor} />
              </ToolbarTooltip>
              <ToolbarTooltip content="Tipografía inteligente" shortcut={KEYBOARD_SHORTCUTS.typography}>
                <TypographyButton editor={editor} />
              </ToolbarTooltip>
              <ToolbarTooltip content="Modo de enfoque" shortcut={KEYBOARD_SHORTCUTS.focus}>
                <FocusButton editor={editor} />
              </ToolbarTooltip>
            </div>
          </TabsContent>

          {/* PESTAÑA COLABORACIÓN */}
          <TabsContent value="colaboracion" className="editor-tabs-content">
            <div className="flex items-center gap-1">
              <span className="text-xs font-medium text-muted-foreground mr-1">Documentos:</span>
              <ToolbarTooltip content="Gestión de documentos" shortcut="Vincular documentos">
                <DocumentButton editor={editor} />
              </ToolbarTooltip>
              
              <Separator orientation="vertical" className="h-4 mx-1" />
              
              <span className="text-xs font-medium text-muted-foreground mr-1">Menciones:</span>
              <ToolbarTooltip content="Mencionar usuario" shortcut={KEYBOARD_SHORTCUTS.mention}>
                <MentionButton editor={editor} />
              </ToolbarTooltip>
              
              <Separator orientation="vertical" className="h-4 mx-1" />
              
              <span className="text-xs font-medium text-muted-foreground mr-1">Herramientas:</span>
              <ToolbarTooltip content="Arrastrar archivos" shortcut="Drag & Drop">
                <FileHandlerButton editor={editor} />
              </ToolbarTooltip>
            </div>
          </TabsContent>
        </Tabs>
      </TooltipProvider>
    </div>
  );
};

export default EditorToolbar;
