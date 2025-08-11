import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/auth';
import { ConfiguracionPageClient } from './client';

export default async function ConfiguracionPage() {
  // Verificar autenticación
  if (!(await isAdminAuthenticated())) {
    redirect('/admin/login');
  }

  return <ConfiguracionPageClient />;
} 