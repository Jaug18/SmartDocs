import React, { useState } from 'react';
import { Editor } from '@tiptap/react';
import { Smile, Heart, ThumbsUp, Flame, Star, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import './emoji.css';

interface EmojiButtonProps {
  editor: Editor;
  variant?: 'button' | 'dropdown';
}

// Lista de emojis comunes organizados por categorías
const EMOJI_CATEGORIES = {
  'Caras': [
    { name: 'grinning', emoji: '😀', shortcode: ':grinning:' },
    { name: 'laughing', emoji: '😆', shortcode: ':laughing:' },
    { name: 'heart_eyes', emoji: '😍', shortcode: ':heart_eyes:' },
    { name: 'wink', emoji: '😉', shortcode: ':wink:' },
    { name: 'thinking', emoji: '🤔', shortcode: ':thinking:' },
    { name: 'confused', emoji: '😕', shortcode: ':confused:' },
  ],
  'Gestos': [
    { name: 'thumbsup', emoji: '👍', shortcode: ':thumbsup:' },
    { name: 'thumbsdown', emoji: '👎', shortcode: ':thumbsdown:' },
    { name: 'clap', emoji: '👏', shortcode: ':clap:' },
    { name: 'wave', emoji: '👋', shortcode: ':wave:' },
    { name: 'muscle', emoji: '💪', shortcode: ':muscle:' },
    { name: 'pray', emoji: '🙏', shortcode: ':pray:' },
  ],
  'Corazones': [
    { name: 'heart', emoji: '❤️', shortcode: ':heart:' },
    { name: 'heartbreak', emoji: '💔', shortcode: ':heartbreak:' },
    { name: 'blue_heart', emoji: '💙', shortcode: ':blue_heart:' },
    { name: 'green_heart', emoji: '💚', shortcode: ':green_heart:' },
    { name: 'yellow_heart', emoji: '💛', shortcode: ':yellow_heart:' },
    { name: 'purple_heart', emoji: '💜', shortcode: ':purple_heart:' },
  ],
  'Símbolos': [
    { name: 'fire', emoji: '🔥', shortcode: ':fire:' },
    { name: 'zap', emoji: '⚡', shortcode: ':zap:' },
    { name: 'star', emoji: '⭐', shortcode: ':star:' },
    { name: 'check', emoji: '✅', shortcode: ':check:' },
    { name: 'x', emoji: '❌', shortcode: ':x:' },
    { name: 'warning', emoji: '⚠️', shortcode: ':warning:' },
  ],
};

const EmojiButton: React.FC<EmojiButtonProps> = ({ editor, variant = 'dropdown' }) => {
  if (!editor) return null;

  const insertEmoji = (emojiName: string) => {
    editor.commands.setEmoji(emojiName);
    editor.commands.focus();
  };

  const insertQuickEmoji = () => {
    // Insertar un emoji rápido por defecto
    insertEmoji('grinning');
  };

  if (variant === 'button') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={insertQuickEmoji}
              className="emoji-button"
              aria-label="Insertar emoji sonriente"
            >
              <Smile className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="emoji-tooltip">
              <p className="emoji-tooltip__title">Insertar emoji 😀</p>
              <p className="emoji-tooltip__shortcut">
                Escribe : para autocompletar
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <DropdownMenu>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="emoji-dropdown-button"
                aria-label="Selector de emojis"
              >
                <Smile className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          {/* <TooltipContent>
            <div className="emoji-tooltip">
              <p className="emoji-tooltip__title">Selector de emojis</p>
              <p className="emoji-tooltip__shortcut">
                Escribe : para autocompletar
              </p>
            </div>
          </TooltipContent> */}
        </Tooltip>
      </TooltipProvider>

      <DropdownMenuContent 
        className="emoji-dropdown-content max-h-[50vh] overflow-y-auto" 
        align="start" 
        side="bottom"
        sideOffset={5}
        alignOffset={0}
        style={{ 
          position: 'fixed',
          zIndex: 999,
          maxHeight: '50vh',
          overflowY: 'auto'
        }}
      >
        <DropdownMenuLabel className="emoji-dropdown-label">
          Seleccionar Emoji
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
          <div key={category} className="emoji-category">
            <DropdownMenuLabel className="emoji-category-label">
              {category}
            </DropdownMenuLabel>
            <div className="emoji-grid">
              {emojis.map((emoji) => (
                <DropdownMenuItem
                  key={emoji.name}
                  onClick={() => insertEmoji(emoji.name)}
                  className="emoji-item"
                >
                  <span className="emoji-symbol">{emoji.emoji}</span>
                  <span className="emoji-name">{emoji.shortcode}</span>
                </DropdownMenuItem>
              ))}
            </div>
            <DropdownMenuSeparator />
          </div>
        ))}
        
        <div className="emoji-footer">
          <DropdownMenuLabel className="emoji-footer-text">
            💡 Tip: Escribe : seguido del nombre del emoji para autocompletar
          </DropdownMenuLabel>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default EmojiButton;
