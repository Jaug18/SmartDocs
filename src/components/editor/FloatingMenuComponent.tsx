import { FloatingMenu, Editor } from '@tiptap/react';
import { 
  Heading2, List, ListOrdered, CheckSquare, Quote, Code, 
  Table, Image as ImageIcon, Plus, Text, Bold, Italic,
  AlignLeft, Youtube, Link, LayoutGrid, File
} from 'lucide-react';
import { useState, useCallback } from 'react';
import { DocumentSelector } from './DocumentSelector';

interface FloatingMenuComponentProps {
  editor: Editor;
}

const FloatingMenuComponent = ({ editor }: FloatingMenuComponentProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDocSelectorOpen, setIsDocSelectorOpen] = useState(false);
  const [linkType, setLinkType] = useState<'url' | 'document'>('url');

  // Determina el tipo de nodo/contexto actual
  const getActiveContext = useCallback(() => {
    if (editor.isActive('table')) return 'table';
    if (editor.isActive('codeBlock')) return 'codeBlock';
    if (editor.isActive('heading')) return 'heading';
    if (editor.isActive('bulletList') || editor.isActive('orderedList') || editor.isActive('taskList')) return 'list';
    return 'text'; // contexto por defecto
  }, [editor]);

  // Solo mostrar el menú en bloques vacíos y ciertas condiciones
  const shouldShowMenu = useCallback(({ state, view }) => {
    // Obtener el nodo actual y su posición
    const { $from } = state.selection;
    const currentNode = $from.node();
    
    // Solo mostrar en párrafos vacíos o al inicio de bloques (siguiendo ejemplo oficial)
    const isEmptyTextBlock = 
      currentNode.type.name === 'paragraph' && 
      currentNode.content.size === 0;
    
    // Si ya hay contenido o estamos dentro de un bloque especial, no mostrar
    const isInsideSpecialBlock = 
      editor.isActive('codeBlock') || 
      editor.isActive('blockquote') ||
      editor.isActive('table') ||
      editor.isActive('taskList');
    
    // Solo mostrar cuando está al inicio de un párrafo vacío y no estamos en un bloque especial
    return isEmptyTextBlock && !isInsideSpecialBlock;
  }, [editor]);

  // Función para abrir el selector de documento
  const openDocumentSelector = () => {
    setLinkType('document');
    setIsDocSelectorOpen(true);
  };

  // Función para insertar un enlace URL externo
  const insertExternalLink = () => {
    const url = window.prompt('Introduce la URL:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
      setIsExpanded(false);
    }
  };

  // Función para insertar un enlace a documento interno
  const handleSelectDocument = (documentId: string, documentTitle: string) => {
    const docUrl = `doc://${documentId}`;
    editor.chain().focus().setLink({ href: docUrl }).run();
    setIsDocSelectorOpen(false);
    setIsExpanded(false);
  };

  // Renderiza botones según el contexto actual
  const renderMenuItems = () => {
    // Si el botón no está expandido, mostrar solo el botón de expansión
    if (!isExpanded) {
      return (
        <button
          onClick={() => setIsExpanded(true)}
          className="p-2 flex items-center justify-center hover:bg-accent rounded-full"
        >
          <Plus className="h-4 w-4" />
        </button>
      );
    }

    // Cuando está expandido, mostrar los botones según el contexto
    const context = getActiveContext();
    
    return (
      <div className="flex flex-wrap gap-1 max-w-[300px] p-1.5">
        {/* Botones de estructura de documento siempre visibles */}
        <button
          onClick={() => {
            editor.chain().focus().toggleHeading({ level: 1 }).run();
            setIsExpanded(false);
          }}
          className="p-2 flex items-center justify-center hover:bg-accent rounded"
          title="Encabezado 1"
        >
          <Heading2 className="h-4 w-4" />
        </button>
        
        <button
          onClick={() => {
            editor.chain().focus().toggleBulletList().run();
            setIsExpanded(false);
          }}
          className="p-2 flex items-center justify-center hover:bg-accent rounded"
          title="Lista con viñetas"
        >
          <List className="h-4 w-4" />
        </button>
        
        <button
          onClick={() => {
            editor.chain().focus().toggleOrderedList().run();
            setIsExpanded(false);
          }}
          className="p-2 flex items-center justify-center hover:bg-accent rounded"
          title="Lista numerada"
        >
          <ListOrdered className="h-4 w-4" />
        </button>
        
        <button
          onClick={() => {
            editor.chain().focus().toggleTaskList().run();
            setIsExpanded(false);
          }}
          className="p-2 flex items-center justify-center hover:bg-accent rounded"
          title="Lista de tareas"
        >
          <CheckSquare className="h-4 w-4" />
        </button>
        
        <button
          onClick={() => {
            editor.chain().focus().toggleBlockquote().run();
            setIsExpanded(false);
          }}
          className="p-2 flex items-center justify-center hover:bg-accent rounded"
          title="Cita"
        >
          <Quote className="h-4 w-4" />
        </button>
        
        <button
          onClick={() => {
            editor.chain().focus().toggleCodeBlock().run();
            setIsExpanded(false);
          }}
          className="p-2 flex items-center justify-center hover:bg-accent rounded"
          title="Bloque de código"
        >
          <Code className="h-4 w-4" />
        </button>
        
        <button
          onClick={() => {
            editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
            setIsExpanded(false);
          }}
          className="p-2 flex items-center justify-center hover:bg-accent rounded"
          title="Insertar tabla"
        >
          <Table className="h-4 w-4" />
        </button>
        
        {/* Nuevos botones para enlaces */}
        <button
          onClick={insertExternalLink}
          className="p-2 flex items-center justify-center hover:bg-accent rounded"
          title="Insertar enlace externo"
        >
          <Link className="h-4 w-4" />
        </button>
        
        <button
          onClick={openDocumentSelector}
          className="p-2 flex items-center justify-center hover:bg-accent rounded"
          title="Insertar enlace a documento"
        >
          <File className="h-4 w-4" />
        </button>

        {/* Botón para cerrar */}
        <button
          onClick={() => setIsExpanded(false)}
          className="p-2 flex items-center justify-center hover:bg-accent rounded text-muted-foreground"
          title="Cerrar"
        >
          <Plus className="h-4 w-4 rotate-45" />
        </button>
      </div>
    );
  };

  return (
    <>
      <FloatingMenu 
        className={`tiptap-floating-menu bg-background border-transparent shadow-sm rounded-md overflow-hidden ${isExpanded ? 'p-1' : ''} dark:bg-[hsl(222_25%_14%)] dark:shadow-xl`}
        tippyOptions={{ 
          duration: 100, 
          placement: 'bottom-start',
          offset: [0, 10]
        }}
        editor={editor}
        shouldShow={shouldShowMenu}
      >
        {renderMenuItems()}
      </FloatingMenu>
      
      {/* Selector de documentos para enlaces internos */}
      <DocumentSelector 
        open={isDocSelectorOpen}
        onOpenChange={setIsDocSelectorOpen}
        onSelectDocument={handleSelectDocument}
      />
    </>
  );
};

export default FloatingMenuComponent;
