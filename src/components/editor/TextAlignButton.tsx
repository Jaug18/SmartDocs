import React from 'react';
import { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify 
} from 'lucide-react';

interface TextAlignButtonProps {
  editor: Editor;
}

const TextAlignButton: React.FC<TextAlignButtonProps> = ({ editor }) => {

  if (!editor) return null;

  const alignOptions = [
    {
      value: 'left',
      label: 'Alinear izquierda',
      icon: AlignLeft,
      isActive: () => editor.isActive({ textAlign: 'left' }) || (!editor.isActive({ textAlign: 'center' }) && !editor.isActive({ textAlign: 'right' }) && !editor.isActive({ textAlign: 'justify' }))
    },
    {
      value: 'center',
      label: 'Centrar',
      icon: AlignCenter,
      isActive: () => editor.isActive({ textAlign: 'center' })
    },
    {
      value: 'right',
      label: 'Alinear derecha',
      icon: AlignRight,
      isActive: () => editor.isActive({ textAlign: 'right' })
    },
    {
      value: 'justify',
      label: 'Justificar',
      icon: AlignJustify,
      isActive: () => editor.isActive({ textAlign: 'justify' })
    }
  ];

  const getCurrentAlign = () => {
    const active = alignOptions.find(option => option.isActive());
    return active || alignOptions[0]; // Default to left
  };

  const currentAlign = getCurrentAlign();
  const CurrentIcon = currentAlign.icon;

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={`text-align-button ${currentAlign.isActive() ? 'bg-muted' : ''}`}
            >
              <CurrentIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        {/* <TooltipContent>
          <p>Alineación de texto</p>
        </TooltipContent> */}
      </Tooltip>
      <DropdownMenuContent align="start" className="w-48">
        {alignOptions.map((option) => {
          const Icon = option.icon;
          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => editor.chain().focus().setTextAlign(option.value).run()}
              className={`flex items-center gap-2 ${option.isActive() ? 'bg-accent' : ''}`}
            >
              <Icon className="h-4 w-4" />
              <span>{option.label}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default TextAlignButton;
