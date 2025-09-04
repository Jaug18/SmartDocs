
import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  children: ReactNode;
  tooltip?: string;
}

const ToolbarButton = ({ onClick, isActive, children, tooltip }: ToolbarButtonProps) => {
  const button = (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }} 
      className={`h-8 px-2 ${isActive ? 'bg-accent text-accent-foreground' : ''}`}
    >
      {children}
    </Button>
  );

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {button}
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
};

export default ToolbarButton;
