// ==========================================================
// PORTAL DE CARREIRAS
// SERVIDOR PRINCIPAL
// ==========================================================

// Importamos o Express.
const express = require("express");

// Importamos o módulo path do Node.js.
const path = require("path");


// ==========================================================
// CRIAR SERVIDOR
// ==========================================================

const app = express();


// Porta utilizada pelo sistema.
const PORT =
  process.env.PORT || 3000;


// ==========================================================
// PERMITIR RECEBER JSON
// ==========================================================
//
// Necessário para receber dados enviados pelo frontend.
//
// Exemplo:
//
// fetch("/api/cursos", {
//   method: "POST",
//   body: JSON.stringify(...)
// });
//
app.use(
  express.json()
);


// ==========================================================
// DISPONIBILIZAR A PASTA VIEWS
// ==========================================================
//
// Nossa estrutura é:
//
// views/
//   admin/
//     index.html
//     style.css
//     app.js
//
// Dessa forma o Express poderá acessar esses arquivos.
//
app.use(
  express.static(
    path.join(__dirname, "views")
  )
);


// ==========================================================
// ROTAS DOS CURSOS
// ==========================================================

const cursosRoutes =
  require("./routes/cursos");


app.use(
  "/api/cursos",
  cursosRoutes
);


// ==========================================================
// ROTA INICIAL
// ==========================================================
//
// Quando acessarmos:
//
// http://localhost:3000
//
// redirecionaremos automaticamente para:
//
// http://localhost:3000/admin/
//
app.get(
  "/",
  (req, res) => {

    res.redirect(
      "/admin/"
    );

  }
);


// ==========================================================
// ROTA DE TESTE DA API
// ==========================================================

app.get(
  "/api/status",
  (req, res) => {

    res.json({

      status:
        "ok",

      mensagem:
        "Servidor do Portal de Carreiras funcionando."

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
      "Portal de Carreiras"
    );

    console.log(
      `Servidor rodando em http://localhost:${PORT}`
    );

    console.log(
      `Admin: http://localhost:${PORT}/admin/`
    );

    console.log(
      `API: http://localhost:${PORT}/api/cursos`
    );

    console.log(
      "=============================================="
    );

  }
);