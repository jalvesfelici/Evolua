const express = require('express');

const app = express();
const PORT = 3000;

app.set('view engine', 'ejs');

// Permite acessar arquivos da pasta public
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.render('login');
});

app.listen(PORT, () => {
    console.log(`Evolua+ rodando na porta ${PORT}`);
});