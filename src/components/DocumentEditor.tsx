import { useEditor, EditorContent, Extension } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import ResizableImage from './editor/ResizableImage';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import History from '@tiptap/extension-history';
import Mention from '@tiptap/extension-mention';
import Details from '@tiptap/extension-details';
import DetailsContent from '@tiptap/extension-details-content';
import DetailsSummary from '@tiptap/extension-details-summary';
import Emoji, { gitHubEmojis } from '@tiptap/extension-emoji';
import Document from '@tiptap/extension-document';
import Heading from '@tiptap/extension-heading';
import ResizableYoutube from './editor/ResizableYoutube';
import Bold from '@tiptap/extension-bold';
import Code from '@tiptap/extension-code';
import Italic from '@tiptap/extension-italic';
import Strike from '@tiptap/extension-strike';
import TextStyle from '@tiptap/extension-text-style';
import Blockquote from '@tiptap/extension-blockquote';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';

import suggestion from '../lib/mentions/suggestion';
import tagSuggestion from '../lib/mentions/tagSuggestion';
import { common, createLowlight } from 'lowlight';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import 'highlight.js/styles/github-dark.css';
import 'katex/dist/katex.min.css';
import EditorToolbar from './EditorToolbar';
import BubbleMenu from '@tiptap/extension-bubble-menu';
import CharacterCount from '@tiptap/extension-character-count';
import Color from '@tiptap/extension-color';
import Dropcursor from '@tiptap/extension-dropcursor';
import FloatingMenu from '@tiptap/extension-floating-menu';
import Focus from '@tiptap/extension-focus';
import FontFamily from '@tiptap/extension-font-family';
import Gapcursor from '@tiptap/extension-gapcursor';
import InvisibleCharacters from '@tiptap/extension-invisible-characters';
import ListKeymap from '@tiptap/extension-list-keymap';
import Mathematics from '@tiptap/extension-mathematics';
import Placeholder from '@tiptap/extension-placeholder';
import TableOfContents, { getHierarchicalIndexes } from '@tiptap/extension-table-of-contents';
import Typography from '@tiptap/extension-typography';
import HardBreak from '@tiptap/extension-hard-break';
import DragHandle from '@tiptap/extension-drag-handle-react';
import FileHandler from '@tiptap/extension-file-handler';
import { FontSize } from '../lib/extensions/FontSize';
import BubbleMenuComponent from './editor/BubbleMenuComponent';
import FloatingMenuComponent from './editor/FloatingMenuComponent';
import { CodeBlockLanguages } from './editor/CodeBlockLanguages';
import { ErrorBoundary } from './editor/ErrorBoundary';
import LinkEditor from './editor/LinkEditor';
import './editor/link.css';
import './editor/code-block.css';
import { CharacterCountDisplay } from './editor';
import { Keyboard } from 'lucide-react';
import { PanelBottomOpen, PanelBottomClose, Upload, Download, FileText, Image as ImageIcon, FileType } from 'lucide-react';
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';
import Canvas from '../lib/extensions/Canvas';
import { ColorHighlighter } from '../lib/extensions/ColorHighlighter';
import { SmilieReplacer } from '../lib/extensions/SmilieReplacer';
import React, { useImperativeHandle, forwardRef } from 'react';

import DragHandleWrapper from './editor/DragHandleWrapper';

// Create a lowlight instance with the languages we want to use
const lowlight = createLowlight(common);
lowlight.register('javascript', javascript);
lowlight.register('typescript', typescript);
lowlight.register('python', python);

// Custom extension for keyboard shortcuts
const CustomKeyboardShortcuts = Extension.create({
  name: 'customKeyboardShortcuts',

  addKeyboardShortcuts() {
    return {
      'Mod-b': () => this.editor.commands.toggleBold(),
      'Mod-i': () => this.editor.commands.toggleItalic(),
      'Mod-u': () => this.editor.commands.toggleUnderline(),
      'Mod-Shift-x': () => this.editor.commands.toggleStrike(),
      'Mod-e': () => this.editor.commands.toggleCode(),
      'Mod-,': () => this.editor.commands.toggleSubscript(),
      'Mod-.': () => this.editor.commands.toggleSuperscript(),
      'Mod-k': () => {
        const previousUrl = this.editor.getAttributes('link').href;
        const url = window.prompt('URL:', previousUrl);

        if (url === null) return false;

        if (url === '') {
          this.editor.chain().focus().extendMarkRange('link').unsetLink().run();
          return true;
        }

        this.editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
        return true;
      },
      'Mod-Alt-0': () => this.editor.commands.setParagraph(),
      'Mod-Alt-1': () => this.editor.commands.toggleHeading({ level: 1 }),
      'Mod-Alt-2': () => this.editor.commands.toggleHeading({ level: 2 }),
      'Mod-Alt-3': () => this.editor.commands.toggleHeading({ level: 3 }),
      'Mod-Shift-8': () => this.editor.commands.toggleBulletList(),
      'Mod-Shift-9': () => this.editor.commands.toggleOrderedList(),
      'Mod-Shift-t': () => this.editor.commands.toggleTaskList(),
      'Tab': () => {
        if (this.editor.isActive('taskItem')) {
          return this.editor.commands.sinkListItem('taskItem');
        }
        return false;
      },
      'Shift-Tab': () => {
        if (this.editor.isActive('taskItem')) {
          return this.editor.commands.liftListItem('taskItem');
        }
        return false;
      },
      'Enter': () => {
        if (this.editor.isActive('taskItem')) {
          return this.editor.commands.splitListItem('taskItem');
        }
        return false;
      },
      'Mod-Shift-b': () => this.editor.commands.toggleBlockquote(),
      'Mod-Shift-c': () => this.editor.commands.toggleCodeBlock(),
      'Mod-Alt-d': () => this.editor.commands.setDetails(),
      'Mod-Shift-s': () => {
        if (this.editor.isActive('details')) {
          return this.editor.commands.setNode('detailsSummary');
        }
        return false;
      },
    };
  },
});

interface DocumentEditorProps {
  content: string;
  onUpdate: (content: string) => void;
  documentTitle?: string;
  documentId?: string; // Añadir esta nueva prop
  readOnly?: boolean; // <-- nuevo prop
}

