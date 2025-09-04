import React, { useCallback, useEffect, useRef, useState } from 'react';
import { NodeViewWrapper, ReactNodeViewProps } from '@tiptap/react';
import { ResizableBox, ResizeCallbackData } from 'react-resizable';
import 'react-resizable/css/styles.css';

const ResizableMedia: React.FC<ReactNodeViewProps> = ({ node, updateAttributes, selected }) => {
  const attrs = node.attrs;
  const { src, alt, title, width = 300, height = 200 } = attrs;
  const [dimensions, setDimensions] = useState({ width, height });
  const [aspectRatio, setAspectRatio] = useState(width / height);
  const containerRef = useRef<HTMLDivElement>(null);
  const isYouTube = attrs['data-youtube-video'];

  useEffect(() => {
    setDimensions({ width, height });
    setAspectRatio(width / height);
  }, [width, height]);

  const handleResize = useCallback(
    (event: React.SyntheticEvent, data: ResizeCallbackData) => {
      const newWidth = data.size.width;
      const newHeight = Math.round(newWidth / aspectRatio);
      
      setDimensions({ width: newWidth, height: newHeight });
      
      // Actualizar los atributos del nodo
      updateAttributes({
        width: newWidth,
        height: newHeight,
      });
    },
    [aspectRatio, updateAttributes]
  );

  const handleResizeStop = useCallback(
    (event: React.SyntheticEvent, data: ResizeCallbackData) => {
      const newWidth = data.size.width;
      const newHeight = Math.round(newWidth / aspectRatio);
      
      // Asegurar que las dimensiones se guarden en el nodo
      updateAttributes({
        width: newWidth,
        height: newHeight,
      });
    },
    [aspectRatio, updateAttributes]
  );

  const renderContent = () => {
    if (isYouTube) {
      // Renderizar video de YouTube
      const videoId = attrs['data-youtube-video'];
      return (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?controls=1&modestbranding=1&rel=0`}
          width={dimensions.width}
          height={dimensions.height}
          frameBorder="0"
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          className="rounded-lg"
          title={title || `YouTube video ${videoId}`}
        />
      );
    } else {
      // Renderizar imagen
      return (
        <img
          src={src}
          alt={alt || ''}
          title={title}
          width={dimensions.width}
          height={dimensions.height}
          className="rounded-lg object-cover"
          draggable={false}
          onLoad={(e) => {
            const img = e.target as HTMLImageElement;
            if (!width || !height) {
              // Si no hay dimensiones establecidas, usar las dimensiones naturales
              const naturalAspectRatio = img.naturalWidth / img.naturalHeight;
              const newWidth = Math.min(img.naturalWidth, 600);
              const newHeight = Math.round(newWidth / naturalAspectRatio);
              
              setAspectRatio(naturalAspectRatio);
              setDimensions({ width: newWidth, height: newHeight });
              updateAttributes({
                width: newWidth,
                height: newHeight,
              });
            }
          }}
        />
      );
    }
  };

  return (
    <NodeViewWrapper
      ref={containerRef}
      className={`resizable-media-wrapper ${selected ? 'ProseMirror-selectednode' : ''}`}
      style={{ display: 'inline-block', margin: '8px 0' }}
    >
      {selected ? (
        <ResizableBox
          width={dimensions.width}
          height={dimensions.height}
          onResize={handleResize}
          onResizeStop={handleResizeStop}
          minConstraints={[100, Math.round(100 / aspectRatio)]}
          maxConstraints={[800, Math.round(800 / aspectRatio)]}
          lockAspectRatio={true}
          resizeHandles={['se', 'sw', 'ne', 'nw']}
          handle={(handleAxis, ref) => (
            <div
              ref={ref}
              className={`react-resizable-handle react-resizable-handle-${handleAxis}`}
              style={{
                position: 'absolute',
                width: '12px',
                height: '12px',
                backgroundColor: '#3b82f6',
                border: '2px solid white',
                borderRadius: '50%',
                cursor: `${handleAxis}-resize`,
                zIndex: 10,
                ...(handleAxis === 'se' && { bottom: '-6px', right: '-6px' }),
                ...(handleAxis === 'sw' && { bottom: '-6px', left: '-6px' }),
                ...(handleAxis === 'ne' && { top: '-6px', right: '-6px' }),
                ...(handleAxis === 'nw' && { top: '-6px', left: '-6px' }),
              }}
            />
          )}
        >
          <div className="relative">
            {renderContent()}
            {selected && (
              <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none" />
            )}
          </div>
        </ResizableBox>
      ) : (
        <div className="relative">
          {renderContent()}
        </div>
      )}
      
      {selected && (
        <div className="absolute -bottom-8 left-0 bg-black/80 text-white text-xs px-2 py-1 rounded">
          {dimensions.width} × {dimensions.height}
        </div>
      )}
    </NodeViewWrapper>
  );
};

export default ResizableMedia;
