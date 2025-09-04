import React from 'react';
import { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Type } from 'lucide-react';
import './fontfamily.css';

interface FontFamilyButtonProps {
  editor: Editor | null;
}

// Fuentes predefinidas siguiendo el ejemplo oficial
const PRESET_FONTS = [
  { name: 'Inter', value: 'Inter' },
  { name: 'Comic Sans', value: '"Comic Sans MS", "Comic Sans"' },
  { name: 'Serif', value: 'serif' },
  { name: 'Monospace', value: 'monospace' },
  { name: 'Cursive', value: 'cursive' },
  { name: 'System', value: 'system-ui' },
  { name: 'Arial', value: 'Arial, sans-serif' },
  { name: 'Helvetica', value: 'Helvetica, sans-serif' },
  { name: 'Times', value: '"Times New Roman", Times, serif' },
  { name: 'Georgia', value: 'Georgia, serif' },
];

const FontFamilyButton: React.FC<FontFamilyButtonProps> = ({ editor }) => {
  if (!editor) {
    return null;
  }

  const currentFontFamily = editor.getAttributes('textStyle').fontFamily;
  const isActive = !!currentFontFamily;

  const setFontFamily = (fontFamily: string) => {
    editor.chain().focus().setFontFamily(fontFamily).run();
  };

  const unsetFontFamily = () => {
    editor.chain().focus().unsetFontFamily().run();
  };

  const getCurrentFontName = () => {
    if (!currentFontFamily) return 'Default';
    const preset = PRESET_FONTS.find(font => font.value === currentFontFamily);
    return preset ? preset.name : 'Custom';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`font-family-button ${isActive ? 'is-active' : ''}`}
          aria-label="Fuente del texto"
          // title={`Cambiar fuente del texto - Actual: ${getCurrentFontName()}`}
        >
          <div className="font-family-button-content">
            <Type className="h-4 w-4" />
            <span className="font-family-current">{getCurrentFontName()}</span>
          </div>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="font-family-dropdown-content" align="start">
        {/* Fuentes predefinidas */}
        <div className="preset-fonts-section">
          <div className="preset-fonts-label">Fuentes disponibles:</div>
          {PRESET_FONTS.map((font) => (
            <DropdownMenuItem
              key={font.value}
              className={`preset-font-item ${
                currentFontFamily === font.value ? 'is-selected' : ''
              }`}
              onClick={() => setFontFamily(font.value)}
            >
              <span 
                className="font-preview"
                style={{ fontFamily: font.value }}
              >
                {font.name}
              </span>
              {currentFontFamily === font.value && (
                <span className="selected-indicator">✓</span>
              )}
            </DropdownMenuItem>
          ))}
        </div>

        <DropdownMenuSeparator />

        {/* Remover fuente personalizada */}
        <DropdownMenuItem
          onClick={unsetFontFamily}
          className="unset-font-item"
        >
          <span>Fuente por defecto</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default FontFamilyButton;
