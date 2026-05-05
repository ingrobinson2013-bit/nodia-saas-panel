// scripts/create_tenant_user.mjs
// Crea un usuario de Supabase Auth y lo vincula al tenant de Barbería El Estilo
// Ejecutar: node scripts/create_tenant_user.mjs

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://gtrxvfqgytkpvdgmzcgu.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0cnh2ZnFneXRrcHZkZ216Y2d1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQwMzk3NSwiZXhwIjoyMDkyOTc5OTc1fQ.zlDvdUQ1yQZXaBp0XUyg8IJWO-3HRkHw0pIr9ihrGho";

const TENANT_ID = "bd052d1d-3915-4dc8-946a-cb7ad3581ade";
const TENANT_EMAIL = "barberia@estilo.com";
const TENANT_PASSWORD = "Nodia2024!";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  console.log("🚀 Creando usuario de Supabase Auth para Barbería El Estilo...");

  // 1. Crear usuario en Supabase Auth
  const { data: userdata, error: userError } = await supabase.auth.admin.createUser({
    email: TENANT_EMAIL,
    password: TENANT_PASSWORD,
    email_confirm: true, // confirmar automáticamente, no requiere verificación
  });

  if (userError) {
    if (userError.message.includes("already been registered")) {
      console.log("⚠️  El usuario ya existe. Continuando para vincular el tenant...");
      // Buscar el usuario existente
      const { data: listData } = await supabase.auth.admin.listUsers();
      const existing = listData?.users?.find(u => u.email === TENANT_EMAIL);
      if (existing) {
        await linkUserToTenant(existing.id);
      }
    } else {
      console.error("❌ Error creando usuario:", userError.message);
      process.exit(1);
    }
    return;
  }

  const userId = userdata.user.id;
  console.log(`✅ Usuario creado con ID: ${userId}`);
  await linkUserToTenant(userId);
}

async function linkUserToTenant(userId) {
  console.log(`🔗 Vinculando user_id ${userId} al tenant ${TENANT_ID}...`);
  
  // 2. Actualizar la columna user_id en tenants
  const { error: updateError } = await supabase
    .from('tenants')
    .update({ user_id: userId })
    .eq('tenant_id', TENANT_ID);

  if (updateError) {
    if (updateError.message.includes('column "user_id" of relation')) {
      console.log("\n⚠️  La columna 'user_id' NO existe en la tabla tenants.");
      console.log("👉 Ejecuta este SQL en Supabase primero:");
      console.log("\n  ALTER TABLE public.tenants ADD COLUMN user_id UUID REFERENCES auth.users(id);\n");
      console.log("Luego vuelve a ejecutar este script.");
    } else {
      console.error("❌ Error actualizando tenant:", updateError.message);
    }
    process.exit(1);
  }

  console.log("\n🎉 ¡Todo listo! Credenciales del cliente:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  URL Panel:    https://nodia-saas-panel.vercel.app/login`);
  console.log(`  Email:        ${TENANT_EMAIL}`);
  console.log(`  Contraseña:   ${TENANT_PASSWORD}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main();
