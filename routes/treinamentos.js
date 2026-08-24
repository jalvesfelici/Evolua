// ==========================================================
// EVOLUA+
// ROTAS DO MÓDULO DE TREINAMENTOS
// ==========================================================
//
// RESPONSABILIDADES:
//
// COLABORADOR:
//
// GET  /api/treinamentos
// GET  /api/treinamentos/:cursoId
// POST /api/treinamentos/:cursoId/iniciar
// POST /api/treinamentos/:cursoId/atividades/:atividadeId
// POST /api/treinamentos/:cursoId/enviar
// POST /api/treinamentos/:cursoId/certificado-externo
// GET  /api/treinamentos/certificados/:id
//
// ADMIN:
//
// GET   /api/treinamentos/admin/avaliacoes
// GET   /api/treinamentos/admin/avaliacoes/:inscricaoId
// PATCH /api/treinamentos/admin/entregas/:entregaId
// PATCH /api/treinamentos/admin/avaliacoes/:inscricaoId
// POST  /api/treinamentos/admin/avaliacoes/:inscricaoId/certificado
//
// ==========================================================



// ==========================================================
// IMPORTAÇÕES
// ==========================================================

const express =
  require(
    "express"
  );


const multer =
  require(
    "multer"
  );


const crypto =
  require(
    "crypto"
  );


const path =
  require(
    "path"
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

const DELIVERY_BUCKET =
  "treinamento-entregas";


const CERTIFICATE_BUCKET =
  "certificados";


const MAX_FILE_SIZE =
  10 * 1024 * 1024;



// ==========================================================
// MULTER
// ==========================================================
//
// Os arquivos ficam somente em memória.
//
// Depois enviamos diretamente para o
// Supabase Storage.
//
// ==========================================================

const upload =
  multer({

    storage:
      multer.memoryStorage(),

    limits: {

      fileSize:
        MAX_FILE_SIZE

    }

  });



// ==========================================================
// TOKEN
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
      "Erro ao validar token em treinamentos:",
      authError
    );


    return {

      error:
        "Sessão inválida ou expirada.",

      status:
        401

    };

  }



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
      "Erro ao buscar perfil:",
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
// VALIDAR BIGINT
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
// NOME SEGURO PARA ARQUIVO
// ==========================================================

function sanitizeFileName(
  fileName
) {

  const extension =
    path.extname(
      fileName
    );


  const baseName =
    path
      .basename(
        fileName,
        extension
      )
      .normalize(
        "NFD"
      )
      .replace(
        /[\u0300-\u036f]/g,
        ""
      )
      .replace(
        /[^a-zA-Z0-9_-]/g,
        "_"
      );


  return `${baseName}${extension}`;

}



// ==========================================================
// GERAR CAMINHO DO STORAGE
// ==========================================================

function createStoragePath(
  userId,
  prefix,
  originalName
) {

  const random =
    crypto
      .randomUUID();


  const safeName =
    sanitizeFileName(
      originalName
    );


  return (
    `${userId}/` +
    `${prefix}/` +
    `${random}-${safeName}`
  );

}



// ==========================================================
// UPLOAD STORAGE
// ==========================================================

async function uploadFileToStorage(
  bucket,
  storagePath,
  file
) {

  const {

    error

  } =
    await supabaseAdmin
      .storage
      .from(
        bucket
      )
      .upload(
        storagePath,
        file.buffer,
        {

          contentType:
            file.mimetype,

          upsert:
            false

        }
      );


  if (
    error
  ) {

    console.error(
      `Erro de upload no bucket ${bucket}:`,
      error
    );


    return {

      error

    };

  }


  return {

    path:
      storagePath

  };

}



// ==========================================================
// URL TEMPORÁRIA
// ==========================================================
//
// Os buckets são privados.
//
// Portanto não usamos URL pública.
//
// ==========================================================

async function createSignedFileUrl(
  bucket,
  filePath
) {

  if (
    !filePath
  ) {

    return null;

  }


  const {

    data,

    error

  } =
    await supabaseAdmin
      .storage
      .from(
        bucket
      )
      .createSignedUrl(
        filePath,
        60 * 10
      );


  if (
    error
  ) {

    console.error(
      "Erro ao criar URL temporária:",
      error
    );


    return null;

  }


  return data
    ?.signedUrl
    ||
    null;

}



// ==========================================================
// BUSCAR CURSO
// ==========================================================

async function getCourse(
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

    return {

      error:
        "Não foi possível carregar o treinamento.",

      details:
        error

    };

  }



  if (
    !course
  ) {

    return {

      error:
        "Treinamento não encontrado."

    };

  }



  return {

    course

  };

}



// ==========================================================
// BUSCAR ATIVIDADES
// ==========================================================

async function getCourseActivities(
  courseId
) {

  const {

    data,

    error

  } =
    await supabaseAdmin
      .from(
        "atividades_curso"
      )
      .select(
        "*"
      )
      .eq(
        "curso_id",
        courseId
      )
      .order(
        "ordem",
        {

          ascending:
            true

        }
      );



  if (
    error
  ) {

    return {

      error

    };

  }



  return {

    activities:
      data || []

  };

}



// ==========================================================
// BUSCAR INSCRIÇÃO
// ==========================================================

async function getEnrollment(
  userId,
  courseId
) {

  const {

    data,

    error

  } =
    await supabaseAdmin
      .from(
        "inscricoes_curso"
      )
      .select(
        "*"
      )
      .eq(
        "usuario_id",
        userId
      )
      .eq(
        "curso_id",
        courseId
      )
      .maybeSingle();



  if (
    error
  ) {

    return {

      error

    };

  }



  return {

    enrollment:
      data || null

  };

}



// ==========================================================
// CRIAR INSCRIÇÃO
// ==========================================================

async function createEnrollment(
  user,
  course,
  origin = "catalogo"
) {

  const existing =
    await getEnrollment(
      user.id,
      course.id
    );


  if (
    existing.error
  ) {

    return {

      error:
        existing.error

    };

  }



  if (
    existing.enrollment
  ) {

    return {

      enrollment:
        existing.enrollment

    };

  }



  const {

    data,

    error

  } =
    await supabaseAdmin
      .from(
        "inscricoes_curso"
      )
      .insert({

        usuario_id:
          user.id,

        curso_id:
          course.id,

        status:
          "nao_iniciado",

        progresso:
          0,

        origem:
          origin

      })
      .select()
      .single();



  if (
    error
  ) {

    return {

      error

    };

  }



  return {

    enrollment:
      data

  };

}



// ==========================================================
// GARANTIR CURSOS DO SETOR
// ==========================================================
//
// Essa função garante que colaboradores novos também
// recebam cursos já existentes destinados ao setor.
//
// ==========================================================

