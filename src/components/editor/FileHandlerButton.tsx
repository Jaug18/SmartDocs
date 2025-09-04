import React from 'react';
import { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import './filehandler.css';

interface FileHandlerButtonProps {
  editor: Editor | null;
}

const FileHandlerButton: React.FC<FileHandlerButtonProps> = ({ editor }) => {
  if (!editor) {
    return null;
  }

  const handleFileUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png,image/jpeg,image/gif,image/webp,image/svg+xml';
    input.multiple = true;
    
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files) return;

      Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
          const fileReader = new FileReader();
          
          fileReader.readAsDataURL(file);
          fileReader.onload = () => {
            editor.chain().focus().setImage({
              src: fileReader.result as string,
              alt: file.name,
              title: file.name,
            }).run();
          };
        }
      });
    };
    
    input.click();
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleFileUpload}
      className="file-handler-button"
      aria-label="Subir archivos"
      // title="Subir archivos - También puedes arrastrar y soltar imágenes directamente"
    >
      <Upload className="h-4 w-4" />
    </Button>
  );
};

export default FileHandlerButton;
