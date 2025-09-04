import React from 'react';
import { Editor } from '@tiptap/react';
import { Code2, Terminal, FileCode2, Zap, ChevronDown } from 'lucide-react';
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
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';

interface CodeBlockLowlightButtonProps {
  editor: Editor;
  variant?: 'toggle' | 'dropdown';
  size?: 'sm' | 'lg' | 'default';
  className?: string;
}

const CodeBlockLowlightButton: React.FC<CodeBlockLowlightButtonProps> = ({ 
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

  // Lenguajes soportados por lowlight con mejor categorización
  const languageCategories = {
    web: [
      { name: 'JavaScript', value: 'javascript', icon: '🌐' },
      { name: 'TypeScript', value: 'typescript', icon: '🔷' },
      { name: 'HTML', value: 'html', icon: '📄' },
      { name: 'CSS', value: 'css', icon: '🎨' },
      { name: 'SCSS', value: 'scss', icon: '💅' },
      { name: 'Vue', value: 'vue', icon: '💚' },
      { name: 'React JSX', value: 'jsx', icon: '⚛️' },
    ],
    backend: [
      { name: 'Python', value: 'python', icon: '🐍' },
      { name: 'Java', value: 'java', icon: '☕' },
      { name: 'C#', value: 'csharp', icon: '🔵' },
      { name: 'PHP', value: 'php', icon: '🐘' },
      { name: 'Go', value: 'go', icon: '🐹' },
      { name: 'Rust', value: 'rust', icon: '🦀' },
      { name: 'C++', value: 'cpp', icon: '⚡' },
      { name: 'C', value: 'c', icon: '🔧' },
    ],
    data: [
      { name: 'SQL', value: 'sql', icon: '🗄️' },
      { name: 'JSON', value: 'json', icon: '📋' },
      { name: 'YAML', value: 'yaml', icon: '📝' },
      { name: 'XML', value: 'xml', icon: '📄' },
      { name: 'GraphQL', value: 'graphql', icon: '🔗' },
    ],
    shell: [
      { name: 'Bash', value: 'bash', icon: '🐚' },
      { name: 'PowerShell', value: 'powershell', icon: '💙' },
      { name: 'Dockerfile', value: 'dockerfile', icon: '🐳' },
      { name: 'NGINX', value: 'nginx', icon: '🌐' },
    ],
    other: [
      { name: 'Markdown', value: 'markdown', icon: '📝' },
      { name: 'Texto plano', value: 'plaintext', icon: '📄' },
      { name: 'Diff', value: 'diff', icon: '🔄' },
      { name: 'HTTP', value: 'http', icon: '🌐' },
    ]
  };

  const categoryLabels = {
    web: 'Desarrollo Web',
    backend: 'Backend',
    data: 'Datos y Config',
    shell: 'Shell y DevOps',
    other: 'Otros'
  };

  if (variant === 'dropdown') {
    return (
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size={size}
                className={`${buttonSizeClass} ${className} ${isActive ? 'bg-accent text-accent-foreground' : ''}`}
              >
                <Code2 className={iconSizeClass} />
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          {/* <TooltipContent>
            <p>Bloque de código con resaltado</p>
            <p className="text-xs text-muted-foreground">Ctrl+Alt+C</p>
          </TooltipContent> */}
        </Tooltip>
        <DropdownMenuContent className="w-56 max-h-96 overflow-y-auto">
          <DropdownMenuItem onClick={toggleCodeBlock}>
            <Code2 className="h-4 w-4 mr-2" />
            {isActive ? 'Quitar código resaltado' : 'Código con resaltado'}
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={setCodeBlock}
            disabled={isActive}
          >
            <Terminal className="h-4 w-4 mr-2" />
            Establecer bloque de código
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          
          {Object.entries(languageCategories).map(([category, languages]) => (
            <DropdownMenuSub key={category}>
              <DropdownMenuSubTrigger className="flex items-center">
                <Zap className="h-4 w-4 mr-2" />
                {categoryLabels[category as keyof typeof categoryLabels]}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-48">
                {languages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.value}
                    onClick={() => setCodeBlockWithLanguage(lang.value)}
                    className="flex items-center"
                  >
                    <span className="mr-2">{lang.icon}</span>
                    {lang.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          ))}
          
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Con resaltado de sintaxis
          </DropdownMenuLabel>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Versión toggle simple
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Toggle
          pressed={isActive}
          onPressedChange={toggleCodeBlock}
          aria-label="Bloque de código con resaltado"
          size={size}
          className={`${buttonSizeClass} ${className}`}
        >
          <Code2 className={iconSizeClass} />
        </Toggle>
      </TooltipTrigger>
      {/* <TooltipContent>
        <p>Bloque de código con resaltado</p>
        <p className="text-xs text-muted-foreground">Ctrl+Alt+C</p>
      </TooltipContent> */}
    </Tooltip>
  );
};

export default CodeBlockLowlightButton;
