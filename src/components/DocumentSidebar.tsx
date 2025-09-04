import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ChevronDown, ChevronRight, File, FolderClosed, FolderOpen, 
  Search, Plus, Trash2, FileText, PlusCircle, FolderPlus,
  RefreshCw, FolderInput, ArrowDownAZ, ArrowDownZA, ArrowDownUp,
  MoreVertical, Calendar, Edit, Check, X
} from 'lucide-react';
import { 
  Sidebar, 
  SidebarSection,
  SidebarToggleButton, 
  useSidebar 
} from '@/components/ui/sidebar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from '../hooks/useAuth';
import { cn } from '@/lib/utils/utils';

// Interfaces
interface Document {
  id: string;
  title: string;
  content: string;
  categoryId: string | null;
  createdAt?: number;
  updatedAt?: number;
  sharedPermission?: 'view' | 'edit'; // <-- Añadir esto
  owner?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  }; // <-- Añadir esto
}

interface Category {
  id: string;
  name: string;
  parentId: string | null;
  isOpen?: boolean;
  createdAt?: number;
  sharedPermission?: 'view' | 'edit'; // Agregar esta propiedad
  owner?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  }; // Agregar esta propiedad
}

interface DocumentSidebarProps {
  onDocumentSelect: (document: Document) => void;
  selectedDocumentId: string;
  onDocumentTitleChange?: (documentId: string, newTitle: string) => void;
}

interface DocumentItemProps {
  document: Document;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onRename: (newTitle: string) => void;
  showPath?: boolean;
  documentPath?: string;
}

interface CategoryItemProps {
  category: Category;
  documents: Document[];
  subCategories: Category[];
  allCategories: Category[];
  onToggle: (id: string) => void;
  onDocumentSelect: (document: Document) => void;
  selectedDocumentId: string;
  onDeleteDocument: (documentId: string) => void;
  onDeleteCategory: (categoryId: string) => void;
  onRenameCategory: (categoryId: string, newName: string) => void;
  onRenameDocument: (documentId: string, newTitle: string) => void;
  addDocumentToCategory: (categoryId: string) => void;
  createSubfolder: (parentId: string) => void;
  handleDeleteConfirmation?: (type: 'document' | 'category', id: string, name: string, onConfirm: () => void) => void;
}

// Tipo para ordenación
type SortOption = 'name-asc' | 'name-desc' | 'date-asc' | 'date-desc';

// --- Contexto para la carpeta seleccionada ---
const SelectedCategoryContext = React.createContext<{
  selectedCategoryId: string | null;
  setSelectedCategoryId: (id: string | null) => void;
}>({
  selectedCategoryId: null,
  setSelectedCategoryId: () => {},
});
// --------------------------------------------

// Agregar contexto para nueva categoría
const NewCategoryContext = React.createContext<{
  newCategoryId: string | null;
  setNewCategoryId: (id: string | null) => void;
  onCancelNewCategory?: (id: string) => void;
}>({
  newCategoryId: null,
  setNewCategoryId: () => {},
});

// Cambia aquí el puerto si tu backend corre en otro puerto
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// Componente para un ítem de documento
const DocumentItem: React.FC<DocumentItemProps> = ({
  document,
  isActive,
  onSelect,
  onDelete,
  onRename,
  showPath = false,
  documentPath = ''
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(document.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleEditStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditedTitle(document.title);
    setIsEditing(true);
  };

  const handleEditSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (editedTitle.trim()) {
      onRename(editedTitle.trim());
      setIsEditing(false);
    }
  };

  const handleEditCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditedTitle(document.title);
    setIsEditing(false);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (editedTitle.trim()) {
        onRename(editedTitle.trim());
        setIsEditing(false);
      }
      e.preventDefault();
    } else if (e.key === 'Escape') {
      setEditedTitle(document.title);
      setIsEditing(false);
      e.preventDefault();
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditedTitle(document.title);
    setIsEditing(true);
  };

  return (
    <div
      className={`flex items-center group px-4 py-2 rounded-md cursor-pointer transition-all
      ${isActive ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-accent'}`}
      onClick={(e) => {
        e.stopPropagation(); // Evitar que el click se propague
        if (!isEditing) onSelect();
      }}
      onDoubleClick={handleDoubleClick}
    >
      <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
      {isEditing ? (
        <div className="flex items-center flex-1" onClick={e => e.stopPropagation()}>
          <Input
            ref={inputRef}
            value={editedTitle}
            onChange={e => setEditedTitle(e.target.value)}
            onKeyDown={handleInputKeyDown}
            className="h-7 py-0 text-sm flex-1"
            autoFocus
          />
          <div className="flex items-center ml-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleEditSave}
            >
              <Check className="h-3.5 w-3.5 text-green-500" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleEditCancel}
            >
              <X className="h-3.5 w-3.5 text-red-500" />
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-col flex-1 min-w-0 justify-center">
            <div className="scrollbar-autohide scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400"
                 onScroll={(e) => {
                   const element = e.currentTarget as HTMLDivElement & { scrollTimeout?: NodeJS.Timeout };
                   element.classList.add('scrolling');
                   if (element.scrollTimeout) {
                     clearTimeout(element.scrollTimeout);
                   }
                   element.scrollTimeout = setTimeout(() => {
                     element.classList.remove('scrolling');
                   }, 2000);
                 }}>
              <span className="text-sm whitespace-nowrap block leading-4" title={document.title}>{document.title}</span>
            </div>
            {showPath && documentPath && (
              <div className="scrollbar-autohide scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 mt-0.5"
                   onScroll={(e) => {
                     const element = e.currentTarget as HTMLDivElement & { scrollTimeout?: NodeJS.Timeout };
                     element.classList.add('scrolling');
                     if (element.scrollTimeout) {
                       clearTimeout(element.scrollTimeout);
                     }
                     element.scrollTimeout = setTimeout(() => {
                       element.classList.remove('scrolling');
                     }, 2000);
                   }}>
                <span className="text-xs text-muted-foreground whitespace-nowrap block leading-3" title={documentPath}>
                  📁 {documentPath}
                </span>
              </div>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleEditStart}>
                <Edit className="mr-2 h-3.5 w-3.5" />
                Editar nombre
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}
    </div>
  );
};

