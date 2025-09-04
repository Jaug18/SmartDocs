import React from 'react';
import { Editor } from '@tiptap/react';
import './character-count.css';

interface CharacterCountDisplayProps {
  editor: Editor;
  limit?: number;
  showWords?: boolean;
}

const CharacterCountDisplay: React.FC<CharacterCountDisplayProps> = ({ 
  editor, 
  limit = 1000000,
  showWords = true
}) => {
  if (!editor) return null;

  const characterCount = editor.storage.characterCount.characters();
  const wordCount = editor.storage.characterCount.words();
  const percentage = limit ? Math.round((100 / limit) * characterCount) : 0;
  
  // Determinar el estado del contador
  const isWarning = limit && characterCount >= limit;
  const isNearLimit = limit && characterCount >= limit * 0.9 && characterCount < limit;
  
  const className = `character-count ${
    isWarning ? 'character-count--warning' : 
    isNearLimit ? 'character-count--near-limit' : ''
  }`;

  return (
    <div className={className}>
      {limit && (
        <svg height="20" width="20" viewBox="0 0 20 20">
          {/* Círculo de fondo */}
          <circle 
            r="10" 
            cx="10" 
            cy="10" 
            fill="hsl(var(--muted))" 
          />
          {/* Círculo de progreso */}
          <circle
            r="5"
            cx="10"
            cy="10"
            fill="transparent"
            stroke="currentColor"
            strokeWidth="10"
            strokeDasharray={`calc(${Math.min(percentage, 100)} * 31.4 / 100) 31.4`}
            transform="rotate(-90) translate(-20)"
            style={{
              transition: 'stroke-dasharray 0.3s ease'
            }}
          />
          {/* Círculo central blanco */}
          <circle 
            r="6" 
            cx="10" 
            cy="10" 
            fill="hsl(var(--background))" 
          />
        </svg>
      )}
      <div className="flex flex-col">
        <div className="flex items-center gap-1">
          <span className="font-medium">{characterCount.toLocaleString()}</span>
          {limit && (
            <>
              <span className="text-muted-foreground">/</span>
              <span className="text-muted-foreground">{limit.toLocaleString()}</span>
            </>
          )}
          <span className="text-xs">caracteres</span>
        </div>
        {showWords && (
          <div className="flex items-center gap-1">
            <span className="font-medium">{wordCount.toLocaleString()}</span>
            <span className="text-xs">palabras</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CharacterCountDisplay;
