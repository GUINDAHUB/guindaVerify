const bcrypt = require('bcryptjs');

async function generateHash() {
  const password = 'admin123';
  const hash = await bcrypt.hash(password, 10);
  
  console.log('🔐 Hash generado para la contraseña "admin123":');
  console.log(hash);
  
  // Verificar que el hash funciona
  const isValid = await bcrypt.compare(password, hash);
  console.log('✅ Verificación:', isValid ? 'CORRECTO' : 'ERROR');
  
  console.log('\n📋 SQL para insertar en la base de datos:');
  console.log(`INSERT INTO auth_admin (id, password_hash) VALUES ('00000000-0000-0000-0000-000000000000', '${hash}') ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash;`);
}

generateHash().catch(console.error);
