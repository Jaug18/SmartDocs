import React from 'react';
import { Editor } from '@tiptap/react';
import DragHandle from '@tiptap/extension-drag-handle-react';
import { GripVertical } from 'lucide-react';
import './draghandle.css';

interface DragHandleWrapperProps {
  editor: Editor | null;
  children: React.ReactNode;
}

const DragHandleWrapper: React.FC<DragHandleWrapperProps> = ({ 
  editor, 
  children 
}) => {
  if (!editor) {
    return <>{children}</>;
  }

  return (
    <div className="drag-handle-wrapper">
      <DragHandle
        editor={editor}
        tippyOptions={{
          placement: 'left',
          offset: [0, 8],
          duration: [200, 150],
        }}
      >
        <div className="drag-handle">
          <GripVertical className="drag-handle-icon" />
        </div>
      </DragHandle>
      <div className="editor-content-wrapper">
        {children}
      </div>
    </div>
  );
};

export default DragHandleWrapper;
