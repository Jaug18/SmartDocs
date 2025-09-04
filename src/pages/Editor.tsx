import { useState, useCallback, useRef, useEffect } from 'react';
import DocumentEditor from '@/components/DocumentEditor';
import DocumentSidebar from '@/components/DocumentSidebar';
import { ShareDialog } from '@/components/ShareDialog';
import VersionSelector, { VersionSelectorRef } from '@/components/editor/VersionSelector';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { SidebarProvider, SidebarInset, useSidebar } from '@/components/ui/sidebar';
import { Save, Plus, FileText, Menu, Share2, Check, X, Bot } from 'lucide-react';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { UserMenu } from "@/components/UserMenu";
import { useAuth } from '../hooks/useAuth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useNavigate } from "react-router-dom";
import { MultiSelect } from "@/components/ui/multiselect";
import { AIGPT41NanoChat } from '@/components/AIGPT41Nano';
import { askOpenAIGPT41Nano } from '@/lib/AIGPT41Nano';

interface Document {
  id: string;
  title: string;
  content: string;
  categoryId?: string;
  permission?: 'owner' | 'edit' | 'view';
}

interface SharedUser {
  email: string;
  permission: 'view' | 'edit';
  id?: string;
  firstName?: string;
  lastName?: string;
}

const ShowSidebarButton = () => {
  // Elimina el botón completamente
  return null;
};

