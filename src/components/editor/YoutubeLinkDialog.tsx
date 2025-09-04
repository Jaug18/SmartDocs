import { useState } from "react";
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

interface YoutubeLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (url: string) => void;
}

export const YoutubeLinkDialog = ({ open, onOpenChange, onInsert }: YoutubeLinkDialogProps) => {
  const [youtubeUrl, setYoutubeUrl] = useState("");

  const handleInsert = () => {
    if (youtubeUrl.trim()) {
      onInsert(youtubeUrl);
      setYoutubeUrl("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Insertar video de YouTube</DialogTitle>
          <DialogDescription>
            Introduce la URL del video de YouTube que deseas insertar.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="youtube-url" className="col-span-4">
              URL de YouTube
            </Label>
            <Input
              id="youtube-url"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="col-span-4"
              autoFocus
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleInsert}>Insertar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
