import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '../hooks/useAuth';
import { Users, Building, Shield, UserPlus, Settings, Trash2 } from 'lucide-react';
import { UserMenu } from "@/components/UserMenu";
import { ThemeToggle } from '@/components/theme/ThemeToggle';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  areaId?: string;
  isLeader: boolean;
  area?: { name: string };
}

interface Area {
  id: string;
  name: string;
  description?: string;
  _count: { users: number };
}

export default function AdminDashboard() {
  const { getToken, user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<string>('normal');
  const [currentUserAreaId, setCurrentUserAreaId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Estados para formularios
  const [newAreaName, setNewAreaName] = useState('');
  const [newAreaDescription, setNewAreaDescription] = useState('');
  const [selectedUserEmail, setSelectedUserEmail] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedRole, setSelectedRole] = useState('normal');
  const [isLeader, setIsLeader] = useState(false);

  // Estados para modal de confirmación
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteType, setDeleteType] = useState<'user' | 'area' | 'removeFromArea'>('user');
  const [itemToDelete, setItemToDelete] = useState<User | Area | null>(null);

  // Estados para edición/eliminación de usuarios y áreas
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editArea, setEditArea] = useState<Area | null>(null);
  const [editUserDialogOpen, setEditUserDialogOpen] = useState(false);
  const [editAreaDialogOpen, setEditAreaDialogOpen] = useState(false);

  // Estados para edición de usuario
  const [editUserFirstName, setEditUserFirstName] = useState('');
  const [editUserLastName, setEditUserLastName] = useState('');
  const [editUserRole, setEditUserRole] = useState('normal');
  const [editUserIsLeader, setEditUserIsLeader] = useState(false);
  const [editUserAreaId, setEditUserAreaId] = useState('');
  const [editUserDialogTab, setEditUserDialogTab] = useState(0);

  // Estados para edición de área
  const [editAreaName, setEditAreaName] = useState('');
  const [editAreaDescription, setEditAreaDescription] = useState('');

  // Nuevo: Estado para controlar el área seleccionada para gestión de usuarios
  const [areaUsersDialogOpen, setAreaUsersDialogOpen] = useState(false);
  const [areaUsers, setAreaUsers] = useState<User[]>([]);
  const [selectedAreaForUsers, setSelectedAreaForUsers] = useState<Area | null>(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const token = await getToken();
    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line
  }, [currentUser?.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersRes, areasRes] = await Promise.all([
        fetchWithAuth(`${API_BASE_URL}/api/admin/users`),
        fetchWithAuth(`${API_BASE_URL}/api/admin/areas`)
      ]);

      let usersData = [];
      let areasData = [];

      let myRole = currentUserRole;
      let myAreaId = currentUserAreaId;

      if (usersRes.ok) {
        usersData = await usersRes.json();
        // Determinar el rol y área del usuario actual usando el email real (case-insensitive)
        if (currentUser?.email) {
          const myEmail = currentUser.email.trim().toLowerCase();
          const currentUserData = usersData.find(
            (u: User) => u.email.trim().toLowerCase() === myEmail
          );
          if (currentUserData) {
            myRole = currentUserData.role;
            myAreaId = currentUserData.areaId || null;
            setCurrentUserRole(myRole);
            setCurrentUserAreaId(myAreaId);
          } else {
            setCurrentUserRole('notfound');
            setCurrentUserAreaId(null);
          }
        }
      }

      if (areasRes.ok) {
        areasData = await areasRes.json();
      }

      // Mostrar solo su área si es admin, pero mostrar todos los usuarios
      if (myRole === 'admin' && myAreaId) {
        setAreas(areasData.filter((a: Area) => a.id === myAreaId));
        setUsers(usersData); // Mostrar todos los usuarios
      } else {
        setAreas(areasData);
        setUsers(usersData);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createArea = async () => {
    if (!newAreaName.trim()) return;

    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/api/admin/areas`, {
        method: 'POST',
        body: JSON.stringify({
          name: newAreaName,
          description: newAreaDescription
        })
      });

      if (res.ok) {
        const newArea = await res.json();
        toast({ title: "Área creada", description: `Se creó el área "${newAreaName}"` });
        setNewAreaName('');
        setNewAreaDescription('');
        // Actualizar estado local en lugar de recargar
        setAreas(prev => [...prev, { ...newArea, _count: { users: 0 } }]);
      } else {
        const error = await res.json();
        toast({
          title: "Error",
          description: error.error || "No se pudo crear el área",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error de conexión",
        variant: "destructive",
      });
    }
  };

  const assignUserRole = async () => {
    if (!selectedUserEmail || !selectedArea || !selectedRole) return;

    try {
      // Si eres admin (no superuser), solo puedes asignar usuarios a tu área y solo como normal
      if (currentUserRole === 'admin') {
        // Solo puedes asignar usuarios a tu área y como normal
        if (selectedArea !== currentUserAreaId) {
          toast({
            title: "Acción no permitida",
            description: "Solo puedes asignar usuarios a tu propia área.",
            variant: "destructive",
          });
          return;
        }
        if (selectedRole !== 'normal') {
          toast({
            title: "Acción no permitida",
            description: "Solo puedes asignar usuarios como 'normal'.",
            variant: "destructive",
          });
          return;
        }
      }

      // Usar endpoint correcto según el rol
      let res;
      if (currentUserRole === 'superuser') {
        res = await fetchWithAuth(`${API_BASE_URL}/api/admin/assign-role`, {
          method: 'POST',
          body: JSON.stringify({
            userEmail: selectedUserEmail,
            areaId: selectedArea,
            role: selectedRole,
            isLeader
          })
        });
      } else if (currentUserRole === 'admin') {
        res = await fetchWithAuth(`${API_BASE_URL}/api/admin/add-user-to-area`, {
          method: 'POST',
          body: JSON.stringify({
            userEmail: selectedUserEmail
          })
        });
      }

      if (res && res.ok) {
        toast({
          title: "Usuario asignado",
          description: `Se asignó a ${selectedUserEmail} como ${selectedRole}`
        });
        setSelectedUserEmail('');
        setSelectedArea('');
        setSelectedRole('normal');
        setIsLeader(false);
        
        // Actualizar estado local en lugar de recargar
        setUsers(prev => prev.map(u => {
          if (u.email === selectedUserEmail) {
            const previousAreaId = u.areaId;
            // Encontrar el nombre del área nueva
            const newAreaName = areas.find(a => a.id === selectedArea)?.name;
            const newUser = { 
              ...u, 
              areaId: selectedArea, 
              role: selectedRole, 
              isLeader,
              area: newAreaName ? { name: newAreaName } : undefined
            };
            
            // Actualizar contadores de áreas
            setAreas(prevAreas => prevAreas.map(area => {
              if (area.id === previousAreaId && previousAreaId !== selectedArea) {
                // Decrementar área anterior si cambió
                return { ...area, _count: { ...area._count, users: area._count.users - 1 } };
              } else if (area.id === selectedArea && previousAreaId !== selectedArea) {
                // Incrementar área nueva si cambió
                return { ...area, _count: { ...area._count, users: area._count.users + 1 } };
              }
              return area;
            }));
            
            return newUser;
          }
          return u;
        }));
      } else {
        const error = res ? await res.json() : { error: "No autorizado" };
        toast({
          title: "Error",
          description: error.error || "No se pudo asignar el usuario",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error de conexión",
        variant: "destructive",
      });
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'superuser': return 'bg-red-100 text-red-800';
      case 'admin': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const openEditUserDialog = (user: User) => {
    setEditUser(user);
    setEditUserFirstName(user.firstName || '');
    setEditUserLastName(user.lastName || '');
    setEditUserRole(user.role);
    setEditUserIsLeader(user.isLeader);
    setEditUserAreaId(user.areaId || '');
    setEditUserDialogTab(0);
    setEditUserDialogOpen(true);
  };

  const openEditAreaDialog = (area: Area) => {
    setEditArea(area);
    setEditAreaName(area.name);
    setEditAreaDescription(area.description || '');
    setEditAreaDialogOpen(true);
  };

  const handleSaveUser = async () => {
    if (!editUser) return;
    
    try {
      // Cada pestaña guarda solo su parte, sin requerir datos de las otras
      if (editUserDialogTab === 0) {
        // Guardar solo área y líder
        const res = await fetchWithAuth(`${API_BASE_URL}/api/admin/assign-role`, {
          method: 'POST',
          body: JSON.stringify({
            userEmail: editUser.email,
            areaId: editUserAreaId,
            role: editUser.role, // Mantener el rol actual
            isLeader: editUserIsLeader,
          }),
        });
        
        if (!res.ok) {
          const error = await res.json();
          toast({
            title: "Error",
            description: error.error || "No se pudo actualizar el usuario",
            variant: "destructive",
          });
          return;
        }
        toast({ title: "Usuario actualizado", description: `Se actualizó el área/líder de ${editUser.email}` });
        setEditUserDialogOpen(false);
        // Actualizar estado local en lugar de recargar
        const previousAreaId = editUser.areaId;
        const newAreaName = areas.find(a => a.id === editUserAreaId)?.name;
        setUsers(prev => prev.map(u => u.id === editUser.id ? { 
          ...u, 
          areaId: editUserAreaId, 
          isLeader: editUserIsLeader,
          area: newAreaName ? { name: newAreaName } : undefined
        } : u));
        
        // Actualizar contadores de áreas
        if (previousAreaId !== editUserAreaId) {
          setAreas(prev => prev.map(area => {
            if (area.id === previousAreaId) {
              // Decrementar área anterior
              return { ...area, _count: { ...area._count, users: area._count.users - 1 } };
            } else if (area.id === editUserAreaId) {
              // Incrementar área nueva
              return { ...area, _count: { ...area._count, users: area._count.users + 1 } };
            }
            return area;
          }));
        }
        return;
      } else if (editUserDialogTab === 1) {
        // Guardar solo el rol
        const res = await fetchWithAuth(`${API_BASE_URL}/api/admin/assign-role`, {
          method: 'POST',
          body: JSON.stringify({
            userEmail: editUser.email,
            areaId: editUser.areaId || null,
            role: editUserRole,
            isLeader: editUser.isLeader,
          }),
        });
        
        // Depurar respuesta
        const textResponse = await res.text();
        try {
          const jsonResponse = JSON.parse(textResponse);
          
          if (!res.ok) {
            toast({
              title: "Error",
              description: jsonResponse.error || "No se pudo actualizar el usuario",
              variant: "destructive",
            });
            return;
          }
          
          toast({ title: "Usuario actualizado", description: `Se actualizó el rol de ${editUser.email}` });
          setEditUserDialogOpen(false);
          // Actualizar estado local en lugar de recargar
          setUsers(prev => prev.map(u => u.id === editUser.id ? { ...u, role: editUserRole } : u));
          
        } catch (e) {
          toast({
            title: "Error",
            description: "Respuesta del servidor inválida",
            variant: "destructive",
          });
        }
        return;
      } else if (editUserDialogTab === 2) {
        // Guardar solo nombre y apellido
        const res = await fetchWithAuth(`${API_BASE_URL}/api/users/profile`, {
          method: 'PUT',
          body: JSON.stringify({
            firstName: editUserFirstName,
            lastName: editUserLastName,
          }),
        });
        if (!res.ok) {
          const error = await res.json();
          toast({
            title: "Error",
            description: error.error || "No se pudo actualizar el usuario",
            variant: "destructive",
          });
          return;
        }
        toast({ title: "Usuario actualizado", description: `Se actualizó el nombre de ${editUser.email}` });
        setEditUserDialogOpen(false);
        // Actualizar estado local en lugar de recargar
        setUsers(prev => prev.map(u => u.id === editUser.id ? { ...u, firstName: editUserFirstName, lastName: editUserLastName } : u));
        return;
      }
    } catch (error) {
      toast({ title: "Error", description: "No se pudo actualizar el usuario", variant: "destructive" });
    }
  };

  const handleDeleteUser = async () => {
    if (!editUser) return;
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/api/admin/users/${editUser.id}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const error = await res.json();
        toast({
          title: "Error",
          description: error.error || "No se pudo eliminar el usuario",
          variant: "destructive",
        });
        return;
      }
      toast({ title: "Usuario eliminado", description: `Se eliminó a ${editUser.email}` });
      setEditUserDialogOpen(false);
      // Actualizar estado local en lugar de recargar
      setUsers(prev => prev.filter(u => u.id !== editUser.id));
      // Actualizar contador de área si el usuario tenía área asignada
      if (editUser.areaId) {
        setAreas(prev => prev.map(area => 
          area.id === editUser.areaId 
            ? { ...area, _count: { ...area._count, users: area._count.users - 1 } }
            : area
        ));
      }
    } catch {
      toast({ title: "Error", description: "No se pudo eliminar el usuario", variant: "destructive" });
    }
  };

  const handleDeleteUserDirect = async (user: User) => {
    setItemToDelete(user);
    setDeleteType('user');
    setDeleteModalOpen(true);
  };

  const handleDeleteAreaConfirm = (area: Area) => {
    setItemToDelete(area);
    setDeleteType('area');
    setDeleteModalOpen(true);
  };

  const performDelete = async () => {
    if (!itemToDelete) return;

    try {
      if (deleteType === 'user') {
        const user = itemToDelete as User;
        const res = await fetchWithAuth(`${API_BASE_URL}/api/admin/users/${user.id}`, {
          method: 'DELETE'
        });
        if (!res.ok) {
          const error = await res.json();
          toast({
            title: "Error",
            description: error.error || "No se pudo eliminar el usuario",
            variant: "destructive",
          });
          return;
        }
        toast({ title: "Usuario eliminado", description: `Se eliminó a ${user.email}` });
        // Actualizar lista de usuarios localmente
        setUsers(prev => prev.filter(u => u.id !== user.id));
        // Actualizar contador de área si el usuario tenía área asignada
        if (user.areaId) {
          setAreas(prev => prev.map(area => 
            area.id === user.areaId 
              ? { ...area, _count: { ...area._count, users: area._count.users - 1 } }
              : area
          ));
        }
      } else if (deleteType === 'area') {
        const area = itemToDelete as Area;
        const res = await fetchWithAuth(`${API_BASE_URL}/api/admin/areas/${area.id}`, {
          method: 'DELETE'
        });
        if (!res.ok) {
          const error = await res.json();
          toast({
            title: "Error",
            description: error.error || "No se pudo eliminar el área",
            variant: "destructive",
          });
          return;
        }
        toast({ title: "Área eliminada", description: `Se eliminó el área "${area.name}"` });
        // Actualizar lista de áreas localmente
        setAreas(prev => prev.filter(a => a.id !== area.id));
        // Actualizar usuarios que pertenecían a esta área
        setUsers(prev => prev.map(u => 
          u.areaId === area.id 
            ? { ...u, areaId: undefined, isLeader: false, area: undefined }
            : u
        ));
      } else if (deleteType === 'removeFromArea') {
        const user = itemToDelete as User;
        await performRemoveUserFromArea(user);
      }
      
      // Solo hacer loadData si hay un error que requiera sincronización completa
    } catch {
      toast({ 
        title: "Error", 
        description: `No se pudo ${deleteType === 'removeFromArea' ? 'quitar el usuario del área' : deleteType === 'user' ? 'eliminar el usuario' : 'eliminar el área'}`, 
        variant: "destructive" 
      });
    } finally {
      setDeleteModalOpen(false);
      setItemToDelete(null);
    }
  };

  const handleSaveArea = async () => {
    if (!editArea) return;
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/api/admin/areas/${editArea.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editAreaName,
          description: editAreaDescription
        })
      });
      if (!res.ok) {
        const error = await res.json();
        toast({
          title: "Error",
          description: error.error || "No se pudo actualizar el área",
          variant: "destructive",
        });
        return;
      }
      toast({ title: "Área actualizada", description: `Se actualizó el área` });
      setEditAreaDialogOpen(false);
      // Actualizar estado local en lugar de recargar
      setAreas(prev => prev.map(a => a.id === editArea.id ? { ...a, name: editAreaName, description: editAreaDescription } : a));
    } catch {
      toast({ title: "Error", description: "No se pudo actualizar el área", variant: "destructive" });
    }
  };

  const handleDeleteArea = async () => {
    if (!editArea) return;
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/api/admin/areas/${editArea.id}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const error = await res.json();
        toast({
          title: "Error",
          description: error.error || "No se pudo eliminar el área",
          variant: "destructive",
        });
        return;
      }
      toast({ title: "Área eliminada", description: `Se eliminó el área` });
      setEditAreaDialogOpen(false);
      // Actualizar estado local en lugar de recargar
      setAreas(prev => prev.filter(a => a.id !== editArea.id));
      // Actualizar usuarios que pertenecían a esta área
      setUsers(prev => prev.map(u => 
        u.areaId === editArea.id 
          ? { ...u, areaId: undefined, isLeader: false, area: undefined }
          : u
      ));
    } catch {
      toast({ title: "Error", description: "No se pudo eliminar el área", variant: "destructive" });
    }
  };

  // Nuevo: Cargar usuarios de un área
  const fetchAreaUsers = async (areaId: string) => {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/api/admin/users`);
      if (res.ok) {
        const usersData = await res.json();
        setAreaUsers(usersData.filter((u: User) => u.areaId === areaId));
      }
    } catch {
      setAreaUsers([]);
    }
  };

  // Nuevo: Quitar usuario de un área
  const handleRemoveUserFromArea = async (userId: string) => {
    const userToRemove = areaUsers.find(u => u.id === userId);
    if (userToRemove) {
      setItemToDelete(userToRemove);
      setDeleteType('removeFromArea');
      setDeleteModalOpen(true);
    }
  };

  const performRemoveUserFromArea = async (user: User) => {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/api/admin/assign-role`, {
        method: 'POST',
        body: JSON.stringify({
          userEmail: user.email,
          areaId: null,
          role: 'normal',
          isLeader: false
        })
      });
      if (res.ok) {
        toast({ title: "Usuario removido del área", description: `Se removió a ${user.firstName} ${user.lastName} del área` });
        // Actualizar lista de usuarios del área localmente
        setAreaUsers(prev => prev.filter(u => u.id !== user.id));
        // Actualizar lista general de usuarios
        setUsers(prev => prev.map(u => u.id === user.id ? { 
          ...u, 
          areaId: undefined, 
          isLeader: false, 
          area: undefined 
        } : u));
        // Actualizar contador de área
        if (user.areaId) {
          setAreas(prev => prev.map(area => 
            area.id === user.areaId 
              ? { ...area, _count: { ...area._count, users: area._count.users - 1 } }
              : area
          ));
        }
      } else {
        toast({ title: "Error", description: "No se pudo quitar el usuario del área", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "No se pudo quitar el usuario del área", variant: "destructive" });
    }
  };

  // Función para agregar usuario a mi área (solo admin)
  const handleAddUserToMyArea = async (userEmail: string) => {
    if (currentUserRole !== 'admin' || !currentUserAreaId) {
      toast({
        title: "Error",
        description: "Solo los administradores pueden agregar usuarios a su área",
        variant: "destructive",
      });
      return;
    }

    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/api/admin/assign-role`, {
        method: 'POST',
        body: JSON.stringify({
          userEmail: userEmail,
          areaId: currentUserAreaId,
          role: 'normal',
          isLeader: false
        })
      });

      if (res.ok) {
        toast({
          title: "Usuario agregado",
          description: `Se agregó ${userEmail} a tu área correctamente`,
        });
        // Actualizar estado local en lugar de recargar
        const areaName = areas.find(a => a.id === currentUserAreaId)?.name;
        setUsers(prev => prev.map(u => u.email === userEmail ? { 
          ...u, 
          areaId: currentUserAreaId,
          area: areaName ? { name: areaName } : undefined
        } : u));
        // Actualizar contador de área
        if (currentUserAreaId) {
          setAreas(prev => prev.map(area => 
            area.id === currentUserAreaId 
              ? { ...area, _count: { ...area._count, users: area._count.users + 1 } }
              : area
          ));
        }
      } else {
        const error = await res.json();
        toast({
          title: "Error",
          description: error.error || "No se pudo agregar el usuario al área",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error de conexión",
        variant: "destructive",
      });
    }
  };

  // Mostrar solo usuarios de su área para asignar (si es admin y no superuser)
  const assignableUsers = currentUserRole === 'admin' && currentUserAreaId
    ? users.filter(u => !u.areaId || u.areaId === currentUserAreaId)
    : users;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Cargando panel de administración...</p>
      </div>
    );
  }

  if (currentUserRole === 'notfound') {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-4">
          <p className="text-lg font-semibold text-red-600">
            No se encontró tu usuario en la base de datos.
          </p>
          <p className="text-muted-foreground">
            Verifica que tu email esté correctamente sincronizado.<br />
            Email actual: <span className="font-mono">{currentUser?.email}</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-white dark:bg-gray-900 relative">
      {/* Purple Gradient Grid Background - Light Mode */}
      <div
        className="absolute inset-0 z-0 dark:hidden"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(229,231,235,0.8) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(229,231,235,0.8) 1px, transparent 1px),
            radial-gradient(circle 800px at 0% 200px, rgba(213,197,255,0.6), transparent)
          `,
          backgroundSize: "96px 64px, 96px 64px, 100% 100%",
        }}
      />
      
      {/* Purple Gradient Grid Background - Dark Mode */}
      <div
        className="absolute inset-0 z-0 hidden dark:block"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(75,85,99,0.6) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(75,85,99,0.6) 1px, transparent 1px),
            radial-gradient(circle 800px at 0% 200px, rgba(139,92,246,0.4), transparent)
          `,
          backgroundSize: "96px 64px, 96px 64px, 100% 100%",
        }}
      />
      {/* Contenido principal */}
      <div className="relative z-10 flex h-screen flex-col">
        <header className="sticky top-0 z-50 flex items-center justify-between bg-background/95 backdrop-blur px-4 py-2 border-b">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/editor")}>
            <img src="/forms-document-svgrepo-com.svg" alt="Smart File" className="h-8 w-8" />
            <h1 className="text-lg font-semibold">Panel de Administración</h1>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-sm">
              {currentUserRole === 'superuser' ? 'Super Usuario' : 'Administrador'}
            </Badge>
            <ThemeToggle />
            <UserMenu />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-6 space-y-6">
            {/* Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{users.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Áreas</CardTitle>
                  <Building className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{areas.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Administradores</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {users.filter(u => u.role === 'admin').length}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Acciones rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Crear área (solo superuser) */}
              {currentUserRole === 'superuser' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Crear Nueva Área</CardTitle>
                    <CardDescription>
                      Crea una nueva área de la empresa
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="area-name">Nombre del área</Label>
                      <Input
                        id="area-name"
                        placeholder="ej: TICS, Facturación, RRHH"
                        value={newAreaName}
                        onChange={(e) => setNewAreaName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="area-description">Descripción (opcional)</Label>
                      <Input
                        id="area-description"
                        placeholder="Descripción del área"
                        value={newAreaDescription}
                        onChange={(e) => setNewAreaDescription(e.target.value)}
                      />
                    </div>
                    <Button onClick={createArea} className="w-full">
                      <Building className="mr-2 h-4 w-4" />
                      Crear Área
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Lista de usuarios */}
            <Card>
              <CardHeader>
                <CardTitle>Usuarios del Sistema</CardTitle>
                <CardDescription>
                  Gestiona los usuarios y sus roles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map(user => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {user.firstName} {user.lastName} ({user.email})
                          </span>
                          <Badge className={getRoleBadgeColor(user.role)}>
                            {user.role}
                          </Badge>
                          {user.isLeader && (
                            <Badge variant="outline">Líder</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Área: {user.area?.name || 'Sin asignar'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Botón para agregar a mi área (solo para admin) */}
                        {currentUserRole === 'admin' && !user.areaId && user.role === 'normal' && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleAddUserToMyArea(user.email)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            Agregar a mi área
                          </Button>
                        )}
                        {/* Solo mostrar configuración y eliminar para superuser y que no sea el usuario actual */}
                        {currentUserRole === 'superuser' && user.email !== currentUser?.email && (
                          <>
                            <Button variant="outline" size="sm" onClick={() => openEditUserDialog(user)}>
                              <Settings className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive"
                              onClick={() => handleDeleteUserDirect(user)}
                              title="Eliminar usuario"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Lista de áreas */}
            <Card>
              <CardHeader>
                <CardTitle>Áreas de la Empresa</CardTitle>
                <CardDescription>
                  Gestiona las áreas organizacionales
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {areas.map(area => (
                    <div key={area.id} className="border rounded-lg p-4">
                      <h3 className="font-semibold">{area.name}</h3>
                      <p className="text-sm text-muted-foreground">{area.description}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <Badge variant="secondary">
                          {area._count.users} usuario(s)
                        </Badge>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedAreaForUsers(area);
                              fetchAreaUsers(area.id);
                              setAreaUsersDialogOpen(true);
                            }}
                          >
                            Ver usuarios
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => openEditAreaDialog(area)}>
                            <Settings className="h-4 w-4" />
                          </Button>
                          {/* Agregar icono de eliminar (solo para superuser) */}
                          {currentUserRole === 'superuser' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDeleteAreaConfirm(area)}
                              className="text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Diálogo de edición de usuario */}
            <Dialog open={editUserDialogOpen} onOpenChange={setEditUserDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Editar usuario</DialogTitle>
                  <DialogDescription>
                    Modifica la información del usuario seleccionado.
                  </DialogDescription>
                </DialogHeader>
                {/* Tabs para las 3 secciones */}
                <div className="space-y-6">
                  <div className="flex border-b mb-4">
                    <button
                      className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
                        editUserDialogTab === 0
                          ? "border-primary text-primary"
                          : "border-transparent text-muted-foreground"
                      }`}
                      onClick={() => setEditUserDialogTab(0)}
                    >
                      Área
                    </button>
                    <button
                      className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
                        editUserDialogTab === 1
                          ? "border-primary text-primary"
                          : "border-transparent text-muted-foreground"
                      }`}
                      onClick={() => setEditUserDialogTab(1)}
                    >
                      Rol
                    </button>
                    <button
                      className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
                        editUserDialogTab === 2
                          ? "border-primary text-primary"
                          : "border-transparent text-muted-foreground"
                      }`}
                      onClick={() => setEditUserDialogTab(2)}
                    >
                      Datos personales
                    </button>
                  </div>
                  {/* Sección 1: Asignar área */}
                  {editUserDialogTab === 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Área</h4>
                      <Select value={editUserAreaId} onValueChange={setEditUserAreaId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Área" />
                        </SelectTrigger>
                        <SelectContent>
                          {areas.map(area => (
                            <SelectItem key={area.id} value={area.id}>
                              {area.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex items-center space-x-2 mt-2">
                        <input
                          type="checkbox"
                          id="edit-is-leader"
                          checked={editUserIsLeader}
                          onChange={e => setEditUserIsLeader(e.target.checked)}
                        />
                        <Label htmlFor="edit-is-leader">Es líder del área</Label>
                      </div>
                    </div>
                  )}
                  {/* Sección 2: Cambiar rol */}
                  {editUserDialogTab === 1 && (
                    <div>
                      <h4 className="font-semibold mb-2">Rol</h4>
                      <Select value={editUserRole} onValueChange={setEditUserRole}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">Usuario Normal</SelectItem>
                          <SelectItem value="admin">Administrador</SelectItem>
                          <SelectItem value="superuser">Super Usuario</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {/* Sección 3: Nombre y Apellido */}
                  {editUserDialogTab === 2 && (
                    <div>
                      <h4 className="font-semibold mb-2">Datos personales</h4>
                      <div className="space-y-2">
                        <Label htmlFor="edit-firstName">Nombre</Label>
                        <Input
                          id="edit-firstName"
                          placeholder="Nombre"
                          value={editUserFirstName}
                          onChange={e => setEditUserFirstName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2 mt-4">
                        <Label htmlFor="edit-lastName">Apellido</Label>
                        <Input
                          id="edit-lastName"
                          placeholder="Apellido"
                          value={editUserLastName}
                          onChange={e => setEditUserLastName(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex justify-end mt-4">
                  {/* Solo botón Guardar */}
                  <Button onClick={handleSaveUser}>Guardar</Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Diálogo de edición de área */}
            <Dialog open={editAreaDialogOpen} onOpenChange={setEditAreaDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Editar área</DialogTitle>
                  <DialogDescription>
                    Modifica el nombre y la descripción del área seleccionada.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-area-name">Nombre</Label>
                    <Input
                      id="edit-area-name"
                      placeholder="Nombre del área"
                      value={editAreaName}
                      onChange={e => setEditAreaName(e.target.value)}
                      disabled={false} // Permitir edición para admin también
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-area-description">Descripción</Label>
                    <Input
                      id="edit-area-description"
                      placeholder="Descripción"
                      value={editAreaDescription}
                      onChange={e => setEditAreaDescription(e.target.value)}
                      disabled={false} // Permitir edición para admin también
                    />
                  </div>
                </div>
                <div className="flex justify-end mt-4">
                  <Button onClick={handleSaveArea}>Guardar</Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Diálogo de usuarios de un área */}
            <Dialog open={areaUsersDialogOpen} onOpenChange={setAreaUsersDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    Usuarios en área: {selectedAreaForUsers?.name}
                  </DialogTitle>
                  <DialogDescription>
                    Lista de usuarios asignados a esta área. Puedes quitar usuarios del área desde aquí.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                  {areaUsers.length === 0 && (
                    <p className="text-muted-foreground text-sm">No hay usuarios en esta área.</p>
                  )}
                  {areaUsers.map(u => (
                    <div key={u.id} className="flex items-center justify-between border rounded px-3 py-2">
                      <span>
                        {u.firstName} {u.lastName} ({u.email})
                        {u.isLeader && <Badge variant="outline" className="ml-2">Líder</Badge>}
                      </span>
                      {/* No mostrar el botón para líderes admin, en vez de solo deshabilitarlo */}
                      {!((u.isLeader && u.role === 'admin') || (currentUserRole === 'admin' && u.id === currentUser?.id)) && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveUserFromArea(u.id)}
                        >
                          Quitar
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex justify-end mt-4">
                  <Button variant="secondary" onClick={() => setAreaUsersDialogOpen(false)}>
                    Cerrar
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Modal de confirmación de eliminación */}
            <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className={deleteType === 'removeFromArea' ? 'text-orange-600' : 'text-destructive'}>
                    {deleteType === 'removeFromArea' ? 'Quitar usuario del área' : 'Confirmar eliminación'}
                  </DialogTitle>
                  <DialogDescription>
                    {deleteType === 'removeFromArea' 
                      ? 'Confirma si deseas quitar al usuario del área actual.'
                      : 'Confirma si deseas eliminar permanentemente este elemento.'
                    }
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <p className="text-sm text-muted-foreground">
                    {deleteType === 'user' 
                      ? `¿Seguro que deseas eliminar al usuario ${(itemToDelete as User)?.email}?`
                      : deleteType === 'area'
                      ? `¿Estás seguro de eliminar el área "${(itemToDelete as Area)?.name}"?`
                      : `¿Estás seguro de quitar a ${(itemToDelete as User)?.firstName} ${(itemToDelete as User)?.lastName} del área?`
                    }
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {deleteType === 'removeFromArea' 
                      ? 'El usuario será removido del área pero mantendrá su cuenta.'
                      : 'Esta acción no se puede deshacer.'
                    }
                  </p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setDeleteModalOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    variant={deleteType === 'removeFromArea' ? 'default' : 'destructive'}
                    onClick={performDelete}
                  >
                    {deleteType === 'removeFromArea' ? 'Quitar del área' : 'Eliminar'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </main>
      </div>
    </div>
  );
}
