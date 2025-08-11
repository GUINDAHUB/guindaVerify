import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/auth';
import { AdminPageClient } from './client';

export default async function AdminPage() {
  // Verificar autenticación
  if (!(await isAdminAuthenticated())) {
    redirect('/admin/login');
  }

  return <AdminPageClient />;
} 