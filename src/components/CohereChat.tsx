import React, { useState, useRef, useEffect } from 'react';
import { askOpenAIGPT41Nano } from '@/lib/aiCohere';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Send, Bot, ClipboardPaste, MessageSquare, FileEdit, Loader2, ArrowRight, Paperclip, Image as ImageIcon, FileText, File, Trash2, Check } from 'lucide-react';
import { useAuth, useUser } from "@clerk/clerk-react";
import { toast } from '@/components/ui/use-toast';

type Mode = 'chat' | 'editor';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  id: string;
  status?: 'pending' | 'accepted' | 'rejected';
}

interface CohereChatProps {
  open: boolean;
  onClose: () => void;
  onInsertText?: (text: string, diffType?: 'add' | 'remove' | 'replace' | null) => void;
  onSendEditorRequest?: (prompt: string) => void;
  isEditorProcessing?: boolean;
  editorRef?: React.MutableRefObject<any>;
}

interface AttachedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  content: string;
  preview?: string;
  isImage: boolean;
}

export const CohereChat: React.FC<CohereChatProps> = ({ 
  open, 
  onClose, 
  onInsertText,
  onSendEditorRequest,
  isEditorProcessing = false,
  editorRef
}) => {
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [editorMessages, setEditorMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<Mode>('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { getToken } = useAuth();
  const { user } = useUser();
  const [contextLoaded, setContextLoaded] = useState(false);
  const [contextData, setContextData] = useState<{
    userName?: string;
    documents: { id: string; title: string; shared?: boolean }[];
    categories: { id: string; name: string; shared?: boolean }[];
  }>({ documents: [], categories: [] });

  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [selectedDocContent, setSelectedDocContent] = useState<string | null>(null);

  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchContext = async () => {
      try {
        const token = await getToken();
        const docsRes = await fetch('/api/users/documents', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const catsRes = await fetch('/api/users/categories', {
          headers: { Authorization: `Bearer ${token}` }
        });
        let documents: { id: string; title: string; shared?: boolean }[] = [];
        let categories: { id: string; name: string; shared?: boolean }[] = [];
        if (docsRes.ok) {
          const docs = await docsRes.json();
          documents = docs.map((d: any) => ({
            id: d.id,
            title: d.title,
            shared: !!d.sharedPermission
          }));
        }
        if (catsRes.ok) {
          const cats = await catsRes.json();
          categories = cats.map((c: any) => ({
            id: c.id,
            name: c.name,
            shared: !!c.sharedPermission
          }));
        }
        setContextData({
          userName: user?.fullName || user?.firstName || '',
          documents,
          categories,
        });
        setContextLoaded(true);
      } catch (err) {
        setContextLoaded(false);
      }
    };
    if (open) fetchContext();
  }, [open, getToken, user?.id]);

  const fetchDocumentContent = async (docId: string) => {
    try {
      const token = await getToken();
      const res = await fetch(`/api/users/documents/${docId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const doc = await res.json();
        setSelectedDocContent(doc.content || '');
      } else {
        setSelectedDocContent(null);
      }
    } catch {
      setSelectedDocContent(null);
    }
  };

  const handleSelectDocForContext = async (docId: string) => {
    setSelectedDocId(docId);
    setSelectedDocContent(null);
    await fetchDocumentContent(docId);
  };

  function getEditType(prompt: string) {
    if (/elimina|borra|quitar|remueve/i.test(prompt)) return 'remove';
    if (/corrige|corrígelo|corrígela|corrígelo|corrígela|corrígelo|corrígela|corrige/i.test(prompt)) return 'replace';
    if (/agrega|añade|inserta|escribe/i.test(prompt)) return 'add';
    return null;
  }

  function detectToolCommand(prompt: string) {
    const commands = {
      youtube: /youtube|video de youtube|insertar video|embed video|inserta video|añadir video|agregar video|embeber video|incrustar video|video youtube|yt|youtube\.com|youtu\.be/i,
      table: /crear tabla|tabla|insertar tabla|añadir tabla|agrega tabla|tabla de datos|tabla simple|tabla con bordes|tabla sin bordes|nueva tabla|generar tabla/i,
      heading: /^(título|encabezado|h[1-6]|heading|encabezado principal|subtítulo|título de sección|título principal|cabecera)(?!\w)/i,
      bold: /negrita|bold|texto en negrita|poner en negrita|hacer negrita|formato negrita/i,
      italic: /cursiva|italic|texto en cursiva|poner en cursiva|hacer cursiva|formato cursiva|itálica/i,
      underline: /subrayado|underline|subrayar|texto subrayado|línea debajo/i,
      strikethrough: /tachado|strikethrough|tachar|texto tachado|línea encima|cancelar texto/i,
      superscript: /superíndice|superscript|exponente|potencia|sup|arriba/i,
      subscript: /subíndice|subscript|sub|abajo|índice inferior/i,
      color: /color|cambiar color|texto de color|colorear|pintar|texto rojo|texto azul|texto verde|texto amarillo|texto naranja|texto morado|texto rosa|texto gris|texto negro|texto blanco|texto dorado|texto plateado|#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}/i,
      highlight: /resaltar|fondo|background|destacar|marcar|resaltado|fondo amarillo|fondo azul|fondo verde|fondo rojo/i,
      list: /lista|lista con viñetas|bullet list|viñetas|puntos|lista simple/i,
      orderedList: /lista numerada|lista ordenada|numbered list|números|lista con números|enumerar/i,
      taskList: /lista de tareas|checklist|checkbox|lista de verificación|tareas pendientes|to-do/i,
      align: /alinear|centrar|justificar|align|alinear izquierda|alinear derecha|alinear centro|justificar texto|centrar texto|sangría/i,
      quote: /cita|blockquote|quote|citado|comillas|citar/i,
      code: /código|code|bloque de código|código inline|programación|script/i,
      separator: /separador|línea|hr|división|dividir|separar|línea horizontal/i,
      link: /enlace|link|hipervínculo|url|vincular|conectar/i,
      image: /imagen|img|picture|foto|insertar imagen|añadir imagen|subir imagen/i,
      video: /video|vídeo|multimedia|reproducir/i,
      canvas: /dibujo|canvas|dibujar|pintar|sketch|gráfico/i,
      emoji: /emoji|emoticon|carita|símbolo|emoticono/i,
      spacing: /espaciado|espacio|margin|padding|salto de línea|espacio en blanco/i,
      columns: /columnas|column|dividir en columnas|layout en columnas/i,
      small: /texto pequeño|small|reducir tamaño|texto chico/i,
      large: /texto grande|large|aumentar tamaño|texto más grande/i,
      uppercase: /mayúsculas|uppercase|convertir a mayúsculas|todo en mayúsculas/i,
      lowercase: /minúsculas|lowercase|convertir a minúsculas|todo en minúsculas/i,
      capitalize: /capitalizar|title case|primera letra mayúscula/i,
      formula: /fórmula|ecuación|matemática|símbolo matemático|notación/i,
      fraction: /fracción|dividir|quebrado/i,
      button: /botón|button|clickeable|enlace tipo botón/i,
      badge: /badge|etiqueta|insignia|tag/i,
      progress: /progreso|barra de progreso|indicador/i,
      border: /borde|border|marco|contorno|línea alrededor/i,
      shadow: /sombra|shadow|efecto de sombra/i,
      tableModify: /agregar fila|agregar columna|eliminar fila|eliminar columna|combinar celdas|dividir celda|modificar tabla/i
    };

    if (/youtube\.com|youtu\.be/i.test(prompt)) {
      return 'youtube';
    }

    for (const [tool, regex] of Object.entries(commands)) {
      if (regex.test(prompt)) {
        return tool;
      }
    }
    return null;
  }

  const executeToolCommand = (command: string, prompt: string) => {
    if (!editorRef?.current?.editor) return false;

    const editor = editorRef.current.editor;

    switch (command) {
      case 'table': {
        const tableMatch = prompt.match(/(\d+)\s*[x×]\s*(\d+)|tabla de (\d+)|(\d+)\s+filas?\s+(\d+)\s+columnas?|(\d+)\s+columnas?\s+(\d+)\s+filas?/i);
        let rows = 3, cols = 3;
        
        if (tableMatch) {
          if (tableMatch[1] && tableMatch[2]) {
            rows = parseInt(tableMatch[1]);
            cols = parseInt(tableMatch[2]);
          } else if (tableMatch[3]) {
            rows = cols = parseInt(tableMatch[3]);
          } else if (tableMatch[4] && tableMatch[5]) {
            rows = parseInt(tableMatch[4]);
            cols = parseInt(tableMatch[5]);
          } else if (tableMatch[6] && tableMatch[7]) {
            cols = parseInt(tableMatch[6]);
            rows = parseInt(tableMatch[7]);
          }
        }
        
        const hasHeaders = /con encabezados?|con headers?|con títulos?/i.test(prompt);
        const withBorders = /con bordes?|con líneas?|bordeada/i.test(prompt);
        const noBorders = /sin bordes?|sin líneas?|limpia/i.test(prompt);
        
        editor.chain().focus().insertTable({ 
          rows: Math.max(1, Math.min(rows, 20)), 
          cols: Math.max(1, Math.min(cols, 10)), 
          withHeaderRow: hasHeaders !== false 
        }).run();
        return true;
      }

      case 'tableModify': {
        if (/agregar fila|añadir fila|nueva fila/i.test(prompt)) {
          editor.chain().focus().addRowAfter().run();
        } else if (/agregar columna|añadir columna|nueva columna/i.test(prompt)) {
          editor.chain().focus().addColumnAfter().run();
        } else if (/eliminar fila|borrar fila|quitar fila/i.test(prompt)) {
          editor.chain().focus().deleteRow().run();
        } else if (/eliminar columna|borrar columna|quitar columna/i.test(prompt)) {
          editor.chain().focus().deleteColumn().run();
        } else if (/combinar celdas|unir celdas|fusionar/i.test(prompt)) {
          editor.chain().focus().mergeCells().run();
        } else if (/dividir celda|separar celda|split/i.test(prompt)) {
          editor.chain().focus().splitCell().run();
        }
        return true;
      }

      case 'heading': {
        let level = 2;
        
        const levelMatch = prompt.match(/h(\d)|título (\d)|encabezado (\d)|nivel (\d)/i);
        if (levelMatch) {
          level = parseInt(levelMatch[1] || levelMatch[2] || levelMatch[3] || levelMatch[4]);
        } else if (/principal|grande|h1|título 1/i.test(prompt)) {
          level = 1;
        } else if (/subtítulo|h2|título 2/i.test(prompt)) {
          level = 2;
        } else if (/sección|h3|título 3/i.test(prompt)) {
          level = 3;
        } else if (/subsección|h4|título 4/i.test(prompt)) {
          level = 4;
        } else if (/menor|h5|título 5/i.test(prompt)) {
          level = 5;
        } else if (/detalle|h6|título 6/i.test(prompt)) {
          level = 6;
        }
        
        level = Math.max(1, Math.min(level, 6));
        editor.chain().focus().toggleHeading({ level }).run();
        return true;
      }

      case 'bold':
        editor.chain().focus().toggleBold().run();
        return true;

      case 'italic':
        editor.chain().focus().toggleItalic().run();
        return true;

      case 'underline':
        editor.chain().focus().toggleUnderline().run();
        return true;

      case 'strikethrough':
        editor.chain().focus().toggleStrike().run();
        return true;

      case 'superscript':
        editor.chain().focus().toggleSuperscript().run();
        return true;

      case 'subscript':
        editor.chain().focus().toggleSubscript().run();
        return true;

      case 'color': {
        let color = '#000000';
        
        const colorMatch = prompt.match(/#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})|rojo|azul|verde|amarillo|naranja|morado|rosa|gris|negro|blanco|dorado|plateado|violeta|turquesa|coral|salmon|lima|oliva|navy|maroon|aqua|fucsia/i);
        
        if (colorMatch) {
          const colorName = colorMatch[0].toLowerCase();
          const colorMap: { [key: string]: string } = {
            'rojo': '#ff0000', 'red': '#ff0000',
            'azul': '#0000ff', 'blue': '#0000ff',
            'verde': '#00ff00', 'green': '#00ff00',
            'amarillo': '#ffff00', 'yellow': '#ffff00',
            'naranja': '#ffa500', 'orange': '#ffa500',
            'morado': '#800080', 'purple': '#800080',
            'rosa': '#ffc0cb', 'pink': '#ffc0cb',
            'gris': '#808080', 'gray': '#808080', 'grey': '#808080',
            'negro': '#000000', 'black': '#000000',
            'blanco': '#ffffff', 'white': '#ffffff',
            'dorado': '#ffd700', 'gold': '#ffd700',
            'plateado': '#c0c0c0', 'silver': '#c0c0c0',
            'violeta': '#8a2be2', 'violet': '#8a2be2',
            'turquesa': '#40e0d0', 'turquoise': '#40e0d0',
            'coral': '#ff7f50',
            'salmon': '#fa8072',
            'lima': '#32cd32', 'lime': '#32cd32',
            'oliva': '#808000', 'olive': '#808000',
            'navy': '#000080',
            'maroon': '#800000',
            'aqua': '#00ffff',
            'fucsia': '#ff00ff', 'fuchsia': '#ff00ff'
          };
          
          color = colorMap[colorName] || colorMatch[0];
        }
        
        editor.chain().focus().setColor(color).run();
        return true;
      }

      case 'highlight': {
        let bgColor = '#ffff00';
        
        if (/azul/i.test(prompt)) bgColor = '#add8e6';
        else if (/verde/i.test(prompt)) bgColor = '#90ee90';
        else if (/rojo/i.test(prompt)) bgColor = '#ffcccb';
        else if (/rosa/i.test(prompt)) bgColor = '#ffb6c1';
        else if (/naranja/i.test(prompt)) bgColor = '#ffd4b3';
        
        editor.chain().focus().setHighlight({ color: bgColor }).run();
        return true;
      }

      case 'list':
        editor.chain().focus().toggleBulletList().run();
        return true;

      case 'orderedList':
        editor.chain().focus().toggleOrderedList().run();
        return true;

      case 'taskList':
        editor.chain().focus().toggleTaskList().run();
        return true;

      case 'align': {
        if (/centrar|center/i.test(prompt)) {
          editor.chain().focus().setTextAlign('center').run();
        } else if (/derecha|right/i.test(prompt)) {
          editor.chain().focus().setTextAlign('right').run();
        } else if (/justificar|justify/i.test(prompt)) {
          editor.chain().focus().setTextAlign('justify').run();
        } else if (/izquierda|left/i.test(prompt)) {
          editor.chain().focus().setTextAlign('left').run();
        }
        return true;
      }

      case 'quote':
        editor.chain().focus().toggleBlockquote().run();
        return true;

      case 'code':
        if (/bloque|block/i.test(prompt)) {
          editor.chain().focus().toggleCodeBlock().run();
        } else {
          editor.chain().focus().toggleCode().run();
        }
        return true;

      case 'separator':
        editor.chain().focus().setHorizontalRule().run();
        return true;

      case 'link': {
        const urlMatch = prompt.match(/https?:\/\/[^\s]+/);
        const url = urlMatch ? urlMatch[0] : window.prompt('Ingresa la URL:');
        if (url) {
          const newTab = /nueva pestaña|new tab|target.*blank/i.test(prompt);
          const attrs = newTab ? { href: url, target: '_blank' } : { href: url };
          editor.chain().focus().setLink(attrs).run();
        }
        return true;
      }

      case 'image': {
        const imgMatch = prompt.match(/https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp|svg)/i);
        const imgUrl = imgMatch ? imgMatch[0] : window.prompt('Ingresa la URL de la imagen:');
        if (imgUrl) {
          const centered = /centrada|center/i.test(prompt);
          const bordered = /con borde|border/i.test(prompt);
          const circular = /circular|redonda/i.test(prompt);
          
          let style = '';
          if (centered) style += 'display: block; margin: 0 auto;';
          if (bordered) style += 'border: 2px solid #ccc;';
          if (circular) style += 'border-radius: 50%;';
          
          const attrs = style ? { src: imgUrl, style } : { src: imgUrl };
          editor.chain().focus().setImage(attrs).run();
        }
        return true;
      }

      case 'youtube': {
        const ytMatch = prompt.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/);
        let videoId = ytMatch ? ytMatch[1] : null;
        
        if (!videoId) {
          const userInput = window.prompt('Ingresa la URL del video de YouTube:');
          if (userInput) {
            const inputMatch = userInput.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/);
            videoId = inputMatch ? inputMatch[1] : null;
          }
        }
        
        if (videoId) {
          try {
            if (editor.commands.setYoutubeVideo) {
              editor.chain().focus().setYoutubeVideo({ 
                src: `https://www.youtube.com/watch?v=${videoId}`,
                width: 640,
                height: 360
              }).run();
            } else {
              const youtubeEmbed = `<div class="youtube-video" style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; background: #000; margin: 16px 0;">
                <iframe 
                  src="https://www.youtube.com/embed/${videoId}" 
                  style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;" 
                  allowfullscreen>
                </iframe>
              </div>`;
              editor.chain().focus().insertContent(youtubeEmbed).run();
            }
          } catch (error) {
            const simpleIframe = `<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>`;
            editor.chain().focus().insertContent(simpleIframe).run();
          }
        }
        return true;
      }

      case 'canvas':
        editor.chain().focus().insertCanvas().run();
        return true;

      case 'emoji':
        const emojiMatch = prompt.match(/😀|😃|😄|😁|😆|😅|😂|🤣|😊|😇|🙂|🙃|😉|😌|😍|🥰|😘|😗|😙|😚|😋|😛|😝|😜|🤪|🤨|🧐|🤓|😎|🤩|🥳|😏|😒|😞|😔|😟|😕|🙁|☹️|😣|😖|😫|😩|🥺|😢|😭|😤|😠|😡|🤬|🤯|😳|🥵|🥶|😱|😨|😰|😥|😓|🤗|🤔|🤭|🤫|🤥|😶|😐|😑|😬|🙄|😯|😦|😧|😮|😲|🥱|😴|🤤|😪|😵|🤐|🥴|🤢|🤮|🤧|😷|🤒|🤕/);
        if (emojiMatch) {
          editor.chain().focus().insertContent(emojiMatch[0]).run();
        }
        return true;

      case 'small':
        editor.chain().focus().insertContent('<small>texto pequeño</small>').run();
        return true;

      case 'large':
        editor.chain().focus().insertContent('<span style="font-size: 1.2em;">texto grande</span>').run();
        return true;

      case 'uppercase': {
        const { state } = editor;
        const { from, to } = state.selection;
        if (from !== to) {
          const selectedText = state.doc.textBetween(from, to, ' ');
          editor.chain().focus().insertContentAt({ from, to }, selectedText.toUpperCase()).run();
        }
        return true;
      }

      case 'lowercase': {
        const { state } = editor;
        const { from, to } = state.selection;
        if (from !== to) {
          const selectedText = state.doc.textBetween(from, to, ' ');
          editor.chain().focus().insertContentAt({ from, to }, selectedText.toLowerCase()).run();
        }
        return true;
      }

      case 'capitalize': {
        const { state } = editor;
        const { from, to } = state.selection;
        if (from !== to) {
          const selectedText = state.doc.textBetween(from, to, ' ');
          const capitalized = selectedText.replace(/\w\S*/g, (txt) => 
            txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
          );
          editor.chain().focus().insertContentAt({ from, to }, capitalized).run();
        }
        return true;
      }

      case 'spacing':
        if (/doble|2/i.test(prompt)) {
          editor.chain().focus().insertContent('<div style="line-height: 2;">texto con espaciado doble</div>').run();
        } else if (/simple|1/i.test(prompt)) {
          editor.chain().focus().insertContent('<div style="line-height: 1;">texto con espaciado simple</div>').run();
        } else {
          editor.chain().focus().insertContent('<br><br>').run();
        }
        return true;

      case 'columns': {
        const colMatch = prompt.match(/(\d+)\s+columnas?/i);
        const cols = colMatch ? parseInt(colMatch[1]) : 2;
        const columnStyle = `display: grid; grid-template-columns: repeat(${Math.min(cols, 4)}, 1fr); gap: 20px;`;
        editor.chain().focus().insertContent(`<div style="${columnStyle}"><div>Columna 1</div><div>Columna 2</div></div>`).run();
        return true;
      }

      case 'button': {
        const isPrimary = /principal|primary/i.test(prompt);
        const isSecondary = /secundario|secondary/i.test(prompt);
        
        let buttonClass = 'padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;';
        if (isPrimary) {
          buttonClass += 'background-color: #007bff; color: white;';
        } else if (isSecondary) {
          buttonClass += 'background-color: #6c757d; color: white;';
        } else {
          buttonClass += 'background-color: #28a745; color: white;';
        }
        
        editor.chain().focus().insertContent(`<button style="${buttonClass}">Botón</button>`).run();
        return true;
      }

      case 'badge':
        editor.chain().focus().insertContent('<span style="background-color: #007bff; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.8em;">Badge</span>').run();
        return true;

      case 'progress': {
        const progressMatch = prompt.match(/(\d+)%|(\d+)\s*de\s*(\d+)/i);
        let percentage = 50;
        if (progressMatch) {
          if (progressMatch[1]) {
            percentage = parseInt(progressMatch[1]);
          } else if (progressMatch[2] && progressMatch[3]) {
            percentage = Math.round((parseInt(progressMatch[2]) / parseInt(progressMatch[3])) * 100);
          }
        }
        
        const progressHTML = `
          <div style="width: 100%; background-color: #e0e0e0; border-radius: 10px;">
            <div style="width: ${percentage}%; background-color: #4caf50; height: 20px; border-radius: 10px; text-align: center; line-height: 20px; color: white; font-size: 12px;">
              ${percentage}%
            </div>
          </div>
        `;
        editor.chain().focus().insertContent(progressHTML).run();
        return true;
      }

      case 'border':
        editor.chain().focus().insertContent('<div style="border: 2px solid #ccc; padding: 10px; border-radius: 5px;">Texto con borde</div>').run();
        return true;

      case 'shadow':
        editor.chain().focus().insertContent('<div style="box-shadow: 0 4px 8px rgba(0,0,0,0.1); padding: 15px; border-radius: 5px;">Texto con sombra</div>').run();
        return true;

      default:
        return false;
    }
  };

  const processFile = async (file: File): Promise<AttachedFile | null> => {
    try {
      setIsProcessingFile(true);
      
      const fileId = crypto.randomUUID();
      const isImage = file.type.startsWith('image/');
      
      if (isImage) {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const base64 = e.target?.result as string;
            resolve({
              id: fileId,
              name: file.name,
              type: file.type,
              size: file.size,
              content: base64,
              preview: base64,
              isImage: true
            });
          };
          reader.readAsDataURL(file);
        });
      } else if (file.type === 'application/pdf') {
        try {
          const pdfjsLib = await import('pdfjs-dist');
          pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
          
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          
          let fullText = '';
          for (let pageNum = 1; pageNum <= Math.min(pdf.numPages, 10); pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
              .map((item: any) => item.str || '')
              .join(' ');
            fullText += `Página ${pageNum}:\n${pageText}\n\n`;
          }
          
          return {
            id: fileId,
            name: file.name,
            type: file.type,
            size: file.size,
            content: fullText.trim() || 'No se pudo extraer texto del PDF',
            isImage: false
          };
        } catch (error) {
          return {
            id: fileId,
            name: file.name,
            type: file.type,
            size: file.size,
            content: 'Error al procesar el PDF. El archivo puede estar protegido o corrupto.',
            isImage: false
          };
        }
      } else if (file.type.includes('text/') || 
                 file.name.endsWith('.md') || 
                 file.name.endsWith('.txt') ||
                 file.name.endsWith('.json') ||
                 file.name.endsWith('.csv')) {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const text = e.target?.result as string;
            resolve({
              id: fileId,
              name: file.name,
              type: file.type,
              size: file.size,
              content: text.substring(0, 10000),
              isImage: false
            });
          };
          reader.readAsText(file);
        });
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        try {
          const mammoth = await import('mammoth');
          const arrayBuffer = await file.arrayBuffer();
          const result = await mammoth.extractRawText({ arrayBuffer });
          
          return {
            id: fileId,
            name: file.name,
            type: file.type,
            size: file.size,
            content: result.value.substring(0, 10000),
            isImage: false
          };
        } catch (error) {
          return {
            id: fileId,
            name: file.name,
            type: file.type,
            size: file.size,
            content: 'Error al procesar el documento Word.',
            isImage: false
          };
        }
      } else {
        toast({
          title: "Archivo no soportado",
          description: `El tipo de archivo ${file.type} no es compatible para análisis.`,
          variant: "destructive",
        });
        return null;
      }
    } catch (error) {
      toast({
        title: "Error procesando archivo",
        description: `No se pudo procesar ${file.name}`,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const maxFiles = 5;
    const maxFileSize = 10 * 1024 * 1024;

    const selectedFiles = Array.from(files).slice(0, maxFiles);
    
    for (const file of selectedFiles) {
      if (file.size > maxFileSize) {
        toast({
          title: "Archivo muy grande",
          description: `${file.name} excede el límite de 10MB`,
          variant: "destructive",
        });
        continue;
      }

      const processedFile = await processFile(file);
      if (processedFile) {
        setAttachedFiles(prev => [...prev, processedFile]);
        toast({
          title: "Archivo adjuntado",
          description: `${file.name} está listo para analizar`,
        });
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachedFile = (fileId: string) => {
    setAttachedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const messages = mode === 'chat' ? chatMessages : editorMessages;
  const setMessages = mode === 'chat' ? setChatMessages : setEditorMessages;

  useEffect(() => {
    if (open) setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, [messages, open]);

  const handleSend = async () => {
    if (!input.trim() && attachedFiles.length === 0) return;

    const userMsg: Message = { role: 'user', content: input, id: crypto.randomUUID() };
    setMessages(prev => [...prev, userMsg]);
    const inputText = input;
    setInput('');

    const isContentGeneration = /redacta|escribe|genera|crea|haz un|haz una|dame un|dame una|texto|párrafo|contenido/i.test(inputText);
    
    let contextPrompt = '';
    if (contextLoaded) {
      contextPrompt = `
CONTEXTO COMPLETO DEL USUARIO:
Nombre: ${contextData.userName || 'Sin nombre'}

DOCUMENTOS Y CARPETAS DISPONIBLES:
Carpetas disponibles: 
${contextData.categories.map(c => `- ${c.name}${c.shared ? ' (compartida)' : ''}`).join('\n') || 'Ninguna'}

Documentos disponibles: 
${contextData.documents.map(d => `- ${d.title}${d.shared ? ' (compartido)' : ''}${selectedDocId === d.id ? ' [seleccionado]' : ''}`).join('\n') || 'Ninguno'}

${selectedDocContent ? `
CONTENIDO DEL DOCUMENTO SELECCIONADO "${contextData.documents.find(d => d.id === selectedDocId)?.title || ''}":
${selectedDocContent}
` : ''}

${attachedFiles.length > 0 ? `
ARCHIVOS ADJUNTOS PARA ANÁLISIS:
${attachedFiles.map((file, index) => `
Archivo ${index + 1}: ${file.name} (${file.type})
${file.isImage ? 
  `[IMAGEN] - El usuario ha adjuntado una imagen. Analiza visualmente su contenido, describe lo que ves, identifica elementos, texto, objetos, personas, etc.` :
  `[CONTENIDO DEL ARCHIVO]:\n${file.content.substring(0, 3000)}${file.content.length > 3000 ? '\n...(contenido truncado)' : ''}`
}
`).join('\n')}
INSTRUCCIONES PARA ARCHIVOS:
- Para imágenes: describe detalladamente lo que ves, identifica texto, objetos, personas, emociones, colores, composición
- Para documentos: analiza el contenido, estructura, temas principales, conclusiones
- Para código: explica la funcionalidad, identifica problemas, sugiere mejoras
- Siempre contextualiza tu análisis con la pregunta del usuario
` : ''}

MODO ACTUAL: ${mode === 'chat' ? 'CHAT (solo responder texto)' : 'EDITOR (interactuar con editor)'}

${mode === 'editor' ? `
HERRAMIENTAS DISPONIBLES EN EL EDITOR:
📋 TABLAS:
- "crear tabla 3x4" → Inserta tabla de 3 filas y 4 columnas
- "tabla con encabezados" → Tabla con fila de encabezados
- "insertar tabla" → Tabla básica 3x3

📝 FORMATO DE TEXTO:
- "negrita" → Aplica formato negrita al texto seleccionado
- "cursiva" → Aplica formato cursiva
- "subrayado" → Subraya el texto
- "tachado" → Texto tachado
- "código inline" → Formato de código en línea
- "bloque de código" → Bloque de código completo

🎨 COLORES:
- "texto rojo", "texto azul", "texto verde" → Cambia color del texto
- "color #ff0000" → Aplica color hexadecimal específico
- "fondo amarillo" → Resalta con color de fondo

📊 ENCABEZADOS:
- "título 1" o "h1" → Encabezado nivel 1
- "título 2" o "h2" → Encabezado nivel 2  
- "título 3" o "h3" → Encabezado nivel 3
- "encabezado principal" → H1
- "subtítulo" → H2

📋 LISTAS:
- "lista con viñetas" → Lista bullet points
- "lista numerada" → Lista con números
- "lista de tareas" → Checklist con checkboxes
- "convertir en lista" → Convierte texto seleccionado

🎯 ALINEACIÓN:
- "centrar texto" → Alinea al centro
- "alinear izquierda" → Alinea a la izquierda
- "alinear derecha" → Alinea a la derecha
- "justificar" → Texto justificado

💬 BLOQUES ESPECIALES:
- "cita" o "blockquote" → Bloque de cita
- "separador" → Línea horizontal
- "salto de página" → Separador visual

🔗 ENLACES E IMÁGENES:
- "enlace https://ejemplo.com" → Crear enlace
- "imagen https://ejemplo.com/img.jpg" → Insertar imagen
- "convertir en enlace" → Hace enlace del texto seleccionado

📺 MULTIMEDIA:
- "youtube https://youtube.com/watch?v=..." → Inserta video de YouTube
- "video de youtube" → Solicita URL para insertar

🎨 HERRAMIENTAS ESPECIALES:
- "canvas" o "dibujar" → Inserta canvas para dibujar
- "emoji" → Abre selector de emojis

📐 ACCIONES DE EDICIÓN:
- "eliminar párrafo" → Elimina el párrafo actual
- "duplicar línea" → Duplica la línea actual
- "mayúsculas" → Convierte a mayúsculas
- "minúsculas" → Convierte a minúsculas

COMANDOS DE IA COPILOT (Solo en modo Editor):
- "corrige ortografía" → Corrige errores del texto seleccionado
- "mejora este texto" → Reescribe mejorando redacción
- "resume este párrafo" → Hace resumen conciso
- "amplía esta idea" → Desarrolla más el concepto
- "traduce al inglés" → Traduce texto seleccionado
- "simplifica este texto" → Hace más fácil de entender
- "formaliza este texto" → Convierte a lenguaje formal
- "lista los puntos clave" → Extrae ideas principales

INSTRUCCIONES ESPECIALES:
- Si el usuario pide una herramienta, ejecutarla directamente en el editor
- Si pide corrección/edición, mostrar sugerencia con botones aceptar/rechazar
- Si pide crear contenido, generar e insertar directamente
- Siempre responder en español
- Ser proactivo sugiriendo herramientas relevantes
` : `
MODO CHAT ACTIVO:
- Solo proporcionar respuestas de texto
- NO ejecutar comandos en el editor
- Responder preguntas sobre documentos, contenido, ideas
- Dar consejos de escritura y formato
- Explicar conceptos y ayudar con investigación
- Analizar contenido de documentos seleccionados
- ANALIZAR ARCHIVOS ADJUNTOS: imágenes, documentos, código, etc.
`}

Fin del contexto completo.
      `.trim();
    }
    
    const toolCommand = detectToolCommand(inputText);
    
    if (mode === 'editor' && editorRef?.current?.editor) {
      setLoading(true);
      try {
        let aiResponse: string;
        let suggestionType: 'tool' | 'ai' = 'ai';
        
        if (toolCommand) {
          suggestionType = 'tool';
          
          if (isContentGeneration) {
            const aiPrompt = `${contextPrompt}\n\n${inputText}\n\nGenera el contenido solicitado aplicando los estilos y formatos pedidos. Responde SOLO con HTML listo para insertar en el editor, sin explicaciones.`;
            aiResponse = await askOpenAIGPT41Nano(aiPrompt);
          } else {
            aiResponse = generateToolContent(toolCommand, inputText);
          }
        } else {
          const editor = editorRef.current.editor;
          let selectedText = '';
          let hasSelection = false;
          
          if (editor) {
            const { state } = editor;
            const { from, to } = state.selection;
            if (from !== to) {
              selectedText = state.doc.textBetween(from, to, ' ');
              hasSelection = true;
            }
          }
          
          const aiPrompt = `${contextPrompt}\n\n${hasSelection 
            ? `Tengo el siguiente texto seleccionado:\n"""${selectedText}"""\n${inputText}` 
            : inputText}\n\nIMPORTANTE: Estás en MODO EDITOR. Responde solo con el texto editado, sin explicaciones adicionales.`;
          
          aiResponse = await askOpenAIGPT41Nano(aiPrompt);
        }
        
        const suggestionId = crypto.randomUUID();
        const suggestionMsg: Message = {
          role: 'assistant',
          content: aiResponse,
          id: suggestionId,
          status: 'pending'
        };
        
        setMessages(prev => [...prev, suggestionMsg]);
        
      } catch (error) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: 'Error al consultar la IA. No se pudo generar una sugerencia.', 
          id: crypto.randomUUID() 
        }]);
      } finally {
        setLoading(false);
        setAttachedFiles([]);
      }
      return;
    }

    setLoading(true);
    try {
      let aiPrompt = `${contextPrompt}\n\n${inputText}`;
      
      aiPrompt += `\n\nIMPORTANTE: Estás en MODO CHAT. Solo proporciona respuestas de texto. NO ejecutes comandos ni herramientas del editor. Responde de forma conversacional y útil sobre el tema consultado.`;

      const aiResponse = await askOpenAIGPT41Nano(aiPrompt);

      const aiMsg: Message = {
        role: 'assistant',
        content: aiResponse,
        id: crypto.randomUUID(),
      };
      setMessages(prev => [...prev, aiMsg]);
      
      setAttachedFiles([]);
      
    } catch {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Error al consultar la IA.', 
        id: crypto.randomUUID() 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const generateToolContent = (toolCommand: string, prompt: string): string => {
    switch (toolCommand) {
      case 'table': {
        const tableMatch = prompt.match(/(\d+)\s*[x×]\s*(\d+)|tabla de (\d+)|(\d+)\s+filas?\s+(\d+)\s+columnas?/i);
        let rows = 3, cols = 3;
        
        if (tableMatch) {
          if (tableMatch[1] && tableMatch[2]) {
            rows = parseInt(tableMatch[1]);
            cols = parseInt(tableMatch[2]);
          } else if (tableMatch[3]) {
            rows = cols = parseInt(tableMatch[3]);
          }
        }
        
        let tableHTML = '<table border="1" style="border-collapse: collapse; width: 100%;">\n';
        
        tableHTML += '<tr style="background-color: #f5f5f5;">\n';
        for (let c = 0; c < cols; c++) {
          tableHTML += `<th style="padding: 8px; border: 1px solid #ddd;">Encabezado ${c + 1}</th>\n`;
        }
        tableHTML += '</tr>\n';
        
        for (let r = 1; r < rows; r++) {
          tableHTML += '<tr>\n';
          for (let c = 0; c < cols; c++) {
            tableHTML += `<td style="padding: 8px; border: 1px solid #ddd;">Celda ${r}-${c + 1}</td>\n`;
          }
          tableHTML += '</tr>\n';
        }
        
        tableHTML += '</table>';
        return tableHTML;
      }
      
      case 'youtube': {
        const ytMatch = prompt.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/);
        const videoId = ytMatch ? ytMatch[1] : 'dQw4w9WgXcQ';
        
        return `<div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; background: #000; margin: 16px 0;">
          <iframe 
            src="https://www.youtube.com/embed/${videoId}" 
            style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;" 
            allowfullscreen>
          </iframe>
        </div>`;
      }
      
      case 'list':
        return `<ul>
          <li>Elemento de lista 1</li>
          <li>Elemento de lista 2</li>
          <li>Elemento de lista 3</li>
        </ul>`;
      
      case 'orderedList':
        return `<ol>
          <li>Primer elemento</li>
          <li>Segundo elemento</li>
          <li>Tercer elemento</li>
        </ol>`;
      
      case 'quote':
        return `<blockquote style="border-left: 4px solid #ddd; margin: 16px 0; padding: 8px 16px; background-color: #f9f9f9;">
          Texto de cita o referencia importante
        </blockquote>`;
      
      case 'separator':
        return `<hr style="border: none; border-top: 2px solid #ddd; margin: 20px 0;">`;
      
      default:
        return `<p>Contenido generado para: ${toolCommand}</p>`;
    }
  };

  const handleAcceptSuggestion = (messageId: string, suggestionText: string) => {
    const msgIndex = messages.findIndex(msg => msg.id === messageId);
    const userMessage = msgIndex > 0 ? messages[msgIndex - 1] : null;
    
    const editType = userMessage ? getEditType(userMessage.content) : 'add';
    const toolCommand = userMessage ? detectToolCommand(userMessage.content) : null;
    
    if (toolCommand) {
      const executed = executeToolCommand(toolCommand, userMessage.content);
      if (!executed) {
        if (onInsertText) {
          onInsertText(suggestionText, 'add');
        }
      }
    } else {
      if (onInsertText) {
        if (editType === 'remove') {
          onInsertText('', editType);
        } else {
          onInsertText(suggestionText, editType);
        }
      }
    }
    
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, status: 'accepted' as const }
        : msg
    ));
  };

  const handleRejectSuggestion = (messageId: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, status: 'rejected' as const }
        : msg
    ));
  };

  const switchToEditorMode = () => setMode('editor');
  const switchToChatMode = () => setMode('chat');

  if (!open) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-full max-w-md bg-background border border-muted rounded-2xl shadow-2xl flex flex-col h-[540px] overflow-hidden transition-all">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.txt,.md,.json,.csv,.docx"
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="flex items-center justify-between px-5 py-3 border-b bg-muted/60">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <span className="font-semibold text-lg">ChatGPT Copilot</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>
      
      <div className="flex gap-2 px-5 py-2 border-b bg-background items-center">
        <div className="flex gap-1 items-center">
          <MessageSquare className={`h-4 w-4 ${mode === 'chat' ? 'text-primary' : 'text-muted-foreground'}`} />
          <Button
            size="sm"
            variant={mode === 'chat' ? 'default' : 'outline'}
            onClick={switchToChatMode}
            className="rounded-full px-4"
          >
            Chat
          </Button>
          <FileEdit className={`h-4 w-4 ${mode === 'editor' ? 'text-primary' : 'text-muted-foreground'}`} />
          <Button
            size="sm"
            variant={mode === 'editor' ? 'default' : 'outline'}
            onClick={switchToEditorMode}
            className="rounded-full px-4"
          >
            Editor
          </Button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2 bg-background">
        {contextLoaded && contextData.documents.length > 0 && (
          <div className="mb-3">
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Analizar documento:
            </label>
            <select
              className="w-full text-xs border rounded px-2 py-1 bg-muted/40 focus:outline-none focus:ring-2 focus:ring-primary"
              value={selectedDocId || ''}
              onChange={e => handleSelectDocForContext(e.target.value)}
            >
              <option value="">(Ninguno seleccionado)</option>
              {contextData.documents.map(doc => (
                <option key={doc.id} value={doc.id}>
                  {doc.title}{doc.shared ? ' (compartido)' : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {attachedFiles.length > 0 && (
          <div className="mb-3 p-3 bg-muted/20 rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">
                Archivos adjuntos ({attachedFiles.length}/5)
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setAttachedFiles([])}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {attachedFiles.map((file) => (
                <div key={file.id} className="flex items-center gap-2 p-2 bg-background rounded border">
                  {file.isImage ? (
                    <div className="flex-shrink-0">
                      <img 
                        src={file.preview} 
                        alt={file.name}
                        className="w-8 h-8 object-cover rounded"
                      />
                    </div>
                  ) : (
                    <div className="flex-shrink-0">
                      {file.type.includes('pdf') ? (
                        <FileText className="h-4 w-4 text-red-500" />
                      ) : (
                        <File className="h-4 w-4 text-blue-500" />
                      )}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeAttachedFile(file.id)}
                    className="h-6 w-6 p-0 text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {mode === 'chat' && messages.length === 0 && !loading && (
          <div className="text-muted-foreground text-sm text-center mt-10">
            <p><strong>💬 Modo Chat Activo</strong></p>
            <p className="mt-2">Pregúntame sobre:</p>
            <div className="text-left bg-muted/40 p-3 rounded-lg border mt-4">
              <div className="text-xs space-y-1">
                <p><strong>📎 Archivos adjuntos:</strong></p>
                <p>• Analiza imágenes, documentos PDF, Word</p>
                <p>• Revisa código, archivos de texto</p>
                <p>• Extrae información de tablas CSV</p>
                <p><strong>📖 Análisis de documentos:</strong></p>
                <p>• "Resume este documento"</p>
                <p>• "¿Cuáles son los puntos clave?"</p>
                <p>• "Explícame esta sección"</p>
                <p><strong>💡 Ayuda con escritura:</strong></p>
                <p>• "¿Cómo mejorar este párrafo?"</p>
                <p>• "Ideas para desarrollar este tema"</p>
                <p>• "Sinónimos para esta palabra"</p>
                <p><strong>🔍 Investigación:</strong></p>
                <p>• "Información sobre este tema"</p>
                <p>• "Ejemplos relacionados"</p>
                <p>• "Conceptos similares"</p>
                <p className="text-yellow-600 font-medium">ℹ️ Cambia a Modo Editor para usar herramientas</p>
              </div>
            </div>
          </div>
        )}
        
        {mode === 'editor' && messages.length === 0 && !loading && !isEditorProcessing && (
          <div className="space-y-4 text-center mt-10">
            <div className="text-muted-foreground text-sm">
              <p><strong>⚡ Modo Editor Copilot</strong></p>
              <p className="mt-2">Todos los cambios te mostrarán opciones para mantener o deshacer.</p>
              <div className="flex flex-col gap-2 mt-4 text-left bg-muted/40 p-3 rounded-lg border">
                <div className="text-xs space-y-1">
                  <p><strong>📎 Con archivos adjuntos:</strong></p>
                  <p>• "Inserta el contenido de este documento"</p>
                  <p>• "Crea una tabla con estos datos CSV"</p>
                  <p>• "Transcribe el texto de esta imagen"</p>
                  <p><strong>🛠️ Herramientas directas (sin confirmación):</strong></p>
                  <p>• "crear tabla 4x3"</p>
                  <p>• "texto rojo"</p>
                  <p>• "lista numerada"</p>
                  <p><strong>🤖 IA Copilot (con confirmación):</strong></p>
                  <p>• "corrige ortografía"</p>
                  <p>• "mejora este texto"</p>
                  <p>• "resume este párrafo"</p>
                  <p>• "traduce al inglés"</p>
                  <p>• "elimina este párrafo"</p>
                  <p className="text-blue-600 font-medium">⚡ Opciones: Mantener / Deshacer</p>
                </div>
              </div>
            </div>
            <div className="pt-4 mt-4 border-t border-dashed flex items-center justify-center text-xs text-muted-foreground">
              <ArrowRight className="h-3 w-3 mr-1" />
              <span>Todos los cambios de IA mostrarán opciones de confirmación</span>
            </div>
          </div>
        )}
        
        <div className="flex flex-col gap-2">
          {messages.map((msg, index) => {
            const isAISuggestion = msg.role === 'assistant' && mode === 'editor' && msg.status === 'pending';
            const isAccepted = msg.status === 'accepted';
            const isRejected = msg.status === 'rejected';
            
            const userMessage = index > 0 ? messages[index - 1] : null;
            const editType = userMessage && isAISuggestion ? getEditType(userMessage.content) : null;
            
            return (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`rounded-xl px-4 py-2 max-w-[80%] text-sm whitespace-pre-line relative shadow-sm
                  ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 
                    isAccepted ? 'bg-green-50 text-green-900 border border-green-200' :
                    isRejected ? 'bg-red-50 text-red-900 border border-red-200' :
                    'bg-muted text-foreground'}
                `}>
                  {isAISuggestion && !isAccepted && !isRejected ? (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          {editType === 'add' && '➕ Sugerencia: Agregar texto'}
                          {editType === 'remove' && '🗑️ Sugerencia: Eliminar texto'}
                          {editType === 'replace' && '✏️ Sugerencia: Reemplazar texto'}
                          {!editType && '💡 Sugerencia de edición'}
                        </span>
                      </div>
                      <div className={`
                        p-3 rounded border-l-4 text-sm
                        ${editType === 'add' ? 'bg-green-50 text-green-900 border-l-green-500' : ''}
                        ${editType === 'remove' ? 'bg-red-50 text-red-900 border-l-red-500 line-through' : ''}
                        ${editType === 'replace' ? 'bg-yellow-50 text-yellow-900 border-l-yellow-500' : ''}
                        ${!editType ? 'bg-blue-50 text-blue-900 border-l-blue-500' : ''}
                      `}>
                        {msg.content}
                      </div>
                      <div className="flex gap-2 mt-3 pt-2 border-t border-muted">
                        <Button
                          size="sm"
                          variant="default"
                          className="h-7 px-3 text-xs bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => handleAcceptSuggestion(msg.id, msg.content)}
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Aceptar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-3 text-xs border-red-200 text-red-700 hover:bg-red-50"
                          onClick={() => handleRejectSuggestion(msg.id)}
                        >
                          <X className="h-3 w-3 mr-1" />
                          Rechazar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {isAccepted && (
                        <div className="flex items-center gap-2 mb-1">
                          <Check className="h-4 w-4 text-green-600" />
                          <span className="text-xs font-medium text-green-700">Cambio aplicado</span>
                        </div>
                      )}
                      {isRejected && (
                        <div className="flex items-center gap-2 mb-1">
                          <X className="h-4 w-4 text-red-600" />
                          <span className="text-xs font-medium text-red-700">Sugerencia descartada</span>
                        </div>
                      )}
                      {msg.content}
                    </>
                  )}
                  
                  {msg.role === 'assistant' && onInsertText && mode === 'chat' && !isAISuggestion && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="absolute top-1 right-1"
                      title="Insertar en el editor"
                      onClick={() => onInsertText(msg.content, null)}
                    >
                      <ClipboardPaste className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {(loading || isEditorProcessing || isProcessingFile) && (
          <div className="flex flex-col justify-center items-center h-24 gap-2">
            <Loader2 className="animate-spin h-8 w-8 text-primary" />
            <span className="text-primary font-medium text-sm">
              {isProcessingFile ? 'Procesando archivo...' : 
               mode === 'editor' ? 'Generando sugerencias...' : 'Procesando...'}
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
      
      <form
        className="flex gap-2 p-4 border-t bg-background"
        onSubmit={e => {
          e.preventDefault();
          if (!loading && !isEditorProcessing) handleSend();
        }}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={loading || isEditorProcessing || attachedFiles.length >= 5}
          className="flex-shrink-0"
          title="Adjuntar archivo"
        >
          <Paperclip className="h-4 w-4" />
        </Button>
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={
            attachedFiles.length > 0 
              ? `Analiza ${attachedFiles.length} archivo(s) adjunto(s)...`
              : mode === 'editor'
              ? "Describe lo que quieres que la IA genere en el editor..."
              : "Escribe tu pregunta o instrucción..."
          }
          disabled={loading || isEditorProcessing}
          className="flex-1 rounded-full px-4"
          autoFocus
        />
        <Button 
          type="submit" 
          disabled={loading || isEditorProcessing || (!input.trim() && attachedFiles.length === 0)} 
          className="flex-shrink-0 rounded-full"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
};
