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
// - disponibilizar as telas;
// - conectar as rotas da API;
// - iniciar o sistema na porta 3000.
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
// Necessário para receber dados enviados pelo frontend
// através de:
//
// POST
// PUT
// PATCH
//
// ==========================================================

app.use(
  express.json()
);



// ==========================================================
// ARQUIVOS ESTÁTICOS
// ==========================================================
//
// Estrutura:
//
// views/
//
// ├── login/
// ├── admin/
// ├── treinamentos/
// ├── ferias/
// └── feedbacks/
//
// Dessa forma:
//
// /login/
// /admin/
// /treinamentos/
// /ferias/
// /feedbacks/
//
// ficam disponíveis diretamente no navegador.
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
// Base:
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
// Base:
//
// /api/usuarios
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
// Base:
//
// /api/cursos
//
// Exemplos:
//
// GET   /api/cursos
// GET   /api/cursos/:id
// POST  /api/cursos
// PUT   /api/cursos/:id
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
// Base:
//
// /api/ferias
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
// TREINAMENTOS
// ==========================================================
//
// Arquivo:
//
// routes/treinamentos.js
//
// Base:
//
// /api/treinamentos
//
// COLABORADOR:
//
// GET
// /api/treinamentos
//
// GET
// /api/treinamentos/:cursoId
//
// POST
// /api/treinamentos/:cursoId/iniciar
//
// POST
// /api/treinamentos/:cursoId/atividades/:atividadeId
//
// POST
// /api/treinamentos/:cursoId/enviar
//
// POST
// /api/treinamentos/:cursoId/certificado-externo
//
//
// ADMIN:
//
// GET
// /api/treinamentos/admin/avaliacoes
//
// GET
// /api/treinamentos/admin/avaliacoes/:inscricaoId
//
// PATCH
// /api/treinamentos/admin/entregas/:entregaId
//
// PATCH
// /api/treinamentos/admin/avaliacoes/:inscricaoId
//
// POST
// /api/treinamentos/admin/avaliacoes/:inscricaoId/certificado
//
// ==========================================================

const treinamentosRoutes =
  require(
    "./routes/treinamentos"
  );


app.use(
  "/api/treinamentos",
  treinamentosRoutes
);



// ==========================================================
// FEEDBACKS
// ==========================================================
//
// Arquivo:
//
// routes/feedbacks.js
//
// Base:
//
// /api/feedbacks
//
//
// ----------------------------------------------------------
// COLABORADOR
// ----------------------------------------------------------
//
// GET
// /api/feedbacks
//
// Lista:
// - feedbacks recebidos;
// - solicitações feitas pelo colaborador.
//
//
// GET
// /api/feedbacks/:id
//
// Abre os detalhes de um feedback.
//
//
// POST
// /api/feedbacks/solicitacoes
//
// Cria uma solicitação de feedback.
//
//
// PATCH
// /api/feedbacks/:id/responder
//
// Responde um feedback enviado pelo Admin.
//
//
// PATCH
// /api/feedbacks/:id/ciente
//
// Marca um feedback ou resposta como ciente.
//
//
// ----------------------------------------------------------
// ADMIN
// ----------------------------------------------------------
//
// GET
// /api/feedbacks/admin
//
// Lista:
// - solicitações recebidas;
// - feedbacks enviados.
//
//
// GET
// /api/feedbacks/admin/colaboradores
//
// Lista colaboradores ativos do próprio setor.
//
//
// POST
// /api/feedbacks/admin
//
// Envia um novo feedback.
//
//
// GET
// /api/feedbacks/admin/:id
//
// Abre um feedback / solicitação.
//
//
// PATCH
// /api/feedbacks/admin/:id/responder
//
// Responde solicitação feita pelo colaborador.
//
// ==========================================================

const feedbacksRoutes =
  require(
    "./routes/feedbacks"
  );


app.use(
  "/api/feedbacks",
  feedbacksRoutes
);



// ==========================================================
// ==========================================================
// ROTAS DAS TELAS
// ==========================================================
// ==========================================================



// ==========================================================
// ROTA INICIAL
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
// LOGIN
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
// ADMIN
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
// TREINAMENTOS
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
// FÉRIAS
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
// FEEDBACKS
// ==========================================================
//
// Quando criarmos:
//
// views/feedbacks/index.html
//
// teremos:
//
// http://localhost:3000/feedbacks/
//
// ==========================================================

app.get(
  "/feedbacks",
  (
    req,
    res
  ) => {

    res.redirect(
      "/feedbacks/"
    );

  }
);



// ==========================================================
// STATUS DA API
// ==========================================================
//
// Teste:
//
// http://localhost:3000/api/status
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
// API NÃO ENCONTRADA
// ==========================================================
//
// IMPORTANTE:
//
// Precisa continuar DEPOIS de todas as APIs reais.
//
// Caso contrário:
//
// /api/feedbacks
//
// seria interceptado antes de chegar ao feedbacks.js.
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
// TRATAMENTO GLOBAL DE ERROS
// ==========================================================
//
// Garante que erros inesperados retornem JSON.
//
// Evita problemas como:
//
// Unexpected token '<'
//
// quando o frontend espera JSON.
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



    // ======================================================
    // MULTER - ARQUIVO MUITO GRANDE
    // ======================================================

    if (
      error.code ===
      "LIMIT_FILE_SIZE"
    ) {

      return res
        .status(400)
        .json({

          error:
            "O arquivo enviado ultrapassa o tamanho máximo permitido."

        });

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
      `Feedbacks: http://localhost:${PORT}/feedbacks/`
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
      `API Treinamentos: http://localhost:${PORT}/api/treinamentos`
    );


    console.log(
      `API Feedbacks: http://localhost:${PORT}/api/feedbacks`
    );


    console.log(
      `Status: http://localhost:${PORT}/api/status`
    );


    console.log(
      "=============================================="
    );

  }
);