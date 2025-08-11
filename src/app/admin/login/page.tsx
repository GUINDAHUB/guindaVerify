import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/auth';
import { AdminLoginClient } from './client';

export default async function AdminLoginPage() {
  // Si ya está autenticado, redirigir al admin
  if (await isAdminAuthenticated()) {
    redirect('/admin');
  }

  return <AdminLoginClient />;
}
