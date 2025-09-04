import React from 'react';
import { Editor } from '@tiptap/react';
import { Code, Terminal, FileCode } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { Button } from '@/components/ui/button';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';

interface CodeBlockButtonProps {
  editor: Editor;
  variant?: 'toggle' | 'dropdown';
  size?: 'sm' | 'lg' | 'default';
  className?: string;
}

const CodeBlockButton: React.FC<CodeBlockButtonProps> = ({ 
  editor, 
  variant = 'toggle',
  size = 'sm',
  className = ''
}) => {
  const isActive = editor.isActive('codeBlock');
  
  const toggleCodeBlock = () => {
    editor.chain().focus().toggleCodeBlock().run();
  };

  const setCodeBlock = () => {
    editor.chain().focus().setCodeBlock().run();
  };

  const setCodeBlockWithLanguage = (language: string) => {
    editor.chain().focus().setCodeBlock({ language }).run();
  };

  const buttonSizeClass = size === 'sm' ? 'h-7 w-7 p-0' : size === 'lg' ? 'h-10 w-10 p-0' : 'h-9 w-9 p-0';
  const iconSizeClass = size === 'sm' ? 'h-3.5 w-3.5' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5';

  const popularLanguages = [
    { name: 'JavaScript', value: 'javascript' },
    { name: 'TypeScript', value: 'typescript' },
    { name: 'Python', value: 'python' },
    { name: 'Java', value: 'java' },
    { name: 'C++', value: 'cpp' },
    { name: 'C#', value: 'csharp' },
    { name: 'PHP', value: 'php' },
    { name: 'Go', value: 'go' },
    { name: 'Rust', value: 'rust' },
    { name: 'HTML', value: 'html' },
    { name: 'CSS', value: 'css' },
    { name: 'SQL', value: 'sql' },
    { name: 'JSON', value: 'json' },
    { name: 'Markdown', value: 'markdown' },
    { name: 'Bash', value: 'bash' },
    { name: 'Texto plano', value: 'plaintext' },
  ];

  if (variant === 'dropdown') {
    const DropdownButton = (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size={size}
            className={`${buttonSizeClass} ${className}`}
          >
            <Code className={iconSizeClass} />
            <ChevronDown className="h-3 w-3 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-48">
          <DropdownMenuItem onClick={toggleCodeBlock}>
            <Code className="h-4 w-4 mr-2" />
            {isActive ? 'Quitar bloque de código' : 'Bloque de código'}
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={setCodeBlock}
            disabled={isActive}
          >
            <Terminal className="h-4 w-4 mr-2" />
            Establecer bloque de código
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Lenguajes populares</DropdownMenuLabel>
          {popularLanguages.slice(0, 8).map((lang) => (
            <DropdownMenuItem
              key={lang.value}
              onClick={() => setCodeBlockWithLanguage(lang.value)}
            >
              <FileCode className="h-4 w-4 mr-2" />
              {lang.name}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          {popularLanguages.slice(8).map((lang) => (
            <DropdownMenuItem
              key={lang.value}
              onClick={() => setCodeBlockWithLanguage(lang.value)}
            >
              <FileCode className="h-4 w-4 mr-2" />
              {lang.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {DropdownButton}
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p>Opciones de bloque de código</p>
            <p className="text-xs text-muted-foreground">
              Gestiona bloques de código con diferentes lenguajes
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  // Variant toggle (default)
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Toggle
          pressed={isActive}
          onPressedChange={toggleCodeBlock}
          size={size}
          className={`${buttonSizeClass} ${className}`}
        >
          <Code className={iconSizeClass} />
        </Toggle>
      </TooltipTrigger>
      {/* <TooltipContent>
        <div className="space-y-1">
          <div className="flex justify-between w-full gap-6">
            <p>{isActive ? 'Quitar código' : 'Bloque de código'}</p>
            <kbd className="px-2 py-0.5 text-xs bg-muted rounded">Ctrl+Shift+C</kbd>
          </div>
          <p className="text-xs text-muted-foreground">
            {isActive ? 'Cmd/Ctrl + Enter para salir' : 'Código con formato'}
          </p>
        </div>
      </TooltipContent> */}
    </Tooltip>
  );
};

export default CodeBlockButton;
