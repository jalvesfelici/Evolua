// ==========================================================
// EVOLUA+ - CONEXÃO ADMINISTRATIVA
// ==========================================================
require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAdminKey = process.env.SUPABASE_ADMIN_KEY;

if (!supabaseUrl || !supabaseAdminKey) {
  throw new Error("SUPABASE_URL ou SUPABASE_ADMIN_KEY não configuradas no .env");
}

const supabaseAdmin = createClient(supabaseUrl, supabaseAdminKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

module.exports = supabaseAdmin;