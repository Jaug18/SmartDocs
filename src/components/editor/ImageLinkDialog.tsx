import { useState, useRef } from "react";
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
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, Upload, Image as ImageIcon } from "lucide-react";

interface ImageLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (url: string) => void;
}

export const ImageLinkDialog = ({ open, onOpenChange, onInsert }: ImageLinkDialogProps) => {
  const [imageUrl, setImageUrl] = useState("");
  const [activeTab, setActiveTab] = useState<string>("url");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInsert = () => {
    if (activeTab === "url" && imageUrl.trim()) {
      onInsert(imageUrl);
      setImageUrl("");
      onOpenChange(false);
    } else if (activeTab === "upload" && imagePreview) {
      onInsert(imagePreview);
      setSelectedFile(null);
      setImagePreview(null);
      onOpenChange(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
      // Convertir la imagen a formato Base64
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Insertar imagen</DialogTitle>
          <DialogDescription>
            Selecciona una imagen desde tu dispositivo o introduce la URL.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs 
          defaultValue="url" 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="w-full mt-2"
        >
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="url">
              <Link className="h-4 w-4 mr-2" />
              URL de imagen
            </TabsTrigger>
            <TabsTrigger value="upload">
              <Upload className="h-4 w-4 mr-2" />
              Subir imagen
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="url" className="mt-4">
            <div className="grid gap-4 py-2">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="image-url" className="col-span-4">
                  URL de la imagen
                </Label>
                <Input
                  id="image-url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://ejemplo.com/imagen.jpg"
                  className="col-span-4"
                  autoFocus={activeTab === "url"}
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="upload" className="mt-4">
            <div className="grid gap-4 py-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
              
              {imagePreview ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="relative max-h-[200px] overflow-hidden rounded-md border border-muted">
                    <img 
                      src={imagePreview} 
                      alt="Vista previa" 
                      className="max-h-[200px] w-auto object-contain"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={triggerFileSelect}
                    >
                      Cambiar imagen
                    </Button>
                  </div>
                </div>
              ) : (
                <div 
                  onClick={triggerFileSelect}
                  className="flex flex-col items-center justify-center gap-4 p-12 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <ImageIcon className="h-12 w-12 text-muted-foreground" />
                  <div className="text-center">
                    <p className="text-sm font-medium mb-1">Haz clic para seleccionar una imagen</p>
                    <p className="text-xs text-muted-foreground">PNG, JPG, GIF hasta 10MB</p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="mt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            type="button" 
            onClick={handleInsert}
            disabled={(activeTab === "url" && !imageUrl.trim()) || (activeTab === "upload" && !imagePreview)}
          >
            Insertar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
