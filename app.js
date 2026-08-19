const express = require('express');
const path = require('path');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = 3000;

app.set('view engine', 'ejs');

// Permite acessar arquivos da pasta public
app.use(express.static('public'));
app.use(express.static(path.join(__dirname, 'views', 'Ferias')));

app.get('/', (req, res) => {
    res.render('login');
});

app.get('/ferias', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'Ferias', 'ferias.html'));
});

app.use(express.urlencoded({ extended: true }));
app.use(authRoutes);

app.listen(PORT, () => {
    console.log(`Evolua+ rodando na porta ${PORT}`);
});