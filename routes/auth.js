const express = require('express');
const supabase = require('../config/supabase');

const router = express.Router();

router.post('/login', async (req, res) => {
    try {
        const { email, senha } = req.body;

        if (!email || !senha) {
            return res.status(400).json({
                error: 'Informe e-mail e senha.'
            });
        }

        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: email.trim().toLowerCase(),
            password: senha
        });

        if (authError) {
            return res.status(401).json({
                error: 'E-mail ou senha incorretos.'
            });
        }

        const userId = authData.user.id;
        const { data: usuario, error: profileError } = await supabase
            .from('usuario')
            .select('id, nome, email, matricula, cargo, setor, perfil, ativo')
            .eq('id', userId)
            .single();

        if (profileError && profileError.code !== 'PGRST116') {
            console.error('Erro ao buscar perfil:', profileError);
            return res.status(500).json({
                error: 'Não foi possível consultar o perfil do usuário.'
            });
        }

        const metadata = authData.user.user_metadata || {};
        const usuarioFinal = usuario || {
            id: userId,
            nome: metadata.nome || authData.user.email.split('@')[0],
            email: authData.user.email,
            cargo: metadata.cargo || null,
            perfil: 'colaborador',
            ativo: true
        };

        if (usuarioFinal.ativo === false) {
            return res.status(403).json({
                error: 'Usuário inativo.'
            });
        }

        return res.json({
            access_token: authData.session.access_token,
            usuario: usuarioFinal
        });
    } catch (error) {
        console.error('Erro no login:', error);
        return res.status(500).json({
            error: 'Erro interno no login.'
        });
    }
});

module.exports = router;