async function synchronizeSectorEnrollments(
  user
) {

  const {

    data:
      sectorCourses,

    error

  } =
    await supabaseAdmin
      .from(
        "cursos"
      )
      .select(
        "id"
      )
      .eq(
        "ativo",
        true
      )
      .eq(
        "setor_destino",
        user.setor
      );



  if (
    error
  ) {

    console.error(
      "Erro ao sincronizar cursos do setor:",
      error
    );


    return;

  }



  if (
    !sectorCourses
    ||
    sectorCourses.length ===
    0
  ) {

    return;

  }



  const rows =
    sectorCourses.map(
      course => {

        return {

          usuario_id:
            user.id,

          curso_id:
            course.id,

          status:
            "nao_iniciado",

          progresso:
            0,

          origem:
            "setor"

        };

      }
    );



  const {

    error:
      upsertError

  } =
    await supabaseAdmin
      .from(
        "inscricoes_curso"
      )
      .upsert(
        rows,
        {

          onConflict:
            "usuario_id,curso_id",

          ignoreDuplicates:
            true

        }
      );



  if (
    upsertError
  ) {

    console.error(
      "Erro ao criar inscrições automáticas:",
      upsertError
    );

  }

}



// ==========================================================
// CALCULAR PROGRESSO
// ==========================================================

async function updateEnrollmentProgress(
  enrollmentId,
  courseId
) {

  const activitiesResult =
    await getCourseActivities(
      courseId
    );


  if (
    activitiesResult.error
  ) {

    return;
  }



  const activities =
    activitiesResult.activities;



  if (
    activities.length ===
    0
  ) {

    return;
  }



  const {

    data:
      deliveries,

    error

  } =
    await supabaseAdmin
      .from(
        "entregas_atividades"
      )
      .select(
        "atividade_id"
      )
      .eq(
        "inscricao_id",
        enrollmentId
      );



  if (
    error
  ) {

    return;
  }



  const deliveredIds =
    new Set(

      (
        deliveries ||
        []
      )
        .map(
          item =>
            Number(
              item.atividade_id
            )
        )

    );



  const completed =
    activities.filter(
      activity =>
        deliveredIds.has(
          Number(
            activity.id
          )
        )
    ).length;



  const progress =
    Math.round(

      (
        completed /
        activities.length
      )
      *
      100

    );



  await supabaseAdmin
    .from(
      "inscricoes_curso"
    )
    .update({

      progresso:
        progress,

      status:

        progress > 0

          ? "em_andamento"

          : "nao_iniciado",

      iniciado_em:

        progress > 0

          ? new Date()
              .toISOString()

          : null

    })
    .eq(
      "id",
      enrollmentId
    )
    .in(
      "status",
      [
        "nao_iniciado",
        "em_andamento",
        "correcao_solicitada"
      ]
    );

}



// ==========================================================
// ==========================================================
// GET /api/treinamentos
// ==========================================================
// ==========================================================
//
// Tela principal do colaborador.
//
// Retorna:
//
// usuario
// meus_treinamentos
// catalogo
// resumo
//
// ==========================================================

router.get(
  "/",
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



      if (
        user.perfil !==
        "colaborador"
      ) {

        return res
          .status(403)
          .json({

            error:
              "Esta rota é destinada aos colaboradores."

          });

      }



      // ====================================================
      // GARANTIR INSCRIÇÕES DO SETOR
      // ====================================================

      await synchronizeSectorEnrollments(
        user
      );



      // ====================================================
      // TODOS OS CURSOS ATIVOS
      // ====================================================

      const {

        data:
          courses,

        error:
          coursesError

      } =
        await supabaseAdmin
          .from(
            "cursos"
          )
          .select(
            "*"
          )
          .eq(
            "ativo",
            true
          )
          .order(
            "created_at",
            {

              ascending:
                false

            }
          );



      if (
        coursesError
      ) {

        return res
          .status(500)
          .json({

            error:
              "Não foi possível carregar os treinamentos."

          });

      }



      // ====================================================
      // INSCRIÇÕES
      // ====================================================

      const {

        data:
          enrollments,

        error:
          enrollmentError

      } =
        await supabaseAdmin
          .from(
            "inscricoes_curso"
          )
          .select(
            "*"
          )
          .eq(
            "usuario_id",
            user.id
          );



      if (
        enrollmentError
      ) {

        return res
          .status(500)
          .json({

            error:
              "Não foi possível carregar seu progresso."

          });

      }



      const enrollmentMap =
        new Map(

          (
            enrollments ||
            []
          )
            .map(
              enrollment => [

                Number(
                  enrollment.curso_id
                ),

                enrollment

              ]
            )

        );



      // ====================================================
      // ATIVIDADES DE TODOS OS CURSOS
      // ====================================================

      const courseIds =
        (
          courses ||
          []
        )
          .map(
            course =>
              course.id
          );



      let allActivities =
        [];



      if (
        courseIds.length >
        0
      ) {

        const {

          data:
            activities,

          error:
            activitiesError

        } =
          await supabaseAdmin
            .from(
              "atividades_curso"
            )
            .select(
              "*"
            )
            .in(
              "curso_id",
              courseIds
            )
            .order(
              "ordem",
              {

                ascending:
                  true

              }
            );



        if (
          activitiesError
        ) {

          return res
            .status(500)
            .json({

              error:
                "Não foi possível carregar as atividades."

            });

        }



        allActivities =
          activities || [];

      }



      // ====================================================
      // MAPEAR CURSOS
      // ====================================================

      const mappedCourses =
        (
          courses ||
          []
        )
          .map(
            course => {

              const enrollment =
                enrollmentMap.get(
                  Number(
                    course.id
                  )
                )
                ||
                null;


              return {

                ...course,


                atividades_curso:
                  allActivities.filter(
                    activity =>
                      Number(
                        activity.curso_id
                      )
                      ===
                      Number(
                        course.id
                      )
                  ),


                inscricao:
                  enrollment

              };

            }
          );



      // ====================================================
      // SEUS TREINAMENTOS
      // ====================================================
      //
      // Cursos destinados ao setor
      // OU cursos escolhidos no catálogo.
      //
      // ====================================================

      const myTrainings =
        mappedCourses.filter(
          course => {

            return (

              course.setor_destino ===
                user.setor

              ||

              Boolean(
                course.inscricao
              )

            );

          }
        );



      // ====================================================
      // RESUMO
      // ====================================================

      const activeEnrollments =
        enrollments || [];



      const mandatory =
        myTrainings.filter(
          course => {

            return (

              course.setor_destino ===
                user.setor

              &&

              course.classificacao ===
                "Obrigatório"

              &&

              course.inscricao
                ?.status !==
                "aprovado"

            );

          }
        ).length;



      const inProgress =
        activeEnrollments.filter(
          enrollment => {

            return [

              "em_andamento",

              "aguardando_avaliacao",

              "correcao_solicitada"

            ].includes(
              enrollment.status
            );

          }
        ).length;



      const completed =
        activeEnrollments.filter(
          enrollment =>
            enrollment.status ===
              "aprovado"
        ).length;



      const approvedCourseIds =
        new Set(

          activeEnrollments

            .filter(
              enrollment =>
                enrollment.status ===
                  "aprovado"
            )

            .map(
              enrollment =>
                Number(
                  enrollment.curso_id
                )
            )

        );



      const completedHours =
        mappedCourses

          .filter(
            course =>
              approvedCourseIds.has(
                Number(
                  course.id
                )
              )
          )

          .reduce(
            (
              total,
              course
            ) => {

              return (

                total
                +
                Number(
                  course.carga_horaria || 0
                )

              );

            },
            0
          );



      return res.json({

        usuario:
          user,


        meus_treinamentos:
          myTrainings,


        catalogo:
          mappedCourses,


        resumo: {

          obrigatorios:
            mandatory,

          em_andamento:
            inProgress,

          concluidos:
            completed,

          carga_horaria:
            completedHours

        }

      });


    } catch (
      error
    ) {

      console.error(
        "Erro GET /api/treinamentos:",
        error
      );


      return res
        .status(500)
        .json({

          error:
            "Erro interno ao carregar treinamentos."

        });

    }

  }
);



