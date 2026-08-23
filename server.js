// ==========================================================
// EVOLUA+
// SERVIDOR PRINCIPAL
// ==========================================================
//
// Este arquivo é responsável por:
//
// - iniciar o servidor Node.js;
// - configurar o Express;
// - receber JSON do frontend;
// - disponibilizar as telas da pasta views;
// - registrar as rotas da API;
// - iniciar o servidor na porta 3000.
//
// ==========================================================



// ==========================================================
// IMPORTAÇÕES
// ==========================================================

const express =
  require(
    "express"
  );


const path =
  require(
    "path"
  );



// ==========================================================
// CRIAR APLICAÇÃO
// ==========================================================

const app =
  express();



// ==========================================================
// PORTA
// ==========================================================

const PORT =
  process.env.PORT || 3000;



// ==========================================================
// PERMITIR JSON
// ==========================================================
//
// Necessário para receber dados enviados pelo frontend.
//
// Exemplo:
//
// fetch("/api/usuarios", {
//   method: "POST",
//   headers: {
//     "Content-Type": "application/json"
//   },
//   body: JSON.stringify(...)
// });
//
// ==========================================================

app.use(
  express.json()
);



// ==========================================================
// DISPONIBILIZAR AS TELAS
// ==========================================================
//
// Estrutura esperada:
//
// views/
// ├── login/
// │   ├── index.html
// │   ├── style.css
// │   └── app.js
// │
// ├── admin/
// │   ├── index.html
// │   ├── style.css
// │   └── app.js
// │
// ├── treinamentos/
// │   ├── index.html
// │   ├── style.css
// │   └── app.js
// │
// └── ferias/
//     ├── index.html
//     ├── ferias.css
//     └── ferias.js
//
// ==========================================================

app.use(
  express.static(
    path.join(
      __dirname,
      "views"
    )
  )
);



// ==========================================================
// ROTAS DE AUTENTICAÇÃO
// ==========================================================
//
// Arquivo:
//
// routes/auth.js
//
// Rotas finais:
//
// POST /api/auth/login
//
// ==========================================================

const authRoutes =
  require(
    "./routes/auth"
  );


app.use(
  "/api/auth",
  authRoutes
);



// ==========================================================
// ROTAS DOS CURSOS
// ==========================================================
//
// Arquivo:
//
// routes/cursos.js
//
// Exemplos:
//
// GET  /api/cursos
// POST /api/cursos
//
// ==========================================================

const cursosRoutes =
  require(
    "./routes/cursos"
  );


app.use(
  "/api/cursos",
  cursosRoutes
);



// ==========================================================
// ROTAS DOS USUÁRIOS
// ==========================================================
//
// Arquivo:
//
// routes/usuarios.js
//
// Exemplos:
//
// GET  /api/usuarios
// POST /api/usuarios
//
// ==========================================================

const usuariosRoutes =
  require(
    "./routes/usuarios"
  );


app.use(
  "/api/usuarios",
  usuariosRoutes
);



// ==========================================================
// ROTAS DE FÉRIAS
// ==========================================================
//
// Arquivo:
//
// routes/ferias.js
//
// Exemplos:
//
// GET  /api/ferias/minhas
//
// GET  /api/ferias/solicitacoes
//
// POST /api/ferias/solicitacoes
//
// GET  /api/ferias/admin/solicitacoes
//
// PATCH /api/ferias/admin/solicitacoes/:id
//
// ==========================================================

const feriasRoutes =
  require(
    "./routes/ferias"
  );


app.use(
  "/api/ferias",
  feriasRoutes
);



// ==========================================================
// ROTA INICIAL
// ==========================================================
//
// Ao acessar:
//
// http://localhost:3000
//
// o sistema redireciona para:
//
// http://localhost:3000/login/
//
// ==========================================================

app.get(
  "/",
  (req, res) => {

    res.redirect(
      "/login/"
    );

  }
);



// ==========================================================
// ROTA DE STATUS
// ==========================================================
//
// Utilizada apenas para testar se o servidor
// está funcionando.
//
// Acesse:
//
// http://localhost:3000/api/status
//
// ==========================================================

app.get(
  "/api/status",
  (req, res) => {

    res.json({

      status:
        "ok",

      mensagem:
        "Servidor do Evolua+ funcionando."

    });

  }
);



// ==========================================================
// TRATAMENTO DE API NÃO ENCONTRADA
// ==========================================================
//
// IMPORTANTE:
//
// Este bloco deve ficar DEPOIS de todas
// as rotas reais.
//
// Caso contrário, ele poderia interceptar
// as requisições antes das rotas corretas.
//
// ==========================================================

app.use(
  "/api",
  (req, res) => {

    res
      .status(404)
      .json({

        erro:
          "Rota da API não encontrada."

      });

  }
);



// ==========================================================
// INICIAR SERVIDOR
// ==========================================================

app.listen(
  PORT,
  () => {

    console.log(
      "=============================================="
    );

    console.log(
      "EVOLUA+ - Portal de Gestão de Carreira"
    );

    console.log(
      "=============================================="
    );


    console.log(
      `Servidor: http://localhost:${PORT}`
    );


    console.log(
      `Login: http://localhost:${PORT}/login/`
    );


    console.log(
      `Admin: http://localhost:${PORT}/admin/`
    );


    console.log(
      `Treinamentos: http://localhost:${PORT}/treinamentos/`
    );


    console.log(
      `Férias: http://localhost:${PORT}/ferias/`
    );


    console.log(
      `API Login: http://localhost:${PORT}/api/auth/login`
    );


    console.log(
      `API Usuários: http://localhost:${PORT}/api/usuarios`
    );


    console.log(
      `API Cursos: http://localhost:${PORT}/api/cursos`
    );


    console.log(
      `API Férias: http://localhost:${PORT}/api/ferias`
    );


    console.log(
      `Status: http://localhost:${PORT}/api/status`
    );


    console.log(
      "=============================================="
    );

  }
);