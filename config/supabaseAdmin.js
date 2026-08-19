// ==========================================================
// EVOLUA+
// CONEXÃO ADMINISTRATIVA COM O SUPABASE
// ==========================================================
//
// Esta conexão possui privilégios administrativos.
//
// Utilizaremos somente no backend para:
//
// - criar usuários;
// - excluir usuários;
// - futuras funções administrativas.
//
// NUNCA colocar essa chave no frontend.
//
// ==========================================================

require("dotenv").config();


const {
  createClient
} = require(
  "@supabase/supabase-js"
);


// ==========================================================
// VARIÁVEIS
// ==========================================================

const supabaseUrl =
  process.env.SUPABASE_URL;


const supabaseAdminKey =
  process.env.SUPABASE_ADMIN_KEY;


// ==========================================================
// VALIDAÇÕES
// ==========================================================

if (!supabaseUrl) {

  throw new Error(
    "SUPABASE_URL não foi encontrada no arquivo .env."
  );

}


if (!supabaseAdminKey) {

  throw new Error(
    "SUPABASE_ADMIN_KEY não foi encontrada no arquivo .env."
  );

}


// ==========================================================
// CLIENTE ADMIN
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