// ==========================================================
// ==========================================================
// POST /api/treinamentos/:cursoId/iniciar
// ==========================================================
// ==========================================================
//
// Necessário principalmente para cursos escolhidos
// através do catálogo geral.
//
// ==========================================================

router.post(
  "/:cursoId/iniciar",
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



      if (
        user.perfil !==
        "colaborador"
      ) {

        return res
          .status(403)
          .json({

            error:
              "Somente colaboradores podem iniciar treinamentos."

          });

      }



      const courseId =
        normalizeBigIntId(
          req.params.cursoId
        );


      if (
        !courseId
      ) {

        return res
          .status(400)
          .json({

            error:
              "Curso inválido."

          });

      }



      const courseResult =
        await getCourse(
          courseId
        );


      if (
        courseResult.error
      ) {

        return res
          .status(404)
          .json({

            error:
              courseResult.error

          });

      }



      const course =
        courseResult.course;



      if (
        course.ativo ===
        false
      ) {

        return res
          .status(400)
          .json({

            error:
              "Este treinamento não está disponível."

          });

      }



      const origin =

        course.setor_destino ===
        user.setor

          ? "setor"

          : "catalogo";



      const enrollmentResult =
        await createEnrollment(

          user,

          course,

          origin

        );



      if (
        enrollmentResult.error
      ) {

        return res
          .status(500)
          .json({

            error:
              "Não foi possível iniciar o treinamento."

          });

      }



      let enrollment =
        enrollmentResult.enrollment;



      if (
        enrollment.status ===
        "nao_iniciado"
      ) {

        const {

          data:
            updatedEnrollment,

          error

        } =
          await supabaseAdmin
            .from(
              "inscricoes_curso"
            )
            .update({

              status:
                "em_andamento",

              iniciado_em:
                new Date()
                  .toISOString()

            })
            .eq(
              "id",
              enrollment.id
            )
            .select()
            .single();



        if (
          !error
        ) {

          enrollment =
            updatedEnrollment;

        }

      }



      return res.json({

        message:
          "Treinamento iniciado.",

        inscricao:
          enrollment

      });


    } catch (
      error
    ) {

      console.error(
        "Erro ao iniciar treinamento:",
        error
      );


      return res
        .status(500)
        .json({

          error:
            "Erro interno ao iniciar treinamento."

        });

    }

  }
);



// ==========================================================
// ==========================================================
// GET /api/treinamentos/:cursoId
// ==========================================================
// ==========================================================
//
// Detalhes reais do treinamento.
//
// ==========================================================

router.get(
  "/:cursoId",
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



      if (
        user.perfil !==
        "colaborador"
      ) {

        return res
          .status(403)
          .json({

            error:
              "Rota destinada aos colaboradores."

          });

      }



      const courseId =
        normalizeBigIntId(
          req.params.cursoId
        );


      if (
        !courseId
      ) {

        return res
          .status(400)
          .json({

            error:
              "Curso inválido."

          });

      }



      const courseResult =
        await getCourse(
          courseId
        );


      if (
        courseResult.error
      ) {

        return res
          .status(404)
          .json({

            error:
              courseResult.error

          });

      }



      const course =
        courseResult.course;



      if (
        course.ativo ===
        false
      ) {

        return res
          .status(404)
          .json({

            error:
              "Treinamento indisponível."

          });

      }



      const activitiesResult =
        await getCourseActivities(
          courseId
        );


      if (
        activitiesResult.error
      ) {

        return res
          .status(500)
          .json({

            error:
              "Não foi possível carregar as atividades."

          });

      }



      const enrollmentResult =
        await getEnrollment(
          user.id,
          courseId
        );


      if (
        enrollmentResult.error
      ) {

        return res
          .status(500)
          .json({

            error:
              "Não foi possível carregar sua inscrição."

          });

      }



      const enrollment =
        enrollmentResult.enrollment;



      let deliveries =
        [];



      if (
        enrollment
      ) {

        const {

          data,

          error

        } =
          await supabaseAdmin
            .from(
              "entregas_atividades"
            )
            .select(
              "*"
            )
            .eq(
              "inscricao_id",
              enrollment.id
            );



        if (
          error
        ) {

          return res
            .status(500)
            .json({

              error:
                "Não foi possível carregar suas entregas."

            });

        }



        deliveries =
          data || [];

      }



      // ====================================================
      // CERTIFICADO
      // ====================================================

      let certificate =
        null;



      if (
        enrollment
      ) {

        const {

          data

        } =
          await supabaseAdmin
            .from(
              "certificados_curso"
            )
            .select(
              "*"
            )
            .eq(
              "inscricao_id",
              enrollment.id
            )
            .maybeSingle();



        certificate =
          data || null;

      }



      return res.json({

        curso: {

          ...course,

          atividades_curso:
            activitiesResult.activities

        },


        inscricao:
          enrollment,


        entregas:
          deliveries,


        certificado:
          certificate

      });


    } catch (
      error
    ) {

      console.error(
        "Erro GET detalhe treinamento:",
        error
      );


      return res
        .status(500)
        .json({

          error:
            "Erro interno ao carregar o treinamento."

        });

    }

  }
);



// ==========================================================
// ==========================================================
// POST /:cursoId/atividades/:atividadeId
// ==========================================================
// ==========================================================
//
// Aceita:
//
// resposta_texto
// resposta_link
// arquivo
//
// multipart/form-data
//
// ==========================================================

