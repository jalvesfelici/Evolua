const supabase = require('./config/supabase');

async function testarConexao() {
    const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .limit(1);

    if (error) {
        console.log('Erro ao conectar:', error.message);
        return;
    }

    console.log('Conexão com Supabase funcionando!');
    console.log(data);
}

testarConexao();