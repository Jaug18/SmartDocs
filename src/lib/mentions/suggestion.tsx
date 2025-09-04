import { ReactRenderer } from '@tiptap/react';
import tippy from 'tippy.js';
import MentionList from './MentionList';
import { SuggestionProps, SuggestionKeyDownProps } from '@tiptap/suggestion';

// Lista de sugerencias de usuario ficticia (en un caso real, esto vendría de tu API)
const users = [
  { id: 'juan-perez', name: 'Juan Pérez' },
  { id: 'maria-lopez', name: 'María López' },
  { id: 'carlos-gomez', name: 'Carlos Gómez' },
  { id: 'ana-rodriguez', name: 'Ana Rodríguez' },
  { id: 'luis-martinez', name: 'Luis Martínez' },
  { id: 'sofia-garcia', name: 'Sofía García' },
  { id: 'diego-hernandez', name: 'Diego Hernández' },
  { id: 'valeria-torres', name: 'Valeria Torres' },
  { id: 'miguel-ramirez', name: 'Miguel Ramírez' },
  { id: 'isabella-silva', name: 'Isabella Silva' },
  { id: 'admin', name: 'Administrador' },
  { id: 'editor', name: 'Editor' },
  { id: 'moderador', name: 'Moderador' },
];

export default {
  items: ({ query }: { query: string }) => {
    if (!query) {
      // Si no hay query, muestra los usuarios más relevantes
      return users.slice(0, 5);
    }
    
    return users
      .filter((user) =>
        user.name.toLowerCase().includes(query.toLowerCase()) ||
        user.id.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, 10); // Aumentamos el límite a 10 resultados
  },

  render: () => {
    let component: ReactRenderer;
    let popup: ReturnType<typeof tippy> | null = null;

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
          maxWidth: 300,
          duration: [200, 150],
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

        const refHandler = (component.ref as { onKeyDown?: (props: SuggestionKeyDownProps) => boolean })?.onKeyDown;
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
