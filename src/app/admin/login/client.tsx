'use client';

import { useRouter } from 'next/navigation';
import { LoginForm } from '@/components/login-form';
import { toast } from 'sonner';

export function AdminLoginClient() {
  const router = useRouter();

  const handleLogin = async (password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        toast.success('¡Bienvenido al panel de administración!');
        router.push('/admin');
        router.refresh();
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Error en login admin:', error);
      return false;
    }
  };

  return (
    <LoginForm
      title="Acceso Administrativo"
      description="Introduce la contraseña de administrador para acceder al panel de control"
      onSubmit={handleLogin}
      placeholder="Contraseña de administrador"
    />
  );
}
