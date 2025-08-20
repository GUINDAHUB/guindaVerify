import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/auth';
import { DebugClickUpClient } from './client';

export default async function DebugClickUpPage() {
  // Verificar autenticación
  if (!(await isAdminAuthenticated())) {
    redirect('/admin/login');
  }

  return <DebugClickUpClient />;
}
