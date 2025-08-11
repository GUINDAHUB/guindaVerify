import { redirect } from 'next/navigation';
import { isClientAuthenticated } from '@/lib/auth';
import { ClientLoginClient } from './client';

interface PageProps {
  params: {
    codigo: string;
  };
}

export default async function ClientLoginPage({ params }: PageProps) {
  const { codigo } = params;

  // Si ya está autenticado, redirigir al portal del cliente
  if (await isClientAuthenticated(codigo)) {
    redirect(`/cliente/${codigo}`);
  }

  return <ClientLoginClient codigo={codigo} />;
}
