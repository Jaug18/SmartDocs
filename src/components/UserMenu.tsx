import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuGroup, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { UserIcon, LogOut, Settings, User, Shield } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export const UserMenu = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [userRole, setUserRole] = useState<string>('normal');

  useEffect(() => {
    if (user?.role) {
      setUserRole(user.role);
    }
  }, [user?.role]);

  if (!user) return null;

  const userInitials = `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`;
  const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Usuario';

  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      await logout();
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente"
      });
      navigate("/login");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cerrar la sesión"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
          <Avatar className="h-9 w-9 border border-primary/10">
            {user.imageUrl ? (
              <>
                <AvatarImage 
                  src={user.imageUrl.startsWith('http') ? user.imageUrl : `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}${user.imageUrl}`} 
                  alt={fullName}
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
                  className="bg-primary/10 text-primary avatar-fallback" 
                  style={{ display: 'none' }}
                >
                  {userInitials || <UserIcon className="h-4 w-4" />}
                </AvatarFallback>
              </>
            ) : (
              <AvatarFallback className="bg-primary/10 text-primary">
                {userInitials || <UserIcon className="h-4 w-4" />}
              </AvatarFallback>
            )}
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{fullName}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => navigate("/perfil")}>
            <User className="mr-2 h-4 w-4" />
            <span>Mi perfil</span>
          </DropdownMenuItem>
          {/* <DropdownMenuItem onClick={() => navigate("/configuracion")}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Configuración</span>
          </DropdownMenuItem> */}
        </DropdownMenuGroup>

        {(userRole === 'superuser' || userRole === 'admin') && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link 
                to="/admin" 
                className="w-full flex items-center"
              >
                <Shield className="mr-2 h-4 w-4" />
                Panel de Admin
              </Link>
            </DropdownMenuItem>
          </>
        )}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={handleSignOut} 
          disabled={isLoading}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>{isLoading ? "Cerrando sesión..." : "Cerrar sesión"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
