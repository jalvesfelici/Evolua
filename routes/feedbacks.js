// ==========================================================
// EVOLUA+
// ROTAS DE FEEDBACKS
// ==========================================================
//
// FLUXOS SUPORTADOS:
//
// 1. ADMIN -> COLABORADOR
//
// Admin cria feedback
//      ↓
// colaborador visualiza
//      ↓
// responde OU marca como ciente
//
//
// 2. COLABORADOR -> ADMIN
//
// Colaborador solicita feedback
//      ↓
// Admin do mesmo setor recebe
//      ↓
// Admin responde
//      ↓
// colaborador visualiza
//      ↓
// marca como ciente
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



const supabase =
  require(
    "../config/supabase"
  );



const supabaseAdmin =
  require(
    "../config/supabaseAdmin"
  );



// ==========================================================
// CONSTANTES
// ==========================================================

const ADMIN_PROFILES = [
  "admin_principal",
  "admin_setor"
];


const FEEDBACK_TYPES = [
  "positivo",
  "desenvolvimento",
  "atencao"
];


const FEEDBACK_SUBJECTS = [
  "desempenho_geral",
  "desempenho_tecnico",
  "comunicacao",
  "organizacao",
  "produtividade",
  "relacionamento",
  "desenvolvimento_profissional",
  "outro"
];



// ==========================================================
// PEGAR TOKEN DO HEADER
// ==========================================================
//
// Esperamos:
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
    parts.length !==
    2
  ) {

    return null;

  }



  if (
    parts[0]
      .toLowerCase() !==
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
// TOKEN
//   ↓
// Supabase Auth
//   ↓
// UUID
//   ↓
// tabela usuario
//   ↓
// perfil + setor + ativo
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
    await supabaseAdmin
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
      "Erro ao validar token em feedbacks:",
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
  // PERFIL DO SISTEMA
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
      "Erro ao buscar perfil em feedbacks:",
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



  if (
    profile.ativo ===
    false
  ) {

    return {

      error:
        "Usuário inativo.",

      status:
        403

    };

  }



  return {

    user:
      profile

  };

}



// ==========================================================
// VALIDAR SE É COLABORADOR
// ==========================================================

function validateCollaborator(
  user
) {

  if (
    user.perfil !==
    "colaborador"
  ) {

    return {

      error:
        "Esta operação está disponível apenas para colaboradores.",

      status:
        403

    };

  }


  return null;

}



// ==========================================================
// VALIDAR ADMIN
// ==========================================================

function validateAdmin(
  user
) {

  if (
    !ADMIN_PROFILES.includes(
      user.perfil
    )
  ) {

    return {

      error:
        "Usuário sem permissão administrativa.",

      status:
        403

    };

  }


  return null;

}



// ==========================================================
// BUSCAR USUÁRIO POR ID
// ==========================================================

async function getUserById(
  userId
) {

  const {

    data,
    error

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
    error
  ) {

    throw error;

  }


  return data;

}



// ==========================================================
// BUSCAR VÁRIOS USUÁRIOS
// ==========================================================
//
// Evitamos depender de joins automáticos do Supabase,
// pois feedbacks possui duas FKs apontando para usuario.
//
// ==========================================================

async function getUsersByIds(
  ids
) {

  const uniqueIds =
    [
      ...new Set(
        ids.filter(
          Boolean
        )
      )
    ];



  if (
    uniqueIds.length ===
    0
  ) {

    return new Map();

  }



  const {

    data,
    error

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
      .in(
        "id",
        uniqueIds
      );



  if (
    error
  ) {

    throw error;

  }



  const map =
    new Map();


  (
    data || []
  )
    .forEach(
      user => {

        map.set(
          user.id,
          user
        );

      }
    );


  return map;

}



// ==========================================================
// ADICIONAR DADOS DOS USUÁRIOS AOS FEEDBACKS
// ==========================================================

async function enrichFeedbacks(
  feedbacks
) {

  if (
    !Array.isArray(
      feedbacks
    )
    ||
    feedbacks.length ===
    0
  ) {

    return [];

  }



  const ids =
    feedbacks.flatMap(
      feedback => [

        feedback.colaborador_id,

        feedback.admin_id

      ]
    );



  const users =
    await getUsersByIds(
      ids
    );



  return feedbacks.map(
    feedback => {

      return {

        ...feedback,

        colaborador:
          users.get(
            feedback.colaborador_id
          )
          ||
          null,

        admin:
          users.get(
            feedback.admin_id
          )
          ||
          null

      };

    }
  );

}



// ==========================================================
// BUSCAR ADMIN DE UM SETOR
// ==========================================================
//
// Uma solicitação criada pelo colaborador precisa possuir
// admin_id.
//
// Se houver mais de um Admin do setor, vinculamos inicialmente
// ao primeiro encontrado.
//
// Entretanto, a FILA administrativa é filtrada pelo setor
// do colaborador, portanto qualquer Admin daquele setor
// poderá responder.
//
// Quando alguém responder, admin_id é atualizado para o
// administrador que efetivamente respondeu.
//
// ==========================================================

async function findSectorAdmin(
  sector
) {

  const {

    data:
      sectorAdmins,

    error:
      adminError

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
          cargo,
          setor,
          perfil,
          ativo,
          created_at
        `
      )
      .eq(
        "setor",
        sector
      )
      .eq(
        "perfil",
        "admin_setor"
      )
      .eq(
        "ativo",
        true
      )
      .order(
        "created_at",
        {
          ascending:
            true
        }
      )
      .limit(
        1
      );



  if (
    adminError
  ) {

    throw adminError;

  }



  if (
    sectorAdmins
    &&
    sectorAdmins.length > 0
  ) {

    return sectorAdmins[0];

  }



  // ========================================================
  // FALLBACK
  // ========================================================
  //
  // Caso ainda não exista admin_setor, procuramos um
  // admin_principal ativo do mesmo setor.
  //
  // ========================================================

  const {

    data:
      principalAdmins,

    error:
      principalError

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
          cargo,
          setor,
          perfil,
          ativo,
          created_at
        `
      )
      .eq(
        "setor",
        sector
      )
      .eq(
        "perfil",
        "admin_principal"
      )
      .eq(
        "ativo",
        true
      )
      .order(
        "created_at",
        {
          ascending:
            true
        }
      )
      .limit(
        1
      );



  if (
    principalError
  ) {

    throw principalError;

  }



  return (
    principalAdmins?.[0]
    ||
    null
  );

}



// ==========================================================
// BUSCAR FEEDBACK
// ==========================================================

async function getFeedbackById(
  feedbackId
) {

  const {

    data,
    error

  } =
    await supabase
      .from(
        "feedbacks"
      )
      .select(
        "*"
      )
      .eq(
        "id",
        feedbackId
      )
      .maybeSingle();



  if (
    error
  ) {

    throw error;

  }


  return data;

}



// ==========================================================
// VERIFICAR SE FEEDBACK PERTENCE AO SETOR DO ADMIN
// ==========================================================

async function adminCanAccessFeedback(
  admin,
  feedback
) {

  const collaborator =
    await getUserById(
      feedback.colaborador_id
    );


  if (
    !collaborator
  ) {

    return {

      allowed:
        false,

      collaborator:
        null

    };

  }



  // ========================================================
  // REGRA DEFINITIVA
  // ========================================================
  //
  // Todo Admin possui setor.
  //
  // Feedbacks administrativos só podem envolver
  // colaboradores do mesmo setor.
  //
  // ========================================================

  return {

    allowed:
      collaborator.setor ===
      admin.setor,

    collaborator

  };

}



// ==========================================================
// ==========================================================
// ROTAS DO ADMIN
// ==========================================================
// ==========================================================
//
// IMPORTANTE:
//
// Definimos essas rotas ANTES de "/:id"
// para evitar que "admin" seja interpretado como ID.
//
// ==========================================================



// ==========================================================
// GET /api/feedbacks/admin
// ==========================================================
//
// Retorna:
//
// - solicitações feitas por colaboradores do setor;
// - feedbacks enviados pelo próprio setor.
//
// O frontend poderá separar:
//
// iniciado_por = colaborador
//
// iniciado_por = admin
//
// ==========================================================

router.get(
  "/admin",
  async (
    req,
    res
  ) => {

    try {

      // ====================================================
      // USUÁRIO LOGADO
      // ====================================================

      const session =
        await getLoggedUser(
          req
        );


      if (
        session.error
      ) {

        return res
          .status(
            session.status
          )
          .json({

            error:
              session.error

          });

      }



      const admin =
        session.user;



      // ====================================================
      // VALIDAR ADMIN
      // ====================================================

      const permissionError =
        validateAdmin(
          admin
        );


      if (
        permissionError
      ) {

        return res
          .status(
            permissionError.status
          )
          .json({

            error:
              permissionError.error

          });

      }



      // ====================================================
      // BUSCAR COLABORADORES DO SETOR
      // ====================================================

      const {

        data:
          collaborators,

        error:
          collaboratorsError

      } =
        await supabase
          .from(
            "usuario"
          )
          .select(
            "id"
          )
          .eq(
            "setor",
            admin.setor
          )
          .eq(
            "perfil",
            "colaborador"
          );



      if (
        collaboratorsError
      ) {

        throw collaboratorsError;

      }



      const collaboratorIds =
        (
          collaborators || []
        )
          .map(
            collaborator =>
              collaborator.id
          );



      if (
        collaboratorIds.length ===
        0
      ) {

        return res.json(
          []
        );

      }



      // ====================================================
      // FEEDBACKS DO SETOR
      // ====================================================

      const {

        data:
          feedbacks,

        error:
          feedbacksError

      } =
        await supabase
          .from(
            "feedbacks"
          )
          .select(
            "*"
          )
          .in(
            "colaborador_id",
            collaboratorIds
          )
          .order(
            "created_at",
            {
              ascending:
                false
            }
          );



      if (
        feedbacksError
      ) {

        throw feedbacksError;

      }



      const enriched =
        await enrichFeedbacks(
          feedbacks || []
        );



      return res.json(
        enriched
      );


    } catch (
      error
    ) {

      console.error(
        "Erro ao buscar feedbacks do Admin:",
        error
      );


      return res
        .status(500)
        .json({

          error:
            "Não foi possível carregar os feedbacks.",

          details:
            error.message

        });

    }

  }
);



// ==========================================================
// GET /api/feedbacks/admin/colaboradores
// ==========================================================
//
// Lista os colaboradores que podem receber feedback.
//
// O frontend NÃO precisa usar /api/usuarios para isso.
//
// Mantemos a regra isolada dentro do próprio módulo.
//
// ==========================================================

router.get(
  "/admin/colaboradores",
  async (
    req,
    res
  ) => {

    try {

      const session =
        await getLoggedUser(
          req
        );


      if (
        session.error
      ) {

        return res
          .status(
            session.status
          )
          .json({

            error:
              session.error

          });

      }



      const admin =
        session.user;



      const permissionError =
        validateAdmin(
          admin
        );


      if (
        permissionError
      ) {

        return res
          .status(
            permissionError.status
          )
          .json({

            error:
              permissionError.error

          });

      }



      const {

        data,
        error

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
            "setor",
            admin.setor
          )
          .eq(
            "perfil",
            "colaborador"
          )
          .eq(
            "ativo",
            true
          )
          .order(
            "nome",
            {
              ascending:
                true
            }
          );



      if (
        error
      ) {

        throw error;

      }



      return res.json(
        data || []
      );


    } catch (
      error
    ) {

      console.error(
        "Erro ao listar colaboradores para feedback:",
        error
      );


      return res
        .status(500)
        .json({

          error:
            "Não foi possível carregar os colaboradores.",

          details:
            error.message

        });

    }

  }
);



// ==========================================================
// POST /api/feedbacks/admin
// ==========================================================
//
// Admin envia feedback.
//
// BODY:
//
// {
//   colaborador_id,
//   tipo,
//   titulo,
//   mensagem,
//   exige_resposta
// }
//
// ==========================================================

router.post(
  "/admin",
  async (
    req,
    res
  ) => {

    try {

      // ====================================================
      // AUTENTICAÇÃO
      // ====================================================

      const session =
        await getLoggedUser(
          req
        );


      if (
        session.error
      ) {

        return res
          .status(
            session.status
          )
          .json({

            error:
              session.error

          });

      }



      const admin =
        session.user;



      const permissionError =
        validateAdmin(
          admin
        );


      if (
        permissionError
      ) {

        return res
          .status(
            permissionError.status
          )
          .json({

            error:
              permissionError.error

          });

      }



      // ====================================================
      // BODY
      // ====================================================

      const {

        colaborador_id,

        tipo,

        titulo,

        mensagem,

        exige_resposta

      } =
        req.body;



      // ====================================================
      // CAMPOS OBRIGATÓRIOS
      // ====================================================

      if (
        !colaborador_id
        ||
        !tipo
        ||
        !titulo
        ||
        !mensagem
      ) {

        return res
          .status(400)
          .json({

            error:
              "Preencha todos os campos obrigatórios."

          });

      }



      // ====================================================
      // TIPO
      // ====================================================

      if (
        !FEEDBACK_TYPES.includes(
          tipo
        )
      ) {

        return res
          .status(400)
          .json({

            error:
              "Tipo de feedback inválido."

          });

      }



      // ====================================================
      // COLABORADOR
      // ====================================================

      const collaborator =
        await getUserById(
          colaborador_id
        );



      if (
        !collaborator
      ) {

        return res
          .status(404)
          .json({

            error:
              "Colaborador não encontrado."

          });

      }



      if (
        collaborator.perfil !==
        "colaborador"
      ) {

        return res
          .status(400)
          .json({

            error:
              "O usuário selecionado não é um colaborador."

          });

      }



      if (
        collaborator.ativo ===
        false
      ) {

        return res
          .status(400)
          .json({

            error:
              "Não é possível enviar feedback para um colaborador inativo."

          });

      }



      // ====================================================
      // REGRA DO SETOR
      // ====================================================

      if (
        collaborator.setor !==
        admin.setor
      ) {

        return res
          .status(403)
          .json({

            error:
              "Você só pode enviar feedback para colaboradores do seu setor."

          });

      }



      // ====================================================
      // DEFINE STATUS INICIAL
      // ====================================================

      const requiresAnswer =
        exige_resposta ===
        true;



      const initialStatus =
        requiresAnswer

          ? "aguardando_resposta"

          : "pendente";



      // ====================================================
      // INSERT
      // ====================================================

      const {

        data:
          feedback,

        error:
          insertError

      } =
        await supabase
          .from(
            "feedbacks"
          )
          .insert({

            colaborador_id:
              collaborator.id,

            admin_id:
              admin.id,

            iniciado_por:
              "admin",

            assunto:
              null,

            tipo,

            titulo:
              String(
                titulo
              )
                .trim(),

            mensagem:
              String(
                mensagem
              )
                .trim(),

            exige_resposta:
              requiresAnswer,

            resposta:
              null,

            status:
              initialStatus

          })
          .select(
            "*"
          )
          .single();



      if (
        insertError
      ) {

        throw insertError;

      }



      return res
        .status(201)
        .json({

          message:
            "Feedback enviado com sucesso.",

          feedback: {

            ...feedback,

            colaborador:
              collaborator,

            admin

          }

        });


    } catch (
      error
    ) {

      console.error(
        "Erro ao criar feedback pelo Admin:",
        error
      );


      return res
        .status(500)
        .json({

          error:
            "Não foi possível enviar o feedback.",

          details:
            error.message

        });

    }

  }
);



// ==========================================================
// GET /api/feedbacks/admin/:id
// ==========================================================

router.get(
  "/admin/:id",
  async (
    req,
    res
  ) => {

    try {

      const session =
        await getLoggedUser(
          req
        );


      if (
        session.error
      ) {

        return res
          .status(
            session.status
          )
          .json({

            error:
              session.error

          });

      }



      const admin =
        session.user;



      const permissionError =
        validateAdmin(
          admin
        );


      if (
        permissionError
      ) {

        return res
          .status(
            permissionError.status
          )
          .json({

            error:
              permissionError.error

          });

      }



      const feedback =
        await getFeedbackById(
          req.params.id
        );



      if (
        !feedback
      ) {

        return res
          .status(404)
          .json({

            error:
              "Feedback não encontrado."

          });

      }



      const access =
        await adminCanAccessFeedback(
          admin,
          feedback
        );



      if (
        !access.allowed
      ) {

        return res
          .status(403)
          .json({

            error:
              "Você não possui acesso a este feedback."

          });

      }



      // ====================================================
      // MARCAR COMO VISUALIZADO
      // ====================================================
      //
      // Apenas quando o colaborador iniciou.
      //
      // ====================================================

      let updatedFeedback =
        feedback;



      if (
        feedback.iniciado_por ===
          "colaborador"

        &&

        !feedback.visualizado_em
      ) {

        const updateData = {

          visualizado_em:
            new Date()
              .toISOString()

        };



        if (
          feedback.status ===
          "pendente"
        ) {

          updateData.status =
            "visualizado";

        }



        const {

          data,
          error

        } =
          await supabase
            .from(
              "feedbacks"
            )
            .update(
              updateData
            )
            .eq(
              "id",
              feedback.id
            )
            .select(
              "*"
            )
            .single();



        if (
          error
        ) {

          throw error;

        }



        updatedFeedback =
          data;

      }



      const users =
        await getUsersByIds([

          updatedFeedback
            .colaborador_id,

          updatedFeedback
            .admin_id

        ]);



      return res.json({

        ...updatedFeedback,

        colaborador:
          users.get(
            updatedFeedback
              .colaborador_id
          )
          ||
          access.collaborator,

        admin:
          users.get(
            updatedFeedback
              .admin_id
          )
          ||
          null

      });


    } catch (
      error
    ) {

      console.error(
        "Erro ao abrir feedback no Admin:",
        error
      );


      return res
        .status(500)
        .json({

          error:
            "Não foi possível abrir o feedback.",

          details:
            error.message

        });

    }

  }
);



// ==========================================================
// PATCH /api/feedbacks/admin/:id/responder
// ==========================================================
//
// Admin responde a uma solicitação criada pelo colaborador.
//
// BODY:
//
// {
//   resposta
// }
//
// ==========================================================

router.patch(
  "/admin/:id/responder",
  async (
    req,
    res
  ) => {

    try {

      // ====================================================
      // ADMIN
      // ====================================================

      const session =
        await getLoggedUser(
          req
        );


      if (
        session.error
      ) {

        return res
          .status(
            session.status
          )
          .json({

            error:
              session.error

          });

      }



      const admin =
        session.user;



      const permissionError =
        validateAdmin(
          admin
        );


      if (
        permissionError
      ) {

        return res
          .status(
            permissionError.status
          )
          .json({

            error:
              permissionError.error

          });

      }



      // ====================================================
      // RESPOSTA
      // ====================================================

      const answer =
        String(
          req.body.resposta
          ||
          ""
        )
          .trim();



      if (
        !answer
      ) {

        return res
          .status(400)
          .json({

            error:
              "Informe a resposta do feedback."

          });

      }



      // ====================================================
      // FEEDBACK
      // ====================================================

      const feedback =
        await getFeedbackById(
          req.params.id
        );



      if (
        !feedback
      ) {

        return res
          .status(404)
          .json({

            error:
              "Solicitação de feedback não encontrada."

          });

      }



      // ====================================================
      // SETOR
      // ====================================================

      const access =
        await adminCanAccessFeedback(
          admin,
          feedback
        );



      if (
        !access.allowed
      ) {

        return res
          .status(403)
          .json({

            error:
              "Você só pode responder solicitações de colaboradores do seu setor."

          });

      }



      // ====================================================
      // PRECISA TER SIDO CRIADO PELO COLABORADOR
      // ====================================================

      if (
        feedback.iniciado_por !==
        "colaborador"
      ) {

        return res
          .status(400)
          .json({

            error:
              "Este registro não é uma solicitação de feedback do colaborador."

          });

      }



      // ====================================================
      // JÁ FINALIZADO
      // ====================================================

      if (
        [
          "respondido",
          "ciente"
        ].includes(
          feedback.status
        )
      ) {

        return res
          .status(409)
          .json({

            error:
              "Esta solicitação já foi respondida."

          });

      }



      // ====================================================
      // UPDATE
      // ====================================================

      const {

        data:
          updatedFeedback,

        error:
          updateError

      } =
        await supabase
          .from(
            "feedbacks"
          )
          .update({

            admin_id:
              admin.id,

            resposta:
              answer,

            status:
              "respondido",

            respondido_em:
              new Date()
                .toISOString()

          })
          .eq(
            "id",
            feedback.id
          )
          .select(
            "*"
          )
          .single();



      if (
        updateError
      ) {

        throw updateError;

      }



      return res.json({

        message:
          "Solicitação de feedback respondida com sucesso.",

        feedback:
          updatedFeedback

      });


    } catch (
      error
    ) {

      console.error(
        "Erro ao responder solicitação de feedback:",
        error
      );


      return res
        .status(500)
        .json({

          error:
            "Não foi possível responder à solicitação.",

          details:
            error.message

        });

    }

  }
);



// ==========================================================
// ==========================================================
// ROTAS DO COLABORADOR
// ==========================================================
// ==========================================================



// ==========================================================
// GET /api/feedbacks
// ==========================================================
//
// Lista apenas os feedbacks do colaborador autenticado.
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
      // AUTENTICAÇÃO
      // ====================================================

      const session =
        await getLoggedUser(
          req
        );


      if (
        session.error
      ) {

        return res
          .status(
            session.status
          )
          .json({

            error:
              session.error

          });

      }



      const collaborator =
        session.user;



      const permissionError =
        validateCollaborator(
          collaborator
        );


      if (
        permissionError
      ) {

        return res
          .status(
            permissionError.status
          )
          .json({

            error:
              permissionError.error

          });

      }



      // ====================================================
      // BUSCAR FEEDBACKS
      // ====================================================

      const {

        data:
          feedbacks,

        error:
          feedbacksError

      } =
        await supabase
          .from(
            "feedbacks"
          )
          .select(
            "*"
          )
          .eq(
            "colaborador_id",
            collaborator.id
          )
          .order(
            "created_at",
            {
              ascending:
                false
            }
          );



      if (
        feedbacksError
      ) {

        throw feedbacksError;

      }



      const enriched =
        await enrichFeedbacks(
          feedbacks || []
        );



      // ====================================================
      // RESUMO
      // ====================================================

      const received =
        enriched.filter(
          feedback =>
            feedback.iniciado_por ===
            "admin"
        );


      const requests =
        enriched.filter(
          feedback =>
            feedback.iniciado_por ===
            "colaborador"
        );



      const summary = {

        novos:
          received.filter(
            feedback =>
              (
                feedback.status ===
                "pendente"
              )
              &&
              !feedback.visualizado_em
          ).length,

        aguardando_resposta:
          received.filter(
            feedback =>
              feedback.status ===
              "aguardando_resposta"
          ).length,

        solicitacoes_pendentes:
          requests.filter(
            feedback =>
              [
                "pendente",
                "visualizado"
              ].includes(
                feedback.status
              )
          ).length,

        respondidos:
          enriched.filter(
            feedback =>
              feedback.status ===
              "respondido"
          ).length

      };



      return res.json({

        usuario:
          collaborator,

        resumo:
          summary,

        recebidos:
          received,

        solicitacoes:
          requests

      });


    } catch (
      error
    ) {

      console.error(
        "Erro ao buscar feedbacks do colaborador:",
        error
      );


      return res
        .status(500)
        .json({

          error:
            "Não foi possível carregar seus feedbacks.",

          details:
            error.message

        });

    }

  }
);



// ==========================================================
// POST /api/feedbacks/solicitacoes
// ==========================================================
//
// Colaborador solicita feedback.
//
// BODY:
//
// {
//   assunto,
//   titulo,
//   mensagem
// }
//
// ==========================================================

router.post(
  "/solicitacoes",
  async (
    req,
    res
  ) => {

    try {

      // ====================================================
      // AUTENTICAÇÃO
      // ====================================================

      const session =
        await getLoggedUser(
          req
        );


      if (
        session.error
      ) {

        return res
          .status(
            session.status
          )
          .json({

            error:
              session.error

          });

      }



      const collaborator =
        session.user;



      const permissionError =
        validateCollaborator(
          collaborator
        );


      if (
        permissionError
      ) {

        return res
          .status(
            permissionError.status
          )
          .json({

            error:
              permissionError.error

          });

      }



      // ====================================================
      // BODY
      // ====================================================

      const {

        assunto,

        titulo,

        mensagem

      } =
        req.body;



      if (
        !assunto
        ||
        !titulo
        ||
        !mensagem
      ) {

        return res
          .status(400)
          .json({

            error:
              "Preencha todos os campos da solicitação."

          });

      }



      // ====================================================
      // ASSUNTO
      // ====================================================

      if (
        !FEEDBACK_SUBJECTS.includes(
          assunto
        )
      ) {

        return res
          .status(400)
          .json({

            error:
              "Assunto de feedback inválido."

          });

      }



      // ====================================================
      // ADMIN RESPONSÁVEL
      // ====================================================

      const responsibleAdmin =
        await findSectorAdmin(
          collaborator.setor
        );



      if (
        !responsibleAdmin
      ) {

        return res
          .status(409)
          .json({

            error:
              "Não existe um administrador ativo responsável pelo seu setor."

          });

      }



      // ====================================================
      // INSERT
      // ====================================================

      const {

        data:
          feedback,

        error:
          insertError

      } =
        await supabase
          .from(
            "feedbacks"
          )
          .insert({

            colaborador_id:
              collaborator.id,

            admin_id:
              responsibleAdmin.id,

            iniciado_por:
              "colaborador",

            assunto,

            tipo:
              "solicitacao",

            titulo:
              String(
                titulo
              )
                .trim(),

            mensagem:
              String(
                mensagem
              )
                .trim(),

            exige_resposta:
              true,

            resposta:
              null,

            status:
              "pendente"

          })
          .select(
            "*"
          )
          .single();



      if (
        insertError
      ) {

        throw insertError;

      }



      return res
        .status(201)
        .json({

          message:
            "Solicitação de feedback enviada com sucesso.",

          feedback: {

            ...feedback,

            colaborador:
              collaborator,

            admin:
              responsibleAdmin

          }

        });


    } catch (
      error
    ) {

      console.error(
        "Erro ao solicitar feedback:",
        error
      );


      return res
        .status(500)
        .json({

          error:
            "Não foi possível enviar sua solicitação de feedback.",

          details:
            error.message

        });

    }

  }
);



// ==========================================================
// PATCH /api/feedbacks/:id/responder
// ==========================================================
//
// Colaborador responde um feedback enviado pelo Admin.
//
// BODY:
//
// {
//   resposta
// }
//
// ==========================================================

router.patch(
  "/:id/responder",
  async (
    req,
    res
  ) => {

    try {

      // ====================================================
      // AUTENTICAÇÃO
      // ====================================================

      const session =
        await getLoggedUser(
          req
        );


      if (
        session.error
      ) {

        return res
          .status(
            session.status
          )
          .json({

            error:
              session.error

          });

      }



      const collaborator =
        session.user;



      const permissionError =
        validateCollaborator(
          collaborator
        );


      if (
        permissionError
      ) {

        return res
          .status(
            permissionError.status
          )
          .json({

            error:
              permissionError.error

          });

      }



      const answer =
        String(
          req.body.resposta
          ||
          ""
        )
          .trim();



      if (
        !answer
      ) {

        return res
          .status(400)
          .json({

            error:
              "Digite sua resposta."

          });

      }



      // ====================================================
      // FEEDBACK
      // ====================================================

      const feedback =
        await getFeedbackById(
          req.params.id
        );



      if (
        !feedback
      ) {

        return res
          .status(404)
          .json({

            error:
              "Feedback não encontrado."

          });

      }



      // ====================================================
      // DONO DO FEEDBACK
      // ====================================================

      if (
        feedback.colaborador_id !==
        collaborator.id
      ) {

        return res
          .status(403)
          .json({

            error:
              "Você não possui acesso a este feedback."

          });

      }



      // ====================================================
      // PRECISA TER SIDO ENVIADO PELO ADMIN
      // ====================================================

      if (
        feedback.iniciado_por !==
        "admin"
      ) {

        return res
          .status(400)
          .json({

            error:
              "Esta solicitação não pode ser respondida por esta rota."

          });

      }



      // ====================================================
      // ADMIN EXIGIU RESPOSTA?
      // ====================================================

      if (
        feedback.exige_resposta !==
        true
      ) {

        return res
          .status(400)
          .json({

            error:
              "Este feedback não exige resposta."

          });

      }



      // ====================================================
      // JÁ RESPONDIDO
      // ====================================================

      if (
        [
          "respondido",
          "ciente"
        ].includes(
          feedback.status
        )
      ) {

        return res
          .status(409)
          .json({

            error:
              "Este feedback já foi respondido."

          });

      }



      // ====================================================
      // UPDATE
      // ====================================================

      const {

        data:
          updatedFeedback,

        error:
          updateError

      } =
        await supabase
          .from(
            "feedbacks"
          )
          .update({

            resposta:
              answer,

            status:
              "respondido",

            visualizado_em:
              feedback.visualizado_em
              ||
              new Date()
                .toISOString(),

            respondido_em:
              new Date()
                .toISOString()

          })
          .eq(
            "id",
            feedback.id
          )
          .select(
            "*"
          )
          .single();



      if (
        updateError
      ) {

        throw updateError;

      }



      return res.json({

        message:
          "Resposta enviada com sucesso.",

        feedback:
          updatedFeedback

      });


    } catch (
      error
    ) {

      console.error(
        "Erro ao responder feedback:",
        error
      );


      return res
        .status(500)
        .json({

          error:
            "Não foi possível enviar sua resposta.",

          details:
            error.message

        });

    }

  }
);



// ==========================================================
// PATCH /api/feedbacks/:id/ciente
// ==========================================================
//
// Colaborador confirma que leu.
//
// Permitimos:
//
// 1. feedback Admin -> colaborador sem resposta obrigatória;
//
// 2. solicitação colaborador -> Admin já respondida.
//
// ==========================================================

router.patch(
  "/:id/ciente",
  async (
    req,
    res
  ) => {

    try {

      // ====================================================
      // USUÁRIO
      // ====================================================

      const session =
        await getLoggedUser(
          req
        );


      if (
        session.error
      ) {

        return res
          .status(
            session.status
          )
          .json({

            error:
              session.error

          });

      }



      const collaborator =
        session.user;



      const permissionError =
        validateCollaborator(
          collaborator
        );


      if (
        permissionError
      ) {

        return res
          .status(
            permissionError.status
          )
          .json({

            error:
              permissionError.error

          });

      }



      // ====================================================
      // FEEDBACK
      // ====================================================

      const feedback =
        await getFeedbackById(
          req.params.id
        );



      if (
        !feedback
      ) {

        return res
          .status(404)
          .json({

            error:
              "Feedback não encontrado."

          });

      }



      if (
        feedback.colaborador_id !==
        collaborator.id
      ) {

        return res
          .status(403)
          .json({

            error:
              "Você não possui acesso a este feedback."

          });

      }



      // ====================================================
      // JÁ CIENTE
      // ====================================================

      if (
        feedback.status ===
        "ciente"
      ) {

        return res.json({

          message:
            "Este feedback já foi marcado como ciente.",

          feedback

        });

      }



      // ====================================================
      // VALIDAR FLUXO
      // ====================================================

      const adminFeedbackWithoutAnswer =
        (
          feedback.iniciado_por ===
          "admin"
        )
        &&
        (
          feedback.exige_resposta ===
          false
        );



      const answeredCollaboratorRequest =
        (
          feedback.iniciado_por ===
          "colaborador"
        )
        &&
        (
          feedback.status ===
          "respondido"
        );



      if (
        !adminFeedbackWithoutAnswer
        &&
        !answeredCollaboratorRequest
      ) {

        return res
          .status(400)
          .json({

            error:
              "Este feedback ainda não pode ser marcado como ciente."

          });

      }



      // ====================================================
      // UPDATE
      // ====================================================

      const now =
        new Date()
          .toISOString();



      const {

        data:
          updatedFeedback,

        error:
          updateError

      } =
        await supabase
          .from(
            "feedbacks"
          )
          .update({

            status:
              "ciente",

            visualizado_em:
              feedback.visualizado_em
              ||
              now,

            ciente_em:
              now

          })
          .eq(
            "id",
            feedback.id
          )
          .select(
            "*"
          )
          .single();



      if (
        updateError
      ) {

        throw updateError;

      }



      return res.json({

        message:
          "Feedback marcado como ciente.",

        feedback:
          updatedFeedback

      });


    } catch (
      error
    ) {

      console.error(
        "Erro ao marcar feedback como ciente:",
        error
      );


      return res
        .status(500)
        .json({

          error:
            "Não foi possível atualizar o feedback.",

          details:
            error.message

        });

    }

  }
);



// ==========================================================
// GET /api/feedbacks/:id
// ==========================================================
//
// Detalhes para o colaborador.
//
// Ao abrir:
//
// visualizado_em recebe a data.
//
// Se status = pendente:
//
// passa para visualizado.
//
// Se estiver aguardando_resposta:
//
// continua aguardando_resposta.
//
// ==========================================================

router.get(
  "/:id",
  async (
    req,
    res
  ) => {

    try {

      // ====================================================
      // AUTENTICAÇÃO
      // ====================================================

      const session =
        await getLoggedUser(
          req
        );


      if (
        session.error
      ) {

        return res
          .status(
            session.status
          )
          .json({

            error:
              session.error

          });

      }



      const collaborator =
        session.user;



      const permissionError =
        validateCollaborator(
          collaborator
        );


      if (
        permissionError
      ) {

        return res
          .status(
            permissionError.status
          )
          .json({

            error:
              permissionError.error

          });

      }



      // ====================================================
      // FEEDBACK
      // ====================================================

      const feedback =
        await getFeedbackById(
          req.params.id
        );



      if (
        !feedback
      ) {

        return res
          .status(404)
          .json({

            error:
              "Feedback não encontrado."

          });

      }



      if (
        feedback.colaborador_id !==
        collaborator.id
      ) {

        return res
          .status(403)
          .json({

            error:
              "Você não possui acesso a este feedback."

          });

      }



      // ====================================================
      // VISUALIZAÇÃO
      // ====================================================

      let updatedFeedback =
        feedback;



      if (
        !feedback.visualizado_em
      ) {

        const now =
          new Date()
            .toISOString();



        const updateData = {

          visualizado_em:
            now

        };



        if (
          feedback.status ===
          "pendente"
        ) {

          updateData.status =
            "visualizado";

        }



        const {

          data,
          error

        } =
          await supabase
            .from(
              "feedbacks"
            )
            .update(
              updateData
            )
            .eq(
              "id",
              feedback.id
            )
            .select(
              "*"
            )
            .single();



        if (
          error
        ) {

          throw error;

        }



        updatedFeedback =
          data;

      }



      // ====================================================
      // USUÁRIOS RELACIONADOS
      // ====================================================

      const users =
        await getUsersByIds([

          updatedFeedback
            .colaborador_id,

          updatedFeedback
            .admin_id

        ]);



      return res.json({

        ...updatedFeedback,

        colaborador:
          users.get(
            updatedFeedback
              .colaborador_id
          )
          ||
          collaborator,

        admin:
          users.get(
            updatedFeedback
              .admin_id
          )
          ||
          null

      });


    } catch (
      error
    ) {

      console.error(
        "Erro ao abrir feedback:",
        error
      );


      return res
        .status(500)
        .json({

          error:
            "Não foi possível abrir o feedback.",

          details:
            error.message

        });

    }

  }
);



// ==========================================================
// EXPORTAR ROUTER
// ==========================================================

module.exports =
  router;