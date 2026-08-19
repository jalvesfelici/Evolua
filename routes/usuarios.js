// ==========================================================
// EVOLUA+
// ROTAS DE USUÁRIOS
// ==========================================================
//
// Este arquivo é responsável por:
//
// GET /api/usuarios
//
// - validar o usuário logado;
// - listar usuários;
// - limitar o admin de setor ao próprio setor.
//
// POST /api/usuarios
//
// - validar o usuário logado;
// - verificar permissões;
// - criar usuário no Supabase Auth;
// - salvar dados profissionais na tabela usuario.
//
// ==========================================================



// ==========================================================
// IMPORTAÇÕES
// ==========================================================

const express =
  require(
    "express"
  );


const router =
  express.Router();



// ==========================================================
// SUPABASE NORMAL
// ==========================================================

const supabase =
  require(
    "../config/supabase"
  );



// ==========================================================
// SUPABASE ADMIN
// ==========================================================
//
// Este cliente utiliza a chave secreta.
//
// Serve para:
//
// auth.admin.createUser()
// auth.admin.deleteUser()
//
// ==========================================================

const supabaseAdmin =
  require(
    "../config/supabaseAdmin"
  );



// ==========================================================
// SETORES PERMITIDOS
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
//
// Não colocamos admin_principal aqui.
//
// O Admin Principal inicial foi criado manualmente.
//
// ==========================================================

const allowedCreationProfiles = [

  "admin_setor",

  "colaborador"

];



// ==========================================================
// PEGAR TOKEN DO HEADER
// ==========================================================
//
// O navegador envia:
//
// Authorization: Bearer TOKEN
//
// Esta função extrai somente o TOKEN.
//
// ==========================================================

function getBearerToken(
  req
) {

  const authorization =
    req.headers.authorization;


  if (
    !authorization
  ) {

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
//
// Esta é uma das funções mais importantes.
//
// Fluxo:
//
// token
//   ↓
// Supabase Auth
//   ↓
// UUID do usuário
//   ↓
// tabela usuario
//   ↓
// perfil, setor, ativo etc.
//
// ==========================================================

async function getLoggedUser(
  req
) {

  // ========================================================
  // PEGAR TOKEN
  // ========================================================

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
  // VALIDAR TOKEN NO SUPABASE
  // ========================================================

  const {

    data:
      authData,

    error:
      authError

  } =
    await supabaseAdmin
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



  // ========================================================
  // UUID DO USUÁRIO
  // ========================================================

  const userId =
    authData
      .user
      .id;



  // ========================================================
  // BUSCAR PERFIL NA TABELA usuario
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
      "Erro ao buscar perfil do usuário:",
      profileError
    );


    return {

      error:
        "Não foi possível validar o perfil do usuário.",

      status:
        500

    };

  }



  if (
    !profile
  ) {

    return {

      error:
        "Perfil do usuário não encontrado.",

      status:
        403

    };

  }



  // ========================================================
  // USUÁRIO INATIVO
  // ========================================================

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



  // ========================================================
  // SUCESSO
  // ========================================================

  return {

    user:
      profile,

    authUser:
      authData.user

  };

}



// ==========================================================
// VERIFICAR SE É ADMIN
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
//
// ADMIN PRINCIPAL:
//
// vê todos os usuários.
//
// ADMIN DE SETOR:
//
// vê somente usuários do próprio setor.
//
// ==========================================================

router.get(
  "/",
  async (
    req,
    res
  ) => {

    try {

      // ====================================================
      // IDENTIFICAR USUÁRIO LOGADO
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


      const loggedUser =
        authResult.user;



      // ====================================================
      // SOMENTE ADMINISTRADORES
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
      // ========================================================
      //
      // Não usamos mais:
      //
      // ?setor=Tecnologia
      //
      // para decidir a permissão.
      //
      // O setor vem do próprio usuário logado.
      //
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



      // ====================================================
      // EXECUTAR
      // ====================================================

      const {

        data,

        error

      } =
        await query;



      if (
        error
      ) {

        console.error(
          "Erro Supabase ao buscar usuários:",
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



      // ====================================================
      // RETORNAR
      // ====================================================

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
//
// Recebe:
//
// {
//   nome,
//   matricula,
//   email,
//   senha,
//   cargo,
//   setor,
//   perfil
// }
//
// Não recebe mais:
//
// admin_id
//
// ==========================================================

router.post(
  "/",
  async (
    req,
    res
  ) => {

    try {

      // ====================================================
      // IDENTIFICAR ADMINISTRADOR LOGADO
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
      // SOMENTE ADMINS PODEM CRIAR USUÁRIOS
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
      // DADOS RECEBIDOS
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
      // NORMALIZAR DADOS
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
      // VALIDAR DADOS APÓS TRIM
      // ====================================================

      if (
        !normalizedName ||
        !normalizedRegistration ||
        !normalizedEmail ||
        !normalizedRole
      ) {

        return res
          .status(400)
          .json({

            error:
              "Existem campos obrigatórios vazios."

          });

      }



      // ====================================================
      // VALIDAR SENHA
      // ====================================================

      if (
        String(senha)
          .length < 6
      ) {

        return res
          .status(400)
          .json({

            error:
              "A senha precisa possuir pelo menos 6 caracteres."

          });

      }



      // ====================================================
      // VALIDAR SETOR
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
      // VALIDAR PERFIL
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
      // VERIFICAR E-MAIL DUPLICADO
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

        console.error(
          "Erro ao verificar e-mail:",
          emailCheckError
        );


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
              "Já existe um usuário cadastrado com este e-mail."

          });

      }



      // ====================================================
      // VERIFICAR MATRÍCULA DUPLICADA
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

        console.error(
          "Erro ao verificar matrícula:",
          registrationCheckError
        );


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
              "Já existe um usuário cadastrado com esta matrícula."

          });

      }



      // ====================================================
      // CRIAR NO SUPABASE AUTH
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



      // ====================================================
      // ERRO NO AUTH
      // ====================================================

      if (
        authError
      ) {

        console.error(
          "Erro ao criar usuário no Supabase Auth:",
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



      // ====================================================
      // UUID GERADO
      // ====================================================

      const userId =
        authData
          ?.user
          ?.id;



      if (
        !userId
      ) {

        return res
          .status(500)
          .json({

            error:
              "O Supabase não retornou o ID do novo usuário."

          });

      }



      // ====================================================
      // CRIAR PERFIL NA TABELA usuario
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
      // ERRO AO CRIAR PERFIL
      // ====================================================
      //
      // Se isso acontecer, removemos também
      // o usuário que já foi criado no Auth.
      //
      // Assim não deixamos registros incompletos.
      //
      // ====================================================

      if (
        profileError
      ) {

        console.error(
          "Erro ao criar perfil:",
          profileError
        );


        const {

          error:
            rollbackError

        } =
          await supabaseAdmin
            .auth
            .admin
            .deleteUser(
              userId
            );



        if (
          rollbackError
        ) {

          console.error(
            "Erro ao desfazer criação do Auth:",
            rollbackError
          );

        }



        return res
          .status(500)
          .json({

            error:
              "Não foi possível salvar os dados profissionais do usuário.",

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
// EXPORTAR ROUTER
// ==========================================================

module.exports =
  router;