import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Smile, Heart, Coffee, Car, Globe, Flag, Music, Star } from 'lucide-react'

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void
}

// Categorías de emojis organizadas
const EMOJI_CATEGORIES = {
  smileys: {
    icon: Smile,
    label: 'Caritas',
    emojis: [
      '😀', '😃', '😄', '😁', '😅', '😂', '🤣', '🥲', '😊', '😇',
      '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
      '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥸',
      '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️',
      '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡',
      '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓',
      '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄',
      '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵',
      '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠'
    ]
  },
  hearts: {
    icon: Heart,
    label: 'Corazones',
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
      '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '♥️',
      '💌', '💋', '💍', '💎', '🌹', '🌺', '🌻', '🌷', '🌸', '💐'
    ]
  },
  food: {
    icon: Coffee,
    label: 'Comida',
    emojis: [
      '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈',
      '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦',
      '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔',
      '🍠', '🥐', '🥖', '🍞', '🥨', '🥯', '🧀', '🥚', '🍳', '🧈',
      '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟',
      '🍕', '🫓', '🥪', '🥙', '🧆', '🌮', '🌯', '🫔', '🥗', '🥘',
      '🫕', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🦪', '🍤',
      '🍙', '🍚', '🍘', '🍥', '🥠', '🥮', '🍢', '🍡', '🍧', '🍨',
      '🍦', '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', '🍿',
      '🍩', '🍪', '🌰', '🥜', '🍯', '🥛', '🍼', '☕', '🫖', '🍵'
    ]
  },
  transport: {
    icon: Car,
    label: 'Transporte',
    emojis: [
      '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐',
      '🛻', '🚚', '🚛', '🚜', '🏍️', '🛵', '🚲', '🛴', '🛹', '🛼',
      '🚁', '🛸', '✈️', '🛩️', '🛫', '🛬', '🪂', '💺', '🚀', '🛰️',
      '🚢', '⛵', '🚤', '🛥️', '🛳️', '⛴️', '🚂', '🚃', '🚄', '🚅',
      '🚆', '🚇', '🚈', '🚉', '🚊', '🚝', '🚞', '🚋', '🚌', '🚍'
    ]
  },
  nature: {
    icon: Globe,
    label: 'Naturaleza',
    emojis: [
      '🌍', '🌎', '🌏', '🌐', '🗺️', '🗾', '🧭', '🏔️', '⛰️', '🌋',
      '🗻', '🏕️', '🏖️', '🏜️', '🏝️', '🏞️', '🌲', '🌳', '🌴', '🌱',
      '🌿', '☘️', '🍀', '🎍', '🎋', '🍃', '🍂', '🍁', '🍄', '🌾',
      '💐', '🌷', '🌹', '🥀', '🌺', '🌸', '🌼', '🌻', '🌞', '🌝',
      '🌛', '🌜', '🌚', '🌕', '🌖', '🌗', '🌘', '🌑', '🌒', '🌓',
      '🌔', '🌙', '🌎', '🌍', '🌏', '💫', '⭐', '🌟', '✨', '⚡',
      '☄️', '💥', '🔥', '🌪️', '🌈', '☀️', '🌤️', '⛅', '🌥️', '☁️',
      '🌦️', '🌧️', '⛈️', '🌩️', '🌨️', '❄️', '☃️', '⛄', '🌬️', '💨'
    ]
  },
  flags: {
    icon: Flag,
    label: 'Banderas',
    emojis: [
      '🏁', '🚩', '🎌', '🏴', '🏳️', '🏳️‍🌈', '🏳️‍⚧️', '🏴‍☠️',
      '🇦🇩', '🇦🇪', '🇦🇫', '🇦🇬', '🇦🇮', '🇦🇱', '🇦🇲', '🇦🇴',
      '🇦🇶', '🇦🇷', '🇦🇸', '🇦🇹', '🇦🇺', '🇦🇼', '🇦🇽', '🇦🇿',
      '🇧🇦', '🇧🇧', '🇧🇩', '🇧🇪', '🇧🇫', '🇧🇬', '🇧🇭', '🇧🇮',
      '🇧🇯', '🇧🇱', '🇧🇲', '🇧🇳', '🇧🇴', '🇧🇶', '🇧🇷', '🇧🇸',
      '🇧🇹', '🇧🇻', '🇧🇼', '🇧🇾', '🇧🇿', '🇨🇦', '🇨🇨', '🇨🇩',
      '🇨🇫', '🇨🇬', '🇨🇭', '🇨🇮', '🇨🇰', '🇨🇱', '🇨🇲', '🇨🇳',
      '🇨🇴', '🇨🇵', '🇨🇷', '🇨🇺', '🇨🇻', '🇨🇼', '🇨🇽', '🇨🇾',
      '🇨🇿', '🇩🇪', '🇩🇬', '🇩🇯', '🇩🇰', '🇩🇲', '🇩🇴', '🇩🇿',
      '🇪🇦', '🇪🇨', '🇪🇪', '🇪🇬', '🇪🇭', '🇪🇷', '🇪🇸', '🇪🇹'
    ]
  },
  objects: {
    icon: Music,
    label: 'Objetos',
    emojis: [
      '⌚', '📱', '📲', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️',
      '🗜️', '💽', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥',
      '📽️', '🎞️', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️',
      '🎛️', '🧭', '⏱️', '⏲️', '⏰', '🕰️', '⌛', '⏳', '📡', '🔋',
      '🔌', '💡', '🔦', '🕯️', '🪔', '🧯', '🛢️', '💸', '💵', '💴',
      '💶', '💷', '💰', '💳', '💎', '⚖️', '🪜', '🧰', '🔧', '🔨',
      '⚒️', '🛠️', '⛏️', '🔩', '⚙️', '🧲', '🔫', '💣', '🧨', '🪓',
      '🔪', '🗡️', '⚔️', '🛡️', '🚬', '⚰️', '🪦', '⚱️', '🏺', '🔮'
    ]
  },
  symbols: {
    icon: Star,
    label: 'Símbolos',
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
      '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️',
      '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐',
      '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐',
      '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴', '📳',
      '🈶', '🈚', '🈸', '🈺', '🈷️', '✴️', '🆚', '💮', '🉐', '㊙️',
      '㊗️', '🈴', '🈵', '🈹', '🈲', '🅰️', '🅱️', '🆎', '🆑', '🅾️',
      '🆘', '❌', '⭕', '🛑', '⛔', '📛', '🚫', '💯', '💢', '♨️',
      '🚷', '🚯', '🚳', '🚱', '🔞', '📵', '🚭', '❗', '❕', '❓'
    ]
  }
}

