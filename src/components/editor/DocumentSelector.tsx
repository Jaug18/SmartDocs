import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, File, FolderOpen } from "lucide-react";

interface Document {
  id: string;
  title: string;
  categoryId?: string | null;
}

interface Category {
  id: string;
  name: string;
}

interface DocumentSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectDocument: (documentId: string, documentTitle: string) => void;
}

export const DocumentSelector = ({ open, onOpenChange, onSelectDocument }: DocumentSelectorProps) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar documentos del localStorage
  useEffect(() => {
    if (open) {
      const loadDocuments = () => {
        const docs: Document[] = [];
        const cats: Category[] = [];
        
        // Cargar categorías
        const savedCategories = localStorage.getItem('doc-categories');
        if (savedCategories) {
          try {
            const parsedCategories = JSON.parse(savedCategories);
            parsedCategories.forEach((cat: any) => {
              cats.push({
                id: cat.id,
                name: cat.name
              });
            });
          } catch (error) {
          }
        }
        
        // Cargar documentos
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('doc-') && !key.includes('categories')) {
            try {
              const doc = JSON.parse(localStorage.getItem(key) || "");
              if (doc && doc.title) {
                docs.push({
                  id: doc.id,
                  title: doc.title,
                  categoryId: doc.categoryId || null
                });
              }
            } catch (error) {
            }
          }
        });
        
        setDocuments(docs);
        setCategories(cats);
        setIsLoading(false);
      };
      
      loadDocuments();
      setSelectedDocId(null);
    }
  }, [open]);

  const filteredDocuments = documents.filter(doc => 
    doc.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleConfirm = () => {
    if (selectedDocId) {
      const selectedDoc = documents.find(doc => doc.id === selectedDocId);
      if (selectedDoc) {
        onSelectDocument(selectedDocId, selectedDoc.title);
      }
    }
  };

  const getCategoryName = (categoryId: string | null | undefined) => {
    if (!categoryId) return "Sin categoría";
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : "Sin categoría";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Seleccionar documento</DialogTitle>
          <DialogDescription>
            Elige un documento para crear un enlace interno.
          </DialogDescription>
        </DialogHeader>
        
        <div className="relative my-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar documentos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <div className="border rounded-md overflow-hidden">
          <div className="max-h-[300px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <p className="text-sm text-muted-foreground">Cargando documentos...</p>
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8">
                <File className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No se encontraron documentos</p>
              </div>
            ) : (
              <div>
                {filteredDocuments.map(doc => (
                  <div
                    key={doc.id}
                    className={`flex items-start gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors border-b last:border-0 ${
                      selectedDocId === doc.id ? 'bg-primary/10' : ''
                    }`}
                    onClick={() => setSelectedDocId(doc.id)}
                  >
                    <File className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 overflow-hidden">
                      <p className="font-medium text-sm truncate">{doc.title}</p>
                      <div className="flex items-center mt-1">
                        <FolderOpen className="h-3.5 w-3.5 text-muted-foreground mr-1" />
                        <p className="text-xs text-muted-foreground">{getCategoryName(doc.categoryId)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter className="mt-4">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedDocId}
          >
            Seleccionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