router.post(
  "/:cursoId/atividades/:atividadeId",

  upload.single(
    "arquivo"
  ),

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



      if (
        user.perfil !==
        "colaborador"
      ) {

        return res
          .status(403)
          .json({

            error:
              "Somente colaboradores podem enviar atividades."

          });

      }



      const courseId =
        normalizeBigIntId(
          req.params.cursoId
        );


      const activityId =
        normalizeBigIntId(
          req.params.atividadeId
        );



      if (
        !courseId
        ||
        !activityId
      ) {

        return res
          .status(400)
          .json({

            error:
              "Curso ou atividade inválidos."

          });

      }



      const courseResult =
        await getCourse(
          courseId
        );


      if (
        courseResult.error
      ) {

        return res
          .status(404)
          .json({

            error:
              courseResult.error

          });

      }



      const course =
        courseResult.course;



      if (
        course.curso_externo ===
        true
      ) {

        return res
          .status(400)
          .json({

            error:
              "Cursos externos não possuem atividades internas."

          });

      }



      // ====================================================
      // ATIVIDADE
      // ====================================================

      const {

        data:
          activity,

        error:
          activityError

      } =
        await supabaseAdmin
          .from(
            "atividades_curso"
          )
          .select(
            "*"
          )
          .eq(
            "id",
            activityId
          )
          .eq(
            "curso_id",
            courseId
          )
          .maybeSingle();



      if (
        activityError
        ||
        !activity
      ) {

        return res
          .status(404)
          .json({

            error:
              "Atividade não encontrada."

          });

      }



      // ====================================================
      // INSCRIÇÃO
      // ====================================================

      const origin =

        course.setor_destino ===
        user.setor

          ? "setor"

          : "catalogo";



      const enrollmentResult =
        await createEnrollment(

          user,

          course,

          origin

        );



      if (
        enrollmentResult.error
      ) {

        return res
          .status(500)
          .json({

            error:
              "Não foi possível criar a inscrição."

          });

      }



      const enrollment =
        enrollmentResult.enrollment;



      if (
        enrollment.status ===
        "aguardando_avaliacao"
      ) {

        return res
          .status(400)
          .json({

            error:
              "Este treinamento está aguardando avaliação."

          });

      }



      if (
        enrollment.status ===
        "aprovado"
      ) {

        return res
          .status(400)
          .json({

            error:
              "Este treinamento já foi aprovado."

          });

      }



      // ====================================================
      // RESPOSTAS
      // ====================================================

      const respostaTexto =
        normalizeText(
          req.body
            ?.resposta_texto
        );


      const respostaLink =
        normalizeText(
          req.body
            ?.resposta_link
        );



      let filePath =
        null;


      let fileName =
        null;



      // ====================================================
      // UPLOAD
      // ====================================================

      if (
        req.file
      ) {

        const storagePath =
          createStoragePath(

            user.id,

            `curso-${courseId}/atividade-${activityId}`,

            req.file.originalname

          );



        const uploadResult =
          await uploadFileToStorage(

            DELIVERY_BUCKET,

            storagePath,

            req.file

          );



        if (
          uploadResult.error
        ) {

          return res
            .status(500)
            .json({

              error:
                "Não foi possível enviar o arquivo."

            });

        }



        filePath =
          storagePath;


        fileName =
          req.file.originalname;

      }



      // ====================================================
      // VALIDAÇÃO DA RESPOSTA
      // ====================================================

      if (
        !respostaTexto
        &&
        !respostaLink
        &&
        !filePath
      ) {

        return res
          .status(400)
          .json({

            error:
              "Informe uma resposta ou envie um arquivo."

          });

      }



      // ====================================================
      // ENTREGA EXISTENTE
      // ====================================================

      const {

        data:
          existingDelivery,

        error:
          existingError

      } =
        await supabaseAdmin
          .from(
            "entregas_atividades"
          )
          .select(
            "*"
          )
          .eq(
            "inscricao_id",
            enrollment.id
          )
          .eq(
            "atividade_id",
            activityId
          )
          .maybeSingle();



      if (
        existingError
      ) {

        return res
          .status(500)
          .json({

            error:
              "Não foi possível verificar a entrega existente."

          });

      }



      let delivery =
        null;



      // ====================================================
      // ATUALIZAR
      // ====================================================

      if (
        existingDelivery
      ) {

        const {

          data,

          error

        } =
          await supabaseAdmin
            .from(
              "entregas_atividades"
            )
            .update({

              resposta_texto:
                respostaTexto ||
                null,

              resposta_link:
                respostaLink ||
                null,

              arquivo_url:
                filePath
                ||
                existingDelivery
                  .arquivo_url,

              arquivo_nome:
                fileName
                ||
                existingDelivery
                  .arquivo_nome,

              status:
                "pendente",

              observacao_admin:
                null,

              avaliado_por:
                null,

              avaliado_em:
                null,

              enviado_em:
                new Date()
                  .toISOString()

            })
            .eq(
              "id",
              existingDelivery.id
            )
            .select()
            .single();



        if (
          error
        ) {

          return res
            .status(500)
            .json({

              error:
                "Não foi possível atualizar sua entrega."

            });

        }



        delivery =
          data;

      }



      // ====================================================
      // CRIAR
      // ====================================================

      else {

        const {

          data,

          error

        } =
          await supabaseAdmin
            .from(
              "entregas_atividades"
            )
            .insert({

              inscricao_id:
                enrollment.id,

              atividade_id:
                activityId,

              usuario_id:
                user.id,

              resposta_texto:
                respostaTexto ||
                null,

              resposta_link:
                respostaLink ||
                null,

              arquivo_url:
                filePath,

              arquivo_nome:
                fileName,

              status:
                "pendente",

              enviado_em:
                new Date()
                  .toISOString()

            })
            .select()
            .single();



        if (
          error
        ) {

          console.error(
            "Erro ao criar entrega:",
            error
          );


          return res
            .status(500)
            .json({

              error:
                "Não foi possível salvar sua atividade.",

              details:
                error.message

            });

        }



        delivery =
          data;

      }



      // ====================================================
      // ATUALIZAR PROGRESSO
      // ====================================================

      await updateEnrollmentProgress(

        enrollment.id,

        courseId

      );



      const {

        data:
          updatedEnrollment

      } =
        await supabaseAdmin
          .from(
            "inscricoes_curso"
          )
          .select(
            "*"
          )
          .eq(
            "id",
            enrollment.id
          )
          .single();



      return res.json({

        message:
          "Atividade salva com sucesso.",

        entrega:
          delivery,

        inscricao:
          updatedEnrollment

      });


    } catch (
      error
    ) {

      console.error(
        "Erro ao enviar atividade:",
        error
      );


      if (
        error
          ?.code ===
        "LIMIT_FILE_SIZE"
      ) {

        return res
          .status(400)
          .json({

            error:
              "O arquivo deve possuir no máximo 10 MB."

          });

      }


      return res
        .status(500)
        .json({

          error:
            "Erro interno ao salvar atividade."

        });

    }

  }
);



// ==========================================================
// ==========================================================
// POST /:cursoId/certificado-externo
// ==========================================================
// ==========================================================
//
// Curso externo:
//
// colaborador acessa link fora do sistema,
// conclui o curso,
// envia certificado PDF/arquivo como comprovação.
//
// ==========================================================