// Emojis más populares para mostrar por defecto
const POPULAR_EMOJIS = [
  '😀', '😂', '🥰', '😍', '🤔', '😭', '😅', '😊', '🙄', '😘',
  '😉', '😎', '🤗', '😏', '😢', '😴', '🤤', '😋', '🤨', '🧐',
  '❤️', '💔', '💕', '💖', '💙', '💚', '💛', '💜', '🖤', '🤍',
  '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '👏', '🙌', '👐',
  '🔥', '💯', '✨', '⭐', '🌟', '💫', '🌈', '☀️', '🌙', '⚡'
]

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ onEmojiSelect }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  // Filtrar emojis basado en búsqueda
  const getFilteredEmojis = (emojis: string[]) => {
    if (!searchTerm) return emojis
    
    // Para simplicidad, solo filtramos los emojis populares por nombre
    const emojiNames: { [key: string]: string } = {
      '😀': 'feliz sonrisa cara',
      '😂': 'risa llanto lagrimas',
      '🥰': 'amor corazones enamorado',
      '😍': 'ojos corazon amor',
      '🤔': 'pensando reflexion',
      '😭': 'llanto triste lagrimas',
      '😅': 'risa sudor nervioso',
      '😊': 'sonrisa feliz',
      '🙄': 'ojos rodando',
      '😘': 'beso corazon',
      '😉': 'guiño',
      '😎': 'genial lentes',
      '🤗': 'abrazo',
      '😏': 'sonrisa travesa',
      '😢': 'triste lagrima',
      '😴': 'dormir sueño',
      '🤤': 'babear',
      '😋': 'rico sabroso',
      '🤨': 'sospecha duda',
      '🧐': 'monoculo investigar',
      '❤️': 'corazon amor rojo',
      '💔': 'corazon roto',
      '💕': 'corazones amor',
      '💖': 'corazon brillante',
      '💙': 'corazon azul',
      '💚': 'corazon verde',
      '💛': 'corazon amarillo',
      '💜': 'corazon morado',
      '🖤': 'corazon negro',
      '🤍': 'corazon blanco',
      '👍': 'pulgar arriba bien',
      '👎': 'pulgar abajo mal',
      '👌': 'perfecto ok',
      '✌️': 'paz victoria',
      '🤞': 'dedos cruzados suerte',
      '🤟': 'te amo amor',
      '🤘': 'rock metal',
      '👏': 'aplausos',
      '🙌': 'celebrar manos',
      '👐': 'manos abiertas',
      '🔥': 'fuego genial',
      '💯': 'cien perfecto',
      '✨': 'brillos estrellas',
      '⭐': 'estrella',
      '🌟': 'estrella brillante',
      '💫': 'estrella fugaz',
      '🌈': 'arcoiris',
      '☀️': 'sol',
      '🌙': 'luna',
      '⚡': 'rayo'
    }

    return emojis.filter(emoji => {
      const emojiName = emojiNames[emoji] || ''
      return emojiName.toLowerCase().includes(searchTerm.toLowerCase())
    })
  }

  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji)
    setIsOpen(false)
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-lg">
          😊
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="start" 
        className="w-80 p-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-3 border-b">
          <Input
            placeholder="Buscar emojis..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8"
          />
        </div>

        <Tabs defaultValue="popular" className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-8 p-0 m-1">
            <TabsTrigger value="popular" className="text-xs h-7">
              <Star className="h-3 w-3" />
            </TabsTrigger>
            <TabsTrigger value="smileys" className="text-xs h-7">
              <Smile className="h-3 w-3" />
            </TabsTrigger>
            <TabsTrigger value="hearts" className="text-xs h-7">
              <Heart className="h-3 w-3" />
            </TabsTrigger>
            <TabsTrigger value="more" className="text-xs h-7">
              •••
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-64 w-full">
            <TabsContent value="popular" className="mt-2 p-2">
              <div className="grid grid-cols-8 gap-1">
                {getFilteredEmojis(POPULAR_EMOJIS).map((emoji, index) => (
                  <Button
                    key={`popular-${index}`}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-lg hover:bg-accent"
                    onClick={() => handleEmojiClick(emoji)}
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="smileys" className="mt-2 p-2">
              <div className="grid grid-cols-8 gap-1">
                {EMOJI_CATEGORIES.smileys.emojis.map((emoji, index) => (
                  <Button
                    key={`smiley-${index}`}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-lg hover:bg-accent"
                    onClick={() => handleEmojiClick(emoji)}
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="hearts" className="mt-2 p-2">
              <div className="grid grid-cols-8 gap-1">
                {EMOJI_CATEGORIES.hearts.emojis.map((emoji, index) => (
                  <Button
                    key={`heart-${index}`}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-lg hover:bg-accent"
                    onClick={() => handleEmojiClick(emoji)}
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="more" className="mt-2">
              <Tabs orientation="vertical" className="w-full">
                <TabsList className="grid w-full grid-cols-1 h-auto p-1">
                  {Object.entries(EMOJI_CATEGORIES).slice(2).map(([key, category]) => {
                    const IconComponent = category.icon
                    return (
                      <TabsTrigger 
                        key={key}
                        value={key} 
                        className="justify-start text-xs h-8"
                      >
                        <IconComponent className="h-3 w-3 mr-2" />
                        {category.label}
                      </TabsTrigger>
                    )
                  })}
                </TabsList>

                {Object.entries(EMOJI_CATEGORIES).slice(2).map(([key, category]) => (
                  <TabsContent key={key} value={key} className="mt-2 p-2">
                    <div className="grid grid-cols-8 gap-1">
                      {category.emojis.map((emoji, index) => (
                        <Button
                          key={`${key}-${index}`}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-lg hover:bg-accent"
                          onClick={() => handleEmojiClick(emoji)}
                        >
                          {emoji}
                        </Button>
                      ))}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <div className="p-2 border-t text-xs text-muted-foreground text-center">
          También puedes escribir :) :D &lt;3 y más
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
