import React, { useState, useRef, useEffect } from 'react';
import { askOpenAIGPT41Nano } from '@/lib/AIGPT41Nano';
import { generateUUID } from '@/lib/uuid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { X, Send, Bot, ClipboardPaste, MessageSquare, FileEdit, Loader2, ArrowRight, Paperclip, Image as ImageIcon, FileText, File, Trash2, Check, HelpCircle } from 'lucide-react';
import { useAuth } from "../hooks/useAuth";
import { toast } from '@/components/ui/use-toast';

type Mode = 'chat' | 'editor';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  id: string;
  status?: 'pending' | 'accepted' | 'rejected';
}

interface AIGPT41NanoChatProps {
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

export const AIGPT41NanoChat: React.FC<AIGPT41NanoChatProps> = ({ 
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

  const { getToken, user } = useAuth();
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
          userName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || '',
          documents,
          categories,
        });
        setContextLoaded(true);
      } catch (err) {
        setContextLoaded(false);
      }
    };
    if (open) fetchContext();
  }, [open, getToken, user?.id, user?.firstName, user?.lastName]);

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
      formula: /fórmula|ecuación|matemática|símbolo matemático|notación|math|equation|\\[.*\\]|\$.*\$|LaTeX/i,
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

    // Verificación adicional de seguridad
    if (!editor.isEditable) {
      console.warn('Editor no está en modo editable');
      return false;
    }

    try {
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
        
        try {
          editor.chain().focus().insertTable({ 
            rows: Math.max(1, Math.min(rows, 20)), 
            cols: Math.max(1, Math.min(cols, 10)), 
            withHeaderRow: hasHeaders !== false 
          }).run();
        } catch (error) {
          // Fallback con HTML si el comando insertTable no funciona
          const tableHTML = generateToolContent('table', prompt);
          editor.chain().focus().insertContent(tableHTML).run();
        }
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
        try {
          editor.chain().focus().toggleBold().run();
        } catch (error) {
          const { state } = editor;
          const { from, to } = state.selection;
          if (from !== to) {
            const selectedText = state.doc.textBetween(from, to, ' ');
            editor.chain().focus().insertContentAt({ from, to }, `<strong>${selectedText}</strong>`).run();
          } else {
            editor.chain().focus().insertContent('<strong>texto en negrita</strong>').run();
          }
        }
        return true;

      case 'italic':
        try {
          editor.chain().focus().toggleItalic().run();
        } catch (error) {
          const { state } = editor;
          const { from, to } = state.selection;
          if (from !== to) {
            const selectedText = state.doc.textBetween(from, to, ' ');
            editor.chain().focus().insertContentAt({ from, to }, `<em>${selectedText}</em>`).run();
          } else {
            editor.chain().focus().insertContent('<em>texto en cursiva</em>').run();
          }
        }
        return true;

      case 'underline':
        try {
          editor.chain().focus().toggleUnderline().run();
        } catch (error) {
          const { state } = editor;
          const { from, to } = state.selection;
          if (from !== to) {
            const selectedText = state.doc.textBetween(from, to, ' ');
            editor.chain().focus().insertContentAt({ from, to }, `<u>${selectedText}</u>`).run();
          } else {
            editor.chain().focus().insertContent('<u>texto subrayado</u>').run();
          }
        }
        return true;

      case 'strikethrough':
        try {
          editor.chain().focus().toggleStrike().run();
        } catch (error) {
          const { state } = editor;
          const { from, to } = state.selection;
          if (from !== to) {
            const selectedText = state.doc.textBetween(from, to, ' ');
            editor.chain().focus().insertContentAt({ from, to }, `<s>${selectedText}</s>`).run();
          } else {
            editor.chain().focus().insertContent('<s>texto tachado</s>').run();
          }
        }
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
        try {
          // Intentar usar comando personalizado si existe, sino usar HTML
          if (editor.commands.insertCanvas) {
            editor.chain().focus().insertCanvas().run();
          } else {
            const canvasHTML = `<canvas width="400" height="300" style="border: 1px solid #ccc; background: white; display: block; margin: 10px auto;"></canvas>`;
            editor.chain().focus().insertContent(canvasHTML).run();
          }
        } catch (error) {
          // Fallback seguro
          const drawingArea = `<div style="width: 400px; height: 300px; border: 2px dashed #ccc; display: flex; align-items: center; justify-content: center; margin: 10px auto; background: #f9f9f9; color: #666;">Área de dibujo (Canvas)</div>`;
          editor.chain().focus().insertContent(drawingArea).run();
        }
        return true;

      case 'emoji': {
        // Detectar emojis específicos en el prompt o insertar por nombre
        const emojiMatch = prompt.match(/😀|😃|😄|😁|😆|😅|😂|🤣|😊|😇|🙂|🙃|😉|😌|😍|🥰|😘|😗|😙|😚|😋|😛|😝|😜|🤪|🤨|🧐|🤓|😎|🤩|🥳|😏|😒|😞|😔|😟|😕|🙁|☹️|😣|😖|😫|😩|🥺|😢|😭|😤|😠|😡|🤬|🤯|😳|🥵|🥶|😱|😨|😰|😥|😓|🤗|🤔|🤭|🤫|🤥|😶|😐|😑|😬|🙄|😯|😦|😧|😮|😲|🥱|😴|🤤|😪|😵|🤐|🥴|🤢|🤮|🤧|😷|🤒|🤕|👍|👎|👏|🙌|✋|🤚|🖐️|✌️|🤞|🤟|🤘|🤙|👌|👈|👉|👆|👇|☝️|✊|👊|🤛|🤜|👋|🤝|💪|🦾|🤳|✍️|🙏|💅|🦵|🦿|🦶|👂|🦻|👃|🧠|🦷|🦴|👀|👁️|👅|👄|💋|🩸|❤️|🧡|💛|💚|💙|💜|🤍|🖤|🤎|💔|❣️|💕|💞|💓|💗|💖|💘|💝|💟|☮️|✝️|☪️|🕉️|☸️|✡️|🔯|🕎|☯️|☦️|🛐|⛎|♈|♉|♊|♋|♌|♍|♎|♏|♐|♑|♒|♓|🆔|⚛️|🉑|☢️|☣️|📴|📳|🈶|🈚|🈸|🈺|🈷️|✴️|🆚|💮|🉐|㊙️|㊗️|🈴|🈵|🈹|🈲|🅰️|🅱️|🆎|🆑|🅾️|🆘|❌|⭕|🛑|⛔|📛|🚫|💯|💢|♨️|🚷|🚯|🚳|🚱|🔞|📵|🚭|❗|❕|❓|❔|‼️|⁉️|🔅|🔆|〽️|⚠️|🚸|🔱|⚜️|🔰|♻️|✅|🈯|💹|❇️|✳️|❎|🌐|💠|Ⓜ️|🌀|💤|🏧|🚾|♿|🅿️|🈳|🈂️|🛂|🛃|🛄|🛅|🚹|🚺|🚼|🚻|🚮|🎦|📶|🈁|🔣|ℹ️|🔤|🔡|🔠|🆖|🆗|🆙|🆒|🆕|🆓|0️⃣|1️⃣|2️⃣|3️⃣|4️⃣|5️⃣|6️⃣|7️⃣|8️⃣|9️⃣|🔟|🔢|#️⃣|⭐|☀️|🌙|💧|🌳|🌸|🏠|🚗|✈️|🚢|⏰|💰|🎁|🎉|🎵|📖|📱|📧|✅|❌|❓|❗|👁️|🧠|✋|💪|🔥/);
        
        if (emojiMatch) {
          editor.chain().focus().insertContent(emojiMatch[0]).run();
        } else {
          // Detectar emojis por nombre en español
          const emojiMap: { [key: string]: string } = {
            'sonrisa': '😊', 'feliz': '😀', 'risa': '😂', 'guiño': '😉',
            'corazón': '❤️', 'amor': '💕', 'like': '👍', 'pulgar arriba': '👍',
            'pulgar abajo': '👎', 'ok': '👌', 'paz': '✌️', 'saludo': '👋',
            'aplausos': '👏', 'fuego': '🔥', 'estrella': '⭐', 'sol': '☀️',
            'luna': '🌙', 'agua': '💧', 'árbol': '🌳', 'flor': '🌸',
            'casa': '🏠', 'coche': '🚗', 'avión': '✈️', 'barco': '🚢',
            'tiempo': '⏰', 'dinero': '💰', 'regalo': '🎁', 'fiesta': '🎉',
            'música': '🎵', 'libro': '📖', 'teléfono': '📱', 'email': '📧',
            'check': '✅', 'cruz': '❌', 'pregunta': '❓', 'exclamación': '❗',
            'ojo': '👁️', 'cerebro': '🧠', 'mano': '✋', 'fuerza': '💪'
          };
          
          // Buscar emojis por nombre en el prompt
          let emojiFound = false;
          for (const [name, emoji] of Object.entries(emojiMap)) {
            if (new RegExp(name, 'i').test(prompt)) {
              editor.chain().focus().insertContent(emoji).run();
              emojiFound = true;
              break;
            }
          }
          
          // Si no se encuentra, insertar un emoji por defecto
          if (!emojiFound) {
            editor.chain().focus().insertContent('😊').run();
          }
        }
        return true;
      }

      case 'small':
        try {
          const { state } = editor;
          const { from, to } = state.selection;
          if (from !== to) {
            const selectedText = state.doc.textBetween(from, to, ' ');
            editor.chain().focus().insertContentAt({ from, to }, `<small>${selectedText}</small>`).run();
          } else {
            editor.chain().focus().insertContent('<small>texto pequeño</small>').run();
          }
        } catch (error) {
          editor.chain().focus().insertContent('<span style="font-size: 0.8em;">texto pequeño</span>').run();
        }
        return true;

      case 'large':
        try {
          const { state } = editor;
          const { from, to } = state.selection;
          if (from !== to) {
            const selectedText = state.doc.textBetween(from, to, ' ');
            editor.chain().focus().insertContentAt({ from, to }, `<span style="font-size: 1.25em;">${selectedText}</span>`).run();
          } else {
            editor.chain().focus().insertContent('<span style="font-size: 1.25em;">texto grande</span>').run();
          }
        } catch (error) {
          editor.chain().focus().insertContent('<big>texto grande</big>').run();
        }
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
        } else if (/salto|nueva línea/i.test(prompt)) {
          try {
            editor.chain().focus().setHardBreak().run();
          } catch (error) {
            editor.chain().focus().insertContent('<br>').run();
          }
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

      case 'formula':
      case 'equation': {
        // Extraer la fórmula del prompt de varias maneras
        let mathExpression = '';
        
        // Buscar LaTeX entre $ o \[ \]
        const latexMatch = prompt.match(/\$(.*?)\$|\\\[(.*?)\\\]/);
        if (latexMatch) {
          mathExpression = latexMatch[1] || latexMatch[2];
        } else {
          // Buscar después de palabras clave
          const formulaMatch = prompt.match(/(?:fórmula|ecuación|matemática|math|equation)[\s:]+(.+?)(?:\.|$)/i);
          if (formulaMatch) {
            mathExpression = formulaMatch[1].trim();
          } else {
            // Tomar todo después de las palabras clave
            mathExpression = prompt.replace(/^.*?(?:fórmula|ecuación|matemática|math|equation)[\s:]*/gi, '').trim();
          }
        }
        
        // Limpiar la expresión
        mathExpression = mathExpression.replace(/^["']|["']$/g, '').trim();
        
        // Si no se encuentra una expresión específica, usar ejemplos comunes basados en keywords
        if (!mathExpression || mathExpression.length < 2) {
          if (/cuadrática|quadratic/i.test(prompt)) {
            mathExpression = 'ax^2 + bx + c = 0';
          } else if (/pitágoras|pythagoras|teorema/i.test(prompt)) {
            mathExpression = 'a^2 + b^2 = c^2';
          } else if (/einstein|relatividad|energía/i.test(prompt)) {
            mathExpression = 'E = mc^2';
          } else if (/integral/i.test(prompt)) {
            mathExpression = '\\int_a^b f(x) dx';
          } else if (/derivada|derivative/i.test(prompt)) {
            mathExpression = '\\frac{d}{dx}f(x)';
          } else if (/suma|sum|sumatoria/i.test(prompt)) {
            mathExpression = '\\sum_{i=1}^{n} x_i';
          } else if (/límite|limit/i.test(prompt)) {
            mathExpression = '\\lim_{x \\to \\infty} f(x)';
          } else if (/matriz|matrix/i.test(prompt)) {
            mathExpression = '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}';
          } else if (/raíz|sqrt|square root/i.test(prompt)) {
            mathExpression = '\\sqrt{x}';
          } else if (/fracción|fraction/i.test(prompt)) {
            mathExpression = '\\frac{a}{b}';
          } else {
            // Usar el texto después de limpiar palabras clave, o ejemplo por defecto
            const cleanText = prompt.replace(/(?:crear|agregar|insertar|añadir|poner|escribir)?\s*(?:fórmula|ecuación|matemática|math|equation)?\s*/gi, '').trim();
            mathExpression = cleanText.length > 1 ? cleanText : 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}';
          }
        }
        
        // Usar formato LaTeX que funciona bien ($...$)
        const isInline = /inline|en línea|pequeña/i.test(prompt);
        const mathText = isInline ? `$${mathExpression}$` : `$$${mathExpression}$$`;
        
        editor.chain().focus().insertContent(mathText).run();
        return true;
      }

      case 'fraction': {
        const fractionMatch = prompt.match(/(\d+)\/(\d+)|(\d+)\s+sobre\s+(\d+)/i);
        let numerator = '1', denominator = '2';
        
        if (fractionMatch) {
          numerator = fractionMatch[1] || fractionMatch[3] || '1';
          denominator = fractionMatch[2] || fractionMatch[4] || '2';
        }
        
        // Usar formato LaTeX que funciona bien
        const fractionText = `$\\frac{${numerator}}{${denominator}}$`;
        editor.chain().focus().insertContent(fractionText).run();
        return true;
      }

      case 'video': {
        if (!/youtube/i.test(prompt)) {
          const videoMatch = prompt.match(/https?:\/\/[^\s]+\.(mp4|webm|ogg|mov)/i);
          const videoUrl = videoMatch ? videoMatch[0] : window.prompt('Ingresa la URL del video:');
          if (videoUrl) {
            const videoHTML = `<video controls style="max-width: 100%; height: auto;">
              <source src="${videoUrl}" type="video/mp4">
              Tu navegador no soporta el elemento video.
            </video>`;
            editor.chain().focus().insertContent(videoHTML).run();
          }
        }
        return true;
      }













      default:
        return false;
      }
    } catch (error) {
      console.error('Error ejecutando comando de herramienta:', error);
      return false;
    }
  };

  const processFile = async (file: File): Promise<AttachedFile | null> => {
    try {
      setIsProcessingFile(true);
      
      const fileId = generateUUID();
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
                .map((item: { str?: string; [key: string]: unknown }) => item.str || '')
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

    const userMsg: Message = { role: 'user', content: input, id: generateUUID() };
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
=== HERRAMIENTAS COMPLETAS DEL EDITOR DISPONIBLES ===

📝 FORMATO DE TEXTO BÁSICO:
• BoldButton - "negrita" / "bold" → Aplica <strong> (Ctrl+B)
  - Estados: activo/inactivo, combina con otros formatos
  - Icono: Bold, funciona con selección o al escribir

• ItalicButton - "cursiva" / "italic" → Aplica <em> (Ctrl+I)
  - Estados: activo/inactivo, compatible con todos los elementos
  - Icono: Italic, funciona con selección o al escribir

• UnderlineButton - "subrayado" / "underline" → Aplica <u> (Ctrl+U)
  - Estados: activo/inactivo, compatible con otros formatos
  - Icono: Underline

• StrikeButton - "tachado" / "strikethrough" → Aplica <s> (Ctrl+Shift+X)
  - Estados: activo/inactivo, útil para ediciones
  - Icono: Strikethrough

• CodeButton - "código inline" → Aplica <code> (Ctrl+E)
  - Estados: activo/inactivo, formato monospace
  - Estilo: background y border diferenciado
  - Icono: Code

• SuperscriptButton - "superíndice" → texto<sup>2</sup>
  - Estados: activo/inactivo, desactiva subscript
  - Útil para exponentes, referencias
  - Icono: Superscript

• SubscriptButton - "subíndice" → H<sub>2</sub>O
  - Estados: activo/inactivo, desactiva superscript
  - Útil para fórmulas químicas
  - Icono: Subscript

🎨 COLORES Y ESTILOS:
• ColorButton - Control completo de colores de texto
  - Colores predefinidos: Purple (#958DF1), Red (#F98181), Orange (#FBBC88), 
    Yellow (#FAF594), Blue (#70CFF8), Teal (#94FADB), Green (#B9F18D)
  - Color personalizado con picker hexadecimal
  - Estados: muestra color actual, función unsetColor()
  - Icono: Palette con DropdownMenu

• HighlightButton - "resaltar" / "fondo amarillo"
  - Resaltado de fondo para destacar texto
  - Estados: activo/inactivo, color personalizable
  - Icono: Highlighter

• FontFamilyButton - Selector de familias tipográficas
  - Fuentes: Inter/Sans-serif, Georgia/Serif, Menlo/Monospace
  - Estados: muestra fuente actual, preview en dropdown
  - Icono: Type

• TypographyButton - Estilos tipográficos predefinidos
  - Conjuntos coherentes de estilos
  - Estados: muestra estilo actual

📊 ESTRUCTURA Y JERARQUÍA:
• HeadingButton - Sistema completo H1-H6 con configuraciones específicas:
  - H1: "título 1" → text-3xl, Ctrl+Alt+1 (títulos principales)
  - H2: "título 2" → text-2xl, Ctrl+Alt+2 (subtítulos)
  - H3: "título 3" → text-xl, Ctrl+Alt+3 (secciones)
  - H4: "título 4" → text-lg, Ctrl+Alt+4 (subsecciones)
  - H5: "título 5" → text-base, Ctrl+Alt+5 (puntos menores)
  - H6: "título 6" → text-sm, Ctrl+Alt+6 (detalles)
  - Estados: activo por nivel, iconos Heading1-6
  - Variantes: button individual o dropdown completo

• ParagraphButton - "párrafo normal" / "texto normal"
  - Convierte elementos a párrafo estándar
  - Remueve formatos de encabezado
  - Icono: Pilcrow

• TextAlignButton - Alineación completa:
  - "alinear izquierda" → text-align: left
  - "centrar" → text-align: center  
  - "alinear derecha" → text-align: right
  - "justificar" → text-align: justify
  - Estados: muestra alineación actual
  - Iconos: AlignLeft, AlignCenter, AlignRight, AlignJustify

📋 LISTAS Y ORGANIZACIÓN:
• BulletListButton - "lista con viñetas" / "lista bullets"
  - Lista no ordenada con puntos (•)
  - Estados: activo/inactivo, anidamiento con Tab
  - Icono: List

• OrderedListButton - "lista numerada" / "lista ordenada" 
  - Lista con números (1, 2, 3...)
  - Estados: numeración automática, sub-numeración
  - Icono: ListOrdered

• TaskListButton - "lista de tareas" / "checklist"
  - Checkboxes interactivos ☐ ☑
  - Estados: items marcados/desmarcados
  - Funcionalidad to-do completa
  - Icono: CheckSquare

• ListItemButton - Control de elementos individuales
  - Sangría, conversión entre tipos
  - Estados: posición en jerarquía

🔗 ENLACES Y REFERENCIAS:
• LinkButton - Sistema MUY AVANZADO de enlaces:
  - Enlace rápido: prompt simple para URL
  - Enlace avanzado: diálogo con configuración completa
    * URL personalizable
    * Target: _blank, _self, _parent, _top
    * Edición de enlaces existentes
    * Apertura en nueva pestaña
    * Eliminación de enlaces
  - Estados: activo/inactivo, muestra URL actual
  - Atajos: Ctrl+K
  - Iconos: Link, ExternalLink, Unlink, Edit
  - Variantes: toggle, button, dropdown

• DocumentButton - Enlaces a documentos internos
  - Navegación entre documentos del proyecto
  - Integración con permisos

• DocumentSelector - Selector visual de documentos
  - Lista filtrable de documentos disponibles
  - Estados de permisos (compartido/privado)

🖼️ MULTIMEDIA Y CONTENIDO:
• ImageButton - Sistema completo de imágenes:
  - Inserción por URL o upload
  - Configuraciones: alt text, dimensiones, alineación
  - Estados: loading, error, success
  - Formatos: JPG, PNG, GIF, SVG, WebP
  - Icono: Image

• ImageLinkDialog - Configuración avanzada de imágenes
  - Preview en tiempo real
  - Opciones de accesibilidad

• YoutubeButton - Videos embebidos de YouTube:
  - Inserción por URL de YouTube
  - Configuraciones: autoplay, loop, controls
  - Estados: loading, playing, error
  - Responsive automático
  - Icono: Youtube

• YoutubeLinkDialog - Configuración avanzada de videos
  - Opciones de reproducción y privacidad

📊 TABLAS - SISTEMA MUY COMPLETO:
• TableButton - Inserción y gestión completa:
  - Configuraciones: dimensiones personalizables (filas x columnas)
  - Con/sin encabezados, estilos predefinidos
  - Estados: dentro/fuera de tabla
  - Iconos: Table, Grid3X3, Plus, Minus, Trash2

• TableActions - Acciones contextuales:
  - Agregar/eliminar filas y columnas
  - Posicionamiento: antes/después de actual

• TableCellButton - Gestión de celdas:
  - Fusión (merge) y división (split) de celdas
  - Alineación de contenido
  - Estados: celda seleccionada, fusionada

• TableHeaderButton - Control de encabezados:
  - Conversión fila ↔ encabezado
  - Estilos especiales para headers

• TableRowButton - Gestión de filas:
  - Agregar fila arriba/abajo, eliminar, mover
  - Estados: fila actual, número

• TableMenu - Menú contextual completo
  - Todas las acciones en un menú organizado

• TableSelector - Selector visual de dimensiones
  - Grid interactivo para elegir tamaño

🧮 FUNCIONES AVANZADAS:
• MathematicsButton - Fórmulas matemáticas completas:
  - Soporte LaTeX/KaTeX completo
  - Modos: inline y bloque
  - Preview en tiempo real
  - Ejemplos: fracciones, integrales, matrices
  - Estados: editing, preview, error
  - Icono: Calculator

• CodeBlockButton - Bloques de código simples:
  - Código multilínea con formato preservado
  - Estados: activo/inactivo
  - Icono: Code

• CodeBlockLowlightButton - Código con sintaxis highlighting:
  - Integración con Lowlight
  - Lenguajes: JavaScript, TypeScript, Python, HTML, CSS, JSON, etc.
  - Numeración de líneas opcional
  - Temas de color configurables

• CodeBlockLanguages - Selector de lenguajes:
  - Lista completa de lenguajes soportados
  - Detección automática de sintaxis

� CONTENIDO ESTRUCTURADO:
• BlockquoteButton - Citas en bloque elegantes:
  - Formato especial con sangría y estilos
  - Compatible con atribución de autor
  - Estados: activo/inactivo
  - Icono: Quote

• DetailsButton - Elementos desplegables/colapsables:
  - Contenido expandible/contraíble
  - Estados: expandido/colapsado
  - HTML semántico con <details>

• DetailsSummaryButton - Títulos para details:
  - Encabezado clickeable para details
  - Icono de expansión automático

• DetailsContentButton - Contenido de details:
  - Área colapsable según estado

• TableOfContentsButton - Tabla de contenidos automática:
  - Generación desde encabezados H1-H6
  - Navegación interna con anclas
  - Estados: actualización en tiempo real

🎯 HERRAMIENTAS ESPECIALES:
• EmojiButton + EmojiPicker - Sistema completo de emojis:
  - Categorías: caras, objetos, naturaleza, etc.
  - Búsqueda por nombre
  - Historial de uso y populares
  - Icono: Smile

• MentionButton - Menciones @usuario:
  - Autocompletado de usuarios del sistema
  - Integración con notificaciones
  - Estados: buscando, seleccionado

• PlaceholderButton - Textos placeholder/template:
  - Campos rellenables para plantillas
  - Estados: placeholder vs contenido real

• HardBreakButton - Saltos de línea forzados:
  - <br> en lugar de párrafos nuevos
  - Útil para direcciones, poemas
  - Atajo: Shift+Enter

🔧 PRODUCTIVIDAD Y GESTIÓN:
• HistoryButton/UndoButton/RedoButton - Historial completo:
  - Estados: can undo/redo, posición en historial
  - Atajos: Ctrl+Z (undo), Ctrl+Y (redo)
  - Iconos: Undo, Redo
  - Historial ilimitado en sesión

• FileHandlerButton - Gestión de archivos:
  - Upload: imágenes, documentos, PDFs
  - Estados: uploading, success, error
  - Drag & drop integrado
  - Icono: Upload

• DragHandleWrapper - Arrastrar y reordenar:
  - Drag handle visual para reordenar elementos
  - Estados: dragging, drop zones
  - Feedback visual durante drag
  - Icono: GripVertical

• FocusButton - Modo concentración:
  - Oculta distracciones de interfaz
  - Estados: focus mode on/off
  - Resalta solo contenido
  - Icono: Focus

• InvisibleCharactersButton - Caracteres invisibles:
  - Visualización: •(espacio), →(tab), ↵(enter)
  - Estados: visible/oculto
  - Útil para debug de formato
  - Icono: Eye

🎨 ELEMENTOS DECORATIVOS:
• HorizontalRuleButton - Líneas divisorias:
  - Separadores visuales elegantes
  - Estilos: simple, doble, punteada
  - Icono: Minus

• CanvasComponent - Lienzo para dibujar:
  - Herramienta de dibujo integrada
  - Colores y pinceles configurables
  - Export como imagen

🖱️ INTERFACES Y MENÚS:
• BubbleMenuComponent - Menú flotante contextual:
  - Aparece al seleccionar texto
  - Modos: compacto (Negrita, Cursiva, Enlace, Más) y expandido (todas las herramientas)
  - Herramientas disponibles:
    * Formato básico: Bold, Italic, Underline, Strike, Code
    * Color y fuente: selector de colores, selector de fuentes
    * Enlaces: enlace externo, enlace documento interno
    * Alineación: izquierda, centro, derecha
    * Operaciones: copiar, cortar, descargar, compartir, limpiar estilos
  - Animaciones suaves, expandible/contraíble

• FloatingMenuComponent - Menú para líneas vacías:
  - Aparece en líneas sin contenido
  - Inserción rápida de elementos
  - Integración con todas las herramientas

• ToolbarButton - Botones genéricos reutilizables:
  - Componente base con tooltips integrados
  - Estados: activo/inactivo, disabled
  - Variants: ghost, default, outline

• VersionSelector - Control de versiones:
  - Historial de versiones guardadas
  - Comparación y restauración
  - Estados: versión actual, cambios sin guardar

=== COMANDOS DE IA COPILOT ESPECIALIZADOS ===

📋 COMANDOS DE TABLA:
- "crear tabla 3x4" → Inserta tabla de 3 filas y 4 columnas con encabezados
- "tabla simple 2x2" → Tabla básica sin encabezados  
- "tabla de datos" → Tabla optimizada para información
- "tabla de precios" → Formato para precios/números
- "agregar fila" → Añade fila a tabla existente
- "eliminar columna" → Remueve columna de tabla
- "combinar celdas" → Une celdas seleccionadas
- "centrar tabla" → Alinea tabla al centro

📝 COMANDOS DE FORMATO:
- "negrita" → Aplica formato bold al texto seleccionado
- "cursiva" → Aplica formato italic
- "subrayado" → Subraya el texto
- "tachado" → Aplica strikethrough
- "código inline" → Formato de código en línea
- "quitar formato" → Remueve todos los formatos

🎨 COMANDOS DE COLOR:
- "texto rojo", "texto azul", "texto verde" → Cambia color específico
- "color personalizado #ff0000" → Aplica color hexadecimal
- "fondo amarillo" → Resalta con color de fondo
- "quitar color" → Remueve estilos de color

📊 COMANDOS DE ENCABEZADOS:
- "título 1" / "h1" → Encabezado nivel 1 (text-3xl)
- "título 2" / "h2" → Encabezado nivel 2 (text-2xl)  
- "título 3" / "h3" → Encabezado nivel 3 (text-xl)
- "subtítulo" → H2 con formato elegante
- "convertir a párrafo" → Cambia a texto normal

📋 COMANDOS DE LISTAS:
- "lista con viñetas" → Lista bullet points
- "lista numerada" → Lista con números secuenciales
- "lista de tareas" → Checklist con checkboxes
- "convertir en lista" → Convierte párrafos seleccionados

🎯 COMANDOS DE ALINEACIÓN:
- "centrar texto" → Alinea al centro
- "alinear izquierda" → Alinea a la izquierda
- "alinear derecha" → Alinea a la derecha
- "justificar" → Texto justificado completo

� COMANDOS DE ENLACES:
- "enlace https://ejemplo.com" → Crear enlace con URL
- "enlace avanzado" → Abrir diálogo de configuración completa
- "quitar enlace" → Elimina enlace pero mantiene texto
- "abrir en nueva pestaña" → Configura target="_blank"

🖼️ COMANDOS DE MULTIMEDIA:
- "imagen https://ejemplo.com/img.jpg" → Insertar imagen por URL
- "youtube https://youtube.com/watch?v=..." → Insertar video YouTube
- "subir imagen" → Abrir selector de archivos
- "imagen centrada" → Imagen alineada al centro

💬 COMANDOS DE BLOQUES ESPECIALES:
- "cita" / "blockquote" → Bloque de cita elegante
- "código" / "bloque de código" → Código multilínea
- "separador" → Línea horizontal divisoria
- "salto de línea" → Hard break con Shift+Enter

🎨 COMANDOS DECORATIVOS:
- "canvas" / "dibujar" → Inserta lienzo para dibujar
- "emoji" → Abre selector de emojis completo
- "caracteres invisibles" → Muestra espacios y tabs
- "modo concentración" → Activa focus mode

📐 COMANDOS DE EDICIÓN AVANZADA:
- "deshacer" → Ctrl+Z, revierte último cambio
- "rehacer" → Ctrl+Y, restaura cambio deshecho
- "duplicar línea" → Copia línea actual
- "eliminar línea" → Borra línea completa
- "tabla de contenidos" → Genera TOC desde encabezados

🔧 COMANDOS DE IA INTELIGENTE:
- "corrige ortografía" → Corrige errores del texto seleccionado
- "mejora este texto" → Reescribe mejorando redacción y claridad
- "resume este párrafo" → Hace resumen conciso del contenido
- "amplía esta idea" → Desarrolla más el concepto presentado
- "simplifica este texto" → Hace más fácil de entender
- "formaliza este texto" → Convierte a lenguaje formal/profesional
- "lista los puntos clave" → Extrae ideas principales en lista

INSTRUCCIONES ESPECIALES PARA MODO EDITOR:
- Ejecutar herramientas directamente cuando se soliciten
- Para corrección/edición: mostrar sugerencia con botones aceptar/rechazar
- Para creación de contenido: generar e insertar directamente
- Combinar múltiples herramientas cuando sea apropiado
- Sugerir herramientas complementarias relevantes
- Explicar brevemente qué herramienta se usó y por qué
` : `
MODO CHAT ACTIVO - INSTRUCCIONES:
- Solo proporcionar respuestas de texto conversacional
- NO ejecutar comandos ni herramientas del editor
- Responder preguntas sobre documentos, contenido, ideas
- Dar consejos de escritura y formato teóricos
- Explicar conceptos y ayudar con investigación
- Analizar contenido de documentos seleccionados
- ANALIZAR ARCHIVOS ADJUNTOS: describir imágenes, explicar documentos, revisar código
- Sugerir qué herramientas del editor podrían ser útiles (sin ejecutarlas)
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
        
        const suggestionId = generateUUID();
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
          id: generateUUID() 
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
        id: generateUUID(),
      };
      setMessages(prev => [...prev, aiMsg]);
      
      setAttachedFiles([]);
      
    } catch {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Error al consultar la IA.', 
        id: generateUUID() 
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
    <TooltipProvider>
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
          <span className="font-semibold text-lg">ChatGPT Copilot Beta</span>
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
        
        <div className="ml-auto">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <HelpCircle className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-md p-4 max-h-96 overflow-hidden">
              <div className="space-y-3">
                <div className="font-semibold text-sm sticky top-0 bg-popover pb-2 border-b">
                  {mode === 'chat' ? '💬 Modo Chat - Guía de Prompts' : '⚡ Modo Editor - Guía de Prompts'}
                </div>
                
                <div className="max-h-80 overflow-y-auto pr-2 space-y-3">
                  {mode === 'chat' ? (
                    <div className="text-xs space-y-3">
                      <div>
                        <p className="font-medium text-muted-foreground mb-2">📎 Análisis de Archivos Adjuntos:</p>
                        <div className="space-y-1 pl-2">
                          <p>• "Analiza esta imagen y dime qué ves"</p>
                          <p>• "Resume este documento PDF"</p>
                          <p>• "Extrae los datos de esta tabla CSV"</p>
                          <p>• "Transcribe el texto de esta imagen"</p>
                          <p>• "¿Qué información contiene este archivo?"</p>
                          <p>• "Convierte esta imagen a texto"</p>
                          <p>• "Analiza el código en este archivo"</p>
                          <p>• "¿Cuáles son los errores en este código?"</p>
                        </div>
                      </div>
                      
                      <div>
                        <p className="font-medium text-muted-foreground mb-2">📖 Análisis de Documentos:</p>
                        <div className="space-y-1 pl-2">
                          <p>• "Resume este documento en 3 párrafos"</p>
                          <p>• "¿Cuáles son los puntos clave?"</p>
                          <p>• "Explícame esta sección específica"</p>
                          <p>• "¿Qué argumentos principales presenta?"</p>
                          <p>• "Haz un análisis crítico del contenido"</p>
                          <p>• "¿Qué conclusiones se pueden extraer?"</p>
                          <p>• "Compara este documento con [otro tema]"</p>
                          <p>• "¿Hay inconsistencias en el texto?"</p>
                        </div>
                      </div>
                      
                      <div>
                        <p className="font-medium text-muted-foreground mb-2">💡 Ayuda con Escritura:</p>
                        <div className="space-y-1 pl-2">
                          <p>• "¿Cómo puedo mejorar este párrafo?"</p>
                          <p>• "Dame ideas para desarrollar este tema"</p>
                          <p>• "Sinónimos para esta palabra"</p>
                          <p>• "¿Cómo puedo hacer esto más claro?"</p>
                          <p>• "Sugiere una mejor estructura"</p>
                          <p>• "¿Falta algo importante en este texto?"</p>
                          <p>• "Ayúdame a conectar estas ideas"</p>
                          <p>• "¿Cómo puedo concluir mejor?"</p>
                        </div>
                      </div>
                      
                      <div>
                        <p className="font-medium text-muted-foreground mb-2">🔍 Investigación y Consultas:</p>
                        <div className="space-y-1 pl-2">
                          <p>• "Información sobre [tema específico]"</p>
                          <p>• "Ejemplos relacionados con [concepto]"</p>
                          <p>• "¿Qué otros conceptos están relacionados?"</p>
                          <p>• "Explícame [término técnico] de forma simple"</p>
                          <p>• "¿Cuáles son las mejores prácticas en [área]?"</p>
                          <p>• "Dame ejemplos prácticos de [concepto]"</p>
                          <p>• "¿Qué tendencias hay en [industria]?"</p>
                          <p>• "Compara [opción A] vs [opción B]"</p>
                        </div>
                      </div>
                      
                      <div>
                        <p className="font-medium text-muted-foreground mb-2">🎯 Consultas Específicas:</p>
                        <div className="space-y-1 pl-2">
                          <p>• "¿Cómo funciona [proceso/sistema]?"</p>
                          <p>• "Ventajas y desventajas de [tema]"</p>
                          <p>• "Historia y evolución de [concepto]"</p>
                          <p>• "Casos de estudio sobre [tema]"</p>
                          <p>• "Soluciones para [problema específico]"</p>
                          <p>• "Paso a paso para [proceso]"</p>
                          <p>• "¿Qué herramientas usar para [tarea]?"</p>
                          <p>• "Errores comunes en [área] y cómo evitarlos"</p>
                        </div>
                      </div>
                      
                      <div className="pt-2 border-t bg-yellow-50 p-2 rounded">
                        <p className="text-yellow-700 font-medium text-center">ℹ️ Cambia a Modo Editor para usar herramientas de edición directa</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs space-y-3">
                      <div>
                        <p className="font-medium text-muted-foreground mb-2">📎 Inserción de Archivos Adjuntos:</p>
                        <div className="space-y-1 pl-2">
                          <p>• "Inserta el contenido de este documento"</p>
                          <p>• "Crea una tabla con estos datos CSV"</p>
                          <p>• "Transcribe el texto de esta imagen"</p>
                          <p>• "Agrega esta imagen al documento"</p>
                          <p>• "Convierte estos datos en tabla"</p>
                          <p>• "Inserta este código con formato"</p>
                        </div>
                      </div>
                      
                      <div>
                        <p className="font-medium text-muted-foreground mb-2">🛠️ Herramientas de Formato (Directas):</p>
                        <div className="space-y-1 pl-2">
                          <p>• "negrita" / "bold" / "texto en negrita"</p>
                          <p>• "cursiva" / "italic" / "texto en cursiva"</p>
                          <p>• "subrayado" / "underline"</p>
                          <p>• "tachado" / "strikethrough"</p>
                          <p>• "código" / "code" / "texto de código"</p>
                          <p>• "resaltado" / "highlight" / "amarillo"</p>
                          <p>• "texto rojo" / "texto azul" / "texto verde"</p>
                          <p>• "texto grande" / "texto pequeño"</p>
                        </div>
                      </div>
                      
                      <div>
                        <p className="font-medium text-muted-foreground mb-2">📋 Listas y Estructura (Directas):</p>
                        <div className="space-y-1 pl-2">
                          <p>• "lista" / "lista con viñetas"</p>
                          <p>• "lista numerada" / "lista ordenada"</p>
                          <p>• "lista de tareas" / "checklist"</p>
                          <p>• "cita" / "blockquote" / "cita en bloque"</p>
                          <p>• "título 1" / "heading 1" / "h1"</p>
                          <p>• "título 2" / "heading 2" / "h2"</p>
                          <p>• "título 3" / "heading 3" / "h3"</p>
                          <p>• "párrafo normal"</p>
                        </div>
                      </div>
                      
                      <div>
                        <p className="font-medium text-muted-foreground mb-2">📊 Tablas y Elementos (Directas):</p>
                        <div className="space-y-1 pl-2">
                          <p>• "crear tabla 3x4" / "tabla 2x5"</p>
                          <p>• "línea horizontal" / "separador"</p>
                          <p>• "salto de línea" / "nueva línea"</p>
                          <p>• "bloque de código" / "code block"</p>
                          <p>• "enlace a [URL]" / "link [texto]"</p>
                          <p>• "imagen [descripción]"</p>
                          <p>• "video de YouTube [URL]"</p>
                          <p>• "video [URL mp4/webm]"</p>
                          <p>• "emoji [nombre]" / "😀"</p>
                          <p>• "canvas" / "área de dibujo"</p>
                          <p>• "2 columnas" / "3 columnas" / "dividir en columnas"</p>
                          <p>• "botón [texto]" / "botón principal"</p>
                          <p>• "barra de progreso 75%" / "progreso 50%"</p>
                        </div>
                      </div>
                      
                      <div>
                        <p className="font-medium text-muted-foreground mb-2">🎨 Alineación y Diseño (Directas):</p>
                        <div className="space-y-1 pl-2">
                          <p>• "centrar texto" / "alineación centro"</p>
                          <p>• "alinear izquierda" / "alineación izquierda"</p>
                          <p>• "alinear derecha" / "alineación derecha"</p>
                          <p>• "justificar texto" / "justificado"</p>
                          <p>• "subíndice" / "subscript"</p>
                          <p>• "superíndice" / "superscript"</p>
                          <p>• "mayúsculas" / "convertir a mayúsculas"</p>
                          <p>• "minúsculas" / "convertir a minúsculas"</p>
                          <p>• "capitalizar" / "primera letra mayúscula"</p>
                          <p>• "espaciado doble" / "espaciado simple"</p>
                          <p>• "texto con borde" / "texto con sombra"</p>
                        </div>
                      </div>
                      
                      <div>
                        <p className="font-medium text-muted-foreground mb-2">🤖 IA Copilot (Con Confirmación):</p>
                        <div className="space-y-1 pl-2">
                          <p>• "corrige ortografía" / "revisar ortografía"</p>
                          <p>• "mejora este texto" / "reescribe mejor"</p>
                          <p>• "resume este párrafo" / "hacer resumen"</p>
                          <p>• "traduce al inglés" / "translate to English"</p>
                          <p>• "traduce al español" / "traducir"</p>
                          <p>• "elimina este párrafo" / "borrar texto"</p>
                          <p>• "expande esta idea" / "desarrolla más"</p>
                          <p>• "simplifica este texto" / "hacer más simple"</p>
                          <p>• "cambia el tono a formal" / "tono profesional"</p>
                          <p>• "cambia el tono a casual" / "tono informal"</p>
                          <p>• "agrega ejemplos" / "incluir ejemplos"</p>
                          <p>• "restructura el contenido"</p>
                        </div>
                      </div>
                      
                      <div>
                        <p className="font-medium text-muted-foreground mb-2">📝 Generación de Contenido (Con Confirmación):</p>
                        <div className="space-y-1 pl-2">
                          <p>• "escribe un párrafo sobre [tema]"</p>
                          <p>• "genera una introducción"</p>
                          <p>• "crea una conclusión"</p>
                          <p>• "redacta un email sobre [tema]"</p>
                          <p>• "haz una lista de [elementos]"</p>
                          <p>• "describe [concepto] en detalle"</p>
                          <p>• "explica [proceso] paso a paso"</p>
                          <p>• "compara [A] con [B]"</p>
                        </div>
                      </div>
                      
                      <div>
                        <p className="font-medium text-muted-foreground mb-2">🧮 Fórmulas y Elementos Especiales:</p>
                        <div className="space-y-1 pl-2">
                          <p>• "fórmula matemática [ecuación]" → $ecuación$</p>
                          <p>• "ecuación cuadrática" → $ax^2 + bx + c = 0$</p>
                          <p>• "teorema de Pitágoras" → $a^2 + b^2 = c^2$</p>
                          <p>• "suma matemática" → $\sum_i x_i$</p>
                          <p>• "fracción 3/4" → $\frac{'{3}'}{'{4}'}$</p>
                          <p>• "tabla de contenidos" / "índice"</p>
                          <p>• "mencionar @usuario"</p>
                          <p>• "detalles desplegables"</p>
                          <p>• "placeholder [texto]"</p>
                          <p>• "caracteres invisibles"</p>
                          <p>• "modo enfoque" / "focus mode"</p>
                        </div>
                      </div>
                      
                      <div className="pt-2 border-t bg-blue-50 p-2 rounded">
                        <p className="text-blue-700 font-medium text-center">⚡ Los cambios de IA mostrarán opciones: Mantener / Deshacer</p>
                        <p className="text-blue-600 text-center mt-1">🛠️ Las herramientas directas se aplican inmediatamente</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
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
    </TooltipProvider>
  );
};
