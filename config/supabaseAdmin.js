// ==========================================================
// EVOLUA+
// CONEXÃO ADMINISTRATIVA COM O SUPABASE
// ==========================================================
//
// Este arquivo cria uma conexão especial com o Supabase.
//
// Diferente do config/supabase.js,
// esta conexão utiliza uma CHAVE SECRETA.
//
// Ela será usada somente pelo backend para operações como:
//
// - criar usuários;
// - excluir usuários do Auth;
// - operações administrativas futuras.
//
// IMPORTANTE:
//
// NUNCA utilize SUPABASE_ADMIN_KEY no frontend.
//
// ==========================================================


// ==========================================================
// CARREGAR VARIÁVEIS DO .ENV
// ==========================================================

require("dotenv").config();



// ==========================================================
// IMPORTAR SUPABASE
// ==========================================================

const {
  createClient
} = require(
  "@supabase/supabase-js"
);



// ==========================================================
// PEGAR CONFIGURAÇÕES DO .ENV
// ==========================================================

const supabaseUrl =
  process.env.SUPABASE_URL;


const supabaseAdminKey =
  process.env.SUPABASE_ADMIN_KEY ||
  process.env.SUPABASE_KEY;



// ==========================================================
// VALIDAR VARIÁVEIS
// ==========================================================
//
// Isso ajuda a identificar rapidamente
// caso o .env esteja configurado incorretamente.
//
// ==========================================================

if (!supabaseUrl) {

  throw new Error(
    "SUPABASE_URL não foi encontrada no arquivo .env."
  );

}


if (!process.env.SUPABASE_ADMIN_KEY) {

  console.warn(
    "SUPABASE_ADMIN_KEY não foi encontrada. Operações administrativas exigem a service_role key."
  );

}

if (!supabaseAdminKey) {
  throw new Error("SUPABASE_KEY não foi encontrada no arquivo .env.");
}



// ==========================================================
// CRIAR CLIENTE ADMINISTRATIVO
// ==========================================================
//
// autoRefreshToken:
//
// não precisamos renovar sessão,
// porque este cliente não representa um usuário logado.
//
// persistSession:
//
// não precisamos guardar sessão no servidor.
//
// ==========================================================

const supabaseAdmin =
  createClient(
    supabaseUrl,
    supabaseAdminKey,
    {

      auth: {

        autoRefreshToken:
          false,

        persistSession:
          false

      }

    }
  );



// ==========================================================
// EXPORTAR
// ==========================================================

module.exports =
  supabaseAdmin;