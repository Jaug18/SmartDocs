import React, { useState, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollText } from 'lucide-react';
import { TextSelection } from '@tiptap/pm/state';
import './tableofcontents.css';

interface ToCItem {
  id: string;
  textContent: string;
  level: number;
  itemIndex: number;
  isActive: boolean;
  isScrolledOver: boolean;
}

interface TableOfContentsButtonProps {
  editor: Editor | null;
}

const ToCItem: React.FC<{
  item: ToCItem;
  onItemClick: (e: React.MouseEvent, id: string) => void;
}> = ({ item, onItemClick }) => {
  return (
    <div 
      className={`toc-item ${item.isActive && !item.isScrolledOver ? 'is-active' : ''} ${item.isScrolledOver ? 'is-scrolled-over' : ''}`}
      style={{
        '--level': item.level,
      } as React.CSSProperties}
    >
      <a 
        href={`#${item.id}`} 
        onClick={(e) => onItemClick(e, item.id)} 
        data-item-index={item.itemIndex}
      >
        {item.textContent}
      </a>
    </div>
  );
};

const ToCEmptyState: React.FC = () => {
  return (
    <div className="toc-empty-state">
      <p>Empieza a escribir encabezados en tu documento para ver el índice.</p>
    </div>
  );
};

const TableOfContentsButton: React.FC<TableOfContentsButtonProps> = ({ editor }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<ToCItem[]>([]);

  // Verificar si la extensión TableOfContents está disponible
  const hasTableOfContents = editor?.extensionManager.extensions.some(
    ext => ext.name === 'tableOfContents'
  ) || false;

  useEffect(() => {
    if (!editor || !hasTableOfContents) return;

    // Escuchar cambios en el contenido para actualizar el ToC
    const updateToC = () => {
      const headings: ToCItem[] = [];
      let itemIndex = 0;

      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'heading') {
          const id = `heading-${pos}`;
          const level = node.attrs.level;
          const textContent = node.textContent;
          
          headings.push({
            id,
            textContent,
            level,
            itemIndex: ++itemIndex,
            isActive: false,
            isScrolledOver: false,
          });
        }
        return true;
      });

      setItems(headings);
    };

    updateToC();

    const handleUpdate = () => updateToC();
    editor.on('update', handleUpdate);

    return () => {
      editor.off('update', handleUpdate);
    };
  }, [editor, hasTableOfContents]);

  if (!editor) {
    return null;
  }

  const onItemClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();

    if (editor) {
      // Encontrar el elemento por su ID de datos
      const element = editor.view.dom.querySelector(`[data-toc-id="${id}"]`);
      if (element) {
        const pos = editor.view.posAtDOM(element as Element, 0);

        // Establecer foco
        const tr = editor.view.state.tr;
        tr.setSelection(new TextSelection(tr.doc.resolve(pos)));
        editor.view.dispatch(tr);
        editor.view.focus();

        if (history.pushState) {
          history.pushState(null, null, `#${id}`);
        }

        element.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    }
  };

  const generateToCContent = () => {
    if (!editor) return '';

    let tocContent = '\n## Índice\n\n';
    
    items.forEach((item) => {
      const indent = '  '.repeat(item.level - 1);
      tocContent += `${indent}- [${item.textContent}](#${item.id})\n`;
    });

    return tocContent;
  };

  const insertToC = () => {
    const tocContent = generateToCContent();
    editor.chain().focus().insertContent(tocContent).run();
    setIsOpen(false);
  };

  if (!hasTableOfContents) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="toc-button"
          aria-label="Tabla de contenidos"
          // title="Mostrar tabla de contenidos del documento"
        >
          <ScrollText className="h-4 w-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="toc-dialog-content max-w-md">
        <DialogHeader>
          <DialogTitle>Tabla de Contenidos</DialogTitle>
        </DialogHeader>

        <div className="toc-content">
          {items.length === 0 ? (
            <ToCEmptyState />
          ) : (
            <>
              <div className="toc-items">
                {items.map((item, i) => (
                  <ToCItem 
                    key={item.id} 
                    item={item} 
                    onItemClick={onItemClick}
                  />
                ))}
              </div>
              
              <div className="toc-actions">
                <Button 
                  onClick={insertToC}
                  size="sm"
                  className="w-full"
                >
                  Insertar índice en el documento
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TableOfContentsButton;