export default function Editor() {
  const [activeDocument, setActiveDocument] = useState<Document>({
    id: 'default',
    title: 'Nuevo Documento',
    content: '<h2>Comienza a crear tu documentación</h2><p>Escribe aquí para comenzar...</p>',
    categoryId: 'cat-medapp'
  });

  // Nuevos estados para la edición del título
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const titleInputRef = useRef<HTMLInputElement>(null);

  const { getToken, user } = useAuth();
  const editorContentRef = useRef<string>(activeDocument.content);
  const editorRef = useRef<any>(null); // NUEVO: referencia al editor
  const versionSelectorRef = useRef<VersionSelectorRef>(null);
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPermissionsLoading, setIsPermissionsLoading] = useState<boolean>(true); // Nuevo estado
  const [isAreaLoading, setIsAreaLoading] = useState(true);

  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [sharedUsers, setSharedUsers] = useState<SharedUser[]>([]);
  const [shareEmail, setShareEmail] = useState('');
  const [sharePermission, setSharePermission] = useState<'view' | 'edit'>('view');

  const [documentPermission, setDocumentPermission] = useState<'owner' | 'edit' | 'view'>('owner');
  const [userRole, setUserRole] = useState<'superuser' | 'admin' | 'normal'>('normal');
  const [canCreateDocuments, setCanCreateDocuments] = useState<boolean>(true);

  const [massShareDocumentId, setMassShareDocumentId] = useState('');
  const [massShareDocumentIds, setMassShareDocumentIds] = useState<string[]>([]);
  const [massShareCategoryIds, setMassShareCategoryIds] = useState<string[]>([]);
  const [massShareAreas, setMassShareAreas] = useState<string[]>([]);
  const [massSharePermission, setMassSharePermission] = useState<'view' | 'edit'>('view');
  const [massShareAll, setMassShareAll] = useState(false);
  const [allAreas, setAllAreas] = useState<{ id: string; name: string }[]>([]);
  const [allCategories, setAllCategories] = useState<{ id: string; name: string }[]>([]);
  const [myDocuments, setMyDocuments] = useState<Document[]>([]);
  const [userArea, setUserArea] = useState<string | null>(null);
  const [userAreaRole, setUserAreaRole] = useState<'normal' | 'leader' | null>(null);

  // Estados para versiones
  const [currentVersion, setCurrentVersion] = useState<number>(1);
  const [isViewingVersion, setIsViewingVersion] = useState(false);

  const navigate = useNavigate();
  const [showAIGPT41NanoChat, setShowAIGPT41NanoChat] = useState(false);

  // Estado para sugerencia pendiente de IA
  const [pendingAISuggestion, setPendingAISuggestion] = useState<{
    text: string;
    diffType?: 'add' | 'remove' | 'replace' | null;
    originalText?: string;
    hasSelection?: boolean;
    selectionFrom?: number;
    selectionTo?: number;
  } | null>(null);

  const [isEditorProcessing, setIsEditorProcessing] = useState(false);
  const [copilotInlineStyles, setCopilotInlineStyles] = useState<{
    position: { top: number, left: number } | null;
    text: string;
  }>({
    position: null,
    text: ''
  });

  const handleContentChange = useCallback((newContent: string) => {
    editorContentRef.current = newContent;
    setActiveDocument(prev => ({
      ...prev,
      content: newContent
    }));
  }, []);

  const fetchFullDocument = useCallback(async (documentId: string) => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/api/users/documents/${documentId}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // Si el error es 403, limpiar lastDocumentId y mostrar toast
        if (response.status === 403) {

          localStorage.removeItem('lastDocumentId');
          toast({
            title: "Acceso denegado",
            description: "No tienes permisos para ver este documento",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error al cargar documento",
            description: errorData.error || "No se pudo cargar el documento",
            variant: "destructive",
          });
        }

        throw new Error(errorData.error || 'Error al cargar el documento completo');
      }

      const data = await response.json();
      setDocumentPermission(data.permission || 'owner');
      return data;
    } catch (error) {
      setDocumentPermission('owner');
      return null;
    }
  }, [getToken, API_BASE_URL]);

  useEffect(() => {
    const loadInitialData = async () => {
      setIsPermissionsLoading(true);
      setIsAreaLoading(true);
      try {
        const lastDocumentId = localStorage.getItem('lastDocumentId');
        
        // Cargar perfil de usuario primero para obtener rol y permisos
        const token = await getToken();
        const profileRes = await fetch(`${API_BASE_URL}/api/users/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (profileRes.ok) {
          const data = await profileRes.json();
          
          setUserRole(data.role || 'normal');
          
          // Si hay área, obtener el nombre del área usando el endpoint público
          if (data.areaId) {
            try {
              const areaRes = await fetch(`${API_BASE_URL}/api/users/area/${data.areaId}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              if (areaRes.ok) {
                const userAreaData = await areaRes.json();
                setUserArea(userAreaData.name || null);
                setUserAreaRole(data.isLeader ? 'leader' : 'normal');
              } else {
                setUserArea(null);
                setUserAreaRole(null);
              }
            } catch (error) {
              setUserArea(null);
              setUserAreaRole(null);
            }
          } else {
            setUserArea(null);
            setUserAreaRole(null);
          }
          
          if (data.role === 'normal') {
            setCanCreateDocuments(data.userPermissions?.some((p: { permission: string }) => p.permission === 'create_documents') ?? false);
          } else {
            setCanCreateDocuments(true);
          }
        }

        if (lastDocumentId && lastDocumentId !== 'default' && !lastDocumentId.startsWith('doc-')) {
          setIsLoading(true);
          const document = await fetchFullDocument(lastDocumentId);

          if (document) {
            setActiveDocument(document);
            editorContentRef.current = document.content;
          } else {
            localStorage.removeItem('lastDocumentId');
          }
        }
      } catch (error) {
        // Establecer valores predeterminados en caso de error
        setUserRole('normal');
        setCanCreateDocuments(false);
        setDocumentPermission('owner');
      } finally {
        setIsLoading(false);
        setIsPermissionsLoading(false); // Permisos cargados
        setIsAreaLoading(false);
      }
    };

    loadInitialData();
  }, [getToken, API_BASE_URL, fetchFullDocument]);

  const handleDocumentSelect = async (document: Document) => {
    try {
      localStorage.setItem(`doc-${activeDocument.id}`, JSON.stringify(activeDocument));

      if (document.id && !document.id.startsWith('doc-')) {
        localStorage.setItem('lastDocumentId', document.id);
      }

      if (document.id && !document.id.startsWith('doc-')) {
        const fullDocument = await fetchFullDocument(document.id);
        if (fullDocument) {
          setActiveDocument(fullDocument);
          editorContentRef.current = fullDocument.content;
          toast({
            title: "Documento cargado",
            description: `"${fullDocument.title}" se ha abierto correctamente`,
          });
          return;
        }
      }

      setActiveDocument(document);
      editorContentRef.current = document.content;
      setDocumentPermission('owner');
      toast({
        title: "Documento cargado",
        description: `"${document.title}" se ha abierto correctamente`,
      });
    } catch (error) {
      setDocumentPermission('owner');
    }
  };

  const handleSave = useCallback(async () => {
    try {
      const token = await getToken();
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

      const contentToSave = editorContentRef.current;

      if (activeDocument.id && !activeDocument.id.startsWith('doc-')) {
        const res = await fetch(`${API_BASE_URL}/api/users/documents/${activeDocument.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            title: activeDocument.title,
            content: contentToSave,
            categoryId: activeDocument.categoryId || null,
          }),
        });
        if (!res.ok) throw new Error('No se pudo guardar el documento');
        const updated = await res.json();
        setActiveDocument(prev => ({
          ...prev,
          ...updated,
        }));

        // Si estábamos viendo una versión, volver a la actual
        const wasViewingVersion = isViewingVersion;
        if (isViewingVersion) {
          setIsViewingVersion(false);
          setCurrentVersion(1); // Se actualizará con los datos del servidor
        }

        // Refrescar las versiones después de guardar
        setTimeout(() => {
          versionSelectorRef.current?.refreshVersions();
        }, 500);

        localStorage.setItem('lastDocumentId', activeDocument.id);

        // Mostrar mensaje apropiado
        if (wasViewingVersion) {
          toast({
            title: "Nueva versión creada",
            description: `Se ha creado una nueva versión basada en los cambios realizados`,
            className: "bg-green-50 border-green-200",
          });
        } else {
          toast({
            title: "Documento guardado",
            description: `"${activeDocument.title}" ha sido guardado exitosamente`,
            className: "bg-green-50 border-green-200",
          });
        }
      } else {
        const res = await fetch(`${API_BASE_URL}/api/users/documents`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            title: activeDocument.title,
            content: contentToSave,
            categoryId: activeDocument.categoryId || null,
          }),
        });
        if (!res.ok) throw new Error('No se pudo crear el documento');
        const created = await res.json();
        setActiveDocument(created);

        // Refrescar las versiones después de crear
        setTimeout(() => {
          versionSelectorRef.current?.refreshVersions();
        }, 500);

        localStorage.setItem('lastDocumentId', created.id);

        // Mostrar mensaje para documento nuevo
        toast({
          title: "Documento creado",
          description: `"${activeDocument.title}" ha sido creado exitosamente`,
          className: "bg-green-50 border-green-200",
        });
      }
    } catch (error) {
      toast({
        title: "Error al guardar",
        description: "No se pudo guardar el documento en el servidor.",
        variant: "destructive",
      });
    }
  }, [activeDocument, getToken, isViewingVersion]);

  const createNewDocument = () => {
    const newDoc: Document = {
      id: `doc-${Date.now()}`,
      title: 'Documento sin título',
      content: '<h2>Nuevo documento</h2><p>Empieza a escribir...</p>',
      categoryId: 'cat-medapp'
    };

    localStorage.setItem(`doc-${activeDocument.id}`, JSON.stringify(activeDocument));
    setActiveDocument(newDoc);

    toast({
      title: "Nuevo documento",
      description: "Se ha creado un nuevo documento",
      className: "bg-blue-50 border-blue-200",
    });
  };

  const getOriginalDocumentId = (id: string) => id.split('-version-')[0];


const fetchSharedUsers = useCallback(async (documentId: string) => {
  try {
    const token = await getToken();
    const originalId = getOriginalDocumentId(documentId);
    const res = await fetch(`${API_BASE_URL}/api/users/documents/${originalId}/shares`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) throw new Error('No se pudo obtener los usuarios compartidos');
    const data: {
      user: {
        email: string;
        id?: string;
        firstName?: string;
        lastName?: string;
      };
      permission: 'view' | 'edit';
    }[] = await res.json();
    setSharedUsers(
      data.map((item) => ({
        email: item.user.email,
        permission: item.permission,
        id: item.user.id,
        firstName: item.user.firstName,
        lastName: item.user.lastName,
      }))
    );
  } catch (error) {
    setSharedUsers([]);
  }
}, [getToken, API_BASE_URL]);

useEffect(() => {
  if (
    activeDocument.id &&
    activeDocument.id !== 'default' &&
    !activeDocument.id.startsWith('doc-')
  ) {
    fetchSharedUsers(getOriginalDocumentId(activeDocument.id));
  } else {
    setSharedUsers([]);
  }
}, [activeDocument.id, shareDialogOpen, fetchSharedUsers]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await getToken();
        // Obtener todos los documentos propios (sin sharedPermission)
        const docsRes = await fetch(`${API_BASE_URL}/api/users/documents`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (docsRes.ok) {
          const docs = await docsRes.json();
          setMyDocuments(docs.filter((d: any) => !d.sharedPermission));
        }
        // Obtener todas las áreas
        const areasRes = await fetch(`${API_BASE_URL}/api/admin/areas`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (areasRes.ok) {
          const areas = await areasRes.json();
          setAllAreas(areas.map((a: { id: string; name: string }) => ({ id: a.id, name: a.name })));
        }

        // Obtener todas las categorías sin filtrar
        const catsRes = await fetch(`${API_BASE_URL}/api/users/categories`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (catsRes.ok) {
          const cats = await catsRes.json();

          // No filtrar las categorías, mostrarlas todas
          setAllCategories(cats.map((c: { id: string; name: string }) => ({ 
            id: c.id, 
            name: c.name 
          })));
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    if (userRole === 'admin' || userRole === 'superuser') {
      fetchData();
    }
  }, [userRole, getToken, API_BASE_URL]);

  const handleAddShare = async () => {
    if (!shareEmail.trim()) return;
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/api/users/documents/${activeDocument.id}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          email: shareEmail.trim(),
          permission: sharePermission,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast({
          title: "Error al compartir",
          description: err.error || "No se pudo compartir el documento",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Documento compartido",
        description: `Se compartió con ${shareEmail.trim()}`,
      });
      setShareEmail('');
      setSharePermission('view');
      fetchSharedUsers(activeDocument.id);
    } catch (error) {
      toast({
        title: "Error al compartir",
        description: "No se pudo compartir el documento",
        variant: "destructive",
      });
    }
  };

  const handleRemoveShare = async (userId: string) => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/api/users/documents/${activeDocument.id}/share/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) {
        toast({
          title: "Error al revocar acceso",
          description: "No se pudo revocar el acceso",
          variant: "destructive",
        });
        return;
      }
      fetchSharedUsers(activeDocument.id);
    } catch (error) {
      toast({
        title: "Error al revocar acceso",
        description: "No se pudo revocar el acceso",
        variant: "destructive",
      });
    }
  };

  const handleMassShareDocument = async () => {
    if (massShareDocumentIds.length === 0 && massShareCategoryIds.length === 0) {
      toast({
        title: "Selección incompleta",
        description: "Debes seleccionar al menos un documento o carpeta",
        variant: "destructive",
      });
      return;
    }

    // Validar áreas solo si NO se marcó "compartir con todas las áreas"
    if (!massShareAll && massShareAreas.length === 0) {
      toast({
        title: "Selección incompleta",
        description: "Debes seleccionar al menos un área de destino o marcar 'Compartir con todas las áreas'",
        variant: "destructive",
      });
      return;
    }


    // Determinar las áreas finales a usar
    const finalAreas = massShareAll ? null : massShareAreas;

    try {
      const token = await getToken();
      let totalShared = 0;

      // Compartir documentos individuales
      for (const docId of massShareDocumentIds) {
        if (massShareAll) {
          // Compartir con todas las áreas (areaId = null)
          const response = await fetch(`${API_BASE_URL}/api/admin/share-document-area`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              documentId: docId,
              areaId: null, // null = todas las áreas
              permission: massSharePermission
            })
          });

          if (response.ok) {
            totalShared++;
          } else {
            const error = await response.json();
          }
        } else {
          // Compartir con áreas específicas
          for (const areaId of massShareAreas) {
            const response = await fetch(`${API_BASE_URL}/api/admin/share-document-area`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({
                documentId: docId,
                areaId,
                permission: massSharePermission
              })
            });

            if (response.ok) {
              totalShared++;
            } else {
              const error = await response.json();
            }
          }
        }
      }

      // Compartir carpetas (que incluirá todos los documentos dentro recursivamente)
      for (const catId of massShareCategoryIds) {

        const response = await fetch(`${API_BASE_URL}/api/admin/share-category-area`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            categoryId: catId,
            areaIds: finalAreas, // null si es todas las áreas, array si son específicas
            permission: massSharePermission
          })
        });

        if (response.ok) {
          const result = await response.json();
          totalShared += result.sharedCount || 0;

          if (result.message) {
            toast({
              title: "Carpeta compartida",
              description: result.message,
            });
          }
        } else {
          const error = await response.json();
          toast({
            title: "Error compartiendo carpeta",
            description: error.error || "No se pudo compartir la carpeta",
            variant: "destructive",
          });
        }
      }

      // Mensaje final de éxito
      const shareTypeMessage = massShareAll 
        ? "Se compartieron con todas las áreas" 
        : `Se compartieron con ${massShareAreas.length} área(s)`;

      toast({ 
        title: "Compartir completado", 
        description: `${shareTypeMessage}. Total: ${totalShared} elementos.`,
        className: "bg-green-50 border-green-200",
      });

      // Limpiar formulario
      setShareDialogOpen(false);
      setMassShareDocumentIds([]);
      setMassShareCategoryIds([]);
      setMassShareAreas([]);
      setMassShareAll(false);

    } catch (error) {
      toast({ 
        title: "Error", 
        description: "No se pudo completar la operación de compartir", 
        variant: "destructive" 
      });
    }
  };

  // Nueva función adaptada para trabajar con el componente ShareDialog
  const handleMassShare = async (data: {
    documentIds: string[];
    categoryIds: string[];
    areas: string[];
    permission: 'view' | 'edit';
    shareAll: boolean;
  }) => {
    if (data.documentIds.length === 0 && data.categoryIds.length === 0) {
      toast({
        title: "Selección incompleta",
        description: "Debes seleccionar al menos un documento o carpeta",
        variant: "destructive",
      });
      return;
    }

    // Validar áreas solo si NO se marcó "compartir con todas las áreas"
    if (!data.shareAll && data.areas.length === 0) {
      toast({
        title: "Selección incompleta",
        description: "Debes seleccionar al menos un área de destino o marcar 'Compartir con todas las áreas'",
        variant: "destructive",
      });
      return;
    }

    // Determinar las áreas finales a usar
    const finalAreas = data.shareAll ? null : data.areas;

    try {
      const token = await getToken();
      let totalShared = 0;

      // Compartir documentos individuales
      for (const docId of data.documentIds) {
        if (data.shareAll) {
          // Compartir con todas las áreas (areaId = null)
          const response = await fetch(`${API_BASE_URL}/api/admin/share-document-area`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              documentId: docId,
              areaId: null, // null = todas las áreas
              permission: data.permission
            })
          });

          if (response.ok) {
            const result = await response.json();
            // Usar sharedCount del backend si está disponible, sino incrementar en 1
            totalShared += result.sharedCount || 1;
          } else {
            const error = await response.json();
            console.error('Error compartiendo documento:', error);
          }
        } else {
          // Compartir con áreas específicas
          for (const areaId of data.areas) {
            const response = await fetch(`${API_BASE_URL}/api/admin/share-document-area`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({
                documentId: docId,
                areaId,
                permission: data.permission
              })
            });

            if (response.ok) {
              const result = await response.json();
              // Usar sharedCount del backend si está disponible, sino incrementar en 1
              totalShared += result.sharedCount || 1;
            } else {
              const error = await response.json();
              console.error('Error compartiendo documento:', error);
            }
          }
        }
      }

      // Compartir carpetas (que incluirá todos los documentos dentro recursivamente)
      for (const catId of data.categoryIds) {
        const response = await fetch(`${API_BASE_URL}/api/admin/share-category-area`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            categoryId: catId,
            areaIds: finalAreas, // null si es todas las áreas, array si son específicas
            permission: data.permission
          })
        });

        if (response.ok) {
          const result = await response.json();
          totalShared += result.sharedCount || 0;

          if (result.message) {
            toast({
              title: "Carpeta compartida",
              description: result.message,
            });
          }
        } else {
          const error = await response.json();
          toast({
            title: "Error compartiendo carpeta",
            description: error.error || "No se pudo compartir la carpeta",
            variant: "destructive",
          });
        }
      }

      // Mensaje final de éxito
      const elementsCount = data.documentIds.length + data.categoryIds.length;
      const elementTypes = [];
      if (data.documentIds.length > 0) {
        elementTypes.push(`${data.documentIds.length} documento(s)`);
      }
      if (data.categoryIds.length > 0) {
        elementTypes.push(`${data.categoryIds.length} carpeta(s)`);
      }
      
      const shareTypeMessage = data.shareAll 
        ? "con todas las áreas" 
        : `con ${data.areas.length} área(s)`;

      toast({ 
        title: "Compartir completado", 
        description: `${elementTypes.join(' y ')} compartidos ${shareTypeMessage}. Total de asignaciones: ${totalShared}.`,
        className: "bg-green-50 border-green-200",
      });

      // No cerrar el diálogo aquí, el componente ShareDialog lo maneja

    } catch (error) {
      toast({ 
        title: "Error", 
        description: "No se pudo completar la operación de compartir", 
        variant: "destructive" 
      });
      throw error; // Re-lanzar el error para que el componente lo maneje
    }
  };

  // Nueva función para manejar la edición del título
  const handleUpdateTitle = async () => {
    if (editedTitle.trim() === '') return;

    try {
      // Solo permitir cambios si el documento está guardado en la BD
      if (activeDocument.id && !activeDocument.id.startsWith('doc-')) {
        const token = await getToken();
        const res = await fetch(`${API_BASE_URL}/api/users/documents/${activeDocument.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            title: editedTitle.trim(),
            content: activeDocument.content,
            categoryId: activeDocument.categoryId || null,
          }),
        });

        if (!res.ok) throw new Error('No se pudo actualizar el título');
        const updated = await res.json();

        setActiveDocument(prev => ({
          ...prev,
          title: updated.title,
        }));

        // Disparar evento personalizado para notificar al sidebar
        window.dispatchEvent(new CustomEvent('documentTitleUpdated', {
          detail: { documentId: activeDocument.id, newTitle: updated.title }
        }));

        toast({
          title: "Título actualizado",
          description: "El nombre del documento ha sido actualizado",
          className: "bg-green-50 border-green-200",
        });
      } else {
        // Documento local, simplemente actualizar el estado
        setActiveDocument(prev => ({
          ...prev,
          title: editedTitle.trim(),
        }));

        // Disparar evento personalizado para documentos locales también
        window.dispatchEvent(new CustomEvent('documentTitleUpdated', {
          detail: { documentId: activeDocument.id, newTitle: editedTitle.trim() }
        }));
      }
    } catch (error) {
      toast({
        title: "Error al actualizar",
        description: "No se pudo actualizar el título del documento",
        variant: "destructive",
      });
    } finally {
      setIsEditingTitle(false);
    }
  };

  // Función para iniciar la edición del título desde el header
  const startEditingTitle = () => {
    if (documentPermission === 'view') {
      toast({
        title: "Sin permisos",
        description: "No tienes permisos para editar este documento",
        variant: "destructive",
      });
      return;
    }
    setEditedTitle(activeDocument.title);
    setIsEditingTitle(true);
  };

  // Effect para focus en el input del título
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  const handleInsertFromAIGPT41Nano = (text: string, diffType?: 'add' | 'remove' | 'replace' | null) => {
    if (!editorRef.current || !editorRef.current.editor) return;
    
    const editor = editorRef.current.editor;
    const { state } = editor;
    const { from, to } = state.selection;
    
    if (diffType === 'remove') {
      // Para eliminar: simplemente borrar la selección actual
      if (from !== to) {
        editor.chain().focus().deleteRange({ from, to }).run();
      } else {
        // Si no hay selección, eliminar párrafo actual o línea
        editor.chain().focus().deleteCurrentNode().run();
      }
    } else {
      // Para agregar o reemplazar: aplicar resaltado temporal
      let html = text;
      
      if (diffType === 'add') {
        html = `<span style="background-color:#bbf7d0;color:#166534;border-radius:4px;padding:2px 4px;">${text}</span>`;
      } else if (diffType === 'replace') {
        html = `<span style="background-color:#fef08a;color:#92400e;border-radius:4px;padding:2px 4px;">${text}</span>`;
      }
      
      // Si hay selección, reemplazar el texto seleccionado
      if (from !== to) {
        editor.chain().focus().insertContentAt({ from, to }, html).run();
      } else {
        // Sin selección: insertar en el cursor
        editor.chain().focus().insertContent(html).run();
      }
    }
    
    setPendingAISuggestion(null);
    
    // Remover resaltado después de 3 segundos
    setTimeout(() => {
      const spans = editor.view.dom.querySelectorAll('span[style*="background-color"]');
      spans.forEach(span => {
        const parent = span.parentNode;
        if (parent) {
          parent.replaceChild(document.createTextNode(span.textContent || ''), span);
        }
      });
    }, 3000);
  };

  // Función para aceptar la sugerencia y aplicarla al editor
  const acceptAISuggestion = () => {
    if (!pendingAISuggestion || !editorRef.current?.editor) return;
  
    const editor = editorRef.current.editor;
    let html = pendingAISuggestion.text;
  
    // Aplicar resaltado según el tipo de edición
    if (pendingAISuggestion.diffType === 'add') {
      html = `<span style="background-color:#bbf7d0;color:#166534;border-radius:4px;padding:2px 4px;">${pendingAISuggestion.text}</span>`;
    } else if (pendingAISuggestion.diffType === 'remove') {
      html = `<span style="background-color:#fecaca;color:#991b1b;text-decoration:line-through;border-radius:4px;padding:2px 4px;">${pendingAISuggestion.originalText || pendingAISuggestion.text}</span>`;
    } else if (pendingAISuggestion.diffType === 'replace') {
      html = `<span style="background-color:#fef08a;color:#92400e;border-radius:4px;padding:2px 4px;">${pendingAISuggestion.text}</span>`;
    }
  
    // Aplicar el cambio en la posición correcta
    if (pendingAISuggestion.hasSelection && 
        pendingAISuggestion.selectionFrom !== undefined && 
        pendingAISuggestion.selectionTo !== undefined) {
      // Reemplazar texto seleccionado
      if (pendingAISuggestion.diffType === 'remove') {
        // Para eliminar, mostrar el texto original tachado
        editor.chain().focus().insertContentAt({ 
          from: pendingAISuggestion.selectionFrom, 
          to: pendingAISuggestion.selectionTo 
        }, html).run();
      } else {
        // Para reemplazar o modificar
        editor.chain().focus().insertContentAt({ 
          from: pendingAISuggestion.selectionFrom, 
          to: pendingAISuggestion.selectionTo 
        }, html).run();
      }
    } else {
      // Insertar en la posición del cursor
      editor.chain().focus().insertContent(html).run();
    }
  
    setPendingAISuggestion(null);
  
    toast({
      title: "Sugerencia aplicada",
      description: "El cambio se ha aplicado al documento",
      className: "bg-green-50 border-green-200",
    });
  };

  // Función para rechazar la sugerencia
  const rejectAISuggestion = () => {
    setPendingAISuggestion(null);
  };

  // CORREGIR: función handleEditorModeRequest para trabajar mejor con eliminaciones
  const handleEditorModeRequest = async (prompt: string) => {
    if (!editorRef.current || !editorRef.current.editor) return;
    setIsEditorProcessing(true);
    
    try {
      const editor = editorRef.current.editor;
      const { state } = editor;
      const { from, to } = state.selection;
      let selectedText = '';
      let hasSelection = false;
      
      if (from !== to) {
        selectedText = state.doc.textBetween(from, to, ' ');
        hasSelection = true;
      }
      
      // Determinar el tipo de operación basado en el prompt
      let diffType: 'add' | 'remove' | 'replace' = 'add';
      if (/elimina|borra|quitar|remueve/i.test(prompt)) {
        diffType = 'remove';
      } else if (/corrige|mejora|cambia|modifica|reemplaza/i.test(prompt) || hasSelection) {
        diffType = 'replace';
      }
      
      // Para eliminación, aplicar directamente sin mostrar sugerencia
      if (diffType === 'remove' && hasSelection) {
        editor.chain().focus().deleteRange({ from, to }).run();
        
        toast({
          title: "Texto eliminado",
          description: "El texto seleccionado ha sido eliminado",
          className: "bg-red-50 border-red-200",
        });
        
        setIsEditorProcessing(false);
        return;
      }
      
      // Para otros casos, generar sugerencia
      let formattedPrompt = '';
      if (hasSelection) {
        formattedPrompt = `Actúa como GitHub Copilot. Tengo el siguiente texto seleccionado:\n"""${selectedText}"""\n${prompt}\nResponde solo con el texto editado o reemplazado, sin explicaciones.`;
      } else {
        formattedPrompt = `Actúa como GitHub Copilot. ${prompt}\nResponde solo con el texto sugerido, sin explicaciones.`;
      }
      
      const aiResponse = await askOpenAIGPT41Nano(formattedPrompt);

      // Aplicar directamente al editor con resaltado temporal
      handleInsertFromAIGPT41Nano(aiResponse, diffType);
      
      toast({
        title: "Sugerencia aplicada",
        description: "El cambio se ha aplicado al documento",
        className: "bg-green-50 border-green-200",
      });

    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo generar una sugerencia",
        variant: "destructive",
      });
    } finally {
      setIsEditorProcessing(false);
    }
  };

  // Función para sincronizar el título cuando se cambia desde el sidebar
  const handleDocumentTitleChange = useCallback((documentId: string, newTitle: string) => {
    if (activeDocument.id === documentId) {
      setActiveDocument(prev => ({
        ...prev,
        title: newTitle
      }));
    }
  }, [activeDocument.id]);

  // Función para refrescar datos de compartir masivo
  const refreshMassShareData = useCallback(async () => {
    try {
      const token = await getToken();
      
      // Obtener todos los documentos propios (sin sharedPermission)
      const docsRes = await fetch(`${API_BASE_URL}/api/users/documents`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (docsRes.ok) {
        const docs = await docsRes.json();
        setMyDocuments(docs.filter((d: any) => !d.sharedPermission));
      }
      
      // Obtener todas las áreas
      const areasRes = await fetch(`${API_BASE_URL}/api/admin/areas`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (areasRes.ok) {
        const areas = await areasRes.json();
        setAllAreas(areas.map((a: { id: string; name: string }) => ({ id: a.id, name: a.name })));
      }

      // Obtener todas las categorías sin filtrar
      const catsRes = await fetch(`${API_BASE_URL}/api/users/categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (catsRes.ok) {
        const cats = await catsRes.json();
        setAllCategories(cats.map((c: { id: string; name: string }) => ({ 
          id: c.id, 
          name: c.name 
        })));
      }
    } catch (error) {
      // Error silencioso
    }
  }, [getToken, API_BASE_URL]);

  // Funciones para manejar versiones
  const handleVersionChange = useCallback((newVersion: number) => {
    setCurrentVersion(newVersion);
  }, []);

  const handleVersionSelect = useCallback(async (version: any) => {
    try {
      setIsViewingVersion(true);
      setCurrentVersion(version.version);
      
      // Verificar que el contenido existe y no esté vacío
      if (!version.content) {
        toast({
          title: "Error",
          description: "El contenido de la versión está vacío",
          variant: "destructive",
        });
        return;
      }
      
      // Actualizar el documento con el contenido de la versión histórica
      setActiveDocument(prev => ({
        ...prev,
        title: version.title || prev.title,
        content: version.content
      }));
      
      toast({
        title: "Versión cargada",
        description: `Visualizando versión ${version.version} (editable)`,
      });
    } catch (error) {
      console.error('Error in handleVersionSelect:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar la versión",
        variant: "destructive",
      });
    }
  }, []);

  const handleVersionRestore = useCallback(async (version: number) => {
    try {
      // Refrescar el documento después de la restauración
      await fetchFullDocument(activeDocument.id); // Ya no necesitamos split
      setIsViewingVersion(false);
      
      toast({
        title: "Documento restaurado",
        description: `Se restauró a la versión ${version}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo restaurar la versión",
        variant: "destructive",
      });
    }
  }, [activeDocument.id, fetchFullDocument]);

  const handleBackToLatest = useCallback(async () => {
    try {
      const originalId = activeDocument.id; // Ya no necesitamos split porque no modificamos el ID
      await fetchFullDocument(originalId);
      setIsViewingVersion(false);
      // El currentVersion se actualizará automáticamente cuando se cargue el documento
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo volver a la versión actual",
        variant: "destructive",
      });
    }
  }, [activeDocument.id, fetchFullDocument]);

  return (
    <div className="min-h-screen w-full bg-white dark:bg-gray-900 relative">
      {/* Dual Gradient Overlay Background - Light Mode */}
      <div
        className="absolute inset-0 z-0 dark:hidden"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(229,231,235,0.8) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(229,231,235,0.8) 1px, transparent 1px),
            radial-gradient(circle 500px at 20% 20%, rgba(139,92,246,0.3), transparent),
            radial-gradient(circle 500px at 80% 80%, rgba(59,130,246,0.3), transparent)
          `,
          backgroundSize: "48px 48px, 48px 48px, 100% 100%, 100% 100%",
        }}
      />
      
      {/* Dual Gradient Overlay Background - Dark Mode */}
      <div
        className="absolute inset-0 z-0 hidden dark:block"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(75,85,99,0.6) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(75,85,99,0.6) 1px, transparent 1px),
            radial-gradient(circle 500px at 20% 20%, rgba(139,92,246,0.4), transparent),
            radial-gradient(circle 500px at 80% 80%, rgba(59,130,246,0.4), transparent)
          `,
          backgroundSize: "48px 48px, 48px 48px, 100% 100%, 100% 100%",
        }}
      />
      
      <div className="flex h-screen flex-col relative z-10">
        <header className="sticky top-0 z-50 flex items-center justify-between bg-background/95 backdrop-blur px-4 py-2 border-b">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/editor")}>
            <img src="/forms-document-svgrepo-com.svg" alt="Smart File" className="h-8 w-8" />
            <div className="flex flex-col">
              <h1 className="text-lg font-semibold">
                Smart Docs
                {isAreaLoading ? (
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    / Cargando área...
                  </span>
                ) : (
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    / {userArea ? `Área: ${userArea}` : 'Sin área asignada'}
                    {userArea && userAreaRole && (
                      <span className="ml-1">
                        ({userAreaRole === 'leader' ? 'Líder' : 'Usuario'})
                      </span>
                    )}
                  </span>
                )}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <UserMenu />
          </div>
        </header>

        <main className="flex flex-1 overflow-hidden">
        <SidebarProvider>
          <div className="flex min-h-screen w-full">
            <DocumentSidebar 
              onDocumentSelect={handleDocumentSelect}
              selectedDocumentId={activeDocument.id}
              onDocumentTitleChange={handleDocumentTitleChange} // Pasar la función al sidebar
            />

            <SidebarInset className="p-4 md:p-6 space-y-6 relative flex-grow transition-all duration-300">

              <div className="flex items-center justify-between mb-8 animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <FileText className="text-primary h-6 w-6" />
                  </div>
                  {/* Reemplazar el título estático por un componente editable condicional */}
                  {isEditingTitle ? (
                    <div className="flex items-center">
                      <Input
                        ref={titleInputRef}
                        type="text"
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleUpdateTitle();
                          } else if (e.key === 'Escape') {
                            setIsEditingTitle(false);
                            setEditedTitle(activeDocument.title);
                          }
                        }}
                        onBlur={handleUpdateTitle}
                        className="text-2xl font-semibold h-auto py-1 px-2"
                        placeholder="Nombre del documento"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center min-w-0 max-w-md">
                      <span 
                        className={`text-3xl font-bold bg-transparent border-none px-0 transition-colors truncate ${
                          documentPermission === 'view' || isViewingVersion 
                            ? 'cursor-not-allowed opacity-70' 
                            : 'cursor-pointer hover:text-primary'
                        }`}
                        onClick={documentPermission === 'view' || isViewingVersion ? undefined : startEditingTitle}
                        title={`${activeDocument.title}${
                          documentPermission === 'view' 
                            ? " (No tienes permisos para editar)" 
                            : isViewingVersion 
                              ? " (No se puede editar el título mientras se visualiza una versión anterior)"
                              : " (Haz clic para editar el título)"
                        }`}
                      >
                        {activeDocument.title}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {/* Mostrar selector de versiones si el documento está guardado */}
                  {activeDocument.id && activeDocument.id !== 'default' && !activeDocument.id.startsWith('doc-') && (
                    <>
                      <VersionSelector
                        ref={versionSelectorRef}
                        documentId={activeDocument.id} // Usar ID directo ya que no se modifica
                        currentVersion={currentVersion}
                        onVersionSelect={handleVersionSelect}
                        onVersionRestore={handleVersionRestore}
                        onVersionChange={handleVersionChange}
                      />
                      {isViewingVersion && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleBackToLatest}
                          className="text-orange-600 border-orange-200 hover:bg-orange-50"
                        >
                          Volver a la actual
                        </Button>
                      )}
                    </>
                  )}
                  <Button
                    onClick={handleSave}
                    size="sm"
                    className="bg-primary hover:bg-primary/90 shadow-sm"
                    aria-label={isViewingVersion ? "Guardar como nueva versión" : "Guardar documento"}
                    title={isViewingVersion ? "Guardar cambios como nueva versión" : "Guardar documento"}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isViewingVersion ? "Guardar como Nueva Versión" : "Guardar"}
                  </Button>
                  {/* Solo mostrar botón de compartir si el documento está guardado Y el usuario es propietario */}
                  {activeDocument.id && 
                   activeDocument.id !== 'default' && 
                   !activeDocument.id.startsWith('doc-') && 
                   documentPermission === 'owner' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShareDialogOpen(true)}
                      aria-label="Compartir documento"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Compartir
                    </Button>
                  )}
                </div>
              </div>

              <Card className="p-0 overflow-hidden border rounded-xl shadow-sm transition-shadow hover:shadow-md relative">
                {/* Banner de versión */}
                {isViewingVersion && (
                  <div className="bg-orange-50 border-b border-orange-200 px-4 py-2 text-sm text-orange-800">
                    <div className="flex items-center justify-between">
                      <span>
                        📖 Visualizando versión {currentVersion} (editable - los cambios se guardarán como nueva versión)
                      </span>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={handleBackToLatest}
                        className="text-orange-600 p-0 h-auto"
                      >
                        Volver a la versión actual →
                      </Button>
                    </div>
                  </div>
                )}
                
                {isLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <p className="text-muted-foreground">Cargando documento...</p>
                  </div>
                ) : isPermissionsLoading ? ( // Mostrar carga de permisos
                  <div className="flex items-center justify-center h-64">
                    <p className="text-muted-foreground">Cargando permisos...</p>
                  </div>
                ) : (
                  <>
                    <DocumentEditor 
                      ref={editorRef}
                      key={activeDocument.id}
                      content={activeDocument.content} 
                      onUpdate={handleContentChange}
                      documentTitle={activeDocument.title}
                      documentId={activeDocument.id}
                      readOnly={
                        documentPermission === 'view' ||
                        (userRole === 'normal' && !canCreateDocuments)
                      }
                    />

                    {/* Overlay para sugerencia de Copilot */}
                    {pendingAISuggestion && copilotInlineStyles.position && (
                      <div 
                        className="copilot-suggestion-overlay absolute z-10 max-w-lg bg-background border border-primary/30 rounded-lg shadow-lg p-4"
                        style={{
                          top: copilotInlineStyles.position.top,
                          left: copilotInlineStyles.position.left,
                        }}
                      >
                      </div>
                    )}
                  </>
                )}
                {userRole === 'normal' && !canCreateDocuments && (
                  <div className="absolute inset-0 bg-white/70 dark:bg-black/60 flex items-center justify-center z-20">
                    <div className="text-center">
                      <p className="text-lg font-medium text-muted-foreground">No tienes permisos para crear documentos</p>
                      <p className="text-sm text-muted-foreground mt-1">Contacta a tu administrador para obtener acceso</p>
                    </div>
                  </div>
                )}
              </Card>

              <ShareDialog
                open={shareDialogOpen}
                onOpenChange={setShareDialogOpen}
                documentId={activeDocument.id}
                documentTitle={activeDocument.title}
                documentPermission={documentPermission}
                documentCategoryId={activeDocument.categoryId}
                sharedUsers={sharedUsers}
                onShareSuccess={() => {
                  fetchSharedUsers(activeDocument.id);
                }}
                userRole={userRole}
                myDocuments={myDocuments}
                allCategories={allCategories}
                allAreas={allAreas}
                onMassShare={async (data) => {
                  await handleMassShare(data);
                }}
                onRefreshData={refreshMassShareData}
              />

            {/* SUGERENCIA DE IA TIPO COPILOT - Actualizada */}
            {pendingAISuggestion && (
              <div className="fixed bottom-28 right-6 z-50 max-w-md w-full bg-white dark:bg-zinc-900 border border-primary/30 rounded-xl shadow-lg p-4 animate-fade-in">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      {pendingAISuggestion.diffType === 'add' && '➕ Agregar texto'}
                      {pendingAISuggestion.diffType === 'remove' && '🗑️ Eliminar texto'}
                      {pendingAISuggestion.diffType === 'replace' && '✏️ Reemplazar texto'}
                    </span>
                  </div>
                  
                  {/* Mostrar texto original si hay selección */}
                  {pendingAISuggestion.hasSelection && pendingAISuggestion.originalText && (
                    <div className="text-sm">
                      <span className="text-xs text-muted-foreground">Original:</span>
                      <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs mt-1">
                        {pendingAISuggestion.originalText}
                      </div>
                    </div>
                  )}
                  
                  {/* Mostrar sugerencia */}
                  <div className="text-sm">
                    <span className="text-xs text-muted-foreground">
                      {pendingAISuggestion.diffType === 'remove' ? 'Eliminar:' : 'Sugerencia:'}
                    </span>
                    <div
                      className={`
                        p-3 rounded mt-1 text-sm font-medium
                        ${pendingAISuggestion.diffType === 'add' ? 'bg-green-100 text-green-900 border border-green-200' : ''}
                        ${pendingAISuggestion.diffType === 'remove' ? 'bg-red-100 text-red-900 border border-red-200 line-through' : ''}
                        ${pendingAISuggestion.diffType === 'replace' ? 'bg-yellow-100 text-yellow-900 border border-yellow-200' : ''}
                      `}
                    >
                      {pendingAISuggestion.diffType === 'remove' 
                        ? pendingAISuggestion.originalText || pendingAISuggestion.text
                        : pendingAISuggestion.text
                      }
                    </div>
                  </div>
                  
                  {/* Botones de acción */}
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      size="sm"
                      variant="default"
                      className="flex-1"
                      onClick={acceptAISuggestion}
                    >
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="mr-1">
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                      Mantener
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={rejectAISuggestion}
                    >
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="mr-1">
                        <path d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Deshacer
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Botón flotante para abrir el chat IA */}
            <Button
              className="fixed bottom-6 right-6 z-50 rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90"
              size="icon"
              style={{ width: 56, height: 56 }}
              onClick={() => setShowAIGPT41NanoChat(true)}
              title="Abrir chat IA (AIGPT41Nano)"
            >
              <Bot className="h-7 w-7" />
            </Button>
            {/* Chat IA AIGPT41Nano */}
            <AIGPT41NanoChat 
              open={showAIGPT41NanoChat} 
              onClose={() => setShowAIGPT41NanoChat(false)} 
              onInsertText={handleInsertFromAIGPT41Nano} 
              onSendEditorRequest={handleEditorModeRequest}
              isEditorProcessing={isEditorProcessing}
              editorRef={editorRef}
            />
          </SidebarInset>
        </div>        </SidebarProvider>
      </main>

      {/* Estilos globales para Copilot */}
      <style>{`
        .copilot-suggestion-accepted {
          background-color: rgba(74, 222, 128, 0.2);
          animation: highlight-fade 2s forwards;
        }
        @keyframes highlight-fade {
          0% { background-color: rgba(74, 222, 128, 0.2); }
          100% { background-color: transparent; }
        }
        .copilot-suggestion-overlay {
          animation: slide-in 0.2s ease-out;
        }
        @keyframes slide-in {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      </div>
    </div>
);
}
