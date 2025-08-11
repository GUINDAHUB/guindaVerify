#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando configuración de GuindaVerify...\n');

// Verificar archivos necesarios
const requiredFiles = [
  '.env.local',
  'src/types/index.ts',
  'src/lib/clickup.ts',
  'src/lib/supabase.ts',
  'src/app/api/cliente/[codigo]/publicaciones/route.ts',
  'src/app/api/cliente/[codigo]/acciones/route.ts',
  'src/app/cliente/[codigo]/page.tsx',
  'supabase-setup.sql'
];

console.log('📁 Verificando archivos del proyecto:');
let allFilesExist = true;

requiredFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allFilesExist = false;
});

// Verificar package.json
console.log('\n📦 Verificando dependencias:');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const requiredDeps = [
  'next',
  'react',
  'react-dom',
  '@supabase/supabase-js',
  'axios',
  'react-hook-form',
  '@hookform/resolvers',
  'zod',
  'lucide-react',
  '@radix-ui/react-dialog',
  '@radix-ui/react-dropdown-menu',
  'sonner',
  'class-variance-authority',
  'clsx',
  'tailwind-merge',
  'tailwindcss-animate'
];

let allDepsExist = true;
requiredDeps.forEach(dep => {
  const exists = packageJson.dependencies[dep] || packageJson.devDependencies[dep];
  console.log(`  ${exists ? '✅' : '❌'} ${dep}`);
  if (!exists) allDepsExist = false;
});

// Verificar variables de entorno
console.log('\n🔐 Verificando variables de entorno:');
const envFile = '.env.local';
let envExists = false;
let envVars = [];

if (fs.existsSync(envFile)) {
  envExists = true;
  const envContent = fs.readFileSync(envFile, 'utf8');
  const requiredEnvVars = [
    'CLICKUP_API_KEY',
    'CLICKUP_WORKSPACE_ID',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ];

  requiredEnvVars.forEach(varName => {
    const hasVar = envContent.includes(varName);
    console.log(`  ${hasVar ? '✅' : '❌'} ${varName}`);
    if (!hasVar) envVars.push(varName);
  });
} else {
  console.log('  ❌ .env.local no encontrado');
}

// Resumen
console.log('\n📊 Resumen:');
console.log(`  Archivos del proyecto: ${allFilesExist ? '✅ Completos' : '❌ Faltan archivos'}`);
console.log(`  Dependencias: ${allDepsExist ? '✅ Instaladas' : '❌ Faltan dependencias'}`);
console.log(`  Variables de entorno: ${envExists && envVars.length === 0 ? '✅ Configuradas' : '❌ Faltan variables'}`);

if (!allFilesExist || !allDepsExist || !envExists || envVars.length > 0) {
  console.log('\n⚠️  Problemas encontrados:');
  
  if (!allFilesExist) {
    console.log('  - Algunos archivos del proyecto no existen');
  }
  
  if (!allDepsExist) {
    console.log('  - Faltan dependencias, ejecuta: npm install');
  }
  
  if (!envExists) {
    console.log('  - Crea el archivo .env.local con las variables necesarias');
  }
  
  if (envVars.length > 0) {
    console.log(`  - Faltan variables de entorno: ${envVars.join(', ')}`);
  }
  
  console.log('\n📖 Consulta el README.md para instrucciones completas de configuración.');
  process.exit(1);
} else {
  console.log('\n🎉 ¡Todo está configurado correctamente!');
  console.log('\n🚀 Próximos pasos:');
  console.log('  1. Configura tu base de datos de Supabase ejecutando supabase-setup.sql');
  console.log('  2. Configura las variables de entorno en .env.local');
  console.log('  3. Ejecuta: npm run dev');
  console.log('  4. Accede a http://localhost:3000');
} 