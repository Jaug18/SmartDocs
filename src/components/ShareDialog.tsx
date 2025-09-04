import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, Users, FileText, FolderOpen, Building } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface SharedUser {
  email: string;
  permission: 'view' | 'edit';
  id?: string;
  firstName?: string;
  lastName?: string;
}

interface Document {
  id: string;
  title: string;
  categoryId?: string | null;
}

interface Category {
  id: string;
  name: string;
  parentId?: string | null;
}

interface Area {
  id: string;
  name: string;
}

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  documentTitle: string;
  documentPermission: 'owner' | 'edit' | 'view';
  documentCategoryId?: string | null;
  sharedUsers: SharedUser[];
  onShareSuccess: () => void;
  userRole?: 'superuser' | 'admin' | 'normal';
  // Props para compartir masivo
  myDocuments?: Document[];
  allCategories?: Category[];
  allAreas?: Area[];
  onMassShare?: (data: {
    documentIds: string[];
    categoryIds: string[];
    areas: string[];
    permission: 'view' | 'edit';
    shareAll: boolean;
  }) => Promise<void>;
  // Callbacks para actualizar datos
  onRefreshData?: () => void;
}

export function ShareDialog({
  open,
  onOpenChange,
  documentId,
  documentTitle,
  documentPermission,
  documentCategoryId,
  sharedUsers,
  onShareSuccess,
  userRole = 'normal',
  myDocuments = [],
  allCategories = [],
  allAreas = [],
  onMassShare,
  onRefreshData
}: ShareDialogProps) {
  const [shareEmail, setShareEmail] = useState('');
  const [sharePermission, setSharePermission] = useState<'view' | 'edit'>('view');
  const [loading, setLoading] = useState(false);
  
  // Estados para compartir masivo
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [massPermission, setMassPermission] = useState<'view' | 'edit'>('view');
  const [shareWithAllAreas, setShareWithAllAreas] = useState(false);
  const [activeTab, setActiveTab] = useState('individual');

  const { getToken } = useAuth();
  const isOwner = documentPermission === 'owner';
  const canUseMassShare = userRole === 'admin' || userRole === 'superuser';

  // Función auxiliar para verificar si el documento actual fue afectado por el compartir masivo
  const checkIfCurrentDocumentWasAffected = () => {
    // 1. Verificar si el documento actual está directamente seleccionado
    if (selectedDocuments.includes(documentId)) {
      return true;
    }

    // 2. Si el documento no tiene categoría (está en la raíz), solo se ve afectado si está directamente seleccionado
    if (!documentCategoryId) {
      return false;
    }

    // 3. Verificar si el documento actual está en alguna de las categorías seleccionadas
    if (selectedCategories.includes(documentCategoryId)) {
      return true;
    }

    // 4. Verificar si el documento actual está en una subcategoría de las categorías seleccionadas
    // (necesario para carpetas anidadas)
    for (const selectedCategoryId of selectedCategories) {
      if (isDocumentInCategoryTree(documentCategoryId, selectedCategoryId)) {
        return true;
      }
    }

    return false;
  };

  // Función auxiliar para verificar si una categoría es descendiente de otra
  const isDocumentInCategoryTree = (docCategoryId: string, selectedCategoryId: string): boolean => {
    if (docCategoryId === selectedCategoryId) {
      return true;
    }

    // Buscar la categoría del documento en allCategories
    const docCategory = allCategories.find(cat => cat.id === docCategoryId);
    if (!docCategory || !docCategory.parentId) {
      return false;
    }

    // Verificar recursivamente en el árbol de categorías padre
    return isDocumentInCategoryTree(docCategory.parentId, selectedCategoryId);
  };

  // Refrescar datos cuando se abre el diálogo
  useEffect(() => {
    if (open && onRefreshData) {
      onRefreshData();
    }
  }, [open, onRefreshData]);

  // Función para limpiar selecciones cuando se cierra el diálogo
  useEffect(() => {
    if (!open) {
      setSelectedDocuments([]);
      setSelectedCategories([]);
      setSelectedAreas([]);
      setShareWithAllAreas(false);
      setMassPermission('view');
      setActiveTab('individual');
    }
  }, [open]);

  const handleAddShare = async () => {
    if (!shareEmail.trim()) return;
    try {
      setLoading(true);
      const token = await getToken();
      const res = await fetch(`/api/users/documents/${documentId}/share`, {
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
      onShareSuccess();
    } catch (error) {
      toast({
        title: "Error al compartir",
        description: "No se pudo compartir el documento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveShare = async (userId: string) => {
    try {
      setLoading(true);
      const token = await getToken();
      const res = await fetch(`/api/users/documents/${documentId}/share/${userId}`, {
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
      onShareSuccess();
    } catch (error) {
      toast({
        title: "Error al revocar acceso",
        description: "No se pudo revocar el acceso",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMassShare = async () => {
    if (selectedDocuments.length === 0 && selectedCategories.length === 0) {
      toast({
        title: "Selección incompleta",
        description: "Debes seleccionar al menos un documento o carpeta",
        variant: "destructive",
      });
      return;
    }

    if (!shareWithAllAreas && selectedAreas.length === 0) {
      toast({
        title: "Selección incompleta", 
        description: "Debes seleccionar al menos un área de destino o marcar 'Compartir con todas las áreas'",
        variant: "destructive",
      });
      return;
    }

    if (onMassShare) {
      try {
        setLoading(true);
        await onMassShare({
          documentIds: selectedDocuments,
          categoryIds: selectedCategories,
          areas: selectedAreas,
          permission: massPermission,
          shareAll: shareWithAllAreas
        });
        
        // Verificar si el documento actual fue afectado por el compartir masivo
        const wasCurrentDocumentAffected = checkIfCurrentDocumentWasAffected();
        if (wasCurrentDocumentAffected) {
          onShareSuccess();
        }
        
        // Limpiar selecciones después del éxito
        setSelectedDocuments([]);
        setSelectedCategories([]);
        setSelectedAreas([]);
        setShareWithAllAreas(false);
        setMassPermission('view');
      } catch (error) {
        // El error ya se maneja en onMassShare
      } finally {
        setLoading(false);
      }
    }
  };

  const toggleDocumentSelection = (docId: string) => {
    setSelectedDocuments(prev => 
      prev.includes(docId) 
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
  };

  const toggleCategorySelection = (catId: string) => {
    setSelectedCategories(prev => 
      prev.includes(catId) 
        ? prev.filter(id => id !== catId)
        : [...prev, catId]
    );
  };

  const toggleAreaSelection = (areaId: string) => {
    setSelectedAreas(prev => 
      prev.includes(areaId) 
        ? prev.filter(id => id !== areaId)
        : [...prev, areaId]
    );
  };

  const selectAllDocuments = () => {
    if (selectedDocuments.length === myDocuments.length) {
      setSelectedDocuments([]);
    } else {
      setSelectedDocuments(myDocuments.map(doc => doc.id));
    }
  };

  const selectAllCategories = () => {
    if (selectedCategories.length === allCategories.length) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories(allCategories.map(cat => cat.id));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[95vw] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Compartir "{documentTitle}"</DialogTitle>
          <DialogDescription>
            {isOwner 
              ? "Comparte este documento con otros usuarios o gestiona el acceso masivo."
              : "No puedes compartir este documento porque no eres el propietario."}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 overflow-hidden">
          <TabsList className={`grid w-full mb-3 flex-shrink-0 ${canUseMassShare ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <TabsTrigger value="individual" className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Compartir individual</span>
              <span className="sm:hidden">Individual</span>
            </TabsTrigger>
            {canUseMassShare && (
              <TabsTrigger value="mass" className="flex items-center gap-2 text-sm">
                <Building className="w-4 h-4" />
                <span className="hidden sm:inline">Compartir masivo</span>
                <span className="sm:hidden">Masivo</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="individual" className="space-y-4 flex-1 overflow-y-auto">
            {isOwner ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Agregar usuario</CardTitle>
                    <CardDescription>
                      Comparte este documento con un usuario específico por correo electrónico
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-3">
                      <Input
                        placeholder="correo@ejemplo.com"
                        value={shareEmail}
                        onChange={e => setShareEmail(e.target.value)}
                        className="flex-1"
                      />
                      <Select value={sharePermission} onValueChange={v => setSharePermission(v as 'view' | 'edit')}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="view">Solo ver</SelectItem>
                          <SelectItem value="edit">Puede editar</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button onClick={handleAddShare} disabled={loading || !shareEmail.trim()}>
                        {loading ? "Agregando..." : "Agregar"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Usuarios con acceso</CardTitle>
                    <CardDescription>
                      Lista de usuarios que tienen acceso a este documento
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {sharedUsers.length === 0 ? (
                        <p className="text-muted-foreground text-sm py-4 text-center">
                          Este documento no ha sido compartido con nadie aún
                        </p>
                      ) : (
                        sharedUsers.map(user => (
                          <div key={user.id || user.email} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <Users className="w-4 h-4 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">{user.email}</p>
                                {(user.firstName || user.lastName) && (
                                  <p className="text-sm text-muted-foreground">
                                    {user.firstName} {user.lastName}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={user.permission === 'edit' ? 'default' : 'secondary'}>
                                {user.permission === 'edit' ? 'Puede editar' : 'Solo ver'}
                              </Badge>
                              {user.id && (
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  onClick={() => handleRemoveShare(user.id!)}
                                  disabled={loading}
                                >
                                  Quitar
                                </Button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg text-yellow-700 dark:text-yellow-400 text-sm flex items-center gap-3">
                    <Circle className="w-5 h-5" />
                    <div>
                      <p className="font-medium">Acceso restringido</p>
                      <p>Solo el propietario del documento puede compartirlo con otros usuarios.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="mass" className="flex-1 overflow-hidden">
            {canUseMassShare ? (
              <>
                {/* Layout responsive de 3 pasos */}
                <div className="flex flex-col lg:flex-row gap-3 h-full overflow-hidden">
                {/* Paso 1: Seleccionar contenido */}
                <Card className="flex flex-col h-auto lg:h-full flex-1 lg:w-1/3 min-w-0">
                  <CardHeader className="pb-2 flex-shrink-0">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-semibold">1</span>
                      Contenido
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Selecciona documentos y carpetas
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col flex-1 space-y-3 overflow-hidden p-3">
                    {/* Documentos */}
                    <div className="flex flex-col min-h-0">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="flex items-center gap-1 text-xs font-medium">
                          <FileText className="w-3 h-3" />
                          Documentos ({selectedDocuments.length})
                        </Label>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={selectAllDocuments}
                          className="h-6 px-2 text-xs"
                        >
                          {selectedDocuments.length === myDocuments.length ? 'Ninguno' : 'Todos'}
                        </Button>
                      </div>
                      <div className="overflow-y-auto border rounded-md p-2 bg-muted/30 max-h-[120px] lg:max-h-[100px]">
                        <div className="space-y-1">
                          {myDocuments.map(doc => (
                            <label key={doc.id} className="flex items-center gap-2 p-2 hover:bg-background/80 rounded cursor-pointer transition-colors group">
                              <div onClick={() => toggleDocumentSelection(doc.id)}>
                                {selectedDocuments.includes(doc.id) ? (
                                  <CheckCircle className="w-4 h-4 text-primary" />
                                ) : (
                                  <Circle className="w-4 h-4 text-muted-foreground group-hover:text-primary/60" />
                                )}
                              </div>
                              <span className="text-xs flex-1 font-medium truncate" onClick={() => toggleDocumentSelection(doc.id)} title={doc.title}>
                                {doc.title}
                              </span>
                            </label>
                          ))}
                          {myDocuments.length === 0 && (
                            <p className="text-muted-foreground text-xs py-4 text-center">
                              No hay documentos
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Carpetas */}
                    <div className="flex flex-col min-h-0">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="flex items-center gap-1 text-xs font-medium">
                          <FolderOpen className="w-3 h-3" />
                          Carpetas ({selectedCategories.length})
                        </Label>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={selectAllCategories}
                          className="h-6 px-2 text-xs"
                        >
                          {selectedCategories.length === allCategories.length ? 'Ninguna' : 'Todas'}
                        </Button>
                      </div>
                      <div className="overflow-y-auto border rounded-md p-2 bg-muted/30 max-h-[120px] lg:max-h-[100px]">
                        <div className="space-y-1">
                          {allCategories.map(cat => (
                            <label key={cat.id} className="flex items-center gap-2 p-2 hover:bg-background/80 rounded cursor-pointer transition-colors group">
                              <div onClick={() => toggleCategorySelection(cat.id)}>
                                {selectedCategories.includes(cat.id) ? (
                                  <CheckCircle className="w-4 h-4 text-primary" />
                                ) : (
                                  <Circle className="w-4 h-4 text-muted-foreground group-hover:text-primary/60" />
                                )}
                              </div>
                              <span className="text-xs flex-1 font-medium truncate" onClick={() => toggleCategorySelection(cat.id)} title={cat.name}>
                                {cat.name}
                              </span>
                            </label>
                          ))}
                          {allCategories.length === 0 && (
                            <p className="text-muted-foreground text-xs py-4 text-center">
                              No hay carpetas
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Paso 2: Seleccionar áreas */}
                <Card className="flex flex-col h-auto lg:h-full flex-1 lg:w-1/3 min-w-0">
                  <CardHeader className="pb-2 flex-shrink-0">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-semibold">2</span>
                      Áreas
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Define el alcance de la compartición
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col flex-1 space-y-3 overflow-hidden p-3">
                    {/* Opción "Todas las áreas" */}
                    <div className="flex flex-col min-h-0">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="flex items-center gap-1 text-xs font-medium">
                          <Building className="w-3 h-3" />
                          Alcance global
                        </Label>
                      </div>
                      <div className="overflow-y-auto border rounded-md p-2 bg-muted/30 max-h-[120px] lg:max-h-[100px]">
                        <div 
                          className="flex items-center gap-2 p-2 hover:bg-background/80 rounded cursor-pointer transition-colors" 
                          onClick={() => setShareWithAllAreas(!shareWithAllAreas)}
                        >
                          <div>
                            {shareWithAllAreas ? (
                              <CheckCircle className="w-4 h-4 text-primary" />
                            ) : (
                              <Circle className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-xs">Todas las áreas</p>
                            <p className="text-xs text-muted-foreground">
                              Compartir con toda la organización
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Áreas específicas */}
                    <div className="flex flex-col min-h-0">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="flex items-center gap-1 text-xs font-medium">
                          <Building className="w-3 h-3" />
                          Áreas específicas ({selectedAreas.length})
                        </Label>
                      </div>
                      <div className={`overflow-y-auto border rounded-md p-2 bg-muted/30 max-h-[120px] lg:max-h-[100px] transition-all duration-200 ${
                        shareWithAllAreas ? 'opacity-40 pointer-events-none' : 'opacity-100'
                      }`}>
                        <div className="space-y-1">
                          {allAreas.map(area => (
                            <label key={area.id} className="flex items-center gap-2 p-2 hover:bg-background/80 rounded cursor-pointer transition-colors group">
                              <div onClick={() => !shareWithAllAreas && toggleAreaSelection(area.id)}>
                                {selectedAreas.includes(area.id) && !shareWithAllAreas ? (
                                  <CheckCircle className="w-4 h-4 text-primary" />
                                ) : (
                                  <Circle className="w-4 h-4 text-muted-foreground group-hover:text-primary/60" />
                                )}
                              </div>
                              <span className="text-xs flex-1 font-medium truncate" onClick={() => !shareWithAllAreas && toggleAreaSelection(area.id)} title={area.name}>
                                {area.name}
                              </span>
                            </label>
                          ))}
                          {allAreas.length === 0 && (
                            <p className="text-muted-foreground text-xs py-4 text-center">
                              No hay áreas específicas
                            </p>
                          )}
                        </div>
                      </div>
                      {shareWithAllAreas && (
                        <p className="text-xs text-muted-foreground mt-2 text-center">
                          Deshabilitado cuando se selecciona "Todas las áreas"
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Paso 3: Configurar permisos */}
                <Card className="flex flex-col h-auto lg:h-full flex-1 lg:w-1/3 min-w-0">
                  <CardHeader className="pb-2 flex-shrink-0">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-semibold">3</span>
                      Permisos
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Configura el nivel de acceso
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col flex-1 p-3">
                    <div className="space-y-4 flex flex-col h-full">
                      <div>
                        <Label className="text-xs font-medium mb-2 block">Nivel de acceso</Label>
                        <Select value={massPermission} onValueChange={v => setMassPermission(v as 'view' | 'edit')}>
                          <SelectTrigger className="w-full h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="w-full min-w-[240px]">
                            <SelectItem value="view" className="py-2">
                              <div className="flex flex-col items-start gap-0.5">
                                <span className="font-medium text-xs">Solo ver</span>
                                <span className="text-xs text-muted-foreground">
                                  Solo lectura
                                </span>
                              </div>
                            </SelectItem>
                            <SelectItem value="edit" className="py-2">
                              <div className="flex flex-col items-start gap-0.5">
                                <span className="font-medium text-xs">Puede editar</span>
                                <span className="text-xs text-muted-foreground">
                                  Acceso completo
                                </span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Resumen compacto */}
                      <div className="flex-1 border-t pt-3">
                        <div className="p-3 bg-muted/40 border rounded-lg space-y-2 h-full overflow-y-auto min-h-[200px] lg:min-h-[150px]">
                          <p className="text-xs font-semibold text-primary mb-2">Resumen:</p>
                          
                          <div className="grid grid-cols-1 gap-1.5 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1">
                                <FileText className="w-3 h-3" />
                                Docs:
                              </span>
                              <Badge variant="outline" className="text-xs h-5 px-2">
                                {selectedDocuments.length}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1">
                                <FolderOpen className="w-3 h-3" />
                                Carpetas:
                              </span>
                              <Badge variant="outline" className="text-xs h-5 px-2">
                                {selectedCategories.length}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1">
                                <Building className="w-3 h-3" />
                                Alcance:
                              </span>
                              <Badge variant="outline" className="text-xs h-5 px-2">
                                {shareWithAllAreas ? 'Global' : selectedAreas.length}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                Tipo:
                              </span>
                              <Badge variant={massPermission === 'edit' ? 'default' : 'secondary'} className="text-xs h-5 px-2">
                                {massPermission === 'edit' ? 'Editar' : 'Ver'}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="mt-3 pt-2 border-t">
                            {(selectedDocuments.length > 0 || selectedCategories.length > 0) && 
                             (shareWithAllAreas || selectedAreas.length > 0) ? (
                              <div className="space-y-2">
                                <div className="flex items-center gap-1 text-green-700 dark:text-green-400">
                                  <CheckCircle className="w-3 h-3" />
                                  <span className="text-xs font-medium">Listo para compartir</span>
                                </div>
                                <Button 
                                  onClick={handleMassShare} 
                                  disabled={loading}
                                  className="w-full text-xs h-8"
                                >
                                  {loading ? "Compartiendo..." : "Compartir"}
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-orange-700 dark:text-orange-400">
                                <Circle className="w-3 h-3" />
                                <span className="text-xs font-medium">
                                  {selectedDocuments.length === 0 && selectedCategories.length === 0 
                                    ? 'Selecciona contenido'
                                    : 'Selecciona destino'}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              </>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg text-yellow-700 dark:text-yellow-400 text-sm flex items-center gap-3">
                    <Circle className="w-5 h-5" />
                    <div>
                      <p className="font-medium">Función no disponible</p>
                      <p>Solo los administradores pueden usar la función de compartir masivo.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            </TabsContent>
        </Tabs>
        
        <DialogFooter className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t bg-background flex-shrink-0">
          <div className="text-xs text-muted-foreground order-2 sm:order-1">
            {activeTab === 'mass' ? `Pestaña: ${activeTab} | Admin: ${canUseMassShare}` : 'Pestaña individual'}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 order-1 sm:order-2">
            {activeTab === 'mass' && (
              <Button 
                onClick={handleMassShare} 
                disabled={loading || (selectedDocuments.length === 0 && selectedCategories.length === 0) || (!shareWithAllAreas && selectedAreas.length === 0)}
                className="flex items-center gap-2 text-sm"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Compartiendo...
                  </>
                ) : (
                  <>
                    <Users className="w-4 h-4" />
                    Compartir seleccionados
                  </>
                )}
              </Button>
            )}
            <Button variant="outline" onClick={() => onOpenChange(false)} className="text-sm">
              Cerrar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}