const DocumentEditor = forwardRef(({ 
  content, 
  onUpdate, 
  documentTitle = 'documento', 
  documentId, 
  readOnly
}: DocumentEditorProps, ref) => {
  const [showWordCount, setShowWordCount] = useState(true);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Función mejorada para importar documentos Word con soporte completo
  const handleWordImport = async (file: File) => {
    try {
      // Importar mammoth dinámicamente
      const mammoth = await import('mammoth');
      
      const arrayBuffer = await file.arrayBuffer();
      
      // Opciones mejoradas para mammoth con soporte para estilos y imágenes
      const options = {
        convertImage: mammoth.images.imgElement(function(image) {
          return image.read("base64").then(function(imageBuffer) {
            return {
              src: "data:" + image.contentType + ";base64," + imageBuffer
            };
          });
        }),
        styleMap: [
          // Mapeo de estilos de Word a HTML/CSS
          "p[style-name='Heading 1'] => h1:fresh",
          "p[style-name='Heading 2'] => h2:fresh", 
          "p[style-name='Heading 3'] => h3:fresh",
          "p[style-name='Heading 4'] => h4:fresh",
          "p[style-name='Heading 5'] => h5:fresh",
          "p[style-name='Heading 6'] => h6:fresh",
          "p[style-name='Title'] => h1.title:fresh",
          "p[style-name='Subtitle'] => h2.subtitle:fresh",
          "p[style-name='Quote'] => blockquote:fresh",
          "p[style-name='Intense Quote'] => blockquote.intense:fresh",
          "p[style-name='List Paragraph'] => p.list-paragraph:fresh",
          "r[style-name='Strong'] => strong",
          "r[style-name='Emphasis'] => em",
          "r[style-name='Intense Emphasis'] => strong > em",
          "r[style-name='Subtle Emphasis'] => em.subtle",
          "table => table.word-table",
          "tr => tr",
          "td => td",
          "th => th",
          // Preservar colores y formato
          "r[style-name='Highlight'] => mark",
          "r[color='FF0000'] => span.text-red",
          "r[color='0000FF'] => span.text-blue",
          "r[color='00FF00'] => span.text-green",
        ],
        includeDefaultStyleMap: true,
        preserveEmptyParagraphs: false,
        ignoreEmptyParagraphs: false,
        includeEmbeddedStyleMap: true
      };
      
      const result = await mammoth.convertToHtml({ arrayBuffer }, options);
      
      if (result.value) {
        // Procesar el HTML para mejorar la compatibilidad con TipTap
        const processedHtml = processWordHTML(result.value);
        
        editor?.commands.setContent(processedHtml);
        toast({
          title: "Documento Word importado",
          description: `Se importó correctamente ${file.name}${result.messages.length > 0 ? ` con ${result.messages.length} advertencia(s)` : ''}`,
        });
        
        // Mostrar advertencias si las hay
        if (result.messages.length > 0) {
          console.log('Advertencias de importación:', result.messages);
        }
      } else {
        throw new Error('No se pudo extraer contenido del documento');
      }
    } catch (error) {
      console.error('Error al importar Word:', error);
      toast({
        title: "Error al importar",
        description: "No se pudo importar el documento Word. Verifique que el archivo no esté corrupto.",
        variant: "destructive",
      });
    }
  };

  // Función para procesar HTML de Word y hacerlo compatible con TipTap
  const processWordHTML = (html: string): string => {
    let processedHtml = html;
    
    // Limpiar estilos innecesarios de Word
    processedHtml = processedHtml.replace(/style="[^"]*"/g, '');
    processedHtml = processedHtml.replace(/class="[^"]*"/g, '');
    
    // Convertir tablas de Word a formato TipTap
    processedHtml = processedHtml.replace(/<table[^>]*>/g, '<table>');
    processedHtml = processedHtml.replace(/<td[^>]*>/g, '<td>');
    processedHtml = processedHtml.replace(/<th[^>]*>/g, '<th>');
    processedHtml = processedHtml.replace(/<tr[^>]*>/g, '<tr>');
    
    // Convertir listas anidadas
    processedHtml = processedHtml.replace(/<p class="list-paragraph">([^<]*)<\/p>/g, '<li>$1</li>');
    
    // Agrupar elementos de lista consecutivos
    processedHtml = processedHtml.replace(/(<li>.*?<\/li>\s*)+/gs, (match) => {
      return `<ul>${match}</ul>`;
    });
    
    // Preservar imágenes base64
    processedHtml = processedHtml.replace(/<img([^>]*src="data:image[^"]*"[^>]*)>/g, '<img$1 style="max-width: 100%; height: auto;">');
    
    // Convertir spans con colores a marcas de resaltado
    processedHtml = processedHtml.replace(/<span class="text-red">(.*?)<\/span>/g, '<mark style="background-color: #ffebee; color: #c62828;">$1</mark>');
    processedHtml = processedHtml.replace(/<span class="text-blue">(.*?)<\/span>/g, '<mark style="background-color: #e3f2fd; color: #1565c0;">$1</mark>');
    processedHtml = processedHtml.replace(/<span class="text-green">(.*?)<\/span>/g, '<mark style="background-color: #e8f5e8; color: #2e7d32;">$1</mark>');
    
    // Limpiar párrafos vacíos
    processedHtml = processedHtml.replace(/<p>\s*<\/p>/g, '');
    processedHtml = processedHtml.replace(/<p><br[^>]*><\/p>/g, '');
    
    return processedHtml;
  };

  // Función para convertir Markdown básico a HTML
  const convertMarkdownToHTML = (markdown: string): string => {
    let html = markdown;
    
    // Encabezados
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    
    // Negrita
    html = html.replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>');
    html = html.replace(/__(.*?)__/gim, '<strong>$1</strong>');
    
    // Cursiva
    html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');
    html = html.replace(/_(.*?)_/gim, '<em>$1</em>');
    
    // Código en línea
    html = html.replace(/`(.*?)`/gim, '<code>$1</code>');
    
    // Bloques de código
    html = html.replace(/```([\s\S]*?)```/gim, '<pre><code>$1</code></pre>');
    
    // Enlaces
    html = html.replace(/\[([^\]]*)\]\(([^)]*)\)/gim, '<a href="$2">$1</a>');
    
    // Listas con viñetas
    html = html.replace(/^\* (.+)$/gim, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    
    // Listas numeradas
    html = html.replace(/^\d+\. (.+)$/gim, '<li>$1</li>');
    
    // Párrafos
    html = html.replace(/\n\n/gim, '</p><p>');
    html = `<p>${html}</p>`;
    
    return html;
  };

  // Función básica para convertir HTML a Markdown
  const convertHTMLToMarkdown = (html: string): string => {
    let markdown = html;
    
    // Manejar canvas de dibujo
    markdown = markdown.replace(/<div[^>]*data-type="canvas"[^>]*>.*?<\/div>/gims, (match) => {
      const linesMatch = match.match(/data-lines="([^"]*)"/)
      if (linesMatch) {
        try {
          const lines = JSON.parse(linesMatch[1].replace(/&quot;/g, '"'))
          if (lines.length > 0) {
            return `\n[Dibujo canvas con ${lines.length} trazo(s)]\n\n`
          }
        } catch (e) {
          // Si hay error parseando, mostrar placeholder
        }
      }
      return '\n[Canvas de dibujo]\n\n'
    })
    
    markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gim, '# $1\n\n');
    markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gim, '## $1\n\n');
    markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gim, '### $1\n\n');
    
    markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/gim, '**$1**');
    markdown = markdown.replace(/<b[^>]*>(.*?)<\/b>/gim, '**$1**');
    markdown = markdown.replace(/<em[^>]*>(.*?)<\/em>/gim, '*$1*');
    markdown = markdown.replace(/<i[^>]*>(.*?)<\/i>/gim, '*$1*');
    
    markdown = markdown.replace(/<code[^>]*>(.*?)<\/code>/gim, '`$1`');
    markdown = markdown.replace(/<pre[^>]*><code[^>]*>(.*?)<\/code><\/pre>/gims, '```\n$1\n```\n');
    
    markdown = markdown.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gim, '[$2]($1)');
    
    markdown = markdown.replace(/<ul[^>]*>(.*?)<\/ul>/gims, (match, content) => {
      return content.replace(/<li[^>]*>(.*?)<\/li>/gim, '* $1\n');
    });
    
    markdown = markdown.replace(/<p[^>]*>(.*?)<\/p>/gim, '$1\n\n');
    
    markdown = markdown.replace(/<[^>]*>/gim, '');
    markdown = markdown.replace(/\n{3,}/gim, '\n\n');
    
    return markdown.trim();
  };

  // Función avanzada para convertir HTML a Markdown con soporte completo
  const convertHTMLToAdvancedMarkdown = (html: string): string => {
    let markdown = html;
    
    // Manejar canvas de dibujo
    markdown = markdown.replace(/<div[^>]*data-type="canvas"[^>]*>.*?<\/div>/gims, (match) => {
      const linesMatch = match.match(/data-lines="([^"]*)"/)
      if (linesMatch) {
        try {
          const lines = JSON.parse(linesMatch[1].replace(/&quot;/g, '"'))
          if (lines.length > 0) {
            return `\n![Dibujo canvas con ${lines.length} trazo(s)]\n\n`
          }
        } catch (e) {
          // Si hay error parseando, mostrar placeholder
        }
      }
      return '\n![Canvas de dibujo]\n\n'
    });
    
    // Manejar videos de YouTube
    markdown = markdown.replace(/<iframe[^>]*src="[^"]*youtube[^"]*"[^>]*>.*?<\/iframe>/gims, (match) => {
      const srcMatch = match.match(/src="([^"]*)"/)
      if (srcMatch) {
        const url = srcMatch[1].replace(/embed\//, 'watch?v=').replace(/\?.*$/, '')
        return `\n[![Video de YouTube](https://img.youtube.com/vi/${url.split('v=')[1]}/maxresdefault.jpg)](${url})\n\n`
      }
      return '\n[Video de YouTube]\n\n'
    });
    
    // Tablas mejoradas
    markdown = markdown.replace(/<table[^>]*>(.*?)<\/table>/gims, (match, tableContent) => {
      let tableMarkdown = '\n';
      
      // Extraer filas
      const rowMatches = tableContent.match(/<tr[^>]*>(.*?)<\/tr>/gims);
      if (rowMatches) {
        rowMatches.forEach((row, index) => {
          const cellMatches = row.match(/<t[hd][^>]*>(.*?)<\/t[hd]>/gims);
          if (cellMatches) {
            const cells = cellMatches.map(cell => 
              cell.replace(/<t[hd][^>]*>(.*?)<\/t[hd]>/gi, '$1').trim()
            );
            tableMarkdown += `| ${cells.join(' | ')} |\n`;
            
            // Agregar separador después del encabezado
            if (index === 0) {
              tableMarkdown += `| ${cells.map(() => '---').join(' | ')} |\n`;
            }
          }
        });
      }
      
      return tableMarkdown + '\n';
    });
    
    // Encabezados
    markdown = markdown.replace(/<h([1-6])[^>]*>(.*?)<\/h[1-6]>/gim, (match, level, content) => {
      const hashCount = '#'.repeat(parseInt(level));
      return `\n${hashCount} ${content.trim()}\n\n`;
    });
    
    // Listas de tareas
    markdown = markdown.replace(/<li[^>]*class="[^"]*task-item[^"]*"[^>]*>.*?<input[^>]*type="checkbox"[^>]*checked[^>]*>(.*?)<\/li>/gims, '- [x] $1\n');
    markdown = markdown.replace(/<li[^>]*class="[^"]*task-item[^"]*"[^>]*>.*?<input[^>]*type="checkbox"[^>]*>(.*?)<\/li>/gims, '- [ ] $1\n');
    
    // Listas normales
    markdown = markdown.replace(/<ul[^>]*>(.*?)<\/ul>/gims, (match, content) => {
      return content.replace(/<li[^>]*>(.*?)<\/li>/gim, '- $1\n');
    });
    
    markdown = markdown.replace(/<ol[^>]*>(.*?)<\/ol>/gims, (match, content) => {
      let counter = 1;
      return content.replace(/<li[^>]*>(.*?)<\/li>/gim, () => `${counter++}. $1\n`);
    });
    
    // Formato de texto
    markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/gim, '**$1**');
    markdown = markdown.replace(/<b[^>]*>(.*?)<\/b>/gim, '**$1**');
    markdown = markdown.replace(/<em[^>]*>(.*?)<\/em>/gim, '*$1*');
    markdown = markdown.replace(/<i[^>]*>(.*?)<\/i>/gim, '*$1*');
    markdown = markdown.replace(/<u[^>]*>(.*?)<\/u>/gim, '<u>$1</u>'); // Markdown no soporta subrayado nativamente
    markdown = markdown.replace(/<s[^>]*>(.*?)<\/s>/gim, '~~$1~~');
    
    // Código
    markdown = markdown.replace(/<code[^>]*>(.*?)<\/code>/gim, '`$1`');
    markdown = markdown.replace(/<pre[^>]*><code[^>]*>(.*?)<\/code><\/pre>/gims, '```\n$1\n```\n');
    
    // Citas
    markdown = markdown.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gims, (match, content) => {
      const lines = content.trim().split('\n');
      return lines.map(line => `> ${line.trim()}`).join('\n') + '\n\n';
    });
    
    // Enlaces
    markdown = markdown.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gim, '[$2]($1)');
    
    // Imágenes
    markdown = markdown.replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/gim, '![$2]($1)');
    markdown = markdown.replace(/<img[^>]*src="([^"]*)"[^>]*>/gim, '![]($1)');
    
    // Resaltado
    markdown = markdown.replace(/<mark[^>]*>(.*?)<\/mark>/gim, '==$1==');
    
    // Separadores horizontales
    markdown = markdown.replace(/<hr[^>]*>/gim, '\n---\n');
    
    // Detalles desplegables (usando HTML ya que Markdown no lo soporta nativamente)
    markdown = markdown.replace(/<details[^>]*>(.*?)<\/details>/gims, (match, content) => {
      return `<details>\n${content}\n</details>\n\n`;
    });
    
    // Párrafos
    markdown = markdown.replace(/<p[^>]*>(.*?)<\/p>/gim, '$1\n\n');
    
    // Limpiar HTML restante
    markdown = markdown.replace(/<[^>]*>/gim, '');
    
    // Limpiar espacios múltiples y líneas vacías excesivas
    markdown = markdown.replace(/\n{3,}/gim, '\n\n');
    markdown = markdown.replace(/[ \t]+/gim, ' ');
    
    return markdown.trim();
  };

  // Función avanzada para convertir HTML a texto plano con formato
  const convertHTMLToAdvancedText = (html: string): string => {
    let text = html;
    
    // Manejar canvas de dibujo
    text = text.replace(/<div[^>]*data-type="canvas"[^>]*>.*?<\/div>/gims, (match) => {
      const linesMatch = match.match(/data-lines="([^"]*)"/)
      if (linesMatch) {
        try {
          const lines = JSON.parse(linesMatch[1].replace(/&quot;/g, '"'))
          if (lines.length > 0) {
            return `\n[DIBUJO: Canvas con ${lines.length} trazo(s)]\n\n`
          }
        } catch (e) {
          // Si hay error parseando, mostrar placeholder
        }
      }
      return '\n[DIBUJO: Canvas]\n\n'
    });
    
    // Manejar videos de YouTube
    text = text.replace(/<iframe[^>]*src="[^"]*youtube[^"]*"[^>]*>.*?<\/iframe>/gims, (match) => {
      const srcMatch = match.match(/src="([^"]*)"/)
      if (srcMatch) {
        return `\n[VIDEO: ${srcMatch[1]}]\n\n`
      }
      return '\n[VIDEO: YouTube]\n\n'
    });
    
    // Encabezados con formato
    text = text.replace(/<h1[^>]*>(.*?)<\/h1>/gim, '\n========================================\n$1\n========================================\n\n');
    text = text.replace(/<h2[^>]*>(.*?)<\/h2>/gim, '\n\n$1\n' + '='.repeat(20) + '\n\n');
    text = text.replace(/<h3[^>]*>(.*?)<\/h3>/gim, '\n\n$1\n' + '-'.repeat(15) + '\n\n');
    text = text.replace(/<h4[^>]*>(.*?)<\/h4>/gim, '\n\n*** $1 ***\n\n');
    text = text.replace(/<h5[^>]*>(.*?)<\/h5>/gim, '\n\n** $1 **\n\n');
    text = text.replace(/<h6[^>]*>(.*?)<\/h6>/gim, '\n\n* $1 *\n\n');
    
    // Tablas
    text = text.replace(/<table[^>]*>(.*?)<\/table>/gims, (match, tableContent) => {
      let tableText = '\n[TABLA]\n';
      
      const rowMatches = tableContent.match(/<tr[^>]*>(.*?)<\/tr>/gims);
      if (rowMatches) {
        rowMatches.forEach((row, index) => {
          const cellMatches = row.match(/<t[hd][^>]*>(.*?)<\/t[hd]>/gims);
          if (cellMatches) {
            const cells = cellMatches.map(cell => 
              cell.replace(/<t[hd][^>]*>(.*?)<\/t[hd]>/gi, '$1').trim()
            );
            
            if (index === 0) {
              tableText += cells.join(' | ') + '\n';
              tableText += '-'.repeat(cells.join(' | ').length) + '\n';
            } else {
              tableText += cells.join(' | ') + '\n';
            }
          }
        });
      }
      
      return tableText + '[FIN TABLA]\n\n';
    });
    
    // Listas de tareas
    text = text.replace(/<li[^>]*class="[^"]*task-item[^"]*"[^>]*>.*?<input[^>]*type="checkbox"[^>]*checked[^>]*>(.*?)<\/li>/gims, '☑ $1\n');
    text = text.replace(/<li[^>]*class="[^"]*task-item[^"]*"[^>]*>.*?<input[^>]*type="checkbox"[^>]*>(.*?)<\/li>/gims, '☐ $1\n');
    
    // Listas
    text = text.replace(/<ul[^>]*>(.*?)<\/ul>/gims, (match, content) => {
      return content.replace(/<li[^>]*>(.*?)<\/li>/gim, '• $1\n');
    });
    
    text = text.replace(/<ol[^>]*>(.*?)<\/ol>/gims, (match, content) => {
      let counter = 1;
      return content.replace(/<li[^>]*>(.*?)<\/li>/gim, () => `${counter++}. $1\n`);
    });
    
    // Formato de texto
    text = text.replace(/<strong[^>]*>(.*?)<\/strong>/gim, '**$1**');
    text = text.replace(/<b[^>]*>(.*?)<\/b>/gim, '**$1**');
    text = text.replace(/<em[^>]*>(.*?)<\/em>/gim, '*$1*');
    text = text.replace(/<i[^>]*>(.*?)<\/i>/gim, '*$1*');
    text = text.replace(/<u[^>]*>(.*?)<\/u>/gim, '_$1_');
    text = text.replace(/<s[^>]*>(.*?)<\/s>/gim, '~$1~');
    
    // Código
    text = text.replace(/<pre[^>]*><code[^>]*>(.*?)<\/code><\/pre>/gims, '\n[CÓDIGO]\n$1\n[FIN CÓDIGO]\n\n');
    text = text.replace(/<code[^>]*>(.*?)<\/code>/gim, '`$1`');
    
    // Citas
    text = text.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gims, (match, content) => {
      const lines = content.trim().split('\n');
      return '\n"' + lines.map(line => line.trim()).join(' ') + '"\n\n';
    });
    
    // Enlaces
    text = text.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gim, '$2 ($1)');
    
    // Imágenes
    text = text.replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/gim, '[IMAGEN: $2 - $1]');
    text = text.replace(/<img[^>]*src="([^"]*)"[^>]*>/gim, '[IMAGEN: $1]');
    
    // Resaltado
    text = text.replace(/<mark[^>]*>(.*?)<\/mark>/gim, '【$1】');
    
    // Separadores horizontales
    text = text.replace(/<hr[^>]*>/gim, '\n' + '='.repeat(50) + '\n');
    
    // Detalles desplegables
    text = text.replace(/<details[^>]*>(.*?)<summary[^>]*>(.*?)<\/summary>(.*?)<\/details>/gims, '\n[DESPLEGABLE: $2]\n$3\n[FIN DESPLEGABLE]\n\n');
    
    // Párrafos y saltos de línea
    text = text.replace(/<br[^>]*>/gim, '\n');
    text = text.replace(/<p[^>]*>(.*?)<\/p>/gim, '$1\n\n');
    
    // Limpiar HTML restante
    text = text.replace(/<[^>]*>/gim, '');
    
    // Decodificar entidades HTML
    text = text.replace(/&amp;/g, '&');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    text = text.replace(/&quot;/g, '"');
    text = text.replace(/&#39;/g, "'");
    text = text.replace(/&nbsp;/g, ' ');
    
    // Limpiar espacios múltiples y líneas vacías excesivas
    text = text.replace(/\n{3,}/gim, '\n\n');
    text = text.replace(/[ \t]+/gim, ' ');
    text = text.trim();
    
    return text;
  };

  // Función para exportar contenido
  const exportContent = async (format: 'html' | 'markdown' | 'txt' | 'pdf' | 'docx') => {
    if (!editor) return;

    try {
      switch (format) {
        case 'pdf':
          await exportToPDF();
          break;
        case 'docx':
          await exportToWord();
          break;
        case 'html':
        case 'markdown':
        case 'txt':
          exportBasicFormats(format);
          break;
      }
    } catch (error) {
      toast({
        title: "Error en exportación",
        description: "No se pudo exportar el documento. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  // Función mejorada para exportar formatos básicos con soporte completo de HTML
  const exportBasicFormats = (format: 'html' | 'markdown' | 'txt') => {
    let content = '';
    let fileName = '';
    let mimeType = '';

    switch (format) {
      case 'html':
        content = generateAdvancedHTML();
        fileName = `${documentTitle}.html`;
        mimeType = 'text/html';
        break;

      case 'markdown':
        content = convertHTMLToAdvancedMarkdown(editor.getHTML());
        fileName = `${documentTitle}.md`;
        mimeType = 'text/markdown';
        break;

      case 'txt': {
        content = convertHTMLToAdvancedText(editor.getHTML());
        fileName = `${documentTitle}.txt`;
        mimeType = 'text/plain';
        break;
      }
    }

    // Crear y descargar archivo
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Archivo exportado",
      description: `Se descargó ${fileName} correctamente`,
    });
  };

  // Función para generar HTML avanzado con estilos completos
  const generateAdvancedHTML = (): string => {
    const htmlContent = editor.getHTML();
    
    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${documentTitle}</title>
    <style>
        /* Estilos base */
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif; 
            max-width: 900px; 
            margin: 0 auto; 
            padding: 2rem; 
            line-height: 1.7; 
            color: #333;
            background-color: #fff;
        }
        
        /* Encabezados */
        h1, h2, h3, h4, h5, h6 { 
            color: #2c3e50; 
            margin-top: 2rem; 
            margin-bottom: 1rem; 
            font-weight: 600; 
            line-height: 1.3;
        }
        h1 { font-size: 2.5rem; border-bottom: 3px solid #3498db; padding-bottom: 0.5rem; }
        h2 { font-size: 2rem; border-bottom: 2px solid #e74c3c; padding-bottom: 0.3rem; }
        h3 { font-size: 1.5rem; color: #8e44ad; }
        h4 { font-size: 1.25rem; color: #27ae60; }
        h5 { font-size: 1.1rem; color: #f39c12; }
        h6 { font-size: 1rem; color: #95a5a6; }
        
        /* Párrafos */
        p { margin-bottom: 1rem; text-align: justify; }
        
        /* Código */
        code { 
            background: #f8f9fa; 
            padding: 0.2em 0.4em; 
            border-radius: 4px; 
            font-family: 'SF Mono', 'Monaco', 'Cascadia Code', 'Roboto Mono', monospace;
            color: #e83e8c;
            font-size: 0.9em;
        }
        pre { 
            background: #2d3748; 
            color: #e2e8f0;
            padding: 1.5rem; 
            border-radius: 8px; 
            overflow-x: auto; 
            margin: 1.5rem 0;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        pre code { 
            background: transparent; 
            padding: 0; 
            color: inherit;
            font-size: 0.9rem;
        }
        
        /* Citas */
        blockquote { 
            border-left: 5px solid #3498db; 
            padding: 1rem 1.5rem; 
            margin: 1.5rem 0; 
            background: #f8f9fa;
            font-style: italic;
            border-radius: 0 8px 8px 0;
            position: relative;
        }
        blockquote::before {
            content: '"';
            font-size: 4rem;
            color: #bdc3c7;
            position: absolute;
            left: 10px;
            top: -10px;
            font-family: Georgia, serif;
        }
        
        /* Tablas */
        table { 
            border-collapse: collapse; 
            width: 100%; 
            margin: 1.5rem 0;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            border-radius: 8px;
            overflow: hidden;
        }
        th, td { 
            border: 1px solid #e9ecef; 
            padding: 0.75rem 1rem; 
            text-align: left; 
        }
        th { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 0.85rem;
            letter-spacing: 0.5px;
        }
        tbody tr:nth-child(even) { background-color: #f8f9fa; }
        tbody tr:hover { background-color: #e3f2fd; transition: background-color 0.2s; }
        
        /* Listas */
        ul, ol { 
            padding-left: 2rem; 
            margin: 1rem 0; 
        }
        li { 
            margin-bottom: 0.5rem; 
            line-height: 1.6;
        }
        ul li::marker { color: #3498db; }
        ol li::marker { color: #e74c3c; font-weight: bold; }
        
        /* Lista de tareas */
        .task-list { 
            list-style: none; 
            padding-left: 0; 
            margin: 1rem 0;
        }
        .task-item { 
            display: flex; 
            align-items: flex-start; 
            margin-bottom: 0.5rem;
            padding: 0.5rem;
            border-radius: 6px;
            transition: background-color 0.2s;
        }
        .task-item:hover { background-color: #f8f9fa; }
        .task-item input[type="checkbox"] { 
            margin-right: 0.75rem; 
            margin-top: 0.25rem;
            transform: scale(1.2);
        }
        
        /* Formato de texto */
        strong { color: #2c3e50; font-weight: 700; }
        em { color: #7f8c8d; }
        u { text-decoration: underline; text-decoration-color: #3498db; }
        s { text-decoration: line-through; text-decoration-color: #e74c3c; }
        
        /* Resaltado */
        mark { 
            background: linear-gradient(120deg, #84fab0 0%, #8fd3f4 100%);
            padding: 0.1em 0.3em;
            border-radius: 3px;
            color: #2c3e50;
        }
        
        /* Enlaces */
        a { 
            color: #3498db; 
            text-decoration: none; 
            border-bottom: 2px solid transparent;
            transition: all 0.3s ease;
        }
        a:hover { 
            color: #2980b9; 
            border-bottom-color: #3498db;
        }
        
        /* Imágenes */
        img { 
            max-width: 100%; 
            height: auto; 
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            margin: 1.5rem 0;
            display: block;
        }
        
        /* Videos de YouTube */
        .youtube-embed {
            position: relative;
            width: 100%;
            height: 0;
            padding-bottom: 56.25%; /* 16:9 aspect ratio */
            margin: 1.5rem 0;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }
        .youtube-embed iframe {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border: none;
        }
        
        /* Separadores */
        hr { 
            border: none; 
            height: 3px; 
            background: linear-gradient(90deg, #3498db, #8e44ad, #e74c3c);
            margin: 2rem 0;
            border-radius: 3px;
        }
        
        /* Canvas de dibujo */
        .canvas-drawing-node { 
            margin: 1.5rem 0; 
            text-align: center;
            padding: 1rem;
            background: #f8f9fa;
            border-radius: 8px;
            border: 2px dashed #bdc3c7;
        }
        .canvas-drawing-node svg { 
            max-width: 100%; 
            height: auto; 
            border-radius: 6px;
            background: white;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        /* Detalles desplegables */
        details {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            margin: 1rem 0;
            overflow: hidden;
        }
        summary {
            background: #e9ecef;
            padding: 1rem;
            cursor: pointer;
            font-weight: 600;
            color: #495057;
            transition: background-color 0.2s;
        }
        summary:hover { background: #dee2e6; }
        details[open] summary { background: #6c757d; color: white; }
        .details-content { padding: 1rem; }
        
        /* Matemáticas */
        .math { 
            font-family: 'Times New Roman', serif; 
            font-style: italic;
            background: #f8f9fa;
            padding: 0.5rem 1rem;
            border-radius: 6px;
            margin: 1rem 0;
            border-left: 4px solid #17a2b8;
        }
        
        /* Responsive */
        @media (max-width: 768px) {
            body { padding: 1rem; }
            h1 { font-size: 2rem; }
            h2 { font-size: 1.5rem; }
            table { font-size: 0.9rem; }
            th, td { padding: 0.5rem; }
        }
        
        /* Modo oscuro */
        @media (prefers-color-scheme: dark) {
            body { 
                background-color: #1a1a1a; 
                color: #e0e0e0; 
            }
            h1, h2, h3, h4, h5, h6 { color: #ffffff; }
            blockquote { 
                background: #2a2a2a; 
                border-left-color: #4a9eff; 
            }
            th { background: #333; }
            tbody tr:nth-child(even) { background-color: #2a2a2a; }
            tbody tr:hover { background-color: #3a3a3a; }
            code { background: #2a2a2a; color: #ff6b6b; }
            pre { background: #1e1e1e; }
        }
    </style>
</head>
<body>
    <header>
        <h1 class="document-title">${documentTitle}</h1>
        <p class="document-meta">Generado el ${new Date().toLocaleDateString('es-ES', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}</p>
    </header>
    <main>
        ${htmlContent}
    </main>
    <footer>
        <hr>
        <p style="text-align: center; color: #7f8c8d; font-size: 0.9rem; margin-top: 2rem;">
            Documento creado con Text Code Spark
        </p>
    </footer>
</body>
</html>`;
  };

  // Función simplificada y robusta para exportar a PDF siguiendo la documentación oficial
  const exportToPDF = async () => {
    try {
      // Importar html2pdf.js dinámicamente
      const html2pdf = (await import('html2pdf.js')).default;
      
      // Validar que hay contenido en el editor
      const content = editor.getHTML();
      if (!content || content.trim() === '<p></p>' || content.trim() === '') {
        toast({
          title: "No hay contenido para exportar",
          description: "El documento está vacío. Agrega contenido antes de exportar.",
          variant: "destructive",
        });
        return;
      }

      console.log('Iniciando exportación PDF...');

      // Crear elemento temporal con contenido principal y pie de página integrado
      const element = document.createElement('div');
      element.innerHTML = `
        <div style="
          max-width: 210mm;
          margin: 0 auto;
          padding: 10mm 20mm 20mm 20mm;
          background: white;
          color: black;
          font-family: Arial, sans-serif;
          font-size: 12pt;
          line-height: 1.8;
        ">
          <h1 style="text-align: center; margin-top: 0; margin-bottom: 20mm; color: black; font-size: 18pt; font-weight: bold;">
            ${documentTitle || 'Documento'}
          </h1>
          
          <div style="color: black; margin-bottom: 30pt;">
            ${content
              .replace(/<p>/g, '<p style="margin-bottom: 12pt;">')
              .replace(/<h([1-6])/g, '<h$1 style="margin-top: 20pt; margin-bottom: 12pt;"')
              .replace(/<ul>/g, '<ul style="margin-bottom: 15pt;">')
              .replace(/<ol>/g, '<ol style="margin-bottom: 15pt;">')
              .replace(/<li>/g, '<li style="margin-bottom: 6pt;">')
              .replace(/<table>/g, '<table style="margin: 30pt 0; border-collapse: collapse; width: 100%;">')
              .replace(/<td>/g, '<td style="padding: 8pt; border: 1px solid #ccc;">')
              .replace(/<th>/g, '<th style="padding: 8pt; border: 1px solid #ccc; background: #f5f5f5; font-weight: bold;">')
              .replace(/<blockquote>/g, '<blockquote style="margin: 15pt 0; padding: 10pt; border-left: 4px solid #ccc; background: #f9f9f9;">')
              .replace(/<pre>/g, '<pre style="margin: 15pt 0; padding: 12pt; background: #f5f5f5; border: 1px solid #ddd;">')
              .replace(/<hr>/g, '<hr style="margin: 20pt 0; border: none; height: 2px; background: #ccc;">')
              .replace(/<a/g, '<a style="margin: 12pt 8pt; display: inline-block;"')
            }
          </div>
          
          <div style="
            margin-top: 30pt;
            text-align: center;
            font-size: 10pt;
            color: #666;
            border-top: 1px solid #ccc;
            padding-top: 15pt;
            page-break-inside: avoid;
          ">
            Generado el ${new Date().toLocaleDateString('es-ES', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })} con Text Code Spark
          </div>
        </div>
      `;

      // Configuración optimizada para mostrar el pie de página
      const opt = {
        margin: [10, 10, 20, 10], // márgenes en mm: top, right, bottom, left
        filename: `${documentTitle || 'documento'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          allowTaint: true
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'portrait'
        },
        pagebreak: { 
          mode: ['avoid-all', 'css'] 
        }
      };

      // Usar la sintaxis recomendada en la documentación oficial
      await html2pdf().set(opt).from(element).save();

      toast({
        title: "✅ PDF exportado exitosamente",
        description: `Se descargó "${documentTitle || 'documento'}.pdf" correctamente`,
      });

    } catch (error) {
      console.error('Error al generar PDF:', error);
      
      toast({
        title: "❌ Error al exportar PDF",
        description: `Error: ${error.message || 'No se pudo generar el PDF'}`,
        variant: "destructive",
      });
    }
  };

  // Función mejorada para exportar a Word con formato completo
  const exportToWord = async () => {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, AlignmentType, UnderlineType } = await import('docx');
    const { saveAs } = await import('file-saver');

    try {
      const htmlContent = editor.getHTML();
      const wordDocument = await convertHTMLToAdvancedWordDocument(htmlContent, documentTitle);

      const blob = await Packer.toBlob(wordDocument);
      saveAs(blob, `${documentTitle}.docx`);

      toast({
        title: "Documento Word exportado",
        description: `Se descargó ${documentTitle}.docx correctamente`,
      });
    } catch (error) {
      console.error('Error al exportar a Word:', error);
      toast({
        title: "Error al exportar Word",
        description: "No se pudo generar el documento Word. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  // Función avanzada para convertir HTML a documento Word con formato A4
  const convertHTMLToAdvancedWordDocument = async (html: string, title: string) => {
    const { 
      Document, 
      Paragraph, 
      TextRun, 
      HeadingLevel, 
      Table, 
      TableRow, 
      TableCell, 
      WidthType, 
      AlignmentType, 
      UnderlineType,
      PageOrientation,
      BorderStyle,
      ImageRun,
      ExternalHyperlink,
      InternalHyperlink,
      PageNumber,
      Footer,
      Header
    } = await import('docx');
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    const elements: any[] = [];
    
    // Título del documento
    elements.push(
      new Paragraph({
        text: title,
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: {
          after: 400, // Espacio después del título
        }
      })
    );
    
    // Fecha del documento
    elements.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Documento generado el ${new Date().toLocaleDateString('es-ES', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}`,
            italics: true,
            size: 20, // 10pt
            color: "666666"
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: {
          after: 600, // Espacio después de la fecha
        }
      })
    );
    elements.push(
      new Paragraph({
        text: title,
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 }
      })
    );

    // Función para procesar nodos de manera recursiva
    const processNode = (node: Node): any[] => {
      const results: any[] = [];
      
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent?.trim();
        if (text) {
          return [new TextRun({ text })];
        }
        return [];
      }
      
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        const tagName = element.tagName.toLowerCase();
        
        switch (tagName) {
          case 'h1': {
            results.push(new Paragraph({
              text: element.textContent || '',
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 240, after: 120 }
            }));
            break;
          }
            
          case 'h2': {
            results.push(new Paragraph({
              text: element.textContent || '',
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 240, after: 120 }
            }));
            break;
          }
            
          case 'h3': {
            results.push(new Paragraph({
              text: element.textContent || '',
              heading: HeadingLevel.HEADING_3,
              spacing: { before: 240, after: 120 }
            }));
            break;
          }
            
          case 'h4': {
            results.push(new Paragraph({
              text: element.textContent || '',
              heading: HeadingLevel.HEADING_4,
              spacing: { before: 240, after: 120 }
            }));
            break;
          }
            
          case 'h5': {
            results.push(new Paragraph({
              text: element.textContent || '',
              heading: HeadingLevel.HEADING_5,
              spacing: { before: 240, after: 120 }
            }));
            break;
          }
            
          case 'h6': {
            results.push(new Paragraph({
              text: element.textContent || '',
              heading: HeadingLevel.HEADING_6,
              spacing: { before: 240, after: 120 }
            }));
            break;
          }
            
          case 'p': {
            const pContent = processInlineElements(element);
            if (pContent.length > 0) {
              results.push(new Paragraph({
                children: pContent,
                spacing: { after: 120 }
              }));
            }
            break;
          }
            
          case 'blockquote': {
            results.push(new Paragraph({
              text: element.textContent || '',
              indent: { left: 720 },
              spacing: { before: 120, after: 120 }
            }));
            break;
          }
            
          case 'ul':
          case 'ol': {
            const listItems = element.querySelectorAll('li');
            listItems.forEach((li, index) => {
              const bullet = tagName === 'ul' ? '•' : `${index + 1}.`;
              results.push(new Paragraph({
                text: `${bullet} ${li.textContent || ''}`,
                indent: { left: 360 },
                spacing: { after: 60 }
              }));
            });
            break;
          }
            
          case 'table': {
            try {
              const tableElement = processTableElement(element);
              if (tableElement) {
                results.push(tableElement);
              }
            } catch (error) {
              console.warn('Error procesando tabla:', error);
              results.push(new Paragraph({
                text: `[Tabla: ${element.textContent || 'Contenido no disponible'}]`,
                spacing: { before: 120, after: 120 }
              }));
            }
            break;
          }
            
          case 'img': {
            const src = element.getAttribute('src');
            const alt = element.getAttribute('alt') || 'Sin descripción';
            results.push(new Paragraph({
              text: `[Imagen: ${alt}${src ? ` - ${src.substring(0, 50)}...` : ''}]`,
              spacing: { before: 120, after: 120 }
            }));
            break;
          }
            
          case 'pre': {
            results.push(new Paragraph({
              text: element.textContent || '',
              spacing: { before: 120, after: 120 }
            }));
            break;
          }
            
          case 'hr': {
            results.push(new Paragraph({
              text: '─'.repeat(50),
              spacing: { before: 240, after: 240 }
            }));
            break;
          }
            
          case 'iframe': {
            const src = element.getAttribute('src');
            if (src && src.includes('youtube')) {
              results.push(new Paragraph({
                text: `[Video de YouTube: ${src}]`,
                spacing: { before: 120, after: 120 }
              }));
            }
            break;
          }
            
          default: {
            const childContent = processInlineElements(element);
            if (childContent.length > 0) {
              results.push(new Paragraph({
                children: childContent,
                spacing: { after: 60 }
              }));
            }
            break;
          }
        }
      }
      
      return results;
    };

    // Función para procesar elementos inline
    const processInlineElements = (element: Element): any[] => {
      const textRuns: any[] = [];
      
      const processInlineNode = (node: Node): any[] => {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent;
          if (text && text.trim()) {
            return [new TextRun({ text })];
          }
          return [];
        }
        
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as HTMLElement;
          const text = element.textContent || '';
          
          if (!text.trim()) return [];
          
          // Aplicar formato basado en el elemento
          switch (element.tagName.toLowerCase()) {
            case 'strong':
            case 'b': {
              return [new TextRun({ text, bold: true })];
            }
            case 'em':
            case 'i': {
              return [new TextRun({ text, italics: true })];
            }
            case 'u': {
              return [new TextRun({ text, underline: { type: UnderlineType.SINGLE } })];
            }
            case 's': {
              return [new TextRun({ text, strike: true })];
            }
            case 'code': {
              return [new TextRun({ 
                text, 
                font: 'Courier New'
              })];
            }
            case 'mark': {
              return [new TextRun({ 
                text,
                highlight: 'yellow'
              })];
            }
            case 'a': {
              const href = element.getAttribute('href');
              return [new TextRun({ 
                text: `${text} (${href})`,
                color: '0000FF',
                underline: { type: UnderlineType.SINGLE }
              })];
            }
            default: {
              return [new TextRun({ text })];
            }
          }
        }
        
        return [];
      };
      
      // Procesar todos los nodos hijos
      for (const child of element.childNodes) {
        textRuns.push(...processInlineNode(child));
      }
      
      return textRuns;
    };

    // Función para procesar tablas
    const processTableElement = (tableElement: Element): any | null => {
      const rows = tableElement.querySelectorAll('tr');
      if (rows.length === 0) return null;
      
      const tableRows: any[] = [];
      
      rows.forEach(row => {
        const cells = row.querySelectorAll('td, th');
        const tableCells: any[] = [];
        
        cells.forEach(cell => {
          tableCells.push(
            new TableCell({
              children: [new Paragraph({ text: cell.textContent || '' })],
              width: { size: 100 / cells.length, type: WidthType.PERCENTAGE }
            })
          );
        });
        
        if (tableCells.length > 0) {
          tableRows.push(new TableRow({ children: tableCells }));
        }
      });
      
      return tableRows.length > 0 ? new Table({
        rows: tableRows,
        width: { size: 100, type: WidthType.PERCENTAGE }
      }) : null;
    };

    // Procesar todos los nodos del HTML
    const walker = document.createTreeWalker(
      tempDiv,
      NodeFilter.SHOW_ELEMENT,
      null
    );

    let node;
    while ((node = walker.nextNode())) {
      const processed = processNode(node);
      elements.push(...processed);
    }

    // Si no se procesó nada, agregar el texto plano
    if (elements.length <= 1) {
      const plainText = editor.getText();
      const textParagraphs = plainText.split('\n').filter(line => line.trim()).map(line => 
        new Paragraph({
          children: [new TextRun({ text: line })],
          spacing: { after: 120 }
        })
      );
      elements.push(...textParagraphs);
    }

    return new Document({
      creator: "Text Code Spark",
      title: title,
      description: `Documento generado el ${new Date().toLocaleDateString('es-ES')}`,
      sections: [{
        properties: {
          page: {
            size: {
              orientation: PageOrientation.PORTRAIT,
              width: 11906, // 210mm en TWIPs (1/20th of a point)
              height: 16838, // 297mm en TWIPs
            },
            margin: {
              top: 1134, // 20mm en TWIPs (20 * 56.7)
              right: 1134, // 20mm
              bottom: 1134, // 20mm
              left: 1134, // 20mm
              header: 708, // 12.5mm
              footer: 708, // 12.5mm
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: title,
                    size: 20, // 10pt
                    color: "666666",
                  })
                ],
                alignment: AlignmentType.CENTER,
              })
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Página ",
                    size: 18, // 9pt
                    color: "999999",
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 18,
                    color: "999999",
                  }),
                  new TextRun({
                    text: " - Creado con Text Code Spark",
                    size: 18,
                    color: "999999",
                  })
                ],
                alignment: AlignmentType.CENTER,
              })
            ],
          }),
        },
        children: elements,
      }],
    });
  };

  // Función auxiliar para convertir HTML a documento Word
  const convertHTMLToWordDocument = async (html: string, title: string) => {
    const { Document, Paragraph, TextRun, HeadingLevel, UnderlineType } = await import('docx');
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    const paragraphs = [];
    
    paragraphs.push(
      new Paragraph({
        text: title,
        heading: HeadingLevel.TITLE,
      })
    );

    const processNode = (node: ChildNode) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent?.trim();
        if (text) {
          return new Paragraph({
            children: [new TextRun(text)],
          });
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        const text = element.textContent?.trim() || '';
        
        if (!text) return null;

        switch (element.tagName.toLowerCase()) {
          case 'h1':
            return new Paragraph({
              text: text,
              heading: HeadingLevel.HEADING_1,
            });
          case 'h2':
            return new Paragraph({
              text: text,
              heading: HeadingLevel.HEADING_2,
            });
          case 'h3':
            return new Paragraph({
              text: text,
              heading: HeadingLevel.HEADING_3,
            });
          case 'p':
            return new Paragraph({
              children: [new TextRun(text)],
            });
          case 'strong':
          case 'b':
            return new Paragraph({
              children: [new TextRun({ text: text, bold: true })],
            });
          case 'em':
          case 'i':
            return new Paragraph({
              children: [new TextRun({ text: text, italics: true })],
            });
          case 'u':
            return new Paragraph({
              children: [new TextRun({ text: text, underline: { type: UnderlineType.SINGLE } })],
            });
          case 's':
            return new Paragraph({
              children: [new TextRun({ text: text, strike: true })],
            });
          case 'code':
            return new Paragraph({
              children: [new TextRun({ 
                text, 
                font: 'Courier New'
              })],
            });
          case 'mark':
            return new Paragraph({
              children: [new TextRun({ 
                text,
                highlight: 'yellow'
              })],
            });
          case 'a': {
            const href = element.getAttribute('href');
            return new Paragraph({
              children: [new TextRun({ 
                text: `${text} (${href})`,
                color: '0000FF',
                underline: { type: UnderlineType.SINGLE }
              })],
            });
          }
          default:
            return new Paragraph({
              children: [new TextRun(text)],
            });
        }
      }
      return null;
    };

    const walker = document.createTreeWalker(
      tempDiv,
      NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
      null
    );

    let node;
    while ((node = walker.nextNode())) {
      const paragraph = processNode(node);
      if (paragraph) {
        paragraphs.push(paragraph);
      }
    }

    if (paragraphs.length <= 1) {
      const plainText = editor.getText();
      const textParagraphs = plainText.split('\n').filter(line => line.trim()).map(line => 
        new Paragraph({
          children: [new TextRun(line)],
        })
      );
      paragraphs.push(...textParagraphs);
    }

    return new Document({
      sections: [{
        properties: {},
        children: paragraphs,
      }],
    });
  };

  // Función mejorada para importar PDF usando PDF.js
  const handlePDFImport = async (file: File) => {
    try {
      toast({
        title: "Procesando PDF",
        description: "Extrayendo texto del documento PDF...",
      });

       // Importar PDF.js dinámicamente
      const pdfjsLib = await import('pdfjs-dist');
      
      // Configurar el worker
      if (typeof window !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
      }

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let fullText = '';
      const totalPages = pdf.numPages;

      // Extraer texto de cada página
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Combinar elementos de texto
        const pageText = textContent.items
          .map((item: { str?: string; [key: string]: unknown }) => {
            if ('str' in item) {
              return item.str;
            }
            return '';
          })
          .join(' ');
        
        if (pageText.trim()) {
          fullText += `${pageText}\n\n`;
        }
      }

      if (fullText.trim()) {
        // Procesar el texto extraído para convertirlo a HTML
        const processedText = processPDFText(fullText);
        editor?.commands.setContent(processedText);
        
        toast({
          title: "PDF importado exitosamente",
          description: `Se importó texto de ${totalPages} página(s) desde ${file.name}`,
        });
      } else {
        // Si no se puede extraer texto, mostrar mensaje específico
        toast({
          title: "PDF sin contenido de texto",
          description: "El PDF no contiene texto extraíble. Puede ser una imagen escaneada o estar protegido.",
          variant: "destructive",
        });
      }
    } catch (error) {
      
      // Fallback: intentar método básico solo si es absolutamente necesario
      try {
        await handlePDFImportFallback(file);
      } catch (fallbackError) {
        toast({
          title: "Error al importar PDF",
          description: "No se pudo extraer texto del PDF. El archivo puede estar protegido, corrupto o ser una imagen escaneada.",
          variant: "destructive",
        });
      }
    }
  };

  // Método de respaldo más inteligente
  const handlePDFImportFallback = async (file: File) => {
    try {
      toast({
        title: "Intentando método alternativo",
        description: "Usando extractor básico de PDF...",
      });

      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Verificar si es realmente un PDF
      const header = new TextDecoder('ascii').decode(uint8Array.slice(0, 8));
      if (!header.startsWith('%PDF-')) {
        throw new Error('El archivo no es un PDF válido');
      }

      // Buscar streams de texto más específicamente
      const pdfString = new TextDecoder('latin1').decode(uint8Array);
      const extractedText = extractPDFTextAdvanced(pdfString);
      
      if (extractedText && extractedText.length > 20) {
        const processedText = processPDFText(extractedText);
        editor?.commands.setContent(processedText);
        
        toast({
          title: "PDF procesado parcialmente",
          description: "Se extrajo algún texto del PDF. El formato puede no ser completo.",
        });
      } else {
        throw new Error('No se pudo extraer texto significativo');
      }
    } catch (error) {
      throw new Error(`Método alternativo falló: ${error.message}`);
    }
  };

  // Extractor de PDF más avanzado
  const extractPDFTextAdvanced = (pdfString: string): string => {
    const patterns = [
      // Texto entre operadores BT y ET (Begin Text / End Text)
      /BT\s*(.*?)\s*ET/gs,
      // Texto después de posicionamiento
      /Td\s*\((.*?)\)\s*Tj/g,
      /Tm\s*\((.*?)\)\s*Tj/g,
      // Texto simple con operador Tj
      /\((.*?)\)\s*Tj/g,
      // Arrays de texto
      /\[\s*\((.*?)\)\s*\]\s*TJ/g,
      // Texto con formato específico
      /\/F\d+\s+\d+\s+Tf\s*\((.*?)\)/g,
    ];

    const extractedTexts: string[] = [];
    
    patterns.forEach(pattern => {
      const matches = [...pdfString.matchAll(pattern)];
      matches.forEach(match => {
        if (match[1]) {
          const text = match[1]
            // Decodificar escapes comunes de PDF
            .replace(/\\n/g, '\n')
            .replace(/\\r/g, '\r')
            .replace(/\\t/g, '\t')
            .replace(/\\\(/g, '(')
            .replace(/\\\)/g, ')')
            .replace(/\\\\/g, '\\')
            .replace(/\\(\d{3})/g, (_, octal) => String.fromCharCode(parseInt(octal, 8)))
            .trim();
          
          // Filtrar texto válido
          if (text.length > 2 && /[a-zA-ZÀ-ÿ]/.test(text)) {
            extractedTexts.push(text);
          }
        }
      });
    });

    // Eliminar duplicados y texto de control
    const uniqueTexts = [...new Set(extractedTexts)]
      .filter(text => {
        // Filtrar texto que parece ser de control o metadatos
        return !text.match(/^(obj|endobj|stream|endstream|xref|trailer|startxref|\d+\s+\d+\s+R)$/i) &&
               text.length > 1 &&
               !/^[\d\s.-]+$/.test(text); // No solo números y espacios
      });

    return uniqueTexts.join(' ').trim();
  };

  // Función mejorada para procesar texto extraído de PDF
  const processPDFText = (text: string): string => {
    // Limpiar texto
    const processedText = text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // Eliminar espacios excesivos
      .replace(/[ \t]+/g, ' ')
      // Eliminar líneas vacías múltiples
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .trim();

    // Si el texto es muy corto o contiene muchos caracteres extraños, rechazarlo
    if (processedText.length < 10 || 
        (processedText.match(/[^\w\s.,;:!?\-áéíóúñüÁÉÍÓÚÑÜ]/g) || []).length > processedText.length * 0.3) {
      return '<p>El PDF contiene principalmente texto no extraíble o está codificado de manera especial.</p>';
    }

    const lines = processedText.split('\n');
    const htmlLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (!line) {
        continue;
      }

      // Detectar títulos (líneas cortas en mayúsculas)
      if (line.length < 60 && line === line.toUpperCase() && /[A-ZÁÉÍÓÚÑ]/.test(line)) {
        htmlLines.push(`<h2>${line}</h2>`);
      }
      // Detectar subtítulos
      else if (/^\d+\.|\d+\.\d+\.|\b(CAPÍTULO|CHAPTER|SECCIÓN|SECTION|TÍTULO|TITLE)\b/i.test(line)) {
        htmlLines.push(`<h3>${line}</h3>`);
      }
      // Detectar listas
      else if (/^[-•▪▫◦‣⁃*]\s+|^\d+[.)]\s+|^[a-z][.)]\s+/i.test(line)) {
        const cleanLine = line.replace(/^[-•▪▫◦‣⁃*]\s+|^\d+[.)]\s+|^[a-z][.)]\s+/i, '');
        htmlLines.push(`<li>${cleanLine}</li>`);
      }
      // Párrafos normales
      else {
        htmlLines.push(`<p>${line}</p>`);
      }
    }

    // Envolver listas consecutivas
    let finalHtml = htmlLines.join('\n');
    
    // Agrupar elementos <li> consecutivos en <ul>
    finalHtml = finalHtml.replace(/(<li>.*?<\/li>\s*)+/gs, (match) => {
      return `<ul>${match}</ul>`;
    });

    return finalHtml || '<p>No se pudo procesar el contenido del PDF correctamente.</p>';
  };

  // Función para manejar carga de imágenes locales
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !editor) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Archivo no válido",
          description: `${file.name} no es una imagen válida`,
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      
      reader.onload = (e) => {
        const base64String = e.target?.result as string;
        
        editor.chain().focus().setResizableImage({ 
          src: base64String, 
          alt: file.name,
          title: file.name 
        }).run();
        
        toast({
          title: "Imagen agregada",
          description: `Se agregó la imagen ${file.name}`,
        });
      };
      
      reader.readAsDataURL(file);
    });

    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  // Función para manejar drag & drop de imágenes
  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    
    const files = Array.from(event.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      toast({
        title: "No se encontraron imágenes",
        description: "Solo se pueden arrastrar archivos de imagen",
        variant: "destructive",
      });
      return;
    }

    imageFiles.forEach((file) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const base64String = e.target?.result as string;
        
        editor?.chain().focus().setResizableImage({ 
          src: base64String, 
          alt: file.name,
          title: file.name 
        }).run();
      };
      
      reader.readAsDataURL(file);
    });

    toast({
      title: "Imágenes agregadas",
      description: `Se agregaron ${imageFiles.length} imagen(es)`,
    });
  };

  // Función para manejar importación de archivos (incluye PDF)
  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
        file.name.endsWith('.docx')) {
      // Importar Word (.docx)
      handleWordImport(file);
    } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      // Importar PDF
      handlePDFImport(file);
    } else {
      // Manejar otros formatos existentes
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const content = e.target?.result as string;
        
        if (file.type === 'text/markdown' || file.name.endsWith('.md')) {
          const htmlContent = convertMarkdownToHTML(content);
          editor?.commands.setContent(htmlContent);
          toast({
            title: "Archivo importado",
            description: `Se importó correctamente el archivo ${file.name}`,
          });
        } else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
          editor?.commands.setContent(`<p>${content.replace(/\n/g, '</p><p>')}</p>`);
          toast({
            title: "Archivo importado",
            description: `Se importó correctamente el archivo ${file.name}`,
          });
        } else if (file.type === 'text/html' || file.name.endsWith('.html')) {
          editor?.commands.setContent(content);
          toast({
            title: "Archivo importado",
            description: `Se importó correctamente el archivo ${file.name}`,
          });
        } else {
          toast({
            title: "Formato no soportado",
            description: "Solo se admiten archivos .md, .txt, .html, .docx y .pdf",
            variant: "destructive",
          });
        }
      };

      reader.readAsText(file);
    }
    
    // Limpiar el input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const editor = useEditor({
    extensions: [
      Document,
      Paragraph.configure({
        HTMLAttributes: {
          class: 'my-paragraph',
        },
      }),
      Text,
      Blockquote,
      BulletList,
      OrderedList.configure({
        HTMLAttributes: {
          class: 'my-custom-ordered-list',
        },
        itemTypeName: 'listItem',
        keepMarks: true,
        keepAttributes: true,
      }),
      ListItem.configure({
        HTMLAttributes: {
          class: 'my-custom-list-item',
        },
      }),
      StarterKit.configure({
        document: false,
        paragraph: false,
        text: false,
        blockquote: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        heading: false,
        horizontalRule: false,
        hardBreak: false,
        bold: false,
        code: false,
        codeBlock: false,
        italic: false,
        strike: false,
        dropcursor: false,
        gapcursor: false,
        history: false, // Disable StarterKit's history to use our custom one
      }),
      History.configure({
        depth: 100,
        newGroupDelay: 500,
      }),
      BubbleMenu,
      CharacterCount.configure({
        limit: 1000000, // Límite de 10,000 caracteres
        mode: 'textSize', // Contar caracteres de texto, no nodos
      }),
      Color,
      Dropcursor,
      FloatingMenu,
      Focus.configure({
        className: 'has-focus',
        mode: 'all',
      }),
      FontFamily,
      Gapcursor,
      InvisibleCharacters.configure({
        visible: false, // Ocultos por defecto
      }),
      HardBreak.configure({
        keepMarks: true,
        HTMLAttributes: {
          class: 'my-hard-break',
        },
      }),
      ListKeymap,
      Mathematics.configure({
        shouldRender: (state, pos, node) => {
          const $pos = state.doc.resolve(pos);
          return node.type.name === 'text' && $pos.parent.type.name !== 'codeBlock';
        },
      }),
      Placeholder.configure({
        placeholder: 'Escribe aquí tu texto... Prueba escribir :) o #A975FF',
      }),
      TableOfContents.configure({
        getIndex: getHierarchicalIndexes,
        onUpdate: () => {
          // ToC se actualiza automáticamente
        },
      }),
      Typography,
      Bold,
      Code,
      Highlight.configure({
        multicolor: true,
        HTMLAttributes: {
          class: 'custom-highlight',
        },
      }),
      Italic,
      Link.configure({
        protocols: ['ftp', 'mailto', 'http', 'https'],
        openOnClick: true,
        autolink: true,
        linkOnPaste: true,
        defaultProtocol: 'https',
        HTMLAttributes: {
          class: 'text-blue-600 dark:text-blue-400 underline decoration-blue-600 dark:decoration-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors cursor-pointer',
          rel: 'noopener noreferrer',
          target: '_blank',
        },
        validate: (url) => {
          try {
            // Permitir URLs sin protocolo
            if (!url.includes('://')) {
              url = `https://${url}`;
            }
            const parsedUrl = new URL(url);
            return ['http:', 'https:', 'mailto:'].includes(parsedUrl.protocol);
          } catch {
            return false;
          }
        },
      }),
      Strike,
      Subscript,
      Superscript,
      Underline.configure({
        HTMLAttributes: {
          class: 'underline decoration-current',
        },
      }),
      TextStyle.configure({
        mergeNestedSpanStyles: true,
      }),
      FontSize.configure({
        types: ['textStyle'],
      }),
      CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: 'typescript',
        HTMLAttributes: {
          class: 'rounded-md p-4 bg-muted overflow-x-auto',
        },
      }),
      Heading.configure({
        levels: [1, 2, 3, 4, 5, 6],
        HTMLAttributes: {
          class: 'font-bold',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      HorizontalRule.configure({
        HTMLAttributes: {
          class: 'my-4 border-t border-gray-300 dark:border-gray-600',
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'w-full border-collapse',
        },
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: {
          class: 'bg-gray-100 dark:bg-gray-800 font-bold text-left p-2 border border-gray-300',
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-gray-300 p-2',
        },
      }),
      TaskList.configure({
        HTMLAttributes: {
          class: 'task-list pl-0 list-none space-y-1',
        },
        itemTypeName: 'taskItem',
      }),
      TaskItem.configure({
        nested: true,
        HTMLAttributes: {
          class: 'task-item flex items-start gap-2 my-1 p-1 rounded hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors',
        },
        onReadOnlyChecked: (node, checked) => {
          // Handle read-only checkbox state changes
          return checked;
        },
        a11y: {
          checkboxLabel: (node, checked) => {
            return checked ? 'Tarea completada' : 'Tarea pendiente';
          },
        },
      }),
      ResizableImage.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg my-4',
        },
      }),
      FileHandler.configure({
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml'],
        onDrop: (currentEditor, files, pos) => {
          files.forEach(file => {
            if (file.type.startsWith('image/')) {
              const fileReader = new FileReader();
              
              fileReader.readAsDataURL(file);
              fileReader.onload = () => {
                currentEditor.chain().insertContentAt(pos, {
                  type: 'resizableImage',
                  attrs: {
                    src: fileReader.result,
                    alt: file.name,
                    title: file.name,
                  },
                }).focus().run();
              };
            }
          });
        },
        onPaste: (currentEditor, files, htmlContent) => {
          files.forEach(file => {
            if (htmlContent) {
              // Si hay contenido HTML, dejamos que otras extensiones manejen la inserción
              return false;
            }

            if (file.type.startsWith('image/')) {
              const fileReader = new FileReader();
              
              fileReader.readAsDataURL(file);
              fileReader.onload = () => {
                currentEditor.chain().insertContentAt(currentEditor.state.selection.anchor, {
                  type: 'resizableImage',
                  attrs: {
                    src: fileReader.result,
                    alt: file.name,
                    title: file.name,
                  },
                }).focus().run();
              };
            }
          });
        },
      }),
      ResizableYoutube.configure({
        width: 640,
        height: 360,
        nocookie: true,
        controls: true,
        allowFullscreen: true,
        autoplay: false,
        ccLanguage: 'es',
        ccLoadPolicy: false,
        disableKBcontrols: false,
        enableIFrameApi: false,
        endTime: undefined,
        interfaceLanguage: 'es',
        ivLoadPolicy: 1,
               loop: false,
        modestBranding: true,
        progressBarColor: 'red',
        HTMLAttributes: {
          class: 'my-4 rounded-lg overflow-hidden youtube-embed',
        },
      }),
      Mention.configure({
        suggestion,
        HTMLAttributes: {
          class: 'mention rounded bg-primary/10 px-1 py-0.5 decoration-primary font-medium cursor-pointer transition-colors hover:bg-primary/20',
        },
        renderText({ options, node }) {
          return `${options.suggestion.char}${node.attrs.label ?? node.attrs.id}`;
        },
        deleteTriggerWithBackspace: true,
      }),
      Details.configure({
        HTMLAttributes: {
          class: 'details-element my-4 border border-gray-200 dark:border-gray-700 rounded-lg',
        },
      }),
      DetailsSummary.configure({
        HTMLAttributes: {
          class: 'details-summary cursor-pointer p-3 bg-gray-50 dark:bg-gray-800 font-medium select-none hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg',
        },
      }),
      DetailsContent.configure({
        HTMLAttributes: {
          class: 'details-content p-3 border-t border-gray-200 dark:border-gray-700',
        },
      }),
      Emoji.configure({
        emojis: gitHubEmojis,
        enableEmoticons: true,
        HTMLAttributes: {
          class: 'emoji-element inline-block',
        },
      }),
      Canvas.configure({
        HTMLAttributes: {
          class: 'canvas-drawing-node',
        },
      }),
      // Extensiones personalizadas nuevas
      ColorHighlighter,
      SmilieReplacer,
      CustomKeyboardShortcuts,
      // Extensiones de colaboración (condicionales)
      // Sin extensiones de colaboración
    ],
    content,
    onUpdate: ({ editor }) => {
      onUpdate(editor.getHTML());
    },
    editable: !readOnly,
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert max-w-none focus:outline-none min-h-[200px] px-6 py-4',
        spellcheck: readOnly ? 'false' : 'true',
        contenteditable: readOnly ? 'false' : 'true',
        tabindex: readOnly ? '-1' : '0',
        'aria-readonly': readOnly ? 'true' : undefined,
      },
      handleClickOn: (view, pos, node, nodePos, event, direct) => {
        // Manejar clicks en enlaces
        if (node.marks) {
          const linkMark = node.marks.find(mark => mark.type.name === 'link');
          if (linkMark && linkMark.attrs.href) {
            event.preventDefault();
            const href = linkMark.attrs.href;
            
            // Abrir enlaces externos en nueva pestaña
            if (href.startsWith('http') || href.startsWith('https')) {
              window.open(href, '_blank', 'noopener,noreferrer');
              return true;
            }
            
            // Manejar enlaces de documentos internos
            if (href.startsWith('doc://')) {
              const documentId = href.replace('doc://', '');
              // Aquí puedes agregar lógica para navegar a documentos internos
              console.log('Navegando a documento:', documentId);
              return true;
            }
            
            // Manejar otros tipos de enlaces
            if (href.startsWith('mailto:')) {
              window.location.href = href;
              return true;
            }
          }
        }
        
        return false;
      },
    },
  });

  // Limpieza del editor al desmontar el componente
  useEffect(() => {
    return () => {
      if (editor && !editor.isDestroyed) {
        editor.destroy();
      }
    };
  }, [editor]);

  // Actualizar el contenido del editor cuando cambia el prop content
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, false); // false para no triggerar onUpdate
    }
  }, [content, editor]);



  // NUEVO: expone el editor de Tiptap al padre
  useImperativeHandle(ref, () => ({
    editor
  }), [editor]);

  return (
    <div className="document-editor relative h-[calc(95vh-120px)] flex flex-col">
      {/* Inputs ocultos para archivos */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.txt,.html,.docx,.pdf"
        onChange={handleFileImport}
        className="hidden"
      />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleImageUpload}
        className="hidden"
      />

      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm shadow-sm">
        <div className="flex items-center gap-1 p-2 border-b">
          {/* Toolbar y botones alineados en una sola línea, solo iconos */}
          <div className="flex items-center gap-1 flex-1 overflow-x-auto scrollbar-hide">
            {/* Solo mostrar la toolbar si no es solo lectura */}
            {!readOnly && <EditorToolbar 
              editor={editor} 
              onImport={() => fileInputRef.current?.click()}
              onExport={exportContent}
              onToggleWordCount={() => setShowWordCount(!showWordCount)}
              showWordCount={showWordCount}
            />}
          </div>
        </div>
      </div>

      <div 
        className="editor-content-container flex-1 overflow-y-auto"
        onDragOver={readOnly ? undefined : handleDragOver}
        onDrop={readOnly ? undefined : handleDrop}
        style={readOnly ? { pointerEvents: 'none', opacity: 0.95 } : {}}
      >
        {/* Los componentes de menú se mueven aquí para vincularse correctamente al editor */}
        {editor && !readOnly && (
          <>
            <BubbleMenuComponent editor={editor} />
            <FloatingMenuComponent editor={editor} />
            <LinkEditor editor={editor} />
            
            <ErrorBoundary>
              <CodeBlockLanguages editor={editor} />
            </ErrorBoundary>
          </>
        )}
        
        {/* DragHandle envolviendo el contenido del editor */}
        {editor && !readOnly ? (
          <DragHandle editor={editor}>
            <div className="drag-handle">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
              </svg>
            </div>
          </DragHandle>
        ) : null}
        
        <EditorContent editor={editor} />
        {/* Overlay para drag & drop */}
        {!readOnly && (
          <div className="drag-drop-overlay">
            <div className="drag-drop-message">
              <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium">Suelta las imágenes aquí</p>
              <p className="text-sm text-muted-foreground">Soporta JPG, PNG, GIF y más</p>
            </div>
          </div>
        )}
      </div>
      
      {editor && showWordCount && (
        <div className="bg-muted/40 backdrop-blur-sm border-t py-2 px-4 flex items-center justify-center text-sm text-muted-foreground">
          <CharacterCountDisplay editor={editor} limit={1000000} />
        </div>
      )}
    </div>
  );
});

export default DocumentEditor;