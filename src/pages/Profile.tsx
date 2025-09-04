import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { Save, User, Mail, Calendar, Shield, Building, Camera, Upload, ChevronDown, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { UserMenu } from "@/components/UserMenu";

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  imageUrl?: string;
  role: string;
  area?: {
    id: string;
    name: string;
  };
  createdAt: string;
}

// Función auxiliar para formatear fechas de manera segura
const formatDate = (dateString: string, format: 'short' | 'long' = 'short'): string => {
  if (!dateString) return 'Fecha no disponible';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Fecha no disponible';
    }
    
    if (format === 'long') {
      return date.toLocaleString('es-ES');
    } else {
      return date.toLocaleDateString('es-ES');
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Fecha no disponible';
  }
};

const Profile: React.FC = () => {
  const { user, getToken, logout } = useAuth();
  const navigate = useNavigate();
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: ''
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

  // Cargar datos del perfil
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${API_BASE_URL}/api/users/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (res.ok) {
          const profile = await res.json();
          // Asegurar que createdAt tenga un valor válido
          if (!profile.createdAt) {
            profile.createdAt = new Date().toISOString();
            console.warn('Profile missing createdAt, using current date as fallback');
          }
          setUserProfile(profile);
          setFormData({
            firstName: profile.firstName || '',
            lastName: profile.lastName || '',
            username: profile.username || ''
          });
        } else {
          throw new Error('Error al cargar el perfil');
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudo cargar el perfil del usuario",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadProfile();
    }
  }, [user, getToken, API_BASE_URL]);

  // Guardar cambios en el perfil
  const handleSave = async () => {
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.username.trim()) {
      toast({
        title: "Error",
        description: "Todos los campos son obligatorios",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        const updatedProfile = await res.json();
        // Preservar campos que no deben cambiar como createdAt
        setUserProfile(prev => prev ? {
          ...prev,
          ...updatedProfile,
          createdAt: prev.createdAt, // Preservar la fecha original
          area: prev.area // Preservar el área si no viene en la respuesta
        } : updatedProfile);
        toast({
          title: "Perfil actualizado",
          description: "Los cambios se han guardado correctamente"
        });
      } else {
        const error = await res.json();
        throw new Error(error.error || 'Error al actualizar el perfil');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo actualizar el perfil",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Manejar selección de imagen
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "Por favor selecciona un archivo de imagen válido",
          variant: "destructive"
        });
        return;
      }

      // Validar tamaño (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error", 
          description: "La imagen debe ser menor a 5MB",
          variant: "destructive"
        });
        return;
      }

      setImageFile(file);
      
      // Crear preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Subir imagen de perfil
  const handleImageUpload = async () => {
    if (!imageFile) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/api/users/profile/image`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData
      });

      if (res.ok) {
        const result = await res.json();
        setUserProfile(prev => prev ? { ...prev, imageUrl: result.imageUrl } : null);
        setPreviewImage(null);
        setImageFile(null);
        
        toast({
          title: "Imagen actualizada",
          description: "Tu imagen de perfil se ha actualizado correctamente"
        });
      } else {
        throw new Error('Error al subir la imagen');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar la imagen de perfil",
        variant: "destructive"
      });
    } finally {
      setUploadingImage(false);
    }
  };

  // Manejar logout
  const handleSignOut = async () => {
    try {
      logout();
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente"
      });
      navigate("/login");
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cerrar la sesión",
        variant: "destructive"
      });
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'superuser':
        return 'bg-purple-500 text-white';
      case 'admin':
        return 'bg-blue-500 text-white';
      case 'normal':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'superuser':
        return 'Super Usuario';
      case 'admin':
        return 'Administrador';
      case 'normal':
        return 'Usuario';
      default:
        return 'Usuario';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-white relative">
        {/* Dual Gradient Overlay Swapped Background */}
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
        
        {/* Header usando el mismo formato que Editor y AdminDashboard */}
        <header className="sticky top-0 z-50 flex items-center justify-between bg-background/95 backdrop-blur px-4 py-2 border-b">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/editor")}>
            <img src="/forms-document-svgrepo-com.svg" alt="Smart File" className="h-8 w-8" />
            <h1 className="text-lg font-semibold">Mi Perfil</h1>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <UserMenu />
          </div>
        </header>
        
        {/* Content principal */}
        <div className="flex items-center justify-center min-h-screen relative z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando perfil...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!userProfile) {
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
        
        {/* Header usando el mismo formato que Editor y AdminDashboard */}
        <header className="sticky top-0 z-50 flex items-center justify-between bg-background/95 backdrop-blur px-4 py-2 border-b">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/editor")}>
            <img src="/forms-document-svgrepo-com.svg" alt="Smart File" className="h-8 w-8" />
            <h1 className="text-lg font-semibold">Mi Perfil</h1>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <UserMenu />
          </div>
        </header>
        
        {/* Content principal */}
        <div className="flex items-center justify-center min-h-screen relative z-10">
          <div className="text-center">
            <p className="text-destructive">Error al cargar el perfil</p>
          </div>
        </div>
      </div>
    );
  }

  const userInitials = `${userProfile.firstName?.charAt(0) || ''}${userProfile.lastName?.charAt(0) || ''}`;

  return (
    <div className="min-h-screen w-full bg-white dark:bg-gray-900 relative overflow-hidden" style={{ overflow: "hidden", height: "100vh" }}>
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

      {/* Usar la misma estructura que Editor y AdminDashboard */}
      <div className="flex h-screen flex-col relative z-10">
        <header className="sticky top-0 z-50 flex items-center justify-between bg-background/95 backdrop-blur px-4 py-2 border-b">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/editor")}>
            <img src="/forms-document-svgrepo-com.svg" alt="Smart File" className="h-8 w-8" />
            <h1 className="text-lg font-semibold">Mi Perfil</h1>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-sm">
              {getRoleDisplayName(userProfile.role)}
            </Badge>
            <ThemeToggle />
            <UserMenu />
          </div>
        </header>

        {/* Content principal */}
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 py-8 max-w-4xl relative z-10">
        <div className="grid gap-6 md:grid-cols-3">
          {/* Profile Card */}
          <Card className="md:col-span-1">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4 relative">
                <div className="relative group">
                  <Avatar className="h-20 w-20 border-4 border-primary/10">
                    {previewImage ? (
                      <AvatarImage src={previewImage} alt={userProfile.firstName} />
                    ) : userProfile.imageUrl ? (
                      <>
                        <AvatarImage 
                          src={userProfile.imageUrl.startsWith('http') ? userProfile.imageUrl : `${API_BASE_URL}${userProfile.imageUrl}`} 
                          alt={userProfile.firstName}
                          onError={(e) => {
                            console.error('Error loading profile image:', userProfile.imageUrl);
                            // En lugar de ocultar, mostrar fallback
                            const parent = e.currentTarget.parentElement;
                            if (parent) {
                              e.currentTarget.style.display = 'none';
                              const fallback = parent.querySelector('.avatar-fallback');
                              if (fallback) (fallback as HTMLElement).style.display = 'flex';
                            }
                          }}
                        />
                        <AvatarFallback 
                          className="bg-primary/10 text-primary text-xl avatar-fallback" 
                          style={{ display: 'none' }}
                        >
                          {userInitials || <User className="h-8 w-8" />}
                        </AvatarFallback>
                      </>
                    ) : user?.imageUrl ? (
                      <>
                        <AvatarImage 
                          src={user.imageUrl.startsWith('http') ? user.imageUrl : `${API_BASE_URL}${user.imageUrl}`} 
                          alt={userProfile.firstName}
                          onError={(e) => {
                            console.error('Error loading profile image:', user.imageUrl);
                            // En lugar de ocultar, mostrar fallback
                            const parent = e.currentTarget.parentElement;
                            if (parent) {
                              e.currentTarget.style.display = 'none';
                              const fallback = parent.querySelector('.avatar-fallback');
                              if (fallback) (fallback as HTMLElement).style.display = 'flex';
                            }
                          }}
                        />
                        <AvatarFallback 
                          className="bg-primary/10 text-primary text-xl avatar-fallback" 
                          style={{ display: 'none' }}
                        >
                          {userInitials || <User className="h-8 w-8" />}
                        </AvatarFallback>
                      </>
                    ) : (
                      <AvatarFallback className="bg-primary/10 text-primary text-xl">
                        {userInitials || <User className="h-8 w-8" />}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  
                  {/* Overlay para cambiar imagen */}
                  <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                    <Camera className="h-6 w-6 text-white" />
                  </div>
                  
                  {/* Input file oculto */}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    disabled={uploadingImage}
                  />
                </div>
              </div>
              
              {/* Mostrar botones de imagen si hay una imagen seleccionada */}
              {imageFile && (
                <div className="flex gap-2 justify-center mb-3">
                  <Button
                    size="sm"
                    onClick={handleImageUpload}
                    disabled={uploadingImage}
                    className="gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    {uploadingImage ? 'Subiendo...' : 'Subir imagen'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setImageFile(null);
                      setPreviewImage(null);
                    }}
                    disabled={uploadingImage}
                  >
                    Cancelar
                  </Button>
                </div>
              )}
              
              <CardTitle className="text-xl">{userProfile.firstName} {userProfile.lastName}</CardTitle>
              <CardDescription>@{userProfile.username}</CardDescription>
              <div className="flex justify-center mt-2">
                <Badge className={getRoleBadgeColor(userProfile.role)}>
                  {getRoleDisplayName(userProfile.role)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span className="truncate">{userProfile.email}</span>
              </div>
              {userProfile.area && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building className="h-4 w-4" />
                  <span>{userProfile.area.name}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Miembro desde {formatDate(userProfile.createdAt)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Edit Form */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Información Personal</CardTitle>
                <CardDescription>
                  Actualiza tu información personal aquí
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Nombre</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      placeholder="Tu nombre"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Apellido</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      placeholder="Tu apellido"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Nombre de usuario</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    placeholder="Tu nombre de usuario"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <Input
                    id="email"
                    value={userProfile.email}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    El correo electrónico no se puede modificar
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Información del Sistema</CardTitle>
                <CardDescription>
                  Información sobre tu cuenta y permisos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Rol del usuario</Label>
                    <div className="flex items-center gap-2">
                      <Badge className={getRoleBadgeColor(userProfile.role)}>
                        {getRoleDisplayName(userProfile.role)}
                      </Badge>
                    </div>
                  </div>
                  {userProfile.area && (
                    <div className="space-y-2">
                      <Label>Área asignada</Label>
                      <Input
                        value={userProfile.area.name}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                  )}
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Fecha de registro</Label>
                    <Input
                      value={formatDate(userProfile.createdAt, 'long')}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </div>
          </div>
        </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Profile;