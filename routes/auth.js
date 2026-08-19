// ==========================================================
// EVOLUA+
// ROTAS DE AUTENTICAÇÃO
// ==========================================================

const express =
  require("express");

const router =
  express.Router();

const supabase =
  require(
    "../config/supabase"
  );


// ==========================================================
// POST /api/auth/login
// ==========================================================

router.post(
  "/login",
  async (req, res) => {

    try {

      const {
        email,
        senha
      } =
        req.body;


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


      // ====================================================
      // AUTENTICAR
      // ====================================================

      const {
        data:
          authData,

        error:
          authError
      } =
        await supabase.auth
          .signInWithPassword({

            email:
              email
                .trim()
                .toLowerCase(),

            password:
              senha

          });


      if (authError) {

        return res
          .status(401)
          .json({

            error:
              "E-mail ou senha incorretos."

          });

      }


      const userId =
        authData.user.id;


      // ====================================================
      // BUSCAR PERFIL
      // ====================================================

      const {
        data:
          usuario,

        error:
          profileError
      } =
        await supabase
          .from(
            "usuarios"
          )
          .select(
            `
              id,
              nome,
              email,
              cargo,
              perfil,
              ativo
            `
          )
          .eq(
            "id",
            userId
          )
          .single();


      if (
        profileError ||
        !usuario
      ) {

        return res
          .status(404)
          .json({

            error:
              "Perfil do usuário não encontrado."

          });

      }


      if (
        usuario.ativo ===
        false
      ) {

        return res
          .status(403)
          .json({

            error:
              "Usuário inativo."

          });

      }


      return res.json({

        access_token:
          authData.session.access_token,

        usuario

      });


    } catch (error) {

      console.error(
        "Erro no login:",
        error
      );


      return res
        .status(500)
        .json({

          error:
            "Erro interno no login."

        });

    }

  }
);


module.exports =
  router;