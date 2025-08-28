import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Convierte una fecha de ClickUp (que puede ser un timestamp como string) a un objeto Date válido
 */
export function parseClickUpDate(dateString?: string): Date | null {
  if (!dateString) return null;
  
  try {
    // Las fechas de ClickUp vienen como timestamps en milisegundos (como string)
    // Verificar si es un timestamp numérico (string de dígitos)
    if (/^\d+$/.test(dateString)) {
      // Si es un timestamp, convertir a número y crear Date
      const timestamp = parseInt(dateString, 10);
      return new Date(timestamp);
    } else {
      // Si no es timestamp, intentar parsear como fecha normal
      return new Date(dateString);
    }
  } catch (error) {
    console.error('Error parseando fecha de ClickUp:', dateString, error);
    return null;
  }
}

/**
 * Formatea una fecha de ClickUp para mostrar en la UI
 */
export function formatClickUpDate(dateString?: string, options?: Intl.DateTimeFormatOptions): string {
  if (!dateString) return 'No especificada';
  
  const date = parseClickUpDate(dateString);
  
  if (!date || isNaN(date.getTime())) {
    console.warn('Fecha inválida recibida de ClickUp:', dateString);
    return 'Fecha inválida';
  }
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  return date.toLocaleDateString('es-ES', { ...defaultOptions, ...options });
}

/**
 * Formatea una fecha de ClickUp a formato ISO string para fechas programadas
 */
export function formatClickUpDateToISO(dateString?: string): string | null {
  if (!dateString) return null;
  
  const date = parseClickUpDate(dateString);
  
  if (!date || isNaN(date.getTime())) {
    return null;
  }
  
  return date.toISOString().split('T')[0];
}