// Componente para una categoría
const CategoryItem: React.FC<CategoryItemProps> = ({
  category,
  documents,
  subCategories,
  allCategories,
  onToggle,
  onDocumentSelect,
  selectedDocumentId,
  onDeleteDocument,
  onDeleteCategory,
  onRenameCategory,
  onRenameDocument,
  addDocumentToCategory,
  createSubfolder,
  handleDeleteConfirmation
}) => {
  const { selectedCategoryId, setSelectedCategoryId } = React.useContext(SelectedCategoryContext);
  const { newCategoryId, onCancelNewCategory } = React.useContext(NewCategoryContext);

  const isNewCategory = category.id === newCategoryId;
  const [isEditing, setIsEditing] = useState(() => isNewCategory); // Inicializar basado en si es nueva categoría
  const [editedName, setEditedName] = useState(category.name);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasChildren = documents.length > 0 || subCategories.length > 0;

  const isSharedCategory = !!category.sharedPermission;
  const isReadOnly = category.sharedPermission === 'view';

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const handleEditStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditedName(category.name);
    setIsEditing(true);
  };

  const handleEditSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (editedName.trim()) {
      onRenameCategory(category.id, editedName.trim());
      setIsEditing(false);
    }
  };

  const handleEditCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isNewCategory) {
      if (onCancelNewCategory) {
        onCancelNewCategory(category.id);
      }
    } else {
      setEditedName(category.name);
      setIsEditing(false);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (editedName.trim()) {
        onRenameCategory(category.id, editedName.trim());
        setIsEditing(false);
      }
      e.preventDefault();
    } else if (e.key === 'Escape') {
      if (isNewCategory) {
        if (onCancelNewCategory) {
          onCancelNewCategory(category.id);
        }
      } else {
        setEditedName(category.name);
        setIsEditing(false);
      }
      e.preventDefault();
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isSharedCategory || !isReadOnly) {
      setEditedName(category.name);
      setIsEditing(true);
    }
  };

  const handleSelectCategory = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle(category.id);
    setSelectedCategoryId(category.id);
  };

  const renderSubcategories = (categories: Category[]) => {
    return categories.map(subCat => (
      <CategoryItem
        key={subCat.id}
        category={subCat}
        documents={documents}
        subCategories={allCategories.filter(cat => cat.parentId === subCat.id)}
        allCategories={allCategories}
        onToggle={onToggle}
        onDocumentSelect={onDocumentSelect}
        selectedDocumentId={selectedDocumentId}
        onDeleteDocument={onDeleteDocument}
        onDeleteCategory={onDeleteCategory}
        onRenameCategory={onRenameCategory}
        onRenameDocument={onRenameDocument}
        addDocumentToCategory={addDocumentToCategory}
        createSubfolder={createSubfolder}
        handleDeleteConfirmation={handleDeleteConfirmation}
      />
    ));
  };

  const renderDocuments = (category: Category) => {
    const docs = category.sharedPermission
      ? documents.filter(doc => doc.categoryId === category.id && doc.sharedPermission)
      : documents.filter(doc => doc.categoryId === category.id && !doc.sharedPermission);

    return docs.map(doc => (        <div className="pl-4" key={doc.id}>
          <DocumentItem
            document={doc}
            isActive={doc.id === selectedDocumentId}
            onSelect={() => onDocumentSelect(doc)}
            onDelete={() => {
              if (handleDeleteConfirmation) {
                handleDeleteConfirmation(
                  'document',
                  doc.id,
                  doc.title,
                  () => onDeleteDocument(doc.id)
                );
              } else {
                onDeleteDocument(doc.id);
              }
            }}
            onRename={doc.sharedPermission && doc.sharedPermission === 'view' ? () => {} : newTitle => onRenameDocument(doc.id, newTitle)}
          />
        </div>
    ));
  };

  return (
    <div className="animate-fade-in" onClick={(e) => e.stopPropagation()}>
      <div
        className={
          `flex items-center px-3 py-1.5 rounded cursor-pointer group relative transition-all
          ${selectedCategoryId === category.id
            ? 'bg-primary/5 border-l-2 border-primary text-primary font-semibold'
            : 'hover:bg-accent'}
          ${isSharedCategory ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''}`
        }
        onClick={handleSelectCategory}
        onDoubleClick={handleDoubleClick}
        style={{ userSelect: 'none', minHeight: 32 }}
        data-selected={category.isOpen}
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 mr-1 p-0 flex-shrink-0 sidebar-toggle-btn"
          onClick={e => {
            e.stopPropagation();
            onToggle(category.id);
          }}
        >
          {hasChildren || subCategories.length > 0 ? (
            category.isOpen ?
              <ChevronDown className="h-3.5 w-3.5" /> :
              <ChevronRight className="h-3.5 w-3.5" />
          ) : <span className="w-3.5 sidebar-placeholder" />}
        </Button>
        <div className="relative">
          {category.isOpen ?
            <FolderOpen className={`h-4.5 w-4.5 mr-2 ${selectedCategoryId === category.id ? 'text-primary' : 'text-muted-foreground'} flex-shrink-0 sidebar-icon`} /> :
            <FolderClosed className="h-4.5 w-4.5 mr-2 text-muted-foreground flex-shrink-0 sidebar-icon" />
          }
        </div>
        {isEditing ? (
          <div className="flex items-center flex-1" onClick={e => e.stopPropagation()}>
            <Input
              ref={inputRef}
              value={editedName}
              onChange={e => setEditedName(e.target.value)}
              onKeyDown={handleInputKeyDown}
              className="h-7 py-0 text-sm flex-1"
              autoFocus
            />
            <div className="flex items-center ml-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleEditSave}
              >
                <Check className="h-3.5 w-3.5 text-green-500" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleEditCancel}
              >
                <X className="h-3.5 w-3.5 text-red-500" />
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 flex flex-col min-w-0">
              <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 pb-2 mb-1">
                <span className="text-sm font-medium whitespace-nowrap block pb-1" title={category.name}>{category.name}</span>
              </div>
              {isSharedCategory && category.owner && (
                <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 pb-2">
                  <span className="text-xs text-muted-foreground whitespace-nowrap block pb-1" title={`Compartida por: ${category.owner.firstName || ''} ${category.owner.lastName || ''}`}>
                    Compartida por: {category.owner.firstName || ''} {category.owner.lastName || ''} • {isReadOnly ? 'Solo lectura' : 'Puede editar'}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {(!isSharedCategory || !isReadOnly) && (
                    <>
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          addDocumentToCategory(category.id);
                        }}
                      >
                        <FileText className="mr-2 h-3.5 w-3.5" />
                        Nuevo documento
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          createSubfolder(category.id);
                        }}
                      >
                        <FolderPlus className="mr-2 h-3.5 w-3.5" />
                        Nueva subcarpeta
                      </DropdownMenuItem>
                    </>
                  )}
                  {!isSharedCategory && (
                    <>
                      <DropdownMenuItem onClick={handleEditStart}>
                        <Edit className="mr-2 h-3.5 w-3.5" />
                        Renombrar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (handleDeleteConfirmation) {
                            handleDeleteConfirmation(
                              'category',
                              category.id,
                              category.name,
                              () => onDeleteCategory(category.id)
                            );
                          } else {
                            onDeleteCategory(category.id);
                          }
                        }}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-3.5 w-3.5" />
                        Eliminar
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </>
        )}
      </div>
      {category.isOpen && (
        <div className="mt-0.5 folder-content">
          {renderSubcategories(subCategories)}
          {renderDocuments(category)}
        </div>
      )}
    </div>
  );
};

