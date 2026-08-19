// ==========================================================
// EVOLUA+
// SERVIDOR PRINCIPAL
// ==========================================================

const express =
  require(
    "express"
  );


const path =
  require(
    "path"
  );


const app =
  express();


const PORT =
  process.env.PORT || 3000;


// ==========================================================
// JSON
// ==========================================================

app.use(
  express.json()
);


// ==========================================================
// ARQUIVOS DAS TELAS
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
// AUTENTICAÇÃO
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
// CURSOS
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
// USUÁRIOS
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
// ROTA INICIAL
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
// STATUS
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
// API NÃO ENCONTRADA
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
// INICIAR
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
      `API Login: http://localhost:${PORT}/api/auth/login`
    );

    console.log(
      `API Usuários: http://localhost:${PORT}/api/usuarios`
    );

    console.log(
      `API Cursos: http://localhost:${PORT}/api/cursos`
    );

    console.log(
      `Status: http://localhost:${PORT}/api/status`
    );

    console.log(
      "=============================================="
    );

  }
);