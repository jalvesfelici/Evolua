// ==========================================================
// EVOLUA+
// ROTAS DE CURSOS
// ==========================================================
//
// RESPONSABILIDADES:
//
// GET /api/cursos
// - listar cursos conforme o perfil do usuário.
//
// GET /api/cursos/:id
// - consultar um curso específico.
//
// POST /api/cursos
// - criar curso;
// - criar atividades;
// - limitar setor responsável ao setor do Admin;
// - distribuir o curso aos colaboradores do setor destino.
//
// PUT /api/cursos/:id
// - atualizar curso do próprio setor;
// - atualizar suas atividades.
//
// PATCH /api/cursos/:id/desativar
// - desativar curso sem apagar histórico.
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

const COURSE_REQUIREMENTS = [

  "Obrigatório",

  "Recomendado"

];


const COURSE_LEVELS = [

  "Básico",

  "Intermediário",

  "Avançado"

];


const ACTIVITY_TYPES = [

  "Texto",

  "Arquivo",

  "Link"

];



// ==========================================================
// PEGAR TOKEN
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
    parts[0].toLowerCase() !==
    "bearer"
  ) {

    return null;

  }


  return parts[1];

}



// ==========================================================
// USUÁRIO LOGADO
// ==========================================================

async function getLoggedUser(
  req
) {

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
      "Erro ao validar token de cursos:",
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
  // PERFIL
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
        authData.user.id
      )
      .maybeSingle();



  if (
    profileError
  ) {

    console.error(
      "Erro ao buscar perfil nas rotas de cursos:",
      profileError
    );


    return {

      error:
        "Não foi possível validar o usuário.",

      status:
        500

    };

  }



  if (
    !profile
  ) {

    return {

      error:
        "Usuário não encontrado.",

      status:
        404

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
// ADMIN?
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
// TEXTO
// ==========================================================

function normalizeText(
  value
) {

  return String(
    value || ""
  ).trim();

}



// ==========================================================
// VALIDAR ID BIGINT
// ==========================================================

function normalizeBigIntId(
  value
) {

  const id =
    Number(
      value
    );


  if (
    !Number.isInteger(
      id
    )
    ||
    id <= 0
  ) {

    return null;

  }


  return id;

}



// ==========================================================
// FORMATAR ATIVIDADES
// ==========================================================

function normalizeActivities(
  atividades
) {

  if (
    !Array.isArray(
      atividades
    )
  ) {

    return [];

  }


  return atividades.map(
    (
      activity,
      index
    ) => {

      return {

        titulo:
          normalizeText(
            activity.titulo
          ),

        descricao:
          normalizeText(
            activity.descricao
          )
          ||
          null,

        tipo:
          normalizeText(
            activity.tipo
          ),

        recurso:
          normalizeText(
            activity.recurso
          )
          ||
          null,

        ordem:
          index + 1

      };

    }
  );

}



// ==========================================================
// VALIDAR ATIVIDADES
// ==========================================================

function validateActivities(
  activities
) {

  for (
    const activity
    of activities
  ) {

    if (
      !activity.titulo
    ) {

      return (
        "Todas as atividades precisam possuir título."
      );

    }


    if (
      !ACTIVITY_TYPES.includes(
        activity.tipo
      )
    ) {

      return (
        "Existe uma atividade com tipo inválido."
      );

    }


    if (
      activity.tipo ===
        "Link"

      &&

      !activity.recurso
    ) {

      return (
        "Atividades do tipo Link precisam possuir uma URL."
      );

    }

  }


  return null;

}



// ==========================================================
// VERIFICAR ADMIN RESPONSÁVEL PELO CURSO
// ==========================================================

async function validateCourseAdmin(
  admin,
  courseId
) {

  const {

    data:
      course,

    error

  } =
    await supabaseAdmin
      .from(
        "cursos"
      )
      .select(
        "*"
      )
      .eq(
        "id",
        courseId
      )
      .maybeSingle();



  if (
    error
  ) {

    console.error(
      "Erro ao buscar curso:",
      error
    );


    return {

      error:
        "Não foi possível carregar o curso.",

      status:
        500

    };

  }



  if (
    !course
  ) {

    return {

      error:
        "Curso não encontrado.",

      status:
        404

    };

  }



  // ========================================================
  // TODOS OS ADMINS SÓ GERENCIAM CURSOS DO PRÓPRIO SETOR
  // ========================================================

  if (
    course.setor_responsavel !==
    admin.setor
  ) {

    return {

      error:
        "Você só pode gerenciar cursos do seu próprio setor.",

      status:
        403

    };

  }



  return {

    course

  };

}



// ==========================================================
// DISTRIBUIR CURSO PARA SETOR
// ==========================================================
//
// Ao criar um curso:
//
// setor_destino = Tecnologia
//
// todos os colaboradores ativos de Tecnologia
// recebem uma inscrição:
//
// origem = setor
//
// Esta função também pode ser reaproveitada
// após alteração do setor destino.
//
// ==========================================================

async function assignCourseToSector(
  courseId,
  targetSector
) {

  // ========================================================
  // COLABORADORES
  // ========================================================

  const {

    data:
      collaborators,

    error:
      usersError

  } =
    await supabaseAdmin
      .from(
        "usuario"
      )
      .select(
        "id"
      )
      .eq(
        "perfil",
        "colaborador"
      )
      .eq(
        "ativo",
        true
      )
      .eq(
        "setor",
        targetSector
      );



  if (
    usersError
  ) {

    console.error(
      "Erro ao buscar colaboradores para distribuição:",
      usersError
    );


    return {

      error:
        usersError

    };

  }



  if (
    !collaborators
    ||
    collaborators.length ===
    0
  ) {

    return {

      inserted:
        0

    };

  }



  // ========================================================
  // PREPARAR INSCRIÇÕES
  // ========================================================

  const enrollments =
    collaborators.map(
      collaborator => {

        return {

          usuario_id:
            collaborator.id,

          curso_id:
            courseId,

          status:
            "nao_iniciado",

          progresso:
            0,

          origem:
            "setor"

        };

      }
    );



  // ========================================================
  // UPSERT
  // ========================================================
  //
  // O UNIQUE usuario_id + curso_id evita duplicações.
  //
  // ignoreDuplicates impede sobrescrever o progresso
  // se o colaborador já estiver inscrito.
  //
  // ========================================================

  const {

    error:
      enrollmentError

  } =
    await supabaseAdmin
      .from(
        "inscricoes_curso"
      )
      .upsert(
        enrollments,
        {

          onConflict:
            "usuario_id,curso_id",

          ignoreDuplicates:
            true

        }
      );



  if (
    enrollmentError
  ) {

    console.error(
      "Erro ao distribuir curso:",
      enrollmentError
    );


    return {

      error:
        enrollmentError

    };

  }



  return {

    inserted:
      enrollments.length

  };

}



// ==========================================================
// SELECT PADRÃO DOS CURSOS
// ==========================================================

const COURSE_SELECT = `

  id,
  titulo,
  descricao,
  carga_horaria,
  area,
  nivel,
  setor_responsavel,
  setor_destino,
  classificacao,
  curso_externo,
  link_externo,
  ativo,
  created_at,

  atividades_curso (
    id,
    curso_id,
    titulo,
    descricao,
    tipo,
    recurso,
    ordem,
    created_at
  )

`;



// ==========================================================
// ==========================================================
// GET /api/cursos
// ==========================================================
// ==========================================================
//
// COLABORADOR:
//
// recebe TODOS os cursos ativos.
//
// Isso é necessário porque:
//
// - parte superior = cursos do seu setor;
// - catálogo inferior = todos os cursos.
//
// A separação final será feita por /api/treinamentos.
//
// ADMIN:
//
// recebe somente cursos cujo:
//
// setor_responsavel = setor do Admin.
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



      const user =
        authResult.user;



      // ====================================================
      // CONSULTA
      // ====================================================

      let query =
        supabaseAdmin
          .from(
            "cursos"
          )
          .select(
            COURSE_SELECT
          )
          .order(
            "created_at",
            {

              ascending:
                false

            }
          );



      // ====================================================
      // ADMIN
      // ====================================================

      if (
        isAdmin(
          user
        )
      ) {

        query =
          query.eq(
            "setor_responsavel",
            user.setor
          );

      }



      // ====================================================
      // COLABORADOR
      // ====================================================

      else if (
        user.perfil ===
        "colaborador"
      ) {

        query =
          query.eq(
            "ativo",
            true
          );

      }



      // ====================================================
      // PERFIL DESCONHECIDO
      // ====================================================

      else {

        return res
          .status(403)
          .json({

            error:
              "Perfil sem permissão para acessar cursos."

          });

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
          "Erro ao carregar cursos:",
          error
        );


        return res
          .status(500)
          .json({

            error:
              "Não foi possível carregar os cursos.",

            details:
              error.message

          });

      }



      return res.json(
        data || []
      );


    } catch (
      error
    ) {

      console.error(
        "Erro GET /api/cursos:",
        error
      );


      return res
        .status(500)
        .json({

          error:
            "Erro interno ao carregar os cursos."

        });

    }

  }
);



// ==========================================================
// ==========================================================
// GET /api/cursos/:id
// ==========================================================
// ==========================================================

router.get(
  "/:id",
  async (
    req,
    res
  ) => {

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



      const user =
        authResult.user;


      const courseId =
        normalizeBigIntId(
          req.params.id
        );



      if (
        !courseId
      ) {

        return res
          .status(400)
          .json({

            error:
              "ID de curso inválido."

          });

      }



      const {

        data:
          course,

        error

      } =
        await supabaseAdmin
          .from(
            "cursos"
          )
          .select(
            COURSE_SELECT
          )
          .eq(
            "id",
            courseId
          )
          .maybeSingle();



      if (
        error
      ) {

        console.error(
          "Erro ao buscar curso:",
          error
        );


        return res
          .status(500)
          .json({

            error:
              "Não foi possível buscar o curso."

          });

      }



      if (
        !course
      ) {

        return res
          .status(404)
          .json({

            error:
              "Curso não encontrado."

          });

      }



      // ====================================================
      // ADMIN
      // ====================================================

      if (
        isAdmin(
          user
        )
        &&
        course.setor_responsavel !==
          user.setor
      ) {

        return res
          .status(403)
          .json({

            error:
              "Você não possui acesso administrativo a este curso."

          });

      }



      // ====================================================
      // COLABORADOR
      // ====================================================

      if (
        user.perfil ===
          "colaborador"

        &&

        course.ativo ===
          false
      ) {

        return res
          .status(404)
          .json({

            error:
              "Curso não disponível."

          });

      }



      return res.json(
        course
      );


    } catch (
      error
    ) {

      console.error(
        "Erro GET /api/cursos/:id:",
        error
      );


      return res
        .status(500)
        .json({

          error:
            "Erro interno ao buscar o curso."

        });

    }

  }
);



// ==========================================================
// ==========================================================
// POST /api/cursos
// ==========================================================
// ==========================================================
//
// ADMIN:
//
// cria curso.
//
// REGRA CRÍTICA:
//
// setor_responsavel NÃO é confiado ao frontend.
//
// Sempre:
//
// setor_responsavel = admin.setor
//
// ==========================================================

router.post(
  "/",
  async (
    req,
    res
  ) => {

    let createdCourseId =
      null;


    try {

      // ====================================================
      // ADMIN
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



      const admin =
        authResult.user;



      if (
        !isAdmin(
          admin
        )
      ) {

        return res
          .status(403)
          .json({

            error:
              "Somente administradores podem criar cursos."

          });

      }



      if (
        !admin.setor
      ) {

        return res
          .status(400)
          .json({

            error:
              "Seu usuário administrador não possui um setor definido."

          });

      }



      // ====================================================
      // BODY
      // ====================================================

      const {

        titulo,

        descricao,

        carga_horaria,

        area,

        nivel,

        setor_destino,

        classificacao,

        curso_externo,

        link_externo,

        atividades

      } =
        req.body;



      // ====================================================
      // NORMALIZAR
      // ====================================================

      const normalizedTitle =
        normalizeText(
          titulo
        );


      const normalizedDescription =
        normalizeText(
          descricao
        );


      const normalizedArea =
        normalizeText(
          area
        );


      const normalizedLevel =
        normalizeText(
          nivel
        );


      const normalizedTargetSector =
        normalizeText(
          setor_destino
        );


      const normalizedRequirement =
        normalizeText(
          classificacao
        );


      const externalCourse =
        Boolean(
          curso_externo
        );


      const externalLink =
        normalizeText(
          link_externo
        );


      const hours =
        Number(
          carga_horaria
        );


      const normalizedActivities =
        normalizeActivities(
          atividades
        );



      // ====================================================
      // CAMPOS
      // ====================================================

      if (
        !normalizedTitle
        ||
        !normalizedDescription
        ||
        !normalizedArea
        ||
        !normalizedLevel
        ||
        !normalizedTargetSector
        ||
        !normalizedRequirement
      ) {

        return res
          .status(400)
          .json({

            error:
              "Preencha todos os campos obrigatórios do treinamento."

          });

      }



      // ====================================================
      // CARGA HORÁRIA
      // ====================================================

      if (
        !Number.isFinite(
          hours
        )
        ||
        hours <= 0
      ) {

        return res
          .status(400)
          .json({

            error:
              "Informe uma carga horária válida."

          });

      }



      // ====================================================
      // NÍVEL
      // ====================================================

      if (
        !COURSE_LEVELS.includes(
          normalizedLevel
        )
      ) {

        return res
          .status(400)
          .json({

            error:
              "Nível de treinamento inválido."

          });

      }



      // ====================================================
      // CLASSIFICAÇÃO
      // ====================================================

      if (
        !COURSE_REQUIREMENTS.includes(
          normalizedRequirement
        )
      ) {

        return res
          .status(400)
          .json({

            error:
              "Classificação do treinamento inválida."

          });

      }



      // ====================================================
      // CURSO EXTERNO
      // ====================================================
      //
      // Curso externo:
      //
      // - precisa de link;
      // - não utiliza atividades internas;
      // - colaborador comprova depois com certificado.
      //
      // ====================================================

      if (
        externalCourse
        &&
        !externalLink
      ) {

        return res
          .status(400)
          .json({

            error:
              "Informe o link do curso externo."

          });

      }



      // ====================================================
      // CURSO INTERNO
      // ====================================================
      //
      // Para o fluxo completo de avaliação,
      // curso interno precisa ter pelo menos uma atividade.
      //
      // ====================================================

      if (
        !externalCourse
        &&
        normalizedActivities.length ===
          0
      ) {

        return res
          .status(400)
          .json({

            error:
              "Cursos internos precisam possuir pelo menos uma atividade."

          });

      }



      // ====================================================
      // ATIVIDADES
      // ====================================================

      if (
        !externalCourse
      ) {

        const activityError =
          validateActivities(
            normalizedActivities
          );


        if (
          activityError
        ) {

          return res
            .status(400)
            .json({

              error:
                activityError

            });

        }

      }



      // ====================================================
      // CRIAR CURSO
      // ====================================================

      const {

        data:
          createdCourse,

        error:
          courseError

      } =
        await supabaseAdmin
          .from(
            "cursos"
          )
          .insert({

            titulo:
              normalizedTitle,

            descricao:
              normalizedDescription,

            carga_horaria:
              hours,

            area:
              normalizedArea,

            nivel:
              normalizedLevel,


            // ==============================================
            // NÃO VEM DO FRONTEND
            // ==============================================

            setor_responsavel:
              admin.setor,


            setor_destino:
              normalizedTargetSector,

            classificacao:
              normalizedRequirement,

            curso_externo:
              externalCourse,

            link_externo:

              externalCourse

                ? externalLink

                : null,

            ativo:
              true

          })
          .select()
          .single();



      if (
        courseError
      ) {

        console.error(
          "Erro ao criar curso:",
          courseError
        );


        return res
          .status(500)
          .json({

            error:
              "Não foi possível criar o treinamento.",

            details:
              courseError.message

          });

      }



      createdCourseId =
        createdCourse.id;



      // ====================================================
      // CRIAR ATIVIDADES
      // ====================================================

      if (
        !externalCourse
        &&
        normalizedActivities.length > 0
      ) {

        const activityRows =
          normalizedActivities.map(
            activity => {

              return {

                curso_id:
                  createdCourseId,

                titulo:
                  activity.titulo,

                descricao:
                  activity.descricao,

                tipo:
                  activity.tipo,

                recurso:
                  activity.recurso,

                ordem:
                  activity.ordem

              };

            }
          );



        const {

          error:
            activitiesError

        } =
          await supabaseAdmin
            .from(
              "atividades_curso"
            )
            .insert(
              activityRows
            );



        if (
          activitiesError
        ) {

          console.error(
            "Erro ao criar atividades:",
            activitiesError
          );



          // ================================================
          // ROLLBACK
          // ================================================

          await supabaseAdmin
            .from(
              "cursos"
            )
            .delete()
            .eq(
              "id",
              createdCourseId
            );



          return res
            .status(500)
            .json({

              error:
                "Não foi possível criar as atividades do treinamento.",

              details:
                activitiesError.message

            });

        }

      }



      // ====================================================
      // DISTRIBUIÇÃO AUTOMÁTICA
      // ====================================================

      const distribution =
        await assignCourseToSector(

          createdCourseId,

          normalizedTargetSector

        );



      if (
        distribution.error
      ) {

        // Não apagamos o curso aqui.
        //
        // A sincronização em /api/treinamentos
        // poderá corrigir inscrições ausentes depois.

        console.error(
          "Curso criado, mas houve erro na distribuição inicial."
        );

      }



      // ====================================================
      // BUSCAR CURSO COMPLETO
      // ====================================================

      const {

        data:
          fullCourse,

        error:
          fullCourseError

      } =
        await supabaseAdmin
          .from(
            "cursos"
          )
          .select(
            COURSE_SELECT
          )
          .eq(
            "id",
            createdCourseId
          )
          .single();



      if (
        fullCourseError
      ) {

        console.error(
          "Erro ao recarregar curso criado:",
          fullCourseError
        );

      }



      return res
        .status(201)
        .json({

          message:
            "Treinamento criado com sucesso.",

          curso:
            fullCourse ||
            createdCourse,

          distribuido_para:
            distribution.inserted ||
            0

        });


    } catch (
      error
    ) {

      console.error(
        "Erro POST /api/cursos:",
        error
      );


      return res
        .status(500)
        .json({

          error:
            "Erro interno ao criar o treinamento."

        });

    }

  }
);



// ==========================================================
// ==========================================================
// PUT /api/cursos/:id
// ==========================================================
// ==========================================================
//
// Já deixamos a rota pronta para edição futura.
//
// Dessa forma não precisaremos voltar aqui quando
// adicionarmos o botão Editar no Admin.
//
// ==========================================================

router.put(
  "/:id",
  async (
    req,
    res
  ) => {

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



      const admin =
        authResult.user;



      if (
        !isAdmin(
          admin
        )
      ) {

        return res
          .status(403)
          .json({

            error:
              "Somente administradores podem editar cursos."

          });

      }



      const courseId =
        normalizeBigIntId(
          req.params.id
        );



      if (
        !courseId
      ) {

        return res
          .status(400)
          .json({

            error:
              "ID de curso inválido."

          });

      }



      const permission =
        await validateCourseAdmin(
          admin,
          courseId
        );


      if (
        permission.error
      ) {

        return res
          .status(
            permission.status
          )
          .json({

            error:
              permission.error

          });

      }



      // ====================================================
      // DADOS
      // ====================================================

      const {

        titulo,

        descricao,

        carga_horaria,

        area,

        nivel,

        setor_destino,

        classificacao,

        curso_externo,

        link_externo,

        atividades

      } =
        req.body;



      const normalizedTitle =
        normalizeText(
          titulo
        );


      const normalizedDescription =
        normalizeText(
          descricao
        );


      const normalizedArea =
        normalizeText(
          area
        );


      const normalizedLevel =
        normalizeText(
          nivel
        );


      const normalizedTargetSector =
        normalizeText(
          setor_destino
        );


      const normalizedRequirement =
        normalizeText(
          classificacao
        );


      const externalCourse =
        Boolean(
          curso_externo
        );


      const externalLink =
        normalizeText(
          link_externo
        );


      const hours =
        Number(
          carga_horaria
        );


      const normalizedActivities =
        normalizeActivities(
          atividades
        );



      // ====================================================
      // VALIDAÇÕES
      // ====================================================

      if (
        !normalizedTitle
        ||
        !normalizedDescription
        ||
        !normalizedArea
        ||
        !normalizedLevel
        ||
        !normalizedTargetSector
        ||
        !normalizedRequirement
      ) {

        return res
          .status(400)
          .json({

            error:
              "Preencha todos os campos obrigatórios."

          });

      }



      if (
        !Number.isFinite(
          hours
        )
        ||
        hours <= 0
      ) {

        return res
          .status(400)
          .json({

            error:
              "Carga horária inválida."

          });

      }



      if (
        !COURSE_LEVELS.includes(
          normalizedLevel
        )
      ) {

        return res
          .status(400)
          .json({

            error:
              "Nível inválido."

          });

      }



      if (
        !COURSE_REQUIREMENTS.includes(
          normalizedRequirement
        )
      ) {

        return res
          .status(400)
          .json({

            error:
              "Classificação inválida."

          });

      }



      if (
        externalCourse
        &&
        !externalLink
      ) {

        return res
          .status(400)
          .json({

            error:
              "Cursos externos precisam possuir um link."

          });

      }



      if (
        !externalCourse
        &&
        normalizedActivities.length ===
          0
      ) {

        return res
          .status(400)
          .json({

            error:
              "Cursos internos precisam possuir atividades."

          });

      }



      if (
        !externalCourse
      ) {

        const activityError =
          validateActivities(
            normalizedActivities
          );


        if (
          activityError
        ) {

          return res
            .status(400)
            .json({

              error:
                activityError

            });

        }

      }



      // ====================================================
      // ATUALIZAR CURSO
      // ====================================================

      const {

        data:
          updatedCourse,

        error:
          updateError

      } =
        await supabaseAdmin
          .from(
            "cursos"
          )
          .update({

            titulo:
              normalizedTitle,

            descricao:
              normalizedDescription,

            carga_horaria:
              hours,

            area:
              normalizedArea,

            nivel:
              normalizedLevel,


            // NÃO É ALTERÁVEL.
            setor_responsavel:
              admin.setor,


            setor_destino:
              normalizedTargetSector,

            classificacao:
              normalizedRequirement,

            curso_externo:
              externalCourse,

            link_externo:

              externalCourse

                ? externalLink

                : null

          })
          .eq(
            "id",
            courseId
          )
          .select()
          .single();



      if (
        updateError
      ) {

        console.error(
          "Erro ao atualizar curso:",
          updateError
        );


        return res
          .status(500)
          .json({

            error:
              "Não foi possível atualizar o treinamento.",

            details:
              updateError.message

          });

      }



      // ====================================================
      // ATIVIDADES
      // ====================================================
      //
      // Para simplificar e manter consistência:
      //
      // removemos as definições antigas
      // e criamos as atuais novamente.
      //
      // Só permitiremos isso se ainda não houver entregas.
      //
      // ====================================================

      const {

        data:
          currentActivities,

        error:
          currentActivitiesError

      } =
        await supabaseAdmin
          .from(
            "atividades_curso"
          )
          .select(
            "id"
          )
          .eq(
            "curso_id",
            courseId
          );



      if (
        currentActivitiesError
      ) {

        return res
          .status(500)
          .json({

            error:
              "Não foi possível validar as atividades existentes."

          });

      }



      const currentActivityIds =
        (
          currentActivities ||
          []
        )
          .map(
            item =>
              item.id
          );



      if (
        currentActivityIds.length >
        0
      ) {

        const {

          data:
            existingSubmission

        } =
          await supabaseAdmin
            .from(
              "entregas_atividades"
            )
            .select(
              "id"
            )
            .in(
              "atividade_id",
              currentActivityIds
            )
            .limit(1)
            .maybeSingle();



        if (
          existingSubmission
        ) {

          return res
            .status(409)
            .json({

              error:
                "Este curso já possui entregas de colaboradores e suas atividades não podem mais ser substituídas."

            });

        }

      }



      // ====================================================
      // APAGAR DEFINIÇÕES ANTIGAS
      // ====================================================

      const {

        error:
          deleteActivitiesError

      } =
        await supabaseAdmin
          .from(
            "atividades_curso"
          )
          .delete()
          .eq(
            "curso_id",
            courseId
          );



      if (
        deleteActivitiesError
      ) {

        return res
          .status(500)
          .json({

            error:
              "Não foi possível atualizar as atividades."

          });

      }



      // ====================================================
      // RECRIAR
      // ====================================================

      if (
        !externalCourse
      ) {

        const newRows =
          normalizedActivities.map(
            activity => {

              return {

                curso_id:
                  courseId,

                titulo:
                  activity.titulo,

                descricao:
                  activity.descricao,

                tipo:
                  activity.tipo,

                recurso:
                  activity.recurso,

                ordem:
                  activity.ordem

              };

            }
          );



        const {

          error:
            insertActivitiesError

        } =
          await supabaseAdmin
            .from(
              "atividades_curso"
            )
            .insert(
              newRows
            );



        if (
          insertActivitiesError
        ) {

          console.error(
            "Erro ao recriar atividades:",
            insertActivitiesError
          );


          return res
            .status(500)
            .json({

              error:
                "Curso atualizado, mas ocorreu um erro ao salvar as novas atividades.",

              details:
                insertActivitiesError.message

            });

        }

      }



      // ====================================================
      // GARANTIR DISTRIBUIÇÃO NO NOVO SETOR
      // ====================================================

      await assignCourseToSector(

        courseId,

        normalizedTargetSector

      );



      // ====================================================
      // RETORNO COMPLETO
      // ====================================================

      const {

        data:
          finalCourse

      } =
        await supabaseAdmin
          .from(
            "cursos"
          )
          .select(
            COURSE_SELECT
          )
          .eq(
            "id",
            courseId
          )
          .single();



      return res.json({

        message:
          "Treinamento atualizado com sucesso.",

        curso:
          finalCourse ||
          updatedCourse

      });


    } catch (
      error
    ) {

      console.error(
        "Erro PUT /api/cursos/:id:",
        error
      );


      return res
        .status(500)
        .json({

          error:
            "Erro interno ao atualizar o treinamento."

        });

    }

  }
);



// ==========================================================
// ==========================================================
// PATCH /api/cursos/:id/desativar
// ==========================================================
// ==========================================================
//
// NÃO apagamos o curso.
//
// Motivo:
//
// inscrições
// avaliações
// certificados
// horas concluídas
//
// precisam continuar existindo.
//
// ==========================================================

router.patch(
  "/:id/desativar",
  async (
    req,
    res
  ) => {

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



      const admin =
        authResult.user;



      if (
        !isAdmin(
          admin
        )
      ) {

        return res
          .status(403)
          .json({

            error:
              "Somente administradores podem remover treinamentos."

          });

      }



      const courseId =
        normalizeBigIntId(
          req.params.id
        );



      if (
        !courseId
      ) {

        return res
          .status(400)
          .json({

            error:
              "ID de curso inválido."

          });

      }



      // ====================================================
      // PERMISSÃO POR SETOR
      // ====================================================

      const permission =
        await validateCourseAdmin(
          admin,
          courseId
        );


      if (
        permission.error
      ) {

        return res
          .status(
            permission.status
          )
          .json({

            error:
              permission.error

          });

      }



      if (
        permission.course.ativo ===
        false
      ) {

        return res.json({

          message:
            "O treinamento já está desativado.",

          curso:
            permission.course

        });

      }



      const {

        data:
          disabledCourse,

        error

      } =
        await supabaseAdmin
          .from(
            "cursos"
          )
          .update({

            ativo:
              false

          })
          .eq(
            "id",
            courseId
          )
          .select()
          .single();



      if (
        error
      ) {

        console.error(
          "Erro ao desativar curso:",
          error
        );


        return res
          .status(500)
          .json({

            error:
              "Não foi possível desativar o treinamento.",

            details:
              error.message

          });

      }



      return res.json({

        message:
          "Treinamento removido da plataforma.",

        curso:
          disabledCourse

      });


    } catch (
      error
    ) {

      console.error(
        "Erro PATCH /api/cursos/:id/desativar:",
        error
      );


      return res
        .status(500)
        .json({

          error:
            "Erro interno ao remover o treinamento."

        });

    }

  }
);



// ==========================================================
// EXPORTAR
// ==========================================================

module.exports =
  router;