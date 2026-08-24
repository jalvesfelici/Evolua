// ==========================================================
// EVOLUA+
// SERVIDOR PRINCIPAL
// ==========================================================
//
// RESPONSABILIDADES:
//
// - iniciar o servidor Node.js;
// - configurar o Express;
// - receber JSON;
// - disponibilizar arquivos das telas;
// - conectar as rotas da API;
// - redirecionar a rota inicial para o login;
// - iniciar o sistema na porta 3000.
//
// ==========================================================



// ==========================================================
// IMPORTAÇÕES
// ==========================================================

// Framework utilizado para criar o backend.
const express =
  require(
    "express"
  );


// Módulo nativo do Node.js para trabalhar
// com caminhos de arquivos.
const path =
  require(
    "path"
  );



// ==========================================================
// CRIAR APLICAÇÃO EXPRESS
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
// Permite receber:
//
// {
//   "nome": "...",
//   "email": "..."
// }
//
// nas requisições POST, PUT e PATCH.
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
//
// ├── login/
// ├── admin/
// ├── treinamentos/
// └── ferias/
//
// Dessa forma:
//
// /login/
// /admin/
// /treinamentos/
// /ferias/
//
// ficam acessíveis diretamente.
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
// ==========================================================
// ROTAS DA API
// ==========================================================
// ==========================================================



// ==========================================================
// AUTENTICAÇÃO
// ==========================================================
//
// Arquivo:
//
// routes/auth.js
//
// Endereço:
//
// /api/auth
//
// Exemplo:
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
// USUÁRIOS
// ==========================================================
//
// Arquivo:
//
// routes/usuarios.js
//
// Endereço:
//
// /api/usuarios
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
// CURSOS
// ==========================================================
//
// Arquivo:
//
// routes/cursos.js
//
// Endereço:
//
// /api/cursos
//
// Exemplos:
//
// GET   /api/cursos
// POST  /api/cursos
// PATCH /api/cursos/:id/desativar
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
// FÉRIAS
// ==========================================================
//
// Arquivo:
//
// routes/ferias.js
//
// Todas as rotas presentes naquele arquivo
// passam a começar com:
//
// /api/ferias
//
// Portanto:
//
// GET
// /api/ferias/minhas
//
// GET
// /api/ferias/solicitacoes
//
// POST
// /api/ferias/solicitacoes
//
// GET
// /api/ferias/admin/periodos/:usuarioId
//
// PUT
// /api/ferias/admin/periodos/:usuarioId
//
// GET
// /api/ferias/admin/solicitacoes
//
// PATCH
// /api/ferias/admin/solicitacoes/:id
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
// ==========================================================
// ROTAS DAS TELAS
// ==========================================================
// ==========================================================



// ==========================================================
// ROTA INICIAL
// ==========================================================
//
// Ao acessar:
//
// http://localhost:3000
//
// enviamos o usuário para:
//
// http://localhost:3000/login/
//
// ==========================================================

app.get(
  "/",
  (
    req,
    res
  ) => {

    res.redirect(
      "/login/"
    );

  }
);



// ==========================================================
// ROTA EXPLÍCITA DE FÉRIAS
// ==========================================================
//
// Tecnicamente o express.static já permite:
//
// /ferias/
//
// se existir:
//
// views/ferias/index.html
//
// Mas deixamos esta rota também para tornar
// o comportamento explícito.
//
// ==========================================================

app.get(
  "/ferias",
  (
    req,
    res
  ) => {

    res.redirect(
      "/ferias/"
    );

  }
);



// ==========================================================
// ROTA EXPLÍCITA DE TREINAMENTOS
// ==========================================================

app.get(
  "/treinamentos",
  (
    req,
    res
  ) => {

    res.redirect(
      "/treinamentos/"
    );

  }
);



// ==========================================================
// ROTA EXPLÍCITA DO ADMIN
// ==========================================================

app.get(
  "/admin",
  (
    req,
    res
  ) => {

    res.redirect(
      "/admin/"
    );

  }
);



// ==========================================================
// ROTA EXPLÍCITA DO LOGIN
// ==========================================================

app.get(
  "/login",
  (
    req,
    res
  ) => {

    res.redirect(
      "/login/"
    );

  }
);



// ==========================================================
// STATUS DO SERVIDOR
// ==========================================================
//
// Teste:
//
// http://localhost:3000/api/status
//
// Deve retornar:
//
// {
//   "status": "ok",
//   "mensagem": "..."
// }
//
// ==========================================================

app.get(
  "/api/status",
  (
    req,
    res
  ) => {

    res.json({

      status:
        "ok",

      mensagem:
        "Servidor do Evolua+ funcionando."

    });

  }
);



// ==========================================================
// ROTA DE API NÃO ENCONTRADA
// ==========================================================
//
// IMPORTANTE:
//
// Isto precisa ficar DEPOIS das rotas reais.
//
// Caso contrário:
//
// /api/ferias
// /api/usuarios
// /api/cursos
//
// poderiam ser interceptadas antes de chegar
// aos respectivos arquivos.
//
// ==========================================================

app.use(
  "/api",
  (
    req,
    res
  ) => {

    res
      .status(404)
      .json({

        error:
          "Rota da API não encontrada."

      });

  }
);



// ==========================================================
// TRATAMENTO DE ERRO GLOBAL
// ==========================================================
//
// Caso algum erro inesperado chegue até aqui,
// evitamos que o servidor responda HTML.
//
// Isso é importante porque nosso frontend executa:
//
// response.json()
//
// Se o Express devolvesse uma página HTML,
// teríamos erros semelhantes a:
//
// Unexpected token '<'
//
// ==========================================================

app.use(
  (
    error,
    req,
    res,
    next
  ) => {

    console.error(
      "Erro não tratado no servidor:",
      error
    );


    if (
      res.headersSent
    ) {

      return next(
        error
      );

    }


    return res
      .status(500)
      .json({

        error:
          "Erro interno do servidor."

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
      "----------------------------------------------"
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