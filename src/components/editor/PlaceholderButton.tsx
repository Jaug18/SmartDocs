import React, { useState } from 'react';
import { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileText } from 'lucide-react';
import './placeholder.css';

interface PlaceholderButtonProps {
  editor: Editor | null;
}

const PlaceholderButton: React.FC<PlaceholderButtonProps> = ({ editor }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [placeholderText, setPlaceholderText] = useState('');
  const [useCustomFunction, setUseCustomFunction] = useState(false);
  const [headingPlaceholder, setHeadingPlaceholder] = useState('');
  const [paragraphPlaceholder, setParagraphPlaceholder] = useState('');

  if (!editor) {
    return null;
  }

  // Verificar si la extensión Placeholder está disponible
  const hasPlaceholder = editor.extensionManager.extensions.some(
    ext => ext.name === 'placeholder'
  );

  if (!hasPlaceholder) {
    return null;
  }

  const updatePlaceholder = () => {
    if (!placeholderText.trim() && !useCustomFunction) return;

    // Reconfigurar la extensión Placeholder
    const placeholderExt = editor.extensionManager.extensions.find(ext => ext.name === 'placeholder');
    if (placeholderExt) {
      if (useCustomFunction && headingPlaceholder && paragraphPlaceholder) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        placeholderExt.options.placeholder = ({ node }: { node: any }) => {
          if (node.type.name === 'heading') {
            return headingPlaceholder;
          }
          return paragraphPlaceholder;
        };
      } else {
        placeholderExt.options.placeholder = placeholderText;
      }
      
      // Forzar actualización del editor
      editor.view.dispatch(editor.view.state.tr);
    }

    setIsOpen(false);
  };

  const resetPlaceholder = () => {
    const placeholderExt = editor.extensionManager.extensions.find(ext => ext.name === 'placeholder');
    if (placeholderExt) {
      placeholderExt.options.placeholder = 'Escribe aquí tu texto... Prueba escribir :) o #A975FF';
      editor.view.dispatch(editor.view.state.tr);
    }
    setPlaceholderText('');
    setHeadingPlaceholder('');
    setParagraphPlaceholder('');
    setUseCustomFunction(false);
    setIsOpen(false);
  };

  // Placeholders predefinidos
  const presetPlaceholders = [
    { name: 'Artículo', text: 'Escribe tu artículo aquí...' },
    { name: 'Nota', text: 'Añade tus notas...' },
    { name: 'Lista de tareas', text: 'Crea tu lista de tareas...' },
    { name: 'Resumen', text: 'Escribe un resumen...' },
    { name: 'Reflexión', text: 'Comparte tus reflexiones...' },
    { name: 'Plan', text: 'Detalla tu plan...' },
  ];

  const setPresetPlaceholder = (text: string) => {
    setPlaceholderText(text);
    setUseCustomFunction(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="placeholder-button"
          aria-label="Configurar placeholder"
          // title="Configurar texto de marcador de posición"
        >
          <FileText className="h-4 w-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="placeholder-dialog-content max-w-xl">
        <DialogHeader>
          <DialogTitle>Configurar Placeholder</DialogTitle>
        </DialogHeader>

        <div className="placeholder-config-section">
          <div className="flex items-center space-x-4 mb-4">
            <Label htmlFor="placeholder-type">Tipo:</Label>
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="simple"
                name="placeholder-type"
                checked={!useCustomFunction}
                onChange={() => setUseCustomFunction(false)}
              />
              <label htmlFor="simple" className="text-sm">Texto simple</label>
              <input
                type="radio"
                id="custom"
                name="placeholder-type"
                checked={useCustomFunction}
                onChange={() => setUseCustomFunction(true)}
              />
              <label htmlFor="custom" className="text-sm">Por tipo de nodo</label>
            </div>
          </div>

          {!useCustomFunction ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="placeholder-text">Texto del placeholder:</Label>
                <Input
                  id="placeholder-text"
                  value={placeholderText}
                  onChange={(e) => setPlaceholderText(e.target.value)}
                  placeholder="Escribe tu placeholder personalizado..."
                  className="placeholder-input-field"
                />
              </div>

              <div className="preset-placeholders-section">
                <Label>Placeholders predefinidos:</Label>
                <div className="preset-placeholders-grid">
                  {presetPlaceholders.map((preset, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="preset-placeholder-button"
                      onClick={() => setPresetPlaceholder(preset.text)}
                    >
                      <span className="preset-name">{preset.name}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="heading-placeholder">Placeholder para encabezados:</Label>
                <Input
                  id="heading-placeholder"
                  value={headingPlaceholder}
                  onChange={(e) => setHeadingPlaceholder(e.target.value)}
                  placeholder="¿Cuál es el título?"
                  className="placeholder-input-field"
                />
              </div>

              <div>
                <Label htmlFor="paragraph-placeholder">Placeholder para párrafos:</Label>
                <Input
                  id="paragraph-placeholder"
                  value={paragraphPlaceholder}
                  onChange={(e) => setParagraphPlaceholder(e.target.value)}
                  placeholder="¿Puedes añadir más contexto?"
                  className="placeholder-input-field"
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={resetPlaceholder}>
            Restablecer
          </Button>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={updatePlaceholder} 
            disabled={!placeholderText.trim() && !(useCustomFunction && headingPlaceholder && paragraphPlaceholder)}
          >
            Aplicar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PlaceholderButton;
