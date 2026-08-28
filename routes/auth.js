// ==========================================================
// EVOLUA+
// ROTAS DE AUTENTICAÇÃO
// ==========================================================

const express =
  require(
    "express"
  );


const router =
  express.Router();


// Importa ambos os clientes configurados
const supabase = require("../config/supabase");
const supabaseAdmin = require("../config/supabaseAdmin");


// ==========================================================
// POST /api/auth/login
// ==========================================================

router.post(
  "/login",
  async (req, res) => {

    try {

      // ====================================================
      // DADOS RECEBIDOS
      // ====================================================

      const {
        email,
        senha
      } =
        req.body;


      // ====================================================
      // VALIDAÇÃO
      // ====================================================

      if (
        !email ||
        !senha
      ) {

        return res
          .status(400)
          .json({

            error:
              "Informe e-mail e senha."

          });

      }


      const normalizedEmail =
        String(email)
          .trim()
          .toLowerCase();


      // ====================================================
      // LOGIN NO SUPABASE AUTH
      // ====================================================

      const {
        data:
          authData,

        error:
          authError

      } =
        await supabase
          .auth
          .signInWithPassword({

            email:
              normalizedEmail,

            password:
              senha

          });


      // ====================================================
      // CREDENCIAIS INCORRETAS
      // ====================================================

      if (
        authError
      ) {

        console.error(
          "Erro do Supabase Auth:",
          authError.message
        );


        return res
          .status(401)
          .json({

            error:
              "E-mail ou senha incorretos."

          });

      }


      // ====================================================
      // VALIDAR SESSÃO
      // ====================================================

      if (
        !authData.user ||
        !authData.session
      ) {

        return res
          .status(500)
          .json({

            error:
              "Não foi possível criar a sessão."

          });

      }


      const userId =
        authData.user.id;


      // ====================================================
      // BUSCAR PERFIL NA TABELA usuario
      // ====================================================

      const {
        data:
          usuario,

        error:
          profileError

      } =
        await supabase
          .from(
            "usuario"
          )
          .select(
            `
              id,
              nome,
              email,
              matricula,
              cargo,
              setor,
              perfil,
              ativo
            `
          )
          .eq(
            "id",
            userId
          )
          .maybeSingle();


      if (
        profileError
      ) {

        console.error(
          "Erro ao buscar perfil:",
          profileError
        );


        return res
          .status(500)
          .json({

            error:
              "Não foi possível carregar os dados do usuário."

          });

      }


      if (!usuario) {

        return res
          .status(404)
          .json({

            error:
              "Perfil do usuário não encontrado."

          });

      }


      // ====================================================
      // USUÁRIO INATIVO
      // ====================================================

      if (
        usuario.ativo ===
        false
      ) {

        return res
          .status(403)
          .json({

            error:
              "Este usuário está inativo."

          });

      }


      // ====================================================
      // SUCESSO
      // ====================================================

      return res
        .status(200)
        .json({

          access_token:
            authData
              .session
              .access_token,

          usuario:
            usuario

        });


    } catch (error) {

      console.error(
        "Erro inesperado no login:",
        error
      );


      return res
        .status(500)
        .json({

          error:
            "Erro interno ao realizar o login."

        });

    }

  }
);


// ==========================================================
// EXPORTAR
// ==========================================================

module.exports =
  router;