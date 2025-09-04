import React from 'react';
import { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Type } from 'lucide-react';

interface TypographyButtonProps {
  editor: Editor;
}

const TypographyButton: React.FC<TypographyButtonProps> = ({ editor }) => {

  if (!editor) return null;

  // Check if Typography extension is available
  const hasTypography = editor.extensionManager.extensions.find(
    (extension) => extension.name === 'typography'
  );

  if (!hasTypography) return null;

  const isTypographyEnabled = () => {
    // Typography is usually enabled by default when the extension is added
    // We can check if the extension is present and working
    return true;
  };

  const toggleTypography = () => {
    // Typography extension automatically handles typographic replacements
    // This button serves as an indicator and can be used to show info
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTypography}
          className={`typography-button ${isTypographyEnabled() ? 'bg-muted' : ''}`}
        >
          <Type className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      {/* <TooltipContent>
        <div className="text-sm">
          <p className="font-medium">Tipografía inteligente</p>
          <p className="text-xs text-muted-foreground mt-1">
            Reemplazos automáticos:<br />
            (c) → ©, (tm) → ™, (r) → ®<br />
            +/- → ±, -- → –, --- → —<br />
            &lt;&lt; → «, &gt;&gt; → »
          </p>
        </div>
      </TooltipContent> */}
    </Tooltip>
  );
};

export default TypographyButton;