router.post(
  "/:cursoId/certificado-externo",

  upload.single(
    "arquivo"
  ),

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



      if (
        user.perfil !==
        "colaborador"
      ) {

        return res
          .status(403)
          .json({

            error:
              "Somente colaboradores podem enviar certificados."

          });

      }



      if (
        !req.file
      ) {

        return res
          .status(400)
          .json({

            error:
              "Selecione o certificado do treinamento."

          });

      }



      const courseId =
        normalizeBigIntId(
          req.params.cursoId
        );


      if (
        !courseId
      ) {

        return res
          .status(400)
          .json({

            error:
              "Curso inválido."

          });

      }



      const courseResult =
        await getCourse(
          courseId
        );


      if (
        courseResult.error
      ) {

        return res
          .status(404)
          .json({

            error:
              courseResult.error

          });

      }



      const course =
        courseResult.course;



      if (
        course.curso_externo !==
        true
      ) {

        return res
          .status(400)
          .json({

            error:
              "Este treinamento não é externo."

          });

      }



      const origin =

        course.setor_destino ===
        user.setor

          ? "setor"

          : "catalogo";



      const enrollmentResult =
        await createEnrollment(

          user,

          course,

          origin

        );



      if (
        enrollmentResult.error
      ) {

        return res
          .status(500)
          .json({

            error:
              "Não foi possível criar a inscrição."

          });

      }



      const enrollment =
        enrollmentResult.enrollment;



      if (
        enrollment.status ===
        "aprovado"
      ) {

        return res
          .status(400)
          .json({

            error:
              "Este curso já foi aprovado."

          });

      }



      const storagePath =
        createStoragePath(

          user.id,

          `externo/curso-${courseId}`,

          req.file.originalname

        );



      const uploadResult =
        await uploadFileToStorage(

          CERTIFICATE_BUCKET,

          storagePath,

          req.file

        );



      if (
        uploadResult.error
      ) {

        return res
          .status(500)
          .json({

            error:
              "Não foi possível enviar o certificado."

          });

      }



      // ====================================================
      // CERTIFICADO JÁ EXISTENTE?
      // ====================================================

      const {

        data:
          existingCertificate

      } =
        await supabaseAdmin
          .from(
            "certificados_curso"
          )
          .select(
            "*"
          )
          .eq(
            "inscricao_id",
            enrollment.id
          )
          .maybeSingle();



      let certificate =
        null;



      if (
        existingCertificate
      ) {

        const {

          data,

          error

        } =
          await supabaseAdmin
            .from(
              "certificados_curso"
            )
            .update({

              origem:
                "externo",

              arquivo_url:
                storagePath,

              arquivo_nome:
                req.file.originalname,

              publicado_por:
                user.id

            })
            .eq(
              "id",
              existingCertificate.id
            )
            .select()
            .single();



        if (
          error
        ) {

          return res
            .status(500)
            .json({

              error:
                "Não foi possível atualizar o certificado."

            });

        }



        certificate =
          data;

      }



      else {

        const {

          data,

          error

        } =
          await supabaseAdmin
            .from(
              "certificados_curso"
            )
            .insert({

              inscricao_id:
                enrollment.id,

              usuario_id:
                user.id,

              curso_id:
                courseId,

              origem:
                "externo",

              arquivo_url:
                storagePath,

              arquivo_nome:
                req.file.originalname,

              publicado_por:
                user.id

            })
            .select()
            .single();



        if (
          error
        ) {

          console.error(
            "Erro ao salvar certificado externo:",
            error
          );


          return res
            .status(500)
            .json({

              error:
                "Não foi possível registrar o certificado."

            });

        }



        certificate =
          data;

      }



      // ====================================================
      // ENVIAR PARA AVALIAÇÃO
      // ====================================================

      const {

        data:
          updatedEnrollment,

        error:
          enrollmentError

      } =
        await supabaseAdmin
          .from(
            "inscricoes_curso"
          )
          .update({

            progresso:
              100,

            status:
              "aguardando_avaliacao",

            iniciado_em:
              enrollment.iniciado_em
              ||
              new Date()
                .toISOString(),

            enviado_em:
              new Date()
                .toISOString()

          })
          .eq(
            "id",
            enrollment.id
          )
          .select()
          .single();



      if (
        enrollmentError
      ) {

        return res
          .status(500)
          .json({

            error:
              "Certificado enviado, mas não foi possível enviar o curso para avaliação."

          });

      }



      return res.json({

        message:
          "Certificado enviado para avaliação.",

        certificado:
          certificate,

        inscricao:
          updatedEnrollment

      });


    } catch (
      error
    ) {

      console.error(
        "Erro certificado externo:",
        error
      );


      return res
        .status(500)
        .json({

          error:
            "Erro interno ao enviar certificado."

        });

    }

  }
);



// ==========================================================
// ==========================================================
// POST /:cursoId/enviar
// ==========================================================
// ==========================================================
//
// Curso interno:
//
// todas as atividades precisam possuir uma entrega.
//
// ==========================================================

router.post(
  "/:cursoId/enviar",
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



      if (
        user.perfil !==
        "colaborador"
      ) {

        return res
          .status(403)
          .json({

            error:
              "Somente colaboradores podem enviar treinamentos."

          });

      }



      const courseId =
        normalizeBigIntId(
          req.params.cursoId
        );


      if (
        !courseId
      ) {

        return res
          .status(400)
          .json({

            error:
              "Curso inválido."

          });

      }



      const courseResult =
        await getCourse(
          courseId
        );


      if (
        courseResult.error
      ) {

        return res
          .status(404)
          .json({

            error:
              courseResult.error

          });

      }



      const course =
        courseResult.course;



      if (
        course.curso_externo ===
        true
      ) {

        return res
          .status(400)
          .json({

            error:
              "Cursos externos devem ser enviados através do certificado."

          });

      }



      const enrollmentResult =
        await getEnrollment(
          user.id,
          courseId
        );


      if (
        enrollmentResult.error
      ) {

        return res
          .status(500)
          .json({

            error:
              "Não foi possível carregar a inscrição."

          });

      }



      const enrollment =
        enrollmentResult.enrollment;



      if (
        !enrollment
      ) {

        return res
          .status(400)
          .json({

            error:
              "Você ainda não iniciou este treinamento."

          });

      }



      if (
        enrollment.status ===
        "aguardando_avaliacao"
      ) {

        return res
          .status(400)
          .json({

            error:
              "Este treinamento já está aguardando avaliação."

          });

      }



      if (
        enrollment.status ===
        "aprovado"
      ) {

        return res
          .status(400)
          .json({

            error:
              "Este treinamento já foi aprovado."

          });

      }



      const activitiesResult =
        await getCourseActivities(
          courseId
        );


      if (
        activitiesResult.error
      ) {

        return res
          .status(500)
          .json({

            error:
              "Não foi possível carregar as atividades."

          });

      }



      const activities =
        activitiesResult.activities;



      if (
        activities.length ===
        0
      ) {

        return res
          .status(400)
          .json({

            error:
              "Este treinamento não possui atividades."

          });

      }



      const {

        data:
          deliveries,

        error:
          deliveryError

      } =
        await supabaseAdmin
          .from(
            "entregas_atividades"
          )
          .select(
            "*"
          )
          .eq(
            "inscricao_id",
            enrollment.id
          );



      if (
        deliveryError
      ) {

        return res
          .status(500)
          .json({

            error:
              "Não foi possível validar suas atividades."

          });

      }



      const deliveryActivityIds =
        new Set(

          (
            deliveries ||
            []
          )
            .map(
              delivery =>
                Number(
                  delivery.atividade_id
                )
            )

        );



      const missingActivities =
        activities.filter(
          activity =>
            !deliveryActivityIds.has(
              Number(
                activity.id
              )
            )
        );



      if (
        missingActivities.length >
        0
      ) {

        return res
          .status(400)
          .json({

            error:
              `Ainda existem ${missingActivities.length} atividade(s) sem entrega.`

          });

      }



      // ====================================================
      // RESET DAS ENTREGAS PARA PENDENTE
      // ====================================================
      //
      // Caso tenha vindo de correção.
      //
      // ====================================================

      await supabaseAdmin
        .from(
          "entregas_atividades"
        )
        .update({

          status:
            "pendente",

          avaliado_por:
            null,

          avaliado_em:
            null

        })
        .eq(
          "inscricao_id",
          enrollment.id
        );



      const {

        data:
          updatedEnrollment,

        error

      } =
        await supabaseAdmin
          .from(
            "inscricoes_curso"
          )
          .update({

            status:
              "aguardando_avaliacao",

            progresso:
              100,

            enviado_em:
              new Date()
                .toISOString()

          })
          .eq(
            "id",
            enrollment.id
          )
          .select()
          .single();



      if (
        error
      ) {

        return res
          .status(500)
          .json({

            error:
              "Não foi possível enviar o treinamento para avaliação."

          });

      }



      return res.json({

        message:
          "Treinamento enviado para avaliação.",

        inscricao:
          updatedEnrollment

      });


    } catch (
      error
    ) {

      console.error(
        "Erro ao enviar curso:",
        error
      );


      return res
        .status(500)
        .json({

          error:
            "Erro interno ao enviar treinamento."

        });

    }

  }
);



// ==========================================================
// ==========================================================
// GET /admin/avaliacoes
// ==========================================================
// ==========================================================
//
// REGRA:
//
// Admin recebe entregas de cursos cujo:
//
// curso.setor_responsavel = admin.setor
//
// O setor do colaborador NÃO importa.
//
// ==========================================================

router.get(
  "/admin/avaliacoes",
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
              "Acesso permitido somente para administradores."

          });

      }



      // ====================================================
      // CURSOS DO SETOR
      // ====================================================

      const {

        data:
          adminCourses,

        error:
          courseError

      } =
        await supabaseAdmin
          .from(
            "cursos"
          )
          .select(
            "id"
          )
          .eq(
            "setor_responsavel",
            admin.setor
          );



      if (
        courseError
      ) {

        return res
          .status(500)
          .json({

            error:
              "Não foi possível carregar os cursos do setor."

          });

      }



      const courseIds =
        (
          adminCourses ||
          []
        )
          .map(
            course =>
              course.id
          );



      if (
        courseIds.length ===
        0
      ) {

        return res.json(
          []
        );

      }



      // ====================================================
      // INSCRIÇÕES AGUARDANDO AVALIAÇÃO
      // ====================================================

      const {

        data:
          enrollments,

        error:
          enrollmentError

      } =
        await supabaseAdmin
          .from(
            "inscricoes_curso"
          )
          .select(
            "*"
          )
          .in(
            "curso_id",
            courseIds
          )
          .eq(
            "status",
            "aguardando_avaliacao"
          )
          .order(
            "enviado_em",
            {

              ascending:
                true

            }
          );



      if (
        enrollmentError
      ) {

        return res
          .status(500)
          .json({

            error:
              "Não foi possível carregar as avaliações."

          });

      }



      const results =
        [];



      for (
        const enrollment
        of enrollments || []
      ) {

        const {

          data:
            user

        } =
          await supabaseAdmin
            .from(
              "usuario"
            )
            .select(
              `
                id,
                nome,
                matricula,
                cargo,
                setor
              `
            )
            .eq(
              "id",
              enrollment.usuario_id
            )
            .maybeSingle();



        const {

          data:
            course

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
              enrollment.curso_id
            )
            .maybeSingle();



        results.push({

          inscricao:
            enrollment,

          usuario:
            user,

          curso:
            course

        });

      }



      return res.json(
        results
      );


    } catch (
      error
    ) {

      console.error(
        "Erro ao listar avaliações:",
        error
      );


      return res
        .status(500)
        .json({

          error:
            "Erro interno ao carregar avaliações."

        });

    }

  }
);



// ==========================================================
// ==========================================================
// GET /admin/avaliacoes/:inscricaoId
// ==========================================================
// ==========================================================

router.get(
  "/admin/avaliacoes/:inscricaoId",
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
              "Acesso permitido somente para administradores."

          });

      }



      const enrollmentId =
        normalizeText(
          req.params.inscricaoId
        );



      const {

        data:
          enrollment,

        error:
          enrollmentError

      } =
        await supabaseAdmin
          .from(
            "inscricoes_curso"
          )
          .select(
            "*"
          )
          .eq(
            "id",
            enrollmentId
          )
          .maybeSingle();



      if (
        enrollmentError
        ||
        !enrollment
      ) {

        return res
          .status(404)
          .json({

            error:
              "Avaliação não encontrada."

          });

      }



      const courseResult =
        await getCourse(
          enrollment.curso_id
        );


      if (
        courseResult.error
      ) {

        return res
          .status(404)
          .json({

            error:
              courseResult.error

          });

      }



      const course =
        courseResult.course;



      // ====================================================
      // SETOR RESPONSÁVEL
      // ====================================================

      if (
        course.setor_responsavel !==
        admin.setor
      ) {

        return res
          .status(403)
          .json({

            error:
              "Você não é responsável por este treinamento."

          });

      }



      const {

        data:
          collaborator

      } =
        await supabaseAdmin
          .from(
            "usuario"
          )
          .select(
            `
              id,
              nome,
              matricula,
              cargo,
              setor,
              email
            `
          )
          .eq(
            "id",
            enrollment.usuario_id
          )
          .maybeSingle();



      const activitiesResult =
        await getCourseActivities(
          course.id
        );



      const {

        data:
          deliveries,

        error:
          deliveriesError

      } =
        await supabaseAdmin
          .from(
            "entregas_atividades"
          )
          .select(
            "*"
          )
          .eq(
            "inscricao_id",
            enrollment.id
          );



      if (
        deliveriesError
      ) {

        return res
          .status(500)
          .json({

            error:
              "Não foi possível carregar as entregas."

          });

      }



      // ====================================================
      // URL DOS ARQUIVOS
      // ====================================================

      const mappedDeliveries =
        [];



      for (
        const delivery
        of deliveries || []
      ) {

        let signedUrl =
          null;



        if (
          delivery.arquivo_url
        ) {

          signedUrl =
            await createSignedFileUrl(

              DELIVERY_BUCKET,

              delivery.arquivo_url

            );

        }



        mappedDeliveries.push({

          ...delivery,

          arquivo_temporario:
            signedUrl

        });

      }



      // ====================================================
      // CERTIFICADO EXTERNO
      // ====================================================

      const {

        data:
          certificate

      } =
        await supabaseAdmin
          .from(
            "certificados_curso"
          )
          .select(
            "*"
          )
          .eq(
            "inscricao_id",
            enrollment.id
          )
          .maybeSingle();



      let certificateWithUrl =
        certificate;



      if (
        certificate
      ) {

        certificateWithUrl = {

          ...certificate,

          arquivo_temporario:
            await createSignedFileUrl(

              CERTIFICATE_BUCKET,

              certificate.arquivo_url

            )

        };

      }



      return res.json({

        inscricao:
          enrollment,

        usuario:
          collaborator,

        curso:
          course,

        atividades:
          activitiesResult.activities
          ||
          [],

        entregas:
          mappedDeliveries,

        certificado:
          certificateWithUrl

      });


    } catch (
      error
    ) {

      console.error(
        "Erro detalhe avaliação:",
        error
      );


      return res
        .status(500)
        .json({

          error:
            "Erro interno ao carregar avaliação."

        });

    }

  }
);



// ==========================================================
// ==========================================================
// PATCH /admin/entregas/:entregaId
// ==========================================================
// ==========================================================
//
// Admin marca:
//
// ok
// nao_ok
//
// ==========================================================

router.patch(
  "/admin/entregas/:entregaId",
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
              "Acesso permitido somente para administradores."

          });

      }



      const deliveryId =
        normalizeText(
          req.params.entregaId
        );


      const status =
        normalizeText(
          req.body.status
        );


      const observation =
        normalizeText(
          req.body.observacao_admin
        );



      if (
        ![
          "ok",
          "nao_ok"
        ].includes(
          status
        )
      ) {

        return res
          .status(400)
          .json({

            error:
              "Status de avaliação inválido."

          });

      }



      if (
        status ===
        "nao_ok"

        &&

        !observation
      ) {

        return res
          .status(400)
          .json({

            error:
              "Informe o motivo da atividade não estar OK."

          });

      }



      const {

        data:
          delivery,

        error

      } =
        await supabaseAdmin
          .from(
            "entregas_atividades"
          )
          .select(
            "*"
          )
          .eq(
            "id",
            deliveryId
          )
          .maybeSingle();



      if (
        error
        ||
        !delivery
      ) {

        return res
          .status(404)
          .json({

            error:
              "Entrega não encontrada."

          });

      }



      const {

        data:
          enrollment

      } =
        await supabaseAdmin
          .from(
            "inscricoes_curso"
          )
          .select(
            "*"
          )
          .eq(
            "id",
            delivery.inscricao_id
          )
          .maybeSingle();



      if (
        !enrollment
      ) {

        return res
          .status(404)
          .json({

            error:
              "Inscrição não encontrada."

          });

      }



      const courseResult =
        await getCourse(
          enrollment.curso_id
        );


      if (
        courseResult.error
      ) {

        return res
          .status(404)
          .json({

            error:
              "Curso não encontrado."

          });

      }



      if (
        courseResult
          .course
          .setor_responsavel !==
        admin.setor
      ) {

        return res
          .status(403)
          .json({

            error:
              "Você não é responsável por esta entrega."

          });

      }



      const {

        data:
          updatedDelivery,

        error:
          updateError

      } =
        await supabaseAdmin
          .from(
            "entregas_atividades"
          )
          .update({

            status,

            observacao_admin:
              observation ||
              null,

            avaliado_por:
              admin.id,

            avaliado_em:
              new Date()
                .toISOString()

          })
          .eq(
            "id",
            delivery.id
          )
          .select()
          .single();



      if (
        updateError
      ) {

        return res
          .status(500)
          .json({

            error:
              "Não foi possível avaliar a atividade."

          });

      }



      return res.json({

        message:

          status ===
          "ok"

            ? "Atividade marcada como OK."

            : "Atividade marcada como não OK.",


        entrega:
          updatedDelivery

      });


    } catch (
      error
    ) {

      console.error(
        "Erro ao avaliar atividade:",
        error
      );


      return res
        .status(500)
        .json({

          error:
            "Erro interno ao avaliar atividade."

        });

    }

  }
);



// ==========================================================
// ==========================================================
// PATCH /admin/avaliacoes/:inscricaoId
// ==========================================================
// ==========================================================
//
// decisão:
//
// aprovado
// correcao_solicitada
//
// ==========================================================

router.patch(
  "/admin/avaliacoes/:inscricaoId",
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
              "Acesso permitido somente para administradores."

          });

      }



      const enrollmentId =
        normalizeText(
          req.params.inscricaoId
        );


      const decision =
        normalizeText(
          req.body.status
        );


      const observation =
        normalizeText(
          req.body.observacao
        );



      if (
        ![
          "aprovado",
          "correcao_solicitada"
        ].includes(
          decision
        )
      ) {

        return res
          .status(400)
          .json({

            error:
              "Decisão inválida."

          });

      }



      if (
        decision ===
        "correcao_solicitada"

        &&

        !observation
      ) {

        return res
          .status(400)
          .json({

            error:
              "Informe o que o colaborador precisa corrigir."

          });

      }



      const {

        data:
          enrollment,

        error:
          enrollmentError

      } =
        await supabaseAdmin
          .from(
            "inscricoes_curso"
          )
          .select(
            "*"
          )
          .eq(
            "id",
            enrollmentId
          )
          .maybeSingle();



      if (
        enrollmentError
        ||
        !enrollment
      ) {

        return res
          .status(404)
          .json({

            error:
              "Inscrição não encontrada."

          });

      }



      if (
        enrollment.status !==
        "aguardando_avaliacao"
      ) {

        return res
          .status(400)
          .json({

            error:
              "Este treinamento não está aguardando avaliação."

          });

      }



      const courseResult =
        await getCourse(
          enrollment.curso_id
        );


      if (
        courseResult.error
      ) {

        return res
          .status(404)
          .json({

            error:
              "Curso não encontrado."

          });

      }



      const course =
        courseResult.course;



      if (
        course.setor_responsavel !==
        admin.setor
      ) {

        return res
          .status(403)
          .json({

            error:
              "Você não é responsável por este treinamento."

          });

      }



      // ====================================================
      // CURSO INTERNO
      // ====================================================
      //
      // Para aprovar:
      // TODAS as atividades precisam estar OK.
      //
      // ====================================================

      if (
        decision ===
        "aprovado"

        &&

        course.curso_externo !==
        true
      ) {

        const {

          data:
            deliveries,

          error:
            deliveryError

        } =
          await supabaseAdmin
            .from(
              "entregas_atividades"
            )
            .select(
              "status"
            )
            .eq(
              "inscricao_id",
              enrollment.id
            );



        if (
          deliveryError
        ) {

          return res
            .status(500)
            .json({

              error:
                "Não foi possível validar as atividades."

            });

        }



        if (
          !deliveries
          ||
          deliveries.length ===
          0
        ) {

          return res
            .status(400)
            .json({

              error:
                "Não existem atividades entregues."

            });

        }



        const allOk =
          deliveries.every(
            delivery =>
              delivery.status ===
                "ok"
          );



        if (
          !allOk
        ) {

          return res
            .status(400)
            .json({

              error:
                "Todas as atividades precisam estar marcadas como OK antes da aprovação final."

            });

        }

      }



      // ====================================================
      // CURSO EXTERNO
      // ====================================================

      if (
        decision ===
        "aprovado"

        &&

        course.curso_externo ===
        true
      ) {

        const {

          data:
            certificate

        } =
          await supabaseAdmin
            .from(
              "certificados_curso"
            )
            .select(
              "id"
            )
            .eq(
              "inscricao_id",
              enrollment.id
            )
            .maybeSingle();



        if (
          !certificate
        ) {

          return res
            .status(400)
            .json({

              error:
                "O colaborador ainda não enviou o certificado externo."

            });

        }

      }



      // ====================================================
      // REGISTRAR AVALIAÇÃO
      // ====================================================

      const {

        error:
          evaluationError

      } =
        await supabaseAdmin
          .from(
            "avaliacoes_curso"
          )
          .insert({

            inscricao_id:
              enrollment.id,

            usuario_id:
              enrollment.usuario_id,

            curso_id:
              enrollment.curso_id,

            admin_id:
              admin.id,

            status:
              decision,

            observacao:
              observation ||
              null

          });



      if (
        evaluationError
      ) {

        console.error(
          "Erro ao registrar avaliação:",
          evaluationError
        );


        return res
          .status(500)
          .json({

            error:
              "Não foi possível registrar a avaliação."

          });

      }



      // ====================================================
      // ATUALIZAR INSCRIÇÃO
      // ====================================================

      const {

        data:
          updatedEnrollment,

        error:
          updateError

      } =
        await supabaseAdmin
          .from(
            "inscricoes_curso"
          )
          .update({

            status:
              decision,

            aprovado_em:

              decision ===
              "aprovado"

                ? new Date()
                    .toISOString()

                : null

          })
          .eq(
            "id",
            enrollment.id
          )
          .select()
          .single();



      if (
        updateError
      ) {

        return res
          .status(500)
          .json({

            error:
              "Avaliação registrada, mas não foi possível atualizar o treinamento."

          });

      }



      return res.json({

        message:

          decision ===
          "aprovado"

            ? "Treinamento aprovado com sucesso."

            : "Treinamento devolvido para correção.",


        inscricao:
          updatedEnrollment

      });


    } catch (
      error
    ) {

      console.error(
        "Erro decisão final:",
        error
      );


      return res
        .status(500)
        .json({

          error:
            "Erro interno ao concluir avaliação."

        });

    }

  }
);



