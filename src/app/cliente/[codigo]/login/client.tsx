'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SimplePasswordLogin } from '@/components/simple-password-login';
import { toast } from 'sonner';
import { Cliente } from '@/types';

interface ClientLoginClientProps {
  codigo: string;
}

export function ClientLoginClient({ codigo }: ClientLoginClientProps) {
  const router = useRouter();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [isLoadingClient, setIsLoadingClient] = useState(true);

  useEffect(() => {
    const fetchCliente = async () => {
      try {
        const response = await fetch(`/api/cliente/${codigo}`);
        if (response.ok) {
          const clienteData = await response.json();
          setCliente(clienteData);
        }
      } catch (error) {
        console.error('Error al obtener información del cliente:', error);
      } finally {
        setIsLoadingClient(false);
      }
    };

    fetchCliente();
  }, [codigo]);

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

  if (isLoadingClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-lg">Cargando...</div>
      </div>
    );
  }

  return (
    <SimplePasswordLogin
      title={cliente?.nombre ? `Portal de ${cliente.nombre}` : `Portal de Cliente`}
      description={`Introduce tu contraseña para acceder al portal`}
      onSubmit={handleLogin}
      placeholderPassword="Contraseña"
      logoUrl={cliente?.logoUrl}
      clientName={cliente?.nombre}
    />
  );
}
