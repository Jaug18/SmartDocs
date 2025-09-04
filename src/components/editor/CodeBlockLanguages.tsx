import React, { useCallback, useEffect, useState, useRef } from 'react';
import { Editor } from '@tiptap/react';
import './code-block.css';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Code } from "lucide-react";

interface CodeBlockLanguagesProps {
  editor: Editor;
}

const LANGUAGES = [
  { name: 'Plain Text', value: 'text' },
  { name: 'TypeScript', value: 'typescript' },
  { name: 'JavaScript', value: 'javascript' },
  { name: 'Python', value: 'python' },
  { name: 'HTML', value: 'html' },
  { name: 'CSS', value: 'css' },
  { name: 'JSON', value: 'json' },
  { name: 'Markdown', value: 'markdown' },
  { name: 'SQL', value: 'sql' },
  { name: 'Bash', value: 'bash' },
];

export const CodeBlockLanguages = ({ editor }: CodeBlockLanguagesProps) => {
  // Estados locales para manejar el lenguaje actual y controlar si el componente debe renderizarse
  const [currentLanguage, setCurrentLanguage] = useState<string>('text');
  const [isActive, setIsActive] = useState<boolean>(false);
  const [currentLang, setCurrentLang] = useState(LANGUAGES[0]);
  
  // Usar useRef para prevenir actualizaciones innecesarias y mantener una referencia estable
  const updateStateRef = useRef<() => void>();
  const debounceTimerRef = useRef<number | null>(null);
  const isUpdatingRef = useRef<boolean>(false);
  
  // Función de debounce para evitar actualizaciones demasiado frecuentes
  const debouncedUpdate = useCallback(() => {
    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }
    
    if (isUpdatingRef.current) {
      return; // Evitar múltiples actualizaciones simultáneas
    }
    
    debounceTimerRef.current = window.setTimeout(() => {
      if (updateStateRef.current) {
        isUpdatingRef.current = true;
        try {
          updateStateRef.current();
        } finally {
          isUpdatingRef.current = false;
        }
      }
      debounceTimerRef.current = null;
    }, 50); // Pequeño debounce de 50ms
  }, []);
  
  // Crear la función de actualización de estado de manera que se mantenga consistente entre renders
  updateStateRef.current = useCallback(() => {
    if (!editor || editor.isDestroyed) {
      setIsActive(false);
      return;
    }
    
    try {
      // Usar requestAnimationFrame para asegurar que el DOM esté listo
      requestAnimationFrame(() => {
        if (!editor || editor.isDestroyed) {
          setIsActive(false);
          return;
        }
        
        try {
          const isCodeBlockActive = editor.isActive('codeBlock');
          
          // Solo actualizar si hay un cambio real
          if (isActive !== isCodeBlockActive) {
            setIsActive(isCodeBlockActive);
          }
          
          if (isCodeBlockActive) {
            const attributes = editor.getAttributes('codeBlock');
            const langValue = attributes.language || 'text';
            
            // Solo actualizar si el lenguaje ha cambiado
            if (currentLanguage !== langValue) {
              setCurrentLanguage(langValue);
              setCurrentLang(LANGUAGES.find(lang => lang.value === langValue) || LANGUAGES[0]);
            }
          } else if (isActive) {
            // Reset al valor por defecto solo si estaba activo antes
            setCurrentLanguage('text');
            setCurrentLang(LANGUAGES[0]);
          }
        } catch (innerError) {
          // Error al acceder al editor durante la animación
          console.warn('Error durante animationFrame:', innerError);
          setIsActive(false);
        }
      });
    } catch (error) {
      console.warn('Error al obtener atributos del codeBlock:', error);
      setIsActive(false);
      setCurrentLanguage('text');
      setCurrentLang(LANGUAGES[0]);
    }
  }, [editor, isActive, currentLanguage]);
  
  // Usar useEffect para escuchar eventos del editor de manera segura
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    
    // Actualizar estado inicial después de un pequeño retraso
    const initialUpdateTimeout = setTimeout(debouncedUpdate, 100);
    
    // Suscribirse a múltiples eventos para detectar cualquier cambio relevante
    editor.on('selectionUpdate', debouncedUpdate);
    editor.on('transaction', debouncedUpdate);
    editor.on('focus', debouncedUpdate);
    editor.on('blur', debouncedUpdate);
    
    // Actualización inmediata para el estado inicial
    if (updateStateRef.current) {
      updateStateRef.current();
    }
    
    // Limpiar todo al desmontar
    return () => {
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      clearTimeout(initialUpdateTimeout);
      
      if (editor && !editor.isDestroyed) {
        editor.off('selectionUpdate', debouncedUpdate);
        editor.off('transaction', debouncedUpdate);
        editor.off('focus', debouncedUpdate);
        editor.off('blur', debouncedUpdate);
      }
    };
  }, [editor, debouncedUpdate]);
  
  // No renderizar si no está activo o el editor no está disponible
  if (!isActive || !editor || editor.isDestroyed) {
    return null;
  }
  
  // Función segura para actualizar atributos con validación adicional
  const handleLanguageChange = (langValue: string) => {
    try {
      if (!editor || editor.isDestroyed) return;
      
      // Verificar que el codeBlock sigue estando activo antes de actualizar
      if (editor.isActive('codeBlock')) {
        editor.chain().focus().updateAttributes('codeBlock', {
          language: langValue
        }).run();
      }
    } catch (error) {
      console.warn('Error al actualizar lenguaje de codeBlock:', error);
    }
  };

  try {
    // Usar una clase CSS para manejar la visibilidad de manera más suave con CSS
    const selectorClassName = `code-language-selector ${!isActive ? 'hidden' : ''}`;
    
    return (
      <div className={selectorClassName}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="code-language-button"
              // Comprobar el estado del editor justo antes de cualquier interacción
              onMouseDown={(e) => {
                if (editor.isDestroyed) {
                  e.preventDefault();
                  e.stopPropagation();
                  return false;
                }
              }}
            >
              <Code className="h-3.5 w-3.5 mr-1" />
              {currentLang.name}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end" 
            className="code-language-menu"
          >
            {LANGUAGES.map(lang => (
              <DropdownMenuItem
                key={lang.value}
                onClick={(e) => {
                  // Verificación extra antes de actualizar
                  if (!editor || editor.isDestroyed) return;
                  handleLanguageChange(lang.value);
                }}
                className={`code-language-item ${currentLanguage === lang.value ? "active" : ""}`}
              >
                {lang.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  } catch (error) {
    console.error('Error al renderizar CodeBlockLanguages:', error);
    return null;
  }
};
