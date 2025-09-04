import { mergeAttributes, Node } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import { useState } from 'react'

export interface CanvasOptions {
  HTMLAttributes: Record<string, string | number | boolean>
}

interface CanvasLine {
  path: string
  color: string
  size: number
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    canvas: {
      /**
       * Insert a canvas drawing node
       */
      insertCanvas: () => ReturnType
    }
  }
}

export default Node.create<CanvasOptions>({
  name: 'canvas',

  group: 'block',

  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      lines: {
        default: [],
        parseHTML: element => {
          const linesData = element.getAttribute('data-lines')
          try {
            return linesData ? JSON.parse(linesData) : []
          } catch (e) {
            return []
          }
        },
        renderHTML: attributes => {
          return {
            'data-lines': JSON.stringify(attributes.lines),
          }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="canvas"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    const lines = HTMLAttributes['data-lines'] ? JSON.parse(HTMLAttributes['data-lines']) : []
    
    // Crear SVG para la exportación
    const svgContent = lines.length > 0 ? `
      <svg viewBox="0 0 500 250" style="width: 100%; height: 200px; background: #fafafa; border: 1px solid #e5e7eb; border-radius: 8px;">
        ${lines.map((line: CanvasLine) => 
          `<path d="${line.path}" stroke="${line.color}" stroke-width="${line.size}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
        ).join('')}
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-export)" />
        ${lines.map((line: CanvasLine) => 
          `<path d="${line.path}" stroke="${line.color}" stroke-width="${line.size}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
        ).join('')}
      </svg>
    ` : `
      <div style="width: 100%; height: 200px; background: #fafafa; border: 2px dashed #d1d5db; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #6b7280;">
        <div style="text-align: center;">
          <div style="margin-bottom: 8px;">🎨</div>
          <div style="font-size: 14px;">Canvas de dibujo</div>
        </div>
      </div>
    `

    return ['div', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { 
      'data-type': 'canvas',
      class: 'canvas-drawing-node',
      style: 'margin: 1rem 0;'
    }), svgContent]
  },

  addNodeView() {
    return ReactNodeViewRenderer(CanvasComponent)
  },

  addCommands() {
    return {
      insertCanvas: () => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: {
            lines: [],
          },
        })
      },
    }
  },
})
