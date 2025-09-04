import React, { useState, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { History, ChevronDown, RotateCcw, Clock, User, Edit2, Check, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import './version-selector.css';

interface DocumentVersion {
  id: string;
  version: number;
  title: string;
  content?: string; // Agregar el campo content
  changeNote: string | null;
  createdBy: string;
  createdAt: string;
}

interface VersionSelectorProps {
  documentId: string;
  currentVersion?: number;
  onVersionSelect: (version: DocumentVersion) => void;
  onVersionRestore: (version: number) => void;
  onVersionChange?: (newVersion: number) => void; // Nueva prop para notificar cambios de versión
}

export interface VersionSelectorRef {
  refreshVersions: () => void;
}

const VersionSelector = forwardRef<VersionSelectorRef, VersionSelectorProps>(({
  documentId,
  currentVersion,
  onVersionSelect,
  onVersionRestore,
  onVersionChange
}, ref) => {
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [editingVersion, setEditingVersion] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState('');
  const { getToken } = useAuth();
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

  const fetchVersions = useCallback(async () => {
    if (!documentId) return;
    
    setLoading(true);
    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/api/users/documents/${documentId}/versions`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (response.ok) {
        const data = await response.json();
        setVersions(data);
        
        // Notificar la versión más alta al componente padre
        if (data.length > 0 && onVersionChange) {
          const latestVersion = Math.max(...data.map((v: DocumentVersion) => v.version));
          onVersionChange(latestVersion);
        }
      } else {
        throw new Error('Error al cargar versiones');
      }
    } catch (error) {
      console.error('Error fetching versions:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las versiones del documento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [documentId, getToken, API_BASE_URL, onVersionChange]);

  useEffect(() => {
    if (isOpen) {
      fetchVersions();
    }
  }, [isOpen, fetchVersions]);

  // Refrescar versiones cuando cambie el documentId
  useEffect(() => {
    if (documentId) {
      fetchVersions();
    }
  }, [documentId, fetchVersions]);

  const handleVersionSelect = async (version: DocumentVersion) => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/api/users/documents/${documentId}/versions/${version.version}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (response.ok) {
        const fullVersion = await response.json();
        onVersionSelect(fullVersion);
        setIsOpen(false);
      } else {
        console.error('API response error:', response.status, response.statusText);
        throw new Error('Error al cargar la versión');
      }
    } catch (error) {
      console.error('Error loading version:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar la versión seleccionada",
        variant: "destructive",
      });
    }
  };

  const handleVersionRestore = async (version: number) => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/api/users/documents/${documentId}/versions/${version}/restore`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (response.ok) {
        onVersionRestore(version);
        setIsOpen(false);
        toast({
          title: "Versión restaurada",
          description: `Se ha restaurado la versión ${version} del documento`,
        });
        // Refrescar las versiones después de restaurar
        setTimeout(() => {
          fetchVersions();
        }, 500);
      } else {
        throw new Error('Error al restaurar la versión');
      }
    } catch (error) {
      console.error('Error restoring version:', error);
      toast({
        title: "Error",
        description: "No se pudo restaurar la versión seleccionada",
        variant: "destructive",
      });
    }
  };

  const handleEditNote = (versionId: string, currentNote: string | null) => {
    setEditingVersion(versionId);
    setEditingNote(currentNote || '');
  };

  const handleSaveNote = async (versionId: string, version: number) => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/api/users/documents/versions/${versionId}/note`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          changeNote: editingNote.trim() || null
        }),
      });

      if (response.ok) {
        // Actualizar la versión en el estado local
        setVersions(prev => prev.map(v => 
          v.id === versionId 
            ? { ...v, changeNote: editingNote.trim() || null }
            : v
        ));
        
        setEditingVersion(null);
        setEditingNote('');
        
        toast({
          title: "Nota actualizada",
          description: "La nota de cambio se ha actualizado correctamente",
        });
      } else {
        throw new Error('Error al actualizar la nota');
      }
    } catch (error) {
      console.error('Error updating note:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la nota de cambio",
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingVersion(null);
    setEditingNote('');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getLatestVersion = () => {
    return versions.length > 0 ? Math.max(...versions.map(v => v.version)) : 1;
  };

  // Exponer funciones al componente padre
  useImperativeHandle(ref, () => ({
    refreshVersions: fetchVersions
  }), [fetchVersions]);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-2"
          disabled={!documentId}
        >
          <History className="h-4 w-4" />
          <span className="hidden sm:inline">
            Versión {currentVersion || getLatestVersion()}
          </span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center gap-2">
          <History className="h-4 w-4" />
          Historial de versiones
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {loading ? (
          <DropdownMenuLabel className="text-center text-muted-foreground">
            Cargando versiones...
          </DropdownMenuLabel>
        ) : versions.length === 0 ? (
          <DropdownMenuLabel className="text-center text-muted-foreground">
            No hay versiones disponibles
          </DropdownMenuLabel>
        ) : (
          <div className="version-selector-scroll">
            {versions.map((version) => (
            <div key={version.id} className="group">
              <DropdownMenuItem
                className="flex-col items-start p-3 cursor-pointer"
                onClick={() => editingVersion !== version.id ? handleVersionSelect(version) : undefined}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="font-medium">Versión {version.version}</span>
                  <div className="flex items-center gap-1">
                    {version.version === getLatestVersion() && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                        Actual
                      </span>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVersionRestore(version.version);
                      }}
                      title={`Restaurar versión ${version.version}`}
                    >
                      <RotateCcw className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                <div className="text-sm text-muted-foreground w-full">
                  <div className="flex items-center gap-1 mb-1">
                    <Clock className="h-3 w-3" />
                    {formatDate(version.createdAt)}
                  </div>
                  
                  {editingVersion === version.id ? (
                    <div className="mt-2 space-y-2">
                      <Input
                        value={editingNote}
                        onChange={(e) => setEditingNote(e.target.value)}
                        placeholder="Agregar nota de cambio..."
                        className="h-8 text-xs"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSaveNote(version.id, version.version);
                          } else if (e.key === 'Escape') {
                            handleCancelEdit();
                          }
                        }}
                        autoFocus
                      />
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSaveNote(version.id, version.version);
                          }}
                          title="Guardar nota"
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancelEdit();
                          }}
                          title="Cancelar"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between group/note">
                      <div className="text-xs italic flex-1">
                        {version.changeNote ? `"${version.changeNote}"` : (
                          <span className="text-muted-foreground">Sin nota de cambio</span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover/note:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditNote(version.id, version.changeNote);
                        }}
                        title="Editar nota"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </DropdownMenuItem>
              {version.version !== versions[versions.length - 1]?.version && (
                <DropdownMenuSeparator />
              )}
            </div>
          ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

VersionSelector.displayName = 'VersionSelector';

export default VersionSelector;