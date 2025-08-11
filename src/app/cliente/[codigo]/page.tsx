import { redirect } from 'next/navigation';
import { isClientAuthenticated } from '@/lib/auth';
import { ClientePortalClient } from './client';

interface PageProps {
  params: Promise<{ codigo: string }>;
}

export default async function ClientePortal({ params }: PageProps) {
  const { codigo } = await params;
  
  // Verificar autenticación del cliente
  if (!(await isClientAuthenticated(codigo))) {
    redirect(`/cliente/${codigo}/login`);
  }

  return <ClientePortalClient codigo={codigo} />;
}