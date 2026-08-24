// ==========================================================
// EVOLUA+
// ROTAS DE USUÁRIOS
// ==========================================================
//
// RESPONSABILIDADES:
//
// GET /api/usuarios
//
// - validar o administrador logado;
// - retornar SOMENTE colaboradores;
// - retornar SOMENTE colaboradores do setor do Admin.
//
// POST /api/usuarios
//
// - validar o administrador logado;
// - criar colaboradores;
// - criar administradores de setor;
// - criar usuário no Supabase Auth;
// - criar perfil na tabela "usuario".
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
//
// Utilizado para:
//
// - validar token;
// - consultas normais.
//
// ==========================================================

const supabase =
  require(
    "../config/supabase"
  );



// ==========================================================
// SUPABASE ADMIN
// ==========================================================
//
// Utilizado para:
//
// - criar usuário no Auth;
// - excluir usuário do Auth em rollback;
// - operações administrativas.
//
// IMPORTANTE:
//
// A chave administrativa fica somente no backend.
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
// Não permitimos criar outro:
//
// admin_principal
//
// pela interface.
//
// O Admin Principal inicial continua sendo
// um usuário especial.
//
// ==========================================================

const allowedCreationProfiles = [

  "admin_setor",

  "colaborador"

];



// ==========================================================
// PEGAR TOKEN BEARER
// ==========================================================
//
// O frontend envia:
//
// Authorization: Bearer TOKEN
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
// Fluxo:
//
// access_token
//      ↓
// Supabase Auth
//      ↓
// UUID
//      ↓
// tabela usuario
//      ↓
// perfil / setor / ativo
//
// ==========================================================

async function getLoggedUser(
  req
) {

  // ========================================================  
  // TOKEN
  // ========================================================

  const token =
    getBearerToken(
      req
    );


  if (
    !token
  ) {

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
    authError
    ||
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
  // UUID
  // ========================================================

  const userId =
    authData
      .user
      .id;



  // ========================================================
  // BUSCAR PERFIL PROFISSIONAL
  // ========================================================

  const {

    data:
      profile,

    error:
      profileError

  } =
    await supabaseAdmin
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



  // ========================================================
  // PERFIL NÃO ENCONTRADO
  // ========================================================

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
  // INATIVO
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



  return {

    user:
      profile,

    authUser:
      authData.user

  };

}



// ==========================================================
// VERIFICAR SE É ADMINISTRADOR
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
// NORMALIZAR TEXTO
// ==========================================================

function normalizeText(
  value
) {

  return String(
    value || ""
  ).trim();

}



// ==========================================================
// NORMALIZAR E-MAIL
// ==========================================================

function normalizeEmail(
  value
) {

  return String(
    value || ""
  )
    .trim()
    .toLowerCase();

}



// ==========================================================
// ==========================================================
// GET /api/usuarios
// ==========================================================
// ==========================================================
//
// NOVA REGRA:
//
// A aba "Funcionários" NÃO é uma lista
// administrativa de todos os usuários.
//
// Ela representa:
//
// "FUNCIONÁRIOS QUE ESTE ADMIN GERENCIA"
//
// Portanto:
//
// 1. somente perfil = colaborador;
//
// 2. somente setor = setor do Admin.
//
// Essa regra vale para:
//
// admin_principal
// admin_setor
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
      // IDENTIFICAR ADMIN LOGADO
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



      const loggedAdmin =
        authResult.user;



      // ====================================================
      // SOMENTE ADMINISTRADORES
      // ====================================================

      if (
        !isAdmin(
          loggedAdmin
        )
      ) {

        return res
          .status(403)
          .json({

            error:
              "Você não possui permissão para visualizar funcionários."

          });

      }



      // ====================================================
      // ADMIN PRECISA TER SETOR
      // ====================================================

      if (
        !loggedAdmin.setor
      ) {

        return res
          .status(400)
          .json({

            error:
              "O administrador não possui um setor definido."

          });

      }



      // ====================================================
      // BUSCAR FUNCIONÁRIOS
      // ====================================================
      //
      // DUAS REGRAS IMPORTANTES:
      //
      // perfil = colaborador
      //
      // setor = setor do Admin
      //
      // NÃO existe mais:
      //
      // admin_principal vê todo mundo.
      //
      // ====================================================

      const {

        data:
          employees,

        error

      } =
        await supabaseAdmin
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

          // Somente funcionários.
          .eq(
            "perfil",
            "colaborador"
          )

          // Somente setor do Admin logado.
          .eq(
            "setor",
            loggedAdmin.setor
          )

          .order(
            "nome",
            {

              ascending:
                true

            }
          );



      // ====================================================
      // ERRO
      // ====================================================

      if (
        error
      ) {

        console.error(
          "Erro Supabase ao buscar funcionários:",
          error
        );


        return res
          .status(500)
          .json({

            error:
              "Não foi possível buscar os funcionários.",

            details:
              error.message

          });

      }



      // ====================================================
      // RETORNAR FUNCIONÁRIOS DO SETOR
      // ====================================================

      return res.json(
        employees || []
      );


    } catch (
      error
    ) {

      console.error(
        "Erro inesperado ao buscar funcionários:",
        error
      );


      return res
        .status(500)
        .json({

          error:
            "Erro interno ao buscar funcionários."

        });

    }

  }
);



// ==========================================================
// ==========================================================
// POST /api/usuarios
// ==========================================================
// ==========================================================
//
// O Admin pode criar:
//
// 1. COLABORADOR
//
//    obrigatoriamente no próprio setor.
//
//
// 2. ADMINISTRADOR DE SETOR
//
//    pode ser criado para qualquer setor.
//
//
// Exemplos:
//
// Admin Tecnologia
//
// criar colaborador Financeiro
// ❌ NÃO
//
// criar colaborador Tecnologia
// ✅ SIM
//
// criar Admin Financeiro
// ✅ SIM
//
// criar Admin RH
// ✅ SIM
//
// ==========================================================

router.post(
  "/",
  async (
    req,
    res
  ) => {

    let createdAuthUserId =
      null;


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
      // SOMENTE ADMINS
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

      let {

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
      // NORMALIZAÇÃO
      // ====================================================

      nome =
        normalizeText(
          nome
        );


      matricula =
        normalizeText(
          matricula
        );


      email =
        normalizeEmail(
          email
        );


      senha =
        String(
          senha || ""
        );


      cargo =
        normalizeText(
          cargo
        );


      setor =
        normalizeText(
          setor
        );


      perfil =
        normalizeText(
          perfil
        );



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
      // SENHA
      // ====================================================

      if (
        senha.length < 6
      ) {

        return res
          .status(400)
          .json({

            error:
              "A senha precisa possuir pelo menos 6 caracteres."

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
      // REGRA PARA COLABORADOR
      // ====================================================
      //
      // TODO Admin só cria colaboradores
      // no próprio setor.
      //
      // Não confiamos no setor enviado pelo frontend.
      //
      // Forçamos:
      //
      // setor = creatorAdmin.setor
      //
      // ====================================================

      if (
        perfil ===
        "colaborador"
      ) {

        if (
          !creatorAdmin.setor
        ) {

          return res
            .status(400)
            .json({

              error:
                "O administrador não possui um setor definido."

            });

        }


        setor =
          creatorAdmin.setor;

      }



      // ====================================================
      // REGRA PARA ADMIN DE SETOR
      // ====================================================
      //
      // Qualquer administrador pode criar
      // outro admin_setor.
      //
      // Nesse caso o setor selecionado no formulário
      // será respeitado.
      //
      // ====================================================

      if (
        perfil ===
        "admin_setor"
      ) {

        if (
          !allowedSectors.includes(
            setor
          )
        ) {

          return res
            .status(400)
            .json({

              error:
                "Setor do administrador inválido."

            });

        }

      }



      // ====================================================
      // VALIDAR SETOR FINAL
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
      // VERIFICAR E-MAIL DUPLICADO
      // ====================================================

      const {

        data:
          existingEmail,

        error:
          emailCheckError

      } =
        await supabaseAdmin
          .from(
            "usuario"
          )
          .select(
            "id"
          )
          .eq(
            "email",
            email
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
        await supabaseAdmin
          .from(
            "usuario"
          )
          .select(
            "id"
          )
          .eq(
            "matricula",
            matricula
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
      // CRIAR USUÁRIO NO SUPABASE AUTH
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
              email,

            password:
              senha,

            email_confirm:
              true,


            // ==================================================
            // METADADOS
            // ==================================================

            user_metadata: {

              nome:
                nome,

              matricula:
                matricula,

              cargo:
                cargo,

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
      // UUID GERADO PELO AUTH
      // ====================================================

      createdAuthUserId =
        authData
          ?.user
          ?.id;



      if (
        !createdAuthUserId
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
        await supabaseAdmin
          .from(
            "usuario"
          )
          .insert({

            id:
              createdAuthUserId,

            nome:
              nome,

            email:
              email,

            matricula:
              matricula,

            cargo:
              cargo,

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
      // O usuário já existe no Auth.
      //
      // Se o INSERT falhar, apagamos o usuário
      // do Auth para não deixar registros incompletos.
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
              createdAuthUserId
            );



        if (
          rollbackError
        ) {

          console.error(
            "Erro ao desfazer criação no Auth:",
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


    } catch (
      error
    ) {

      console.error(
        "Erro inesperado ao criar usuário:",
        error
      );



      // ====================================================
      // ROLLBACK EXTRA
      // ====================================================
      //
      // Caso aconteça um erro inesperado DEPOIS
      // da criação no Auth, tentamos remover
      // o usuário criado.
      //
      // ====================================================

      if (
        createdAuthUserId
      ) {

        try {

          await supabaseAdmin
            .auth
            .admin
            .deleteUser(
              createdAuthUserId
            );

        } catch (
          rollbackError
        ) {

          console.error(
            "Erro no rollback do Auth:",
            rollbackError
          );

        }

      }



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