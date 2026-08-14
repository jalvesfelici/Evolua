const express = require('express');
const supabase = require('../config/supabase');

const router = express.Router();

router.post('/login', async (req, res) => {
    const { email, senha } = req.body;

    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: senha
    });

    if (error) {
        return res.status(401).send('Usuário ou senha inválidos.');
    }

    res.send(`Login realizado com sucesso! Bem-vindo, ${data.user.email}`);
});

module.exports = router;