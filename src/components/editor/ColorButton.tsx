import React, { useState } from 'react';
import { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Palette } from 'lucide-react';
import './color.css';

interface ColorButtonProps {
  editor: Editor | null;
}

// Colores predefinidos siguiendo el ejemplo oficial
const PRESET_COLORS = [
  { name: 'Purple', value: '#958DF1' },
  { name: 'Red', value: '#F98181' },
  { name: 'Orange', value: '#FBBC88' },
  { name: 'Yellow', value: '#FAF594' },
  { name: 'Blue', value: '#70CFF8' },
  { name: 'Teal', value: '#94FADB' },
  { name: 'Green', value: '#B9F18D' },
];

const ColorButton: React.FC<ColorButtonProps> = ({ editor }) => {
  const [customColor, setCustomColor] = useState('#000000');

  if (!editor) {
    return null;
  }

  const currentColor = editor.getAttributes('textStyle').color;
  const isActive = !!currentColor;

  const setColor = (color: string) => {
    editor.chain().focus().setColor(color).run();
  };

  const unsetColor = () => {
    editor.chain().focus().unsetColor().run();
  };

  const handleCustomColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const color = event.target.value;
    setCustomColor(color);
    setColor(color);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`color-button ${isActive ? 'is-active' : ''}`}
          aria-label="Color de texto"
        >
          <div className="color-button-content">
            <Palette className="h-4 w-4" />
            <div 
              className="color-indicator"
              style={{ backgroundColor: currentColor || '#000000' }}
            />
          </div>
        </Button>
      </DropdownMenuTrigger>

        <DropdownMenuContent className="color-dropdown-content" align="start">
          {/* Selector de color personalizado */}
          <div className="custom-color-section">
            <label htmlFor="custom-color" className="custom-color-label">
              Color personalizado:
            </label>
            <input
              id="custom-color"
              type="color"
              value={customColor}
              onChange={handleCustomColorChange}
              className="custom-color-input"
            />
          </div>

          <DropdownMenuSeparator />

          {/* Colores predefinidos */}
          <div className="preset-colors-section">
            <div className="preset-colors-label">Colores predefinidos:</div>
            <div className="preset-colors-grid">
              {PRESET_COLORS.map((color) => (
                <DropdownMenuItem
                  key={color.value}
                  className="preset-color-item"
                  onClick={() => setColor(color.value)}
                >
                  <div
                    className={`preset-color-swatch ${
                      currentColor === color.value ? 'is-selected' : ''
                    }`}
                    style={{ backgroundColor: color.value }}
                  />
                  <span>{color.name}</span>
                </DropdownMenuItem>
              ))}
            </div>
          </div>

          <DropdownMenuSeparator />

          {/* Remover color */}
          <DropdownMenuItem
            onClick={unsetColor}
            className="unset-color-item"
          >
            <div className="unset-color-swatch" />
            <span>Sin color</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ColorButton;
