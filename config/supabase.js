// ==========================================================
// EVOLUA+
// CONEXÃO PADRÃO COM O SUPABASE
// ==========================================================

// Carrega o arquivo .env.
require("dotenv").config();


// Importa o cliente do Supabase.
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


const supabaseKey =
  process.env.SUPABASE_KEY;


// ==========================================================
// VALIDAÇÕES
// ==========================================================

if (!supabaseUrl) {

  throw new Error(
    "SUPABASE_URL não foi encontrada no arquivo .env."
  );

}


if (!supabaseKey) {

  throw new Error(
    "SUPABASE_KEY não foi encontrada no arquivo .env."
  );

}


// ==========================================================
// CLIENTE
// ==========================================================

const supabase =
  createClient(
    supabaseUrl,
    supabaseKey
  );


  // ==========================================================
// CLIENTE ADMINISTRATIVO
// Usado somente no backend
// ==========================================================

const supabaseAdminKey =
  process.env.SUPABASE_ADMIN_KEY;

if (!supabaseAdminKey) {
  throw new Error(
    "SUPABASE_ADMIN_KEY não foi encontrada no arquivo .env."
  );
}

const supabaseAdmin =
  createClient(
    supabaseUrl,
    supabaseAdminKey
  );


// ==========================================================
// EXPORTAR
// ==========================================================

module.exports = {
  supabase,
  supabaseAdmin
};