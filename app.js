const express = require('express');
const path = require('path');
const authRoutes = require('./routes/auth');
const cursosRoutes = require('./routes/cursos');

const app = express();
const PORT = 3000;

app.set('view engine', 'ejs');

// Permite acessar arquivos da pasta public
app.use(express.static('public'));
app.use(express.static(path.join(__dirname, 'views', 'login')));
app.use(express.static(path.join(__dirname, 'views', 'Ferias')));
app.use('/treinamentos', express.static(path.join(__dirname, 'views', 'treinamentos')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'login', 'index.html'));
});

app.get('/ferias', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'Ferias', 'ferias.html'));
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/auth', authRoutes);
app.use('/api/cursos', cursosRoutes);

app.listen(PORT, () => {
    console.log(`Evolua+ rodando na porta ${PORT}`);
});