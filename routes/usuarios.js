// ==========================================================
// EVOLUA+
// ROTAS DE USUÁRIOS
// ==========================================================

const express =
  require(
    "express"
  );


const router =
  express.Router();


const supabase =
  require(
    "../config/supabase"
  );


const supabaseAdmin =
  require(
    "../config/supabaseAdmin"
  );


// ==========================================================
// SETORES
// ==========================================================

const allowedSectors = [

  "Operacional",

  "Logística",

  "Administrativo",

  "Tecnologia",

  "RH",

  "Financeiro",

  "Marketing"

];


// ==========================================================
// PERFIS QUE PODEM SER CRIADOS
// ==========================================================

const allowedCreationProfiles = [

  "admin_setor",

  "colaborador"

];


// ==========================================================
// PEGAR BEARER TOKEN
// ==========================================================

function getBearerToken(
  req
) {

  const authorization =
    req.headers.authorization;


  if (!authorization) {

    return null;

  }


  const parts =
    authorization.split(
      " "
    );


  if (
    parts.length !== 2
  ) {

    return null;

  }


  if (
    parts[0].toLowerCase() !==
    "bearer"
  ) {

    return null;

  }


  return parts[1];

}


// ==========================================================
// IDENTIFICAR USUÁRIO LOGADO
// ==========================================================

async function getLoggedUser(
  req
) {

  const token =
    getBearerToken(
      req
    );


  if (!token) {

    return {

      error:
        "Token de autenticação não informado.",

      status:
        401

    };

  }


  // ========================================================
  // VALIDAR TOKEN
  // ========================================================
  //
  // Aqui usamos o cliente normal.
  //
  // O token enviado é o access_token que veio
  // do login.
  //
  // ========================================================

  const {
    data:
      authData,

    error:
      authError

  } =
    await supabase
      .auth
      .getUser(
        token
      );


  if (
    authError ||
    !authData?.user
  ) {

    console.error(
      "Erro ao validar token:",
      authError
    );


    return {

      error:
        "Sessão inválida ou expirada.",

      status:
        401

    };

  }


  const userId =
    authData.user.id;


  // ========================================================
  // BUSCAR DADOS PROFISSIONAIS
  // ========================================================

  const {
    data:
      profile,

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


    return {

      error:
        "Não foi possível validar o perfil do usuário.",

      status:
        500

    };

  }


  if (!profile) {

    return {

      error:
        "Perfil do usuário não encontrado.",

      status:
        403

    };

  }


  if (
    profile.ativo ===
    false
  ) {

    return {

      error:
        "Este usuário está inativo.",

      status:
        403

    };

  }


  return {

    user:
      profile,

    authUser:
      authData.user

  };

}


// ==========================================================
// VERIFICAR ADMIN
// ==========================================================

function isAdmin(
  user
) {

  return (

    user.perfil ===
      "admin_principal"

    ||

    user.perfil ===
      "admin_setor"

  );

}


// ==========================================================
// GET /api/usuarios
// ==========================================================

router.get(
  "/",
  async (req, res) => {

    try {

      const authResult =
        await getLoggedUser(
          req
        );


      if (
        authResult.error
      ) {

        return res
          .status(
            authResult.status
          )
          .json({

            error:
              authResult.error

          });

      }


      const loggedUser =
        authResult.user;


      // ====================================================
      // SOMENTE ADMIN
      // ====================================================

      if (
        !isAdmin(
          loggedUser
        )
      ) {

        return res
          .status(403)
          .json({

            error:
              "Você não possui permissão para visualizar usuários."

          });

      }


      // ====================================================
      // CONSULTA
      // ====================================================

      let query =
        supabase
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
              ativo,
              criado_por,
              created_at
            `
          )
          .order(
            "nome",
            {
              ascending:
                true
            }
          );


      // ====================================================
      // ADMIN DE SETOR
      // ====================================================

      if (
        loggedUser.perfil ===
        "admin_setor"
      ) {

        query =
          query.eq(
            "setor",
            loggedUser.setor
          );

      }


      const {
        data,
        error
      } =
        await query;


      if (error) {

        console.error(
          "Erro ao buscar usuários:",
          error
        );


        return res
          .status(500)
          .json({

            error:
              "Não foi possível buscar os usuários.",

            details:
              error.message

          });

      }


      return res.json(
        data || []
      );


    } catch (error) {

      console.error(
        "Erro inesperado ao buscar usuários:",
        error
      );


      return res
        .status(500)
        .json({

          error:
            "Erro interno ao buscar usuários."

        });

    }

  }
);


// ==========================================================
// POST /api/usuarios
// ==========================================================

router.post(
  "/",
  async (req, res) => {

    try {

      // ====================================================
      // IDENTIFICAR QUEM ESTÁ CRIANDO
      // ====================================================

      const authResult =
        await getLoggedUser(
          req
        );


      if (
        authResult.error
      ) {

        return res
          .status(
            authResult.status
          )
          .json({

            error:
              authResult.error

          });

      }


      const creatorAdmin =
        authResult.user;


      // ====================================================
      // SOMENTE ADMIN
      // ====================================================

      if (
        !isAdmin(
          creatorAdmin
        )
      ) {

        return res
          .status(403)
          .json({

            error:
              "Você não possui permissão para criar usuários."

          });

      }


      // ====================================================
      // DADOS
      // ====================================================

      const {

        nome,

        matricula,

        email,

        senha,

        cargo,

        setor,

        perfil

      } =
        req.body;


      // ====================================================
      // CAMPOS OBRIGATÓRIOS
      // ====================================================

      if (
        !nome ||
        !matricula ||
        !email ||
        !senha ||
        !cargo ||
        !setor ||
        !perfil
      ) {

        return res
          .status(400)
          .json({

            error:
              "Preencha todos os campos obrigatórios."

          });

      }


      // ====================================================
      // NORMALIZAÇÃO
      // ====================================================

      const normalizedEmail =
        String(email)
          .trim()
          .toLowerCase();


      const normalizedName =
        String(nome)
          .trim();


      const normalizedRegistration =
        String(matricula)
          .trim();


      const normalizedRole =
        String(cargo)
          .trim();


      // ====================================================
      // SENHA
      // ====================================================

      if (
        String(senha).length < 6
      ) {

        return res
          .status(400)
          .json({

            error:
              "A senha precisa possuir pelo menos 6 caracteres."

          });

      }


      // ====================================================
      // SETOR
      // ====================================================

      if (
        !allowedSectors.includes(
          setor
        )
      ) {

        return res
          .status(400)
          .json({

            error:
              "Setor inválido."

          });

      }


      // ====================================================
      // PERFIL
      // ====================================================

      if (
        !allowedCreationProfiles.includes(
          perfil
        )
      ) {

        return res
          .status(400)
          .json({

            error:
              "Perfil de usuário inválido."

          });

      }


      // ====================================================
      // ADMIN DE SETOR NÃO CRIA ADMIN
      // ====================================================

      if (
        creatorAdmin.perfil ===
          "admin_setor"
        &&
        perfil ===
          "admin_setor"
      ) {

        return res
          .status(403)
          .json({

            error:
              "Somente o Administrador Principal pode criar administradores."

          });

      }


      // ====================================================
      // ADMIN DE SETOR SÓ CRIA NO PRÓPRIO SETOR
      // ====================================================

      if (
        creatorAdmin.perfil ===
          "admin_setor"
        &&
        creatorAdmin.setor !==
          setor
      ) {

        return res
          .status(403)
          .json({

            error:
              "Você só pode criar usuários do seu próprio setor."

          });

      }


      // ====================================================
      // E-MAIL DUPLICADO
      // ====================================================

      const {
        data:
          existingEmail,

        error:
          emailCheckError

      } =
        await supabase
          .from(
            "usuario"
          )
          .select(
            "id"
          )
          .eq(
            "email",
            normalizedEmail
          )
          .maybeSingle();


      if (
        emailCheckError
      ) {

        return res
          .status(500)
          .json({

            error:
              "Não foi possível validar o e-mail.",

            details:
              emailCheckError.message

          });

      }


      if (
        existingEmail
      ) {

        return res
          .status(409)
          .json({

            error:
              "Já existe um usuário com este e-mail."

          });

      }


      // ====================================================
      // MATRÍCULA DUPLICADA
      // ====================================================

      const {
        data:
          existingRegistration,

        error:
          registrationCheckError

      } =
        await supabase
          .from(
            "usuario"
          )
          .select(
            "id"
          )
          .eq(
            "matricula",
            normalizedRegistration
          )
          .maybeSingle();


      if (
        registrationCheckError
      ) {

        return res
          .status(500)
          .json({

            error:
              "Não foi possível validar a matrícula.",

            details:
              registrationCheckError.message

          });

      }


      if (
        existingRegistration
      ) {

        return res
          .status(409)
          .json({

            error:
              "Já existe um usuário com esta matrícula."

          });

      }


      // ====================================================
      // CRIAR USUÁRIO NO AUTH
      // ====================================================

      const {
        data:
          authData,

        error:
          authError

      } =
        await supabaseAdmin
          .auth
          .admin
          .createUser({

            email:
              normalizedEmail,

            password:
              senha,

            email_confirm:
              true,

            user_metadata: {

              nome:
                normalizedName,

              matricula:
                normalizedRegistration,

              cargo:
                normalizedRole,

              setor:
                setor,

              perfil:
                perfil

            }

          });


      if (
        authError
      ) {

        console.error(
          "Erro no Auth:",
          authError
        );


        return res
          .status(400)
          .json({

            error:
              "Não foi possível criar o usuário no sistema de autenticação.",

            details:
              authError.message

          });

      }


      const userId =
        authData
          ?.user
          ?.id;


      if (!userId) {

        return res
          .status(500)
          .json({

            error:
              "O Supabase não retornou o ID do novo usuário."

          });

      }


      // ====================================================
      // SALVAR NA TABELA usuario
      // ====================================================

      const {
        data:
          profileData,

        error:
          profileError

      } =
        await supabase
          .from(
            "usuario"
          )
          .insert({

            id:
              userId,

            nome:
              normalizedName,

            email:
              normalizedEmail,

            matricula:
              normalizedRegistration,

            cargo:
              normalizedRole,

            setor:
              setor,

            perfil:
              perfil,

            ativo:
              true,

            criado_por:
              creatorAdmin.id

          })
          .select()
          .single();


      // ====================================================
      // ROLLBACK
      // ====================================================

      if (
        profileError
      ) {

        console.error(
          "Erro ao criar perfil:",
          profileError
        );


        await supabaseAdmin
          .auth
          .admin
          .deleteUser(
            userId
          );


        return res
          .status(500)
          .json({

            error:
              "Não foi possível salvar os dados profissionais.",

            details:
              profileError.message

          });

      }


      // ====================================================
      // SUCESSO
      // ====================================================

      return res
        .status(201)
        .json({

          message:
            perfil ===
              "admin_setor"

              ? "Administrador criado com sucesso."

              : "Funcionário criado com sucesso.",

          usuario:
            profileData

        });


    } catch (error) {

      console.error(
        "Erro inesperado ao criar usuário:",
        error
      );


      return res
        .status(500)
        .json({

          error:
            "Erro interno ao criar usuário."

        });

    }

  }
);


// ==========================================================
// EXPORTAR
// ==========================================================

module.exports =
  router;