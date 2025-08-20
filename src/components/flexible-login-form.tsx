'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, User, UserCheck } from 'lucide-react';

interface FlexibleLoginFormProps {
  title: string;
  description: string;
  onSubmit: (username: string | null, password: string) => Promise<boolean>;
  placeholderUsername?: string;
  placeholderPassword?: string;
}

export function FlexibleLoginForm({
  title,
  description,
  onSubmit,
  placeholderUsername = "Nombre de usuario",
  placeholderPassword = "Contraseña"
}: FlexibleLoginFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [useSpecificUser, setUseSpecificUser] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      setError('Por favor, introduce tu contraseña');
      return;
    }

    if (useSpecificUser && !username.trim()) {
      setError('Por favor, introduce tu nombre de usuario');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const finalUsername = useSpecificUser ? username.trim() : null;
      const success = await onSubmit(finalUsername, password);
      
      if (!success) {
        if (useSpecificUser) {
          setError('Credenciales incorrectas. Verifica tu nombre de usuario y contraseña.');
        } else {
          setError('Contraseña incorrecta o no reconocida.');
        }
      }
    } catch (error) {
      setError('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">{title}</CardTitle>
          <CardDescription className="text-center">{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Selector de modo de login */}
            <div className="flex gap-2 mb-4">
              <Button
                type="button"
                variant={!useSpecificUser ? "default" : "outline"}
                size="sm"
                onClick={() => setUseSpecificUser(false)}
                className="flex-1"
              >
                <UserCheck className="h-4 w-4 mr-2" />
                Solo Contraseña
              </Button>
              <Button
                type="button"
                variant={useSpecificUser ? "default" : "outline"}
                size="sm"
                onClick={() => setUseSpecificUser(true)}
                className="flex-1"
              >
                <User className="h-4 w-4 mr-2" />
                Usuario + Contraseña
              </Button>
            </div>

            {/* Campo de usuario (solo si está activado) */}
            {useSpecificUser && (
              <div className="space-y-2">
                <Label htmlFor="username">Nombre de usuario</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={placeholderUsername}
                  disabled={isLoading}
                  autoComplete="username"
                />
              </div>
            )}
            
            {/* Campo de contraseña */}
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={placeholderPassword}
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Mensaje informativo */}
            <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-md">
              {useSpecificUser 
                ? "💡 Introduce tu nombre de usuario específico y contraseña"
                : "💡 Solo introduce tu contraseña. El sistema detectará automáticamente tu usuario."
              }
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !password.trim() || (useSpecificUser && !username.trim())}
            >
              {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
