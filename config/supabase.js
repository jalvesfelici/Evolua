// ==========================================================
// CONEXÃO COM O SUPABASE
// ==========================================================

// Carrega as variáveis que estão no arquivo .env.
require("dotenv").config();

// Importa a função responsável por criar a conexão.
const { createClient } = require("@supabase/supabase-js");


// Pegamos as informações armazenadas no .env.
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;


// Criamos a conexão com o Supabase.
const supabase = createClient(
  supabaseUrl,
  supabaseKey
);


// Exportamos para poder utilizar em outros arquivos,
// como routes/cursos.js.
module.exports = supabase;