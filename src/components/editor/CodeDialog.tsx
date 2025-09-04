
import { useState } from 'react';
import { Editor } from '@tiptap/react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CodeDialogProps {
  editor: Editor;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CODE_LANGUAGES = [
  { value: 'typescript', label: 'TypeScript' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'json', label: 'JSON' },
  { value: 'sql', label: 'SQL' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'bash', label: 'Bash/Shell' },
];

const CodeDialog = ({ editor, open, onOpenChange }: CodeDialogProps) => {
  const [language, setLanguage] = useState('typescript');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (language) {
      editor.chain().focus().toggleCodeBlock({ language }).run();
    }
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Insertar bloque de código</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="language">Lenguaje</Label>
                <Select
                  value={language}
                  onValueChange={setLanguage}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar lenguaje" />
                  </SelectTrigger>
                  <SelectContent>
                    {CODE_LANGUAGES.map((lang) => (
                      <SelectItem key={lang.value} value={lang.value}>
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Insertar código</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CodeDialog;