// Botón para expandir el menú cuando está colapsado
const SidebarExpandButton = () => {
  const { state, toggleSidebar } = useSidebar();

  // Mostrar solo cuando el sidebar está colapsado
  if (state !== 'collapsed') return null;

  return (
    <button
      onClick={toggleSidebar}
      aria-label="Expandir menú lateral"
      className="absolute left-1/2 -translate-x-1/2 top-20 z-50 rounded-lg h-6 w-6 bg-sidebar border border-sidebar-border shadow-sm flex items-center justify-center transition-all duration-300 hover:bg-sidebar-accent/50"
      style={{
        boxShadow: "0 1px 3px 0 rgba(0,0,0,0.1)",
      }}
    >
      {/* Icono más simple - solo flecha hacia la derecha */}
      <svg width="14" height="14" viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18l6-6-6-6" />
      </svg>
    </button>
  );
};

// Componente principal del sidebar
const DocumentSidebar: React.FC<DocumentSidebarProps> = ({ 
  onDocumentSelect, 
  selectedDocumentId,
  onDocumentTitleChange
}) => {
  const { toggleSidebar, state: sidebarState } = useSidebar();
  const isCollapsed = sidebarState === 'collapsed';
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>('name-asc');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [createSubfolderParentId, setCreateSubfolderParentId] = useState<string | null>(null);
  const [newCategoryId, setNewCategoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletionReason, setDeletionReason] = useState('');
  const [deleteDialogItem, setDeleteDialogItem] = useState<{
    type: 'document' | 'category',
    id: string,
    name: string,
    onConfirm: () => void
  } | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const { user, getToken } = useAuth();
  const [userRole, setUserRole] = useState<string>('normal');
  const [userArea, setUserArea] = useState<string | null>(null);

  // Función para obtener el token de autenticación
  const fetchWithAuth = useCallback(async (url: string, options: RequestInit = {}) => {
    const token = getToken();
    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
  }, [getToken]);

  // Obtener el rol del usuario autenticado
  const fetchRole = useCallback(async () => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/api/users/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setUserRole(data.role || 'normal');
        setUserArea(data.area?.name || null);
      }
    } catch {
      setUserRole('normal');
      setUserArea(null);
    }
  }, [getToken]);

  useEffect(() => {
    fetchRole();
  }, [fetchRole]);

  // Detector de clics fuera del sidebar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Comprobamos si el sidebar está definido y si el clic fue fuera de él
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        // Solo deseleccionamos si no estamos en el diálogo modal
        const dialogElement = document.querySelector('[role="dialog"]');
        if (!dialogElement || !dialogElement.contains(event.target as Node)) {
          setSelectedCategoryId(null);
        }
      }
    };

    // Añadir event listener
    document.addEventListener('mousedown', handleClickOutside);
    
    // Limpiar event listener al desmontar
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Cargar categorías y documentos desde la API
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [catRes, docRes] = await Promise.all([
          fetchWithAuth(`${API_BASE_URL}/api/users/categories`),
          fetchWithAuth(`${API_BASE_URL}/api/users/documents`),
        ]);
        
        if (!catRes.ok || !docRes.ok) {
          throw new Error('Error al obtener datos del servidor');
        }
        
        const categories = await catRes.json();
        const documents = await docRes.json();
        setCategories(categories);
        setDocuments(documents);
      } catch (error) {
        toast({
          title: "Error al cargar datos",
          description: "No se pudieron cargar documentos o categorías. Verifica tu conexión o inicia sesión nuevamente.",
          variant: "destructive",
        });
      }
      setLoading(false);
    };
    loadData();
  }, [fetchWithAuth]);

  // Listener para actualizar título cuando se cambia desde el header
  useEffect(() => {
    const handleDocumentTitleUpdate = (event: CustomEvent) => {
      const { documentId, newTitle } = event.detail;
      setDocuments(prev => 
        prev.map(doc => 
          doc.id === documentId 
            ? { ...doc, title: newTitle }
            : doc
        )
      );
    };

    // Agregar listener para el evento personalizado
    window.addEventListener('documentTitleUpdated', handleDocumentTitleUpdate as EventListener);

    // Limpiar listener al desmontar
    return () => {
      window.removeEventListener('documentTitleUpdated', handleDocumentTitleUpdate as EventListener);
    };
  }, []);

  // --- NUEVO: Filtrar documentos compartidos ---
  const sharedDocuments = documents.filter(doc => {
    if (doc.sharedPermission) {
      if (doc.categoryId) {
        const isInSharedCategory = categories.some(
          cat => cat.id === doc.categoryId && cat.sharedPermission
        );
        return !isInSharedCategory;
      }
      return true;
    }
    return false;
  });

  const ownDocuments = documents.filter(doc => !doc.sharedPermission);

  // NUEVO: Categorías compartidas conmigo (carpetas compartidas)
  const sharedCategories = categories.filter(cat => !!cat.sharedPermission);

  // Toggle para abrir/cerrar categorías y seleccionar la activa
  const toggleCategory = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setCategories(prevCats => prevCats.map(cat => 
      cat.id === categoryId ? { ...cat, isOpen: !cat.isOpen } : cat
    ));
  };

  const collapseAllCategories = () => {
    setCategories(prevCats => prevCats.map(cat => ({ ...cat, isOpen: false })));
  };

  const refreshExplorer = async () => {
    await fetchRole();
    const loadData = async () => {
      try {
        const [catRes, docRes] = await Promise.all([
          fetchWithAuth(`${API_BASE_URL}/api/users/categories`),
          fetchWithAuth(`${API_BASE_URL}/api/users/documents`),
        ]);
        const categories = await catRes.json();
        const documents = await docRes.json();
        setCategories(categories);
        setDocuments(documents);
      } catch (error) {
        toast({
          title: "Error al cargar datos",
          description: "No se pudieron cargar documentos o categorías",
          variant: "destructive",
        });
      }
    };
    loadData();
    toast({
      title: "Explorador actualizado",
      description: "Los documentos y carpetas han sido actualizados",
    });
  };

  // Crear documento en la API
  const addDocumentToCategory = async (parentId?: string) => {
    const actualParentId = parentId || selectedCategoryId;
    const newDoc = {
      title: 'Nuevo documento',
      content: '<h2>Documento nuevo</h2><p>Empieza a escribir aquí...</p>',
      categoryId: actualParentId || null,
    };
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/api/users/documents`, {
        method: 'POST',
        body: JSON.stringify(newDoc),
      });
      if (!res.ok) throw new Error('Error al crear documento');
      const created = await res.json();
      setDocuments(prev => [...prev, created]);
      onDocumentSelect(created);
      toast({ title: "Documento creado", description: "Se ha creado un nuevo documento" });
    } catch (err) {
      toast({ title: "Error", description: "No se pudo crear el documento", variant: "destructive" });
    }
  };

  // Función modificada para crear subcarpeta directamente sin modal
  const createSubfolder = (parentId: string) => {
    createCategoryDirect(parentId);
  };

  // Crear categoría en la API
  const createCategoryDirect = async (parentId?: string | null) => {
    const actualParentId = parentId || selectedCategoryId;
    
    // Generar un nombre único para evitar conflictos
    const existingNames = categories
      .filter(cat => cat.parentId === actualParentId)
      .map(cat => cat.name.toLowerCase());
    
    let categoryName = "Nueva carpeta";
    let counter = 1;
    while (existingNames.includes(categoryName.toLowerCase())) {
      categoryName = `Nueva carpeta ${counter}`;
      counter++;
    }
    
    const newCategory = {
      name: categoryName,
      parentId: actualParentId,
    };
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/api/users/categories`, {
        method: 'POST',
        body: JSON.stringify(newCategory),
      });
      if (!res.ok) throw new Error('Error al crear carpeta');
      const created = await res.json();
      setCategories(prev => [...prev, created]);
      setNewCategoryId(created.id);
      setSelectedCategoryId(created.id);
      toast({ title: "Carpeta creada", description: "Puedes editar el nombre directamente" });
    } catch (err) {
      toast({ title: "Error", description: "No se pudo crear la carpeta", variant: "destructive" });
    }
  };

  // Actualizar categoría en la API
  const renameCategory = async (categoryId: string, newName: string) => {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/api/users/categories/${categoryId}`, {
        method: 'PUT',
        body: JSON.stringify({ name: newName }),
      });
      const updated = await res.json();
      setCategories(prev => prev.map(cat => cat.id === categoryId ? { ...cat, name: updated.name } : cat));
      toast({ title: "Categoría renombrada", description: `La categoría ha sido renombrada a "${newName}"` });
    } catch {
      toast({ title: "Error", description: "No se pudo renombrar la categoría", variant: "destructive" });
    }
  };

  // Actualizar documento en la API
  const renameDocument = async (documentId: string, newTitle: string) => {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/api/users/documents/${documentId}`, {
        method: 'PUT',
        body: JSON.stringify({ title: newTitle }),
      });
      if (!res.ok) {
        const error = await res.json();
        toast({ title: "Error", description: error.error || "No se pudo renombrar el documento", variant: "destructive" });
        return;
      }
      const updated = await res.json();
      setDocuments(prev => prev.map(doc => doc.id === documentId ? { ...doc, title: updated.title } : doc));
      
      // Sincronizar con el editor si se proporciona la función
      if (onDocumentTitleChange) {
        onDocumentTitleChange(documentId, updated.title);
      }
      
      toast({ title: "Documento renombrado", description: `El documento ha sido renombrado a "${updated.title}"` });
    } catch {
      toast({ title: "Error", description: "No se pudo renombrar el documento", variant: "destructive" });
    }
  };

  // Eliminar documento en la API
  const deleteDocument = async (documentId: string) => {
    if (!deletionReason.trim()) {
      toast({ title: "Error", description: "Debe proporcionar un motivo de eliminación", variant: "destructive" });
      return;
    }

    try {
      await fetchWithAuth(`${API_BASE_URL}/api/users/documents/${documentId}`, {
        method: 'DELETE',
        body: JSON.stringify({ deletionReason: deletionReason.trim() }),
      });
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      setDeletionReason(''); // Limpiar el motivo después de eliminar
      toast({ title: "Documento eliminado", description: "El documento se ha eliminado correctamente", variant: "destructive" });
    } catch {
      toast({ title: "Error", description: "No se pudo eliminar el documento", variant: "destructive" });
    }
  };

  // Cancelar nueva categoría (sin eliminación en la API, solo local)
  const cancelNewCategory = (categoryId: string) => {
    setCategories(prev => prev.filter(cat => cat.id !== categoryId));
    setNewCategoryId(null);
  };

  // Eliminar categoría en la API
  const deleteCategory = async (categoryId: string) => {
    if (!deletionReason.trim()) {
      toast({ title: "Error", description: "Debe proporcionar un motivo de eliminación", variant: "destructive" });
      return;
    }

    try {
      await fetchWithAuth(`${API_BASE_URL}/api/users/categories/${categoryId}`, {
        method: 'DELETE',
        body: JSON.stringify({ deletionReason: deletionReason.trim() }),
      });
      setCategories(prev => prev.filter(cat => cat.id !== categoryId));
      setDeletionReason(''); // Limpiar el motivo después de eliminar
      toast({ title: "Categoría eliminada", description: "La categoría ha sido eliminada correctamente" });
    } catch {
      toast({ title: "Error", description: "No se pudo eliminar la categoría", variant: "destructive" });
    }
  };

  // Función para mostrar el diálogo de confirmación de eliminación
  const handleDeleteConfirmation = (type: 'document' | 'category', id: string, name: string, onConfirm: () => void) => {
    setDeleteDialogItem({ type, id, name, onConfirm });
    setDeleteDialogOpen(true);
  };

  // Función para confirmar la eliminación
  const handleConfirmDelete = () => {
    if (deleteDialogItem && deletionReason.trim()) {
      if(deleteDialogItem.type === 'document') {
        deleteDocument(deleteDialogItem.id);
      } else if(deleteDialogItem.type === 'category') {
        deleteCategory(deleteDialogItem.id);
      }
      deleteDialogItem.onConfirm();
      setDeleteDialogOpen(false);
      setDeleteDialogItem(null);
      setDeletionReason(''); // Limpiar el motivo después de confirmar
    }
  };

  // Función para cancelar la eliminación
  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setDeleteDialogItem(null);
    setDeletionReason(''); // Limpiar el motivo al cancelar
  };

  // Manejar clicks en el sidebar para colapsar carpetas
  const handleSidebarClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;

    if (
      target.classList.contains('sidebar-main-container') ||
      target.classList.contains('sidebar-section-container') ||
      target.closest('.sidebar-toggle-btn') ||
      target.closest('.category-item') ||
      target.closest('.document-item')
    ) {
      return; // No hacer nada si es un click específico
    }

    collapseAllCategories();
    setSelectedCategoryId(null);
  };

  const sortCategories = (cats: Category[]): Category[] => {
    return [...cats].sort((a, b) => {
      switch (sortOption) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'date-asc':
          return (a.createdAt || 0) - (b.createdAt || 0);
        case 'date-desc':
          return (b.createdAt || 0) - (a.createdAt || 0);
        default:
          return 0;
      }
    });
  };

  const sortDocuments = (docs: Document[]): Document[] => {
    return [...docs].sort((a, b) => {
      switch (sortOption) {
        case 'name-asc':
          return a.title.localeCompare(b.title);
        case 'name-desc':
          return b.title.localeCompare(a.title);
        case 'date-asc':
          return (a.createdAt || 0) - (b.createdAt || 0);
        case 'date-desc':
          return (b.createdAt || 0) - (a.createdAt || 0);
        default:
          return 0;
      }
    });
  };

  // Solo buscar por nombre/título
  const filteredDocuments = sortDocuments(
    search 
      ? ownDocuments.filter(doc => {
          return doc.title.toLowerCase().includes(search.toLowerCase());
        })
      : ownDocuments
  );

  // Filtro de búsqueda mejorado: mostrar elementos con su ruta, no carpetas padre
  const searchInAllElements = (categories: Category[], documents: Document[], searchTerm: string) => {
    if (!searchTerm.trim()) {
      return { filteredCategories: categories, filteredDocuments: documents };
    }

    const lowerSearchTerm = searchTerm.toLowerCase();
    const matchingCategories = new Set<string>();
    const matchingDocuments = new Set<string>();

    // Función para obtener la ruta completa de una categoría
    const getCategoryPath = (categoryId: string): string => {
      const category = categories.find(c => c.id === categoryId);
      if (!category) return '';
      
      if (category.parentId) {
        const parentPath = getCategoryPath(category.parentId);
        return parentPath ? `${parentPath} / ${category.name}` : category.name;
      }
      return category.name;
    };

    // Buscar en documentos directamente
    documents.forEach(doc => {
      if (doc.title.toLowerCase().includes(lowerSearchTerm)) {
        matchingDocuments.add(doc.id);
        
        // Solo incluir la categoría padre directa si el documento coincide
        if (doc.categoryId) {
          matchingCategories.add(doc.categoryId);
        }
      }
    });

    // Buscar en nombres de categorías
    categories.forEach(category => {
      if (category.name.toLowerCase().includes(lowerSearchTerm)) {
        matchingCategories.add(category.id);
      }
    });

    return {
      filteredCategories: categories.filter(cat => matchingCategories.has(cat.id)),
      filteredDocuments: documents.filter(doc => matchingDocuments.has(doc.id))
    };
  };

  // Aplicar filtro de búsqueda para documentos compartidos
  const filteredSharedDocuments = sortDocuments(
    search
      ? sharedDocuments.filter(doc => doc.title.toLowerCase().includes(search.toLowerCase()))
      : sharedDocuments
  );

  // Función para obtener la ruta completa de una categoría
  const getCategoryPath = (categoryId: string): string => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return '';
    
    if (category.parentId) {
      const parentPath = getCategoryPath(category.parentId);
      return parentPath ? `${parentPath} / ${category.name}` : category.name;
    }
    return category.name;
  };

  // Aplicar filtro de búsqueda mejorado para categorías propias
  const { filteredCategories: searchFilteredCategories, filteredDocuments: searchFilteredDocuments } = 
    searchInAllElements(categories, documents, search);

  const filteredOwnCategories = sortCategories(searchFilteredCategories);
  const filteredOwnDocuments = sortDocuments(searchFilteredDocuments);

  const rootCategories = sortCategories(filteredOwnCategories.filter(cat => 
    cat.parentId === null && !cat.sharedPermission
  ));
  
  const showDocumentsSection = true;
  
  const rootDocuments = filteredOwnDocuments.filter(doc => !doc.categoryId || !categories.some(cat => cat.id === doc.categoryId));

  const handleDocumentSelect = (document: Document) => {
    onDocumentSelect(document);
  };

  return (
    <SelectedCategoryContext.Provider value={{ selectedCategoryId, setSelectedCategoryId }}>
      <NewCategoryContext.Provider value={{ 
        newCategoryId, 
        setNewCategoryId,
        onCancelNewCategory: (id: string) => cancelNewCategory(id),
      }}>
        <Sidebar 
          className={cn(
            "border-r bg-sidebar text-sidebar-foreground min-h-screen relative sidebar-main-container",
            isCollapsed ? "min-w-[32px] max-w-[32px]" : "min-w-[280px] max-w-[400px]"
          )}
          ref={sidebarRef}
          onClick={handleSidebarClick}
        >
          {/* Botón para expandir el menú cuando está colapsado */}
          <SidebarExpandButton />
          <div className="h-full flex flex-col">
            {/* Header section - solo mostrar el toggle cuando está colapsado */}
            <div className={cn(
              "flex items-center h-14 border-b border-sidebar-border flex-shrink-0",
              isCollapsed ? "justify-center px-1" : "justify-between px-4"
            )}>
              {!isCollapsed && (
                <div className="flex flex-col">
                  <h2 className="text-xl font-semibold text-sidebar-primary">Explorador</h2>
                  {userArea && (
                    <p className="text-xs text-sidebar-foreground/70">
                      Área: {userArea}
                    </p>
                  )}
                </div>
              )}
              <div className={cn(
                "flex items-center",
                isCollapsed ? "justify-center w-full p-0" : "gap-1 ml-auto"
              )}>
                {/* SOLO mostrar controles si NO está colapsado Y es admin/superuser */}
                {!isCollapsed && (userRole === 'admin' || userRole === 'superuser') && (
                  <>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 text-sidebar-foreground hover:bg-sidebar-accent/50" 
                      onClick={() => createCategoryDirect()}
                      title="Nueva carpeta"
                    >
                      <FolderPlus className="h-3.5 w-3.5" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 text-sidebar-foreground hover:bg-sidebar-accent/50" 
                      onClick={() => addDocumentToCategory()}
                      title="Nuevo archivo"
                    >
                      <FileText className="h-3.5 w-3.5" />
                    </Button>
                    <div className="w-px h-4 bg-sidebar-border mx-1" />
                  </>
                )}
                {/* Controles básicos - solo mostrar si NO está colapsado */}
                {!isCollapsed && (
                  <>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 text-sidebar-foreground hover:bg-sidebar-accent/50" 
                      onClick={refreshExplorer}
                      title="Actualizar explorador"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 text-sidebar-foreground hover:bg-sidebar-accent/50" 
                      onClick={collapseAllCategories}
                      title="Contraer todas las carpetas"
                    >
                      <FolderInput className="h-3.5 w-3.5" />
                    </Button>
                    <div className="w-px h-4 bg-sidebar-border mx-1" />
                  </>
                )}
                <SidebarToggleButton />
              </div>
            </div>

            {/* Solo mostrar el contenido del sidebar cuando NO está colapsado */}
            {!isCollapsed && (
              <>
                {/* Barra de búsqueda fija */}
                <div className="px-4 py-3 flex flex-col gap-3 bg-sidebar border-b border-sidebar-border flex-shrink-0">
                  <div>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="Buscar por nombre..." 
                        className="pl-9 bg-sidebar-accent/10 border-sidebar-border focus-visible:ring-sidebar-ring"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-sidebar-foreground/70">
                      {selectedCategoryId ? 
                        `Carpeta: ${categories.find(c => c.id === selectedCategoryId)?.name || ""}` : 
                        "Carpeta: Raíz"}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 text-xs">
                          {sortOption === 'name-asc' && <><ArrowDownAZ className="h-3 w-3 mr-1" /> Nombre (A-Z)</>}
                          {sortOption === 'name-desc' && <><ArrowDownZA className="h-3 w-3 mr-1" /> Nombre (Z-A)</>}
                          {sortOption === 'date-asc' && <><Calendar className="h-3 w-3 mr-1" /> Antigua - Reciente</>}
                          {sortOption === 'date-desc' && <><Calendar className="h-3 w-3 mr-1" /> Reciente - Antigua</>}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSortOption('name-asc')}>
                          <ArrowDownAZ className="h-4 w-4 mr-2" />
                          <span>Nombre (A-Z)</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSortOption('name-desc')}>
                          <ArrowDownZA className="h-4 w-4 mr-2" />
                          <span>Nombre (Z-A)</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setSortOption('date-asc')}>
                          <Calendar className="h-4 w-4 mr-2" />
                          <span>Antigua - Reciente</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSortOption('date-desc')}>
                          <Calendar className="h-4 w-4 mr-2" />
                          <span>Reciente - Antigua</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Contenido de carpetas con scroll */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden pb-4">

                <SidebarSection title="Carpetas" className="sidebar-section-container">
                  <div className="space-y-1 folder-tree">
                    {rootCategories.map(category => (
                      <div 
                        key={category.id} 
                        className="category-item"
                        onClick={(e) => e.stopPropagation()} // Evitar que el click se propague
                      >                          <CategoryItem
                            category={category}
                            documents={documents}
                            subCategories={filteredOwnCategories.filter(cat => cat.parentId === category.id)}
                            allCategories={filteredOwnCategories}
                            onToggle={toggleCategory}
                            onDocumentSelect={handleDocumentSelect}
                            selectedDocumentId={selectedDocumentId}
                            onDeleteDocument={deleteDocument}
                            onDeleteCategory={deleteCategory}
                            onRenameCategory={renameCategory}
                            onRenameDocument={renameDocument}
                            addDocumentToCategory={addDocumentToCategory}
                            createSubfolder={createSubfolder}
                            handleDeleteConfirmation={handleDeleteConfirmation}
                          />
                      </div>
                    ))}
                  </div>
                </SidebarSection>

                {/* Mostrar resultados de búsqueda cuando hay un término de búsqueda */}
                {search.trim() && (
                  <SidebarSection title="Resultados de búsqueda" className="sidebar-section-container">
                    <div className="space-y-1">
                      {/* Documentos encontrados with su ruta */}
                      {searchFilteredDocuments.map(doc => {
                        const documentPath = doc.categoryId ? getCategoryPath(doc.categoryId) : 'Sin carpeta';
                        return (
                          <div 
                            className="pl-4 document-item" 
                            key={`search-${doc.id}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <DocumentItem
                              document={doc}
                              isActive={doc.id === selectedDocumentId}
                              onSelect={() => handleDocumentSelect(doc)}
                              onDelete={() => {
                                handleDeleteConfirmation(
                                  'document',
                                  doc.id,
                                  doc.title,
                                  () => deleteDocument(doc.id)
                                );
                              }}
                              onRename={(newTitle) => renameDocument(doc.id, newTitle)}
                              showPath={true}
                              documentPath={documentPath}
                            />
                          </div>
                        );
                      })}
                      
                      {/* Categorías encontradas */}
                      {searchFilteredCategories.filter(cat => 
                        cat.name.toLowerCase().includes(search.toLowerCase())
                      ).map(category => {
                        const categoryPath = category.parentId ? getCategoryPath(category.parentId) : 'Raíz';
                        return (
                          <div 
                            key={`search-cat-${category.id}`} 
                            className="category-item pl-4"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center px-3 py-1.5 rounded cursor-pointer hover:bg-accent">
                              <FolderClosed className="h-4 w-4 mr-2 text-muted-foreground" />
                              <div className="flex flex-col flex-1 min-w-0">
                                <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
                                  <span className="text-sm font-medium whitespace-nowrap block" title={category.name}>{category.name}</span>
                                </div>
                                <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
                                  <span className="text-xs text-muted-foreground whitespace-nowrap block" title={categoryPath}>
                                    📁 {categoryPath}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      
                      {searchFilteredDocuments.length === 0 && searchFilteredCategories.length === 0 && (
                        <div className="px-4 py-2 text-sm text-muted-foreground">
                          No se encontraron resultados para "{search}"
                        </div>
                      )}
                    </div>
                  </SidebarSection>
                )}

                {/* Solo mostrar las otras secciones cuando NO hay búsqueda */}
                {!search.trim() && (
                  <>
                    {/* NUEVO: Sección de carpetas compartidas conmigo */}
                    {sharedCategories.length > 0 && (
                      <SidebarSection title="Compartidos conmigo" className="sidebar-section-container">
                        <div className="space-y-1">
                          {sharedCategories.map(category => (
                            <div 
                              key={category.id} 
                              className="category-item"
                              onClick={e => e.stopPropagation()}
                            >
                              <CategoryItem
                                category={category}
                                documents={documents}
                                subCategories={categories.filter(cat => cat.parentId === category.id && !!cat.sharedPermission)}
                                allCategories={categories}
                                onToggle={toggleCategory}
                                onDocumentSelect={handleDocumentSelect}
                                selectedDocumentId={selectedDocumentId}
                                onDeleteDocument={() => {}}
                                onDeleteCategory={() => {}}
                                onRenameCategory={() => {}}
                                onRenameDocument={() => {}}
                                addDocumentToCategory={() => {}}
                                createSubfolder={() => {}}
                              />
                            </div>
                          ))}
                          {/* Documentos compartidos sueltos (no en carpeta compartida) */}
                          {filteredSharedDocuments.length > 0 && (
                            <div className="mt-2">
                              {filteredSharedDocuments.map(doc => (
                                <div 
                                  className="pl-4 document-item" 
                                  key={doc.id}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <DocumentItem
                                    document={doc}
                                    isActive={doc.id === selectedDocumentId}
                                    onSelect={() => handleDocumentSelect(doc)}
                                    onDelete={() => {}} // No permitir borrar compartidos
                                    onRename={() => {}} // No permitir renombrar compartidos
                                  />
                                  <div className="text-xs text-muted-foreground pl-8">
                                    {doc.owner
                                      ? `Propietario: ${doc.owner.firstName || ''} ${doc.owner.lastName || ''} (${doc.owner.email})`
                                      : ''}
                                    {doc.sharedPermission === 'view' && ' • Solo lectura'}
                                    {doc.sharedPermission === 'edit' && ' • Puede editar'}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </SidebarSection>
                    )}

                    {/* Siempre muestra los documentos en la raíz */}
                    {showDocumentsSection && rootDocuments.length > 0 && (
                      <SidebarSection title="Documentos sin carpeta" className="sidebar-section-container">
                        <div className="space-y-1">
                          {rootDocuments.map(doc => (
                            <div 
                              className="pl-4 document-item" 
                              key={doc.id}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <DocumentItem
                                document={doc}
                                isActive={doc.id === selectedDocumentId}
                                onSelect={() => handleDocumentSelect(doc)}
                                onDelete={() => {
                                  handleDeleteConfirmation(
                                    'document',
                                    doc.id,
                                    doc.title,
                                    () => deleteDocument(doc.id)
                                  );
                                }}
                                onRename={(newTitle) => renameDocument(doc.id, newTitle)}
                              />
                            </div>
                          ))}
                        </div>
                      </SidebarSection>
                    )}
                  </>
                )}
                </div>
              </>
            )}
          </div>
          
          {/* AlertDialog para confirmación de eliminación con motivo */}
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                  {deleteDialogItem?.type === 'document' ? (
                    <>
                      Esta acción eliminará permanentemente el documento "{deleteDialogItem.name}".
                      No se puede deshacer.
                    </>
                  ) : (
                    <>
                      Esta acción eliminará permanentemente la carpeta "{deleteDialogItem?.name}" y todo su contenido.
                      No se puede deshacer.
                    </>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              
              <div className="my-4">
                <Label htmlFor="deletion-reason" className="text-sm font-medium">
                  Motivo de eliminación <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="deletion-reason"
                  placeholder="Describe el motivo por el cual eliminas este elemento..."
                  value={deletionReason}
                  onChange={(e) => setDeletionReason(e.target.value)}
                  className="mt-2"
                  required
                />
                {!deletionReason.trim() && (
                  <p className="text-sm text-destructive mt-1">
                    El motivo de eliminación es obligatorio
                  </p>
                )}
              </div>

              <AlertDialogFooter>
                <AlertDialogCancel onClick={handleCancelDelete}>Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleConfirmDelete} 
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={!deletionReason.trim()}
                >
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </Sidebar>
      </NewCategoryContext.Provider>
    </SelectedCategoryContext.Provider>
  );
};

export default DocumentSidebar;

// Componente separado para el AlertDialog
export const DocumentSidebarWithAlert: React.FC<DocumentSidebarProps> = (props) => {
  return (
    <>
      <DocumentSidebar {...props} />
    </>
  );
};