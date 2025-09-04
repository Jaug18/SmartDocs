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
import { Calculator } from 'lucide-react';
import './mathematics.css';

interface MathematicsButtonProps {
  editor: Editor | null;
}

const MathematicsButton: React.FC<MathematicsButtonProps> = ({ editor }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mathInput, setMathInput] = useState('');
  const [isInline, setIsInline] = useState(true);

  if (!editor) {
    return null;
  }

  // Verificar si la extensión Mathematics está disponible
  const hasMathematics = editor.extensionManager.extensions.some(
    ext => ext.name === 'mathematics'
  );

  if (!hasMathematics) {
    return null;
  }

  const insertMath = () => {
    if (!mathInput.trim()) return;

    if (isInline) {
      // Insertar matemáticas inline con $...$
      editor.chain().focus().insertContent(`$${mathInput}$`).run();
    } else {
      // Insertar matemáticas en bloque con $$...$$
      editor.chain().focus().insertContent(`$$${mathInput}$$`).run();
    }

    setMathInput('');
    setIsOpen(false);
  };

  const insertPresetMath = (formula: string, isBlock = false) => {
    if (isBlock) {
      editor.chain().focus().insertContent(`$$${formula}$$`).run();
    } else {
      editor.chain().focus().insertContent(`$${formula}$`).run();
    }
    setIsOpen(false);
  };

  // Fórmulas predefinidas
  const presetFormulas = [
    { name: 'Teorema de Pitágoras', formula: 'a^2 + b^2 = c^2', isBlock: false },
    { name: 'Raíz cuadrada', formula: '\\sqrt{x}', isBlock: false },
    { name: 'Fracción', formula: '\\frac{a}{b}', isBlock: false },
    { name: 'Sumatoria', formula: '\\sum_{i=1}^{n} x_i', isBlock: true },
    { name: 'Integral', formula: '\\int_a^b f(x) dx', isBlock: true },
    { name: 'Límite', formula: '\\lim_{x \\to \\infty} f(x)', isBlock: false },
    { name: 'Matriz', formula: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}', isBlock: true },
    { name: 'Sistema de ecuaciones', formula: '\\begin{cases} x + y = 1 \\\\ x - y = 0 \\end{cases}', isBlock: true },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="mathematics-button"
          aria-label="Insertar matemáticas"
          title="Insertar fórmulas matemáticas (LaTeX)"
        >
          <Calculator className="h-4 w-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="mathematics-dialog-content max-w-2xl">
        <DialogHeader>
          <DialogTitle>Insertar Fórmula Matemática</DialogTitle>
        </DialogHeader>

        <div className="mathematics-input-section">
          <div className="flex items-center space-x-4 mb-4">
            <Label htmlFor="math-type">Tipo:</Label>
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="inline"
                name="math-type"
                checked={isInline}
                onChange={() => setIsInline(true)}
              />
              <label htmlFor="inline" className="text-sm">En línea ($...$)</label>
              <input
                type="radio"
                id="block"
                name="math-type"
                checked={!isInline}
                onChange={() => setIsInline(false)}
              />
              <label htmlFor="block" className="text-sm">Bloque ($$...$$)</label>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="math-input">Fórmula LaTeX:</Label>
              <Textarea
                id="math-input"
                value={mathInput}
                onChange={(e) => setMathInput(e.target.value)}
                placeholder="Escribe tu fórmula LaTeX aquí... ej: x^2 + y^2 = r^2"
                className="math-input-field"
                rows={3}
              />
            </div>

            {mathInput && (
              <div className="math-preview">
                <Label>Vista previa:</Label>
                <div className="preview-container">
                  {isInline ? `$${mathInput}$` : `$$${mathInput}$$`}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="preset-formulas-section">
          <Label>Fórmulas predefinidas:</Label>
          <div className="preset-formulas-grid">
            {presetFormulas.map((preset, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="preset-formula-button"
                onClick={() => insertPresetMath(preset.formula, preset.isBlock)}
                title={preset.formula}
              >
                <span className="preset-formula-name">{preset.name}</span>
              </Button>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={insertMath} disabled={!mathInput.trim()}>
            Insertar Fórmula
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MathematicsButton;
