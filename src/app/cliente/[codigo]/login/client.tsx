'use client';

import { useRouter } from 'next/navigation';
import { LoginForm } from '@/components/login-form';
import { toast } from 'sonner';

interface ClientLoginClientProps {
  codigo: string;
}

export function ClientLoginClient({ codigo }: ClientLoginClientProps) {
  const router = useRouter();

  const handleLogin = async (password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/cliente/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ codigo, password }),
      });

      if (response.ok) {
        toast.success('¡Bienvenido a tu portal!');
        router.push(`/cliente/${codigo}`);
        router.refresh();
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Error en login cliente:', error);
      return false;
    }
  };

  return (
    <LoginForm
      title={`Portal de Cliente`}
      description={`Introduce tu contraseña para acceder a tu portal de publicaciones`}
      onSubmit={handleLogin}
      placeholder="Contraseña del portal"
    />
  );
}
