import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import ResizableMedia from './ResizableMedia';

export interface YoutubeOptions {
  addPasteHandler: boolean;
  allowFullscreen: boolean;
  autoplay: boolean;
  ccLanguage?: string;
  ccLoadPolicy?: boolean;
  controls: boolean;
  disableKBcontrols: boolean;
  enableIFrameApi: boolean;
  endTime: number;
  height: number;
  interfaceLanguage?: string;
  ivLoadPolicy: number;
  loop: boolean;
  modestBranding: boolean;
  nocookie: boolean;
  origin: string;
  playlist: string;
  progressBarColor?: string;
  startAt: number;
  width: number;
  HTMLAttributes: Record<string, unknown>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    youtube: {
      setYoutubeVideo: (options: { src: string; width?: number; height?: number }) => ReturnType;
    };
  }
}

const YOUTUBE_REGEX = /^(https?:\/\/)?(www\.|music\.)?(youtube\.com|youtu\.be)\/(.+)?$/;
const YOUTUBE_REGEX_GLOBAL = /^(https?:\/\/)?(www\.|music\.)?(youtube\.com|youtu\.be)\/(.+)?$/g;

const getEmbedUrlFromYoutubeUrl = (url: string): { id: string; url: string } | null => {
  if (url.includes('youtu.be/')) {
    const id = url.split('youtu.be/')[1]?.split('?')[0];
    return id ? { id, url: `https://www.youtube-nocookie.com/embed/${id}` } : null;
  }

  if (url.includes('youtube.com/watch')) {
    const match = url.match(/[?&]v=([^&]+)/);
    const id = match?.[1];
    return id ? { id, url: `https://www.youtube-nocookie.com/embed/${id}` } : null;
  }

  if (url.includes('youtube.com/embed/')) {
    const id = url.split('youtube.com/embed/')[1]?.split('?')[0];
    return id ? { id, url: `https://www.youtube-nocookie.com/embed/${id}` } : null;
  }

  return null;
};

export const ResizableYoutube = Node.create<YoutubeOptions>({
  name: 'resizableYoutube',

  addOptions() {
    return {
      addPasteHandler: true,
      allowFullscreen: true,
      autoplay: false,
      ccLanguage: 'es',
      ccLoadPolicy: false,
      controls: true,
      disableKBcontrols: false,
      enableIFrameApi: false,
      endTime: 0,
      height: 315,
      interfaceLanguage: 'es',
      ivLoadPolicy: 1,
      loop: false,
      modestBranding: true,
      nocookie: true,
      origin: '',
      playlist: '',
      progressBarColor: undefined,
      startAt: 0,
      width: 560,
      HTMLAttributes: {},
    };
  },

  group: 'block',

  atom: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      width: {
        default: this.options.width,
      },
      height: {
        default: this.options.height,
      },
      'data-youtube-video': {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'iframe[src*="youtube.com"]',
        getAttrs: (element) => {
          const src = (element as HTMLElement).getAttribute('src');
          const embedData = src ? getEmbedUrlFromYoutubeUrl(src) : null;
          
          if (!embedData) return false;
          
          return {
            src: embedData.url,
            'data-youtube-video': embedData.id,
            width: (element as HTMLElement).getAttribute('width') || this.options.width,
            height: (element as HTMLElement).getAttribute('height') || this.options.height,
          };
        },
      },
      {
        tag: 'iframe[src*="youtu.be"]',
        getAttrs: (element) => {
          const src = (element as HTMLElement).getAttribute('src');
          const embedData = src ? getEmbedUrlFromYoutubeUrl(src) : null;
          
          if (!embedData) return false;
          
          return {
            src: embedData.url,
            'data-youtube-video': embedData.id,
            width: (element as HTMLElement).getAttribute('width') || this.options.width,
            height: (element as HTMLElement).getAttribute('height') || this.options.height,
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const embedUrl = HTMLAttributes.src;

    return [
      'iframe',
      mergeAttributes(
        this.options.HTMLAttributes,
        {
          src: embedUrl,
          width: HTMLAttributes.width || this.options.width,
          height: HTMLAttributes.height || this.options.height,
          allowfullscreen: this.options.allowFullscreen,
          frameborder: 0,
          allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
        },
        HTMLAttributes
      ),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableMedia);
  },

  addCommands() {
    return {
      setYoutubeVideo:
        (options: { src: string; width?: number; height?: number }) =>
        ({ commands }) => {
          const embedData = getEmbedUrlFromYoutubeUrl(options.src);
          
          if (!embedData) {
            return false;
          }

          return commands.insertContent({
            type: this.name,
            attrs: {
              src: embedData.url,
              'data-youtube-video': embedData.id,
              width: options.width || this.options.width,
              height: options.height || this.options.height,
            },
          });
        },
    };
  },

  addPasteRules() {
    if (!this.options.addPasteHandler) {
      return [];
    }

    return [
      {
        find: YOUTUBE_REGEX_GLOBAL,
        handler: ({ state, range, match }) => {
          const embedData = getEmbedUrlFromYoutubeUrl(match[0]);

          if (!embedData) {
            return null;
          }

          const { tr } = state;
          const start = range.from;
          const end = range.to;

          tr.replaceWith(start, end, this.type.create({
            src: embedData.url,
            'data-youtube-video': embedData.id,
            width: this.options.width,
            height: this.options.height,
          }));
        },
      },
    ];
  },
});

export default ResizableYoutube;
