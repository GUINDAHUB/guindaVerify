import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/auth';
import { AdminLogsClient } from './client';

export default async function AdminLogsPage() {
  // Verificar autenticación
  if (!(await isAdminAuthenticated())) {
    redirect('/admin/login');
  }

  return <AdminLogsClient />;
}
