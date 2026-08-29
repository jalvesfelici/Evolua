const express = require("express");
const path = require("path");

const authRoutes = require("./routes/auth");
const usuariosRoutes = require("./routes/usuarios");
const cursosRoutes = require("./routes/cursos");
const feriasRoutes = require("./routes/ferias");
const treinamentosRoutes = require("./routes/treinamentos");
const feedbacksRoutes = require("./routes/feedbacks");
const pontoRoutes = require("./routes/ponto_r");

const app = express();

const PORT = process.env.PORT || 3000;

// ==========================================================
// MIDDLEWARES
// ==========================================================

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true
  })
);

app.use(
  express.static(
    path.join(
      __dirname,
      "views"
    )
  )
);

// ==========================================================
// ROTAS DA API
// ==========================================================

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/usuarios",
  usuariosRoutes
);

app.use(
  "/api/cursos",
  cursosRoutes
);

app.use(
  "/api/ferias",
  feriasRoutes
);

app.use(
  "/api/treinamentos",
  treinamentosRoutes
);

app.use(
  "/api/feedbacks",
  feedbacksRoutes
);

app.use(
  "/api/ponto",
  pontoRoutes
);

// ==========================================================
// STATUS DA API
// ==========================================================

app.get(
  "/api/status",
  (req, res) => {
    return res.json({
      status: "ok",
      mensagem:
        "Servidor do Evolua+ funcionando."
    });
  }
);

// ==========================================================
// ROTAS DAS TELAS
// ==========================================================

app.get(
  "/",
  (req, res) => {
    return res.redirect(
      "/login/"
    );
  }
);

app.get(
  "/login",
  (req, res) => {
    return res.redirect(
      "/login/"
    );
  }
);

app.get(
  "/admin",
  (req, res) => {
    return res.redirect(
      "/admin/"
    );
  }
);

app.get(
  "/treinamentos",
  (req, res) => {
    return res.redirect(
      "/treinamentos/"
    );
  }
);

app.get(
  "/ferias",
  (req, res) => {
    return res.redirect(
      "/ferias/"
    );
  }
);

app.get(
  "/feedbacks",
  (req, res) => {
    return res.redirect(
      "/feedbacks/"
    );
  }
);

app.get(
  "/ponto",
  (req, res) => {
    return res.redirect(
      "/ponto/"
    );
  }
);

// ==========================================================
// API NÃO ENCONTRADA
// ==========================================================

app.use(
  "/api",
  (req, res) => {
    return res
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

    if (res.headersSent) {
      return next(error);
    }

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
      "EVOLUA+"
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
      `Ponto: http://localhost:${PORT}/ponto/`
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
      `API Ponto: http://localhost:${PORT}/api/ponto`
    );

    console.log(
      `API Jornadas: http://localhost:${PORT}/api/ponto/admin/jornadas`
    );

    console.log(
      `Status: http://localhost:${PORT}/api/status`
    );

    console.log(
      "=============================================="
    );
  }
);