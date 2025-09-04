import React, { useState, useEffect } from 'react';
import { BubbleMenu, Editor } from '@tiptap/react';
import { Link as LinkIcon, ExternalLink, Trash, File, FilePlus2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocumentSelector } from './DocumentSelector';

interface LinkEditorProps {
  editor: Editor;
}

const LinkEditor = ({ editor }: LinkEditorProps) => {
  const [url, setUrl] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>("url");
  const [isDocSelectorOpen, setIsDocSelectorOpen] = useState(false);

  useEffect(() => {
    if (editor.isActive('link')) {
      const href = editor.getAttributes('link').href;
      
      // Detecta si es un enlace interno a documento y cambia la pestaña
      if (href.startsWith('doc://')) {
        setActiveTab('document');
      } else {
        setActiveTab('url');
      }
      
      setUrl(href);
    }
  }, [editor]);

  const saveLink = () => {
    if (url) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    } else {
      removeLink();
    }
  };

  const removeLink = () => {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
  };

  const openLink = () => {
    if (url) {
      // Si es un enlace a documento interno, manejar de manera especial
      if (url.startsWith('doc://')) {
        const docId = url.replace('doc://', '');
        // Aquí iría la lógica para abrir un documento interno
        alert(`Navegando al documento con ID: ${docId}`);
      } else {
        window.open(url, '_blank');
      }
    }
  };

  const handleSelectDocument = (documentId: string, documentTitle: string) => {
    const docUrl = `doc://${documentId}`;
    setUrl(docUrl);
    setIsDocSelectorOpen(false);
    editor.chain().focus().extendMarkRange('link').setLink({ href: docUrl }).run();
  };

  return (
    <>
      <BubbleMenu
        className="bg-background border-transparent rounded-md shadow-md p-2 flex flex-col gap-2 min-w-[250px]"
        tippyOptions={{ duration: 100, placement: 'bottom' }}
        editor={editor}
        shouldShow={({ editor }) => editor.isActive('link')}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 w-full mb-2">
            <TabsTrigger value="url" className="text-xs">
              <LinkIcon className="h-3 w-3 mr-1" />
              URL Externa
            </TabsTrigger>
            <TabsTrigger value="document" className="text-xs">
              <File className="h-3 w-3 mr-1" />
              Documento
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="url" className="mt-0 space-y-1">
            <div className="flex items-center gap-2">
              <Input
                value={url.startsWith('doc://') ? '' : url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    saveLink();
                  }
                }}
                className="h-7 py-1 text-sm"
                placeholder="https://"
              />
            </div>
          </TabsContent>
          
          <TabsContent value="document" className="mt-0">
            <div className="flex items-center gap-2">
              <Input
                value={url.startsWith('doc://') ? `Documento: ${url.replace('doc://', '')}` : ''}
                readOnly
                className="h-7 py-1 text-sm bg-muted/50 cursor-pointer"
                onClick={() => setIsDocSelectorOpen(true)}
              />
              <button 
                className="p-1 rounded hover:bg-accent"
                onClick={() => setIsDocSelectorOpen(true)}
                title="Seleccionar documento"
              >
                <FilePlus2 className="h-4 w-4" />
              </button>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end gap-2">
          <button
            className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
            onClick={openLink}
            title="Abrir enlace"
          >
            <ExternalLink className="h-4 w-4" />
          </button>
          <button
            className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-destructive"
            onClick={removeLink}
            title="Eliminar enlace"
          >
            <Trash className="h-4 w-4" />
          </button>
        </div>
      </BubbleMenu>
      
      {/* El DocumentSelector se abrirá cuando isDocSelectorOpen sea true */}
      <DocumentSelector 
        open={isDocSelectorOpen}
        onOpenChange={setIsDocSelectorOpen}
        onSelectDocument={handleSelectDocument}
      />
    </>
  );
};

export default LinkEditor;
