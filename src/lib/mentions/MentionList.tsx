import { useState, useEffect, useCallback, forwardRef } from 'react';

interface User {
  id: string;
  name: string;
}

interface MentionListProps {
  items: User[];
  command: (item: { id: string; label: string }) => void;
}

interface MentionListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

const MentionList = forwardRef<MentionListRef, MentionListProps>((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { items, command } = props;

  const selectItem = useCallback((index: number) => {
    const item = items[index];

    if (item) {
      command({ id: item.id, label: item.name });
    }
  }, [items, command]);

  const upHandler = useCallback(() => {
    setSelectedIndex((prevIndex) => (
      prevIndex > 0 ? prevIndex - 1 : items.length - 1
    ));
  }, [items.length]);

  const downHandler = useCallback(() => {
    setSelectedIndex((prevIndex) => (
      prevIndex < items.length - 1 ? prevIndex + 1 : 0
    ));
  }, [items.length]);

  const enterHandler = useCallback(() => {
    selectItem(selectedIndex);
  }, [selectItem, selectedIndex]);

  useEffect(() => setSelectedIndex(0), [items]);

  const onKeyDown = useCallback(({ event }: { event: KeyboardEvent }) => {
    if (event.key === 'ArrowUp') {
      upHandler();
      return true;
    }

    if (event.key === 'ArrowDown') {
      downHandler();
      return true;
    }

    if (event.key === 'Enter') {
      enterHandler();
      return true;
    }

    return false;
  }, [upHandler, downHandler, enterHandler]);

  // Expone onKeyDown al componente padre
  useEffect(() => {
    if (ref && typeof ref === 'object' && ref !== null && 'current' in ref) {
      (ref as React.MutableRefObject<MentionListRef | null>).current = { onKeyDown };
    }
  }, [onKeyDown, ref]);

  return (
    <div className="bg-background border rounded-md shadow-md overflow-hidden max-h-72 overflow-y-auto">
      {items.length ? (
        <div className="py-1">
          {items.map((item: User, index: number) => (
            <button
              type="button"
              className={`px-4 py-2 text-left w-full text-sm ${selectedIndex === index ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-accent'}`}
              key={item.id}
              onClick={() => selectItem(index)}
            >
              {item.name}
            </button>
          ))}
        </div>
      ) : (
        <div className="px-4 py-2 text-left text-sm text-muted-foreground">
          No hay resultados
        </div>
      )}
    </div>
  );
});

MentionList.displayName = 'MentionList';

export default MentionList;