// ==========================================================
// ==========================================================
// POST /admin/avaliacoes/:inscricaoId/certificado
// ==========================================================
// ==========================================================
//
// Curso interno aprovado:
//
// Admin pode publicar certificado.
//
// ==========================================================

router.post(
  "/admin/avaliacoes/:inscricaoId/certificado",

  upload.single(
    "arquivo"
  ),

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
              "Acesso permitido somente para administradores."

          });

      }



      if (
        !req.file
      ) {

        return res
          .status(400)
          .json({

            error:
              "Selecione um certificado."

          });

      }



      const enrollmentId =
        normalizeText(
          req.params.inscricaoId
        );



      const {

        data:
          enrollment

      } =
        await supabaseAdmin
          .from(
            "inscricoes_curso"
          )
          .select(
            "*"
          )
          .eq(
            "id",
            enrollmentId
          )
          .maybeSingle();



      if (
        !enrollment
      ) {

        return res
          .status(404)
          .json({

            error:
              "Inscrição não encontrada."

          });

      }



      if (
        enrollment.status !==
        "aprovado"
      ) {

        return res
          .status(400)
          .json({

            error:
              "O treinamento precisa estar aprovado antes da publicação do certificado."

          });

      }



      const courseResult =
        await getCourse(
          enrollment.curso_id
        );


      if (
        courseResult.error
      ) {

        return res
          .status(404)
          .json({

            error:
              "Curso não encontrado."

          });

      }



      const course =
        courseResult.course;



      if (
        course.setor_responsavel !==
        admin.setor
      ) {

        return res
          .status(403)
          .json({

            error:
              "Você não é responsável por este treinamento."

          });

      }



      if (
        course.curso_externo ===
        true
      ) {

        return res
          .status(400)
          .json({

            error:
              "Cursos externos utilizam o certificado enviado pelo próprio colaborador."

          });

      }



      const storagePath =
        createStoragePath(

          enrollment.usuario_id,

          `interno/curso-${enrollment.curso_id}`,

          req.file.originalname

        );



      const uploadResult =
        await uploadFileToStorage(

          CERTIFICATE_BUCKET,

          storagePath,

          req.file

        );



      if (
        uploadResult.error
      ) {

        return res
          .status(500)
          .json({

            error:
              "Não foi possível publicar o certificado."

          });

      }



      const {

        data:
          existingCertificate

      } =
        await supabaseAdmin
          .from(
            "certificados_curso"
          )
          .select(
            "*"
          )
          .eq(
            "inscricao_id",
            enrollment.id
          )
          .maybeSingle();



      let certificate =
        null;



      if (
        existingCertificate
      ) {

        const {

          data,

          error

        } =
          await supabaseAdmin
            .from(
              "certificados_curso"
            )
            .update({

              origem:
                "interno",

              arquivo_url:
                storagePath,

              arquivo_nome:
                req.file.originalname,

              publicado_por:
                admin.id

            })
            .eq(
              "id",
              existingCertificate.id
            )
            .select()
            .single();



        if (
          error
        ) {

          return res
            .status(500)
            .json({

              error:
                "Não foi possível atualizar o certificado."

            });

        }



        certificate =
          data;

      }



      else {

        const {

          data,

          error

        } =
          await supabaseAdmin
            .from(
              "certificados_curso"
            )
            .insert({

              inscricao_id:
                enrollment.id,

              usuario_id:
                enrollment.usuario_id,

              curso_id:
                enrollment.curso_id,

              origem:
                "interno",

              arquivo_url:
                storagePath,

              arquivo_nome:
                req.file.originalname,

              publicado_por:
                admin.id

            })
            .select()
            .single();



        if (
          error
        ) {

          return res
            .status(500)
            .json({

              error:
                "Não foi possível registrar o certificado."

            });

        }



        certificate =
          data;

      }



      return res.json({

        message:
          "Certificado publicado com sucesso.",

        certificado:
          certificate

      });


    } catch (
      error
    ) {

      console.error(
        "Erro ao publicar certificado:",
        error
      );


      return res
        .status(500)
        .json({

          error:
            "Erro interno ao publicar certificado."

        });

    }

  }
);



// ==========================================================
// ==========================================================
// GET /certificados/:id
// ==========================================================
// ==========================================================
//
// Retorna uma URL temporária.
//
// Colaborador:
// somente certificado próprio.
//
// Admin:
// certificado de curso do próprio setor responsável.
//
// ==========================================================

router.get(
  "/certificados/:id",
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



      const certificateId =
        normalizeText(
          req.params.id
        );



      const {

        data:
          certificate,

        error

      } =
        await supabaseAdmin
          .from(
            "certificados_curso"
          )
          .select(
            "*"
          )
          .eq(
            "id",
            certificateId
          )
          .maybeSingle();



      if (
        error
        ||
        !certificate
      ) {

        return res
          .status(404)
          .json({

            error:
              "Certificado não encontrado."

          });

      }



      // ====================================================
      // COLABORADOR
      // ====================================================

      if (
        user.perfil ===
        "colaborador"
      ) {

        if (
          certificate.usuario_id !==
          user.id
        ) {

          return res
            .status(403)
            .json({

              error:
                "Você não possui acesso a este certificado."

            });

        }

      }



      // ====================================================
      // ADMIN
      // ====================================================

      else if (
        isAdmin(
          user
        )
      ) {

        const courseResult =
          await getCourse(
            certificate.curso_id
          );


        if (
          courseResult.error
          ||
          courseResult
            .course
            .setor_responsavel !==
            user.setor
        ) {

          return res
            .status(403)
            .json({

              error:
                "Você não possui acesso a este certificado."

            });

        }

      }



      else {

        return res
          .status(403)
          .json({

            error:
              "Acesso negado."

          });

      }



      const signedUrl =
        await createSignedFileUrl(

          CERTIFICATE_BUCKET,

          certificate.arquivo_url

        );



      if (
        !signedUrl
      ) {

        return res
          .status(500)
          .json({

            error:
              "Não foi possível gerar acesso ao certificado."

          });

      }



      return res.json({

        certificado:
          certificate,

        url:
          signedUrl

      });


    } catch (
      error
    ) {

      console.error(
        "Erro certificado:",
        error
      );


      return res
        .status(500)
        .json({

          error:
            "Erro interno ao abrir certificado."

        });

    }

  }
);



// ==========================================================
// EXPORTAR
// ==========================================================

module.exports =
  router;