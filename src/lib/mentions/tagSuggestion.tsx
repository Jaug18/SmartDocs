import { ReactRenderer } from '@tiptap/react';
import tippy, { Instance as TippyInstance } from 'tippy.js';
import { Editor } from '@tiptap/core';
import { SuggestionProps, SuggestionKeyDownProps } from '@tiptap/suggestion';
import MentionList from './MentionList';

// Lista de tags/categorías ficticia
const tags = [
  { id: 'frontend', name: '#frontend' },
  { id: 'backend', name: '#backend' },
  { id: 'react', name: '#react' },
  { id: 'typescript', name: '#typescript' },
  { id: 'javascript', name: '#javascript' },
  { id: 'nodejs', name: '#nodejs' },
  { id: 'database', name: '#database' },
  { id: 'api', name: '#api' },
  { id: 'testing', name: '#testing' },
  { id: 'deployment', name: '#deployment' },
  { id: 'ui-ux', name: '#ui-ux' },
  { id: 'mobile', name: '#mobile' },
];

interface Tag {
  id: string;
  name: string;
}

interface MentionRef {
  onKeyDown: (props: SuggestionKeyDownProps) => boolean;
}

export default {
  items: ({ query }: { query: string }) => {
    if (!query) {
      // Si no hay query, muestra los tags más populares
      return tags.slice(0, 6);
    }
    
    return tags
      .filter((tag) =>
        tag.name.toLowerCase().includes(query.toLowerCase()) ||
        tag.id.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, 8);
  },

  render: () => {
    let component: ReactRenderer;
    let popup: TippyInstance[] | null = null;

    return {
      onStart: (props: SuggestionProps) => {
        component = new ReactRenderer(MentionList, {
          props,
          editor: props.editor,
        });

        if (!props.clientRect) {
          return;
        }

        popup = tippy('body', {
          getReferenceClientRect: props.clientRect,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: 'manual',
          placement: 'bottom-start',
          theme: 'light-border',
          maxWidth: 250,
          duration: [150, 100],
        });
      },

      onUpdate(props: SuggestionProps) {
        component.updateProps(props);

        if (!props.clientRect) {
          return;
        }

        if (popup && popup[0]) {
          popup[0].setProps({
            getReferenceClientRect: props.clientRect,
          });
        }
      },

      onKeyDown(props: SuggestionKeyDownProps) {
        if (props.event.key === 'Escape') {
          if (popup && popup[0]) {
            popup[0].hide();
          }
          return true;
        }

        const refHandler = (component.ref as MentionRef)?.onKeyDown;
        return refHandler ? refHandler(props) : false;
      },

      onExit() {
        if (popup && popup[0]) {
          popup[0].destroy();
        }
        if (component) {
          component.destroy();
        }
      },
    };
  },
};
