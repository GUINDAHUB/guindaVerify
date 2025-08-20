'use client';

import { useRouter } from 'next/navigation';
import { SimplePasswordLogin } from '@/components/simple-password-login';
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
        const data = await response.json();
        const userName = data.user?.nombre || 'Usuario';
        toast.success(`¡Bienvenido ${userName}!`);
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
    <SimplePasswordLogin
      title={`Portal de Cliente`}
      description={`Introduce tu contraseña para acceder al portal`}
      onSubmit={handleLogin}
      placeholderPassword="Contraseña"
    />
  );
}
