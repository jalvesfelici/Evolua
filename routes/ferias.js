// ==========================================================
// EVOLUA+
// ROTAS DE FÉRIAS
// ==========================================================
//
// REGRAS:
//
// 1. O Admin cadastra o período aquisitivo.
//
// 2. Enquanto o período não terminar:
//
//    dias_direito = 0
//    status = em_aquisicao
//
// 3. Depois que o período terminar:
//
//    dias_direito = 30
//
// 4. Saldo:
//
//    dias_disponiveis =
//      dias_direito - dias_usados
//
// 5. Admin de setor:
//    somente funcionários do próprio setor.
//
// 6. Colaborador:
//    somente as próprias férias.
//
// 7. Solicitações:
//
//    pendente
//    aprovada
//    aprovada_com_ressalvas
//    recusada
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



// Cliente normal.
//
// Utilizado para validar o token do usuário.
const supabase =
  require(
    "../config/supabase"
  );



// Cliente administrativo.
//
// Utilizado no backend para acessar as tabelas
// com segurança através da Service Role.
const supabaseAdmin =
  require(
    "../config/supabaseAdmin"
  );



// ==========================================================
// CONSTANTES
// ==========================================================

const DIAS_FERIAS_PADRAO =
  30;



// ==========================================================
// PEGAR TOKEN BEARER
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
    parts.length !== 2
    ||
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
  // VALIDAR TOKEN NO SUPABASE AUTH
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
  // BUSCAR PERFIL DO USUÁRIO
  // ========================================================

  const {

    data:
      usuario,

    error:
      usuarioError

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
    usuarioError
    ||
    !usuario
  ) {

    console.error(
      "Erro ao buscar usuário:",
      usuarioError
    );


    return {

      error:
        "Usuário não encontrado.",

      status:
        404

    };

  }



  // ========================================================
  // USUÁRIO INATIVO
  // ========================================================

  if (
    usuario.ativo ===
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
      usuario

  };

}



// ==========================================================
// VERIFICAR SE É ADMIN
// ==========================================================

function isAdmin(
  usuario
) {

  return (

    usuario.perfil ===
      "admin_principal"

    ||

    usuario.perfil ===
      "admin_setor"

  );

}



// ==========================================================
// NORMALIZAR DATA
// ==========================================================
//
// Trabalhamos com UTC para evitar problemas de:
//
// 2026-08-23
//
// virar:
//
// 2026-08-22
//
// por causa do timezone.
//
// ==========================================================

function createUtcDate(
  value
) {

  if (
    !value
  ) {

    return null;

  }


  const dateOnly =
    String(
      value
    )
      .substring(
        0,
        10
      );


  const date =
    new Date(
      `${dateOnly}T00:00:00.000Z`
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return null;

  }


  return date;

}



// ==========================================================
// HOJE EM UTC
// ==========================================================

function getTodayUtc() {

  const now =
    new Date();


  return new Date(

    Date.UTC(

      now.getUTCFullYear(),

      now.getUTCMonth(),

      now.getUTCDate()

    )

  );

}



// ==========================================================
// CALCULAR QUANTIDADE DE DIAS
// ==========================================================
//
// Exemplo:
//
// 01/09
// até
// 10/09
//
// = 10 dias.
//
// ==========================================================

function calculateDaysBetween(
  inicio,
  fim
) {

  if (
    !inicio
    ||
    !fim
  ) {

    return 0;

  }


  if (
    fim <
    inicio
  ) {

    return 0;

  }


  const difference =

    fim.getTime()

    -

    inicio.getTime();


  return (

    Math.floor(

      difference /
      86400000

    )

    +

    1

  );

}



// ==========================================================
// CALCULAR SITUAÇÃO DO PERÍODO
// ==========================================================
//
// IMPORTANTE:
//
// O banco guarda as datas e os dias usados.
//
// A regra de negócio é calculada pelo backend.
//
// ==========================================================

function calculateVacationPeriod(
  periodo
) {

  if (
    !periodo
  ) {

    return null;

  }



  const periodoFim =
    createUtcDate(
      periodo.periodo_fim
    );


  const hoje =
    getTodayUtc();



  // ========================================================
  // PERÍODO INVÁLIDO
  // ========================================================

  if (
    !periodoFim
  ) {

    return {

      ...periodo,

      dias_direito:
        0,

      dias_usados:
        Number(
          periodo.dias_usados || 0
        ),

      dias_disponiveis:
        0,

      status_calculado:
        "invalido",

      periodo_concluido:
        false

    };

  }



  // ========================================================
  // PERÍODO CONCLUÍDO?
  // ========================================================
  //
  // Regra atual:
  //
  // hoje > periodo_fim
  //
  // Ou seja:
  //
  // se o período terminar em 31/12,
  // os 30 dias ficam disponíveis a partir de 01/01.
  //
  // ========================================================

  const periodoConcluido =

    hoje >
    periodoFim;



  // ========================================================
  // DIAS DE DIREITO
  // ========================================================

  const diasDireito =

    periodoConcluido

      ? DIAS_FERIAS_PADRAO

      : 0;



  // ========================================================
  // DIAS JÁ UTILIZADOS
  // ========================================================

  const diasUsados =

    Math.max(

      Number(
        periodo.dias_usados || 0
      ),

      0

    );



  // ========================================================
  // SALDO
  // ========================================================

  const diasDisponiveis =

    Math.max(

      diasDireito -
      diasUsados,

      0

    );



  // ========================================================
  // STATUS
  // ========================================================

  let statusCalculado =
    "em_aquisicao";


  if (
    periodoConcluido
    &&
    diasDisponiveis > 0
  ) {

    statusCalculado =
      "disponivel";

  }


  if (
    periodoConcluido
    &&
    diasDisponiveis === 0
  ) {

    statusCalculado =
      "utilizado";

  }



  return {

    ...periodo,

    dias_direito:
      diasDireito,

    dias_usados:
      diasUsados,

    dias_disponiveis:
      diasDisponiveis,

    status_calculado:
      statusCalculado,

    periodo_concluido:
      periodoConcluido

  };

}



// ==========================================================
// SINCRONIZAR PERÍODO NO BANCO
// ==========================================================
//
// Apesar de o cálculo poder ser feito em tempo real,
// também mantemos:
//
// dias_direito
// status
//
// atualizados na tabela.
//
// ==========================================================

async function synchronizeVacationPeriod(
  periodoCalculado
) {

  if (
    !periodoCalculado
    ||
    !periodoCalculado.id
  ) {

    return;

  }


  const {

    error

  } =
    await supabaseAdmin
      .from(
        "periodos_ferias"
      )
      .update({

        dias_direito:
          periodoCalculado
            .dias_direito,

        status:
          periodoCalculado
            .status_calculado

      })
      .eq(
        "id",
        periodoCalculado.id
      );


  if (
    error
  ) {

    // Não derrubamos toda a requisição
    // porque o cálculo já está correto em memória.

    console.error(
      "Não foi possível sincronizar o período:",
      error
    );

  }

}



// ==========================================================
// VALIDAR PERMISSÃO SOBRE COLABORADOR
// ==========================================================
//
// admin_principal
// → qualquer setor.
//
// admin_setor
// → somente próprio setor.
//
// ==========================================================

async function validateEmployeePermission(
  admin,
  usuarioId
) {

  const {

    data:
      colaborador,

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
          matricula,
          email,
          cargo,
          setor,
          perfil,
          ativo
        `
      )
      .eq(
        "id",
        usuarioId
      )
      .maybeSingle();



  if (
    error
    ||
    !colaborador
  ) {

    return {

      error:
        "Colaborador não encontrado.",

      status:
        404

    };

  }



  // ========================================================
  // PRECISA SER COLABORADOR
  // ========================================================

  if (
    colaborador.perfil !==
    "colaborador"
  ) {

    return {

      error:
        "Férias só podem ser configuradas para colaboradores.",

      status:
        400

    };

  }



  // ========================================================
  // COLABORADOR INATIVO
  // ========================================================

  if (
    colaborador.ativo ===
    false
  ) {

    return {

      error:
        "O colaborador está inativo.",

      status:
        400

    };

  }



  // ========================================================
  // ADMIN DE SETOR
  // ========================================================

  if (
    admin.perfil ===
      "admin_setor"

    &&

    admin.setor !==
      colaborador.setor
  ) {

    return {

      error:
        "Você só pode administrar férias dos colaboradores do seu próprio setor.",

      status:
        403

    };

  }



  return {

    colaborador

  };

}



// ==========================================================
// GET /api/ferias/minhas
// ==========================================================
//
// Retorna:
//
// usuario
// periodo
//
// Se o período tiver terminado,
// os 30 dias são liberados automaticamente.
//
// ==========================================================

router.get(
  "/minhas",
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



      const usuario =
        authResult.user;



      // ====================================================
      // SOMENTE COLABORADOR
      // ====================================================

      if (
        usuario.perfil !==
        "colaborador"
      ) {

        return res
          .status(403)
          .json({

            error:
              "Esta consulta é destinada aos colaboradores."

          });

      }



      // ====================================================
      // PERÍODO MAIS RECENTE
      // ====================================================

      const {

        data:
          periodo,

        error

      } =
        await supabaseAdmin
          .from(
            "periodos_ferias"
          )
          .select(
            "*"
          )
          .eq(
            "usuario_id",
            usuario.id
          )
          .order(
            "periodo_inicio",
            {

              ascending:
                false

            }
          )
          .limit(1)
          .maybeSingle();



      if (
        error
      ) {

        console.error(
          "Erro ao carregar férias:",
          error
        );


        return res
          .status(500)
          .json({

            error:
              "Não foi possível carregar as férias."

          });

      }



      // ====================================================
      // AINDA NÃO POSSUI PERÍODO
      // ====================================================

      if (
        !periodo
      ) {

        return res.json({

          usuario,

          periodo:
            null

        });

      }



      // ====================================================
      // CALCULAR
      // ====================================================

      const periodoCalculado =
        calculateVacationPeriod(
          periodo
        );


      await synchronizeVacationPeriod(
        periodoCalculado
      );



      return res.json({

        usuario,

        periodo:
          periodoCalculado

      });


    } catch (
      error
    ) {

      console.error(
        "Erro GET /api/ferias/minhas:",
        error
      );


      return res
        .status(500)
        .json({

          error:
            "Erro interno ao carregar as férias."

        });

    }

  }
);



// ==========================================================
// GET /api/ferias/solicitacoes
// ==========================================================
//
// Colaborador consulta somente
// as próprias solicitações.
//
// ==========================================================

router.get(
  "/solicitacoes",
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



      const usuario =
        authResult.user;



      // ====================================================
      // SOMENTE COLABORADOR
      // ====================================================

      if (
        usuario.perfil !==
        "colaborador"
      ) {

        return res
          .status(403)
          .json({

            error:
              "Esta consulta é destinada aos colaboradores."

          });

      }



      const {

        data,

        error

      } =
        await supabaseAdmin
          .from(
            "solicitacoes_ferias"
          )
          .select(
            "*"
          )
          .eq(
            "usuario_id",
            usuario.id
          )
          .order(
            "created_at",
            {

              ascending:
                false

            }
          );



      if (
        error
      ) {

        console.error(
          "Erro ao carregar solicitações:",
          error
        );


        return res
          .status(500)
          .json({

            error:
              "Não foi possível carregar as solicitações."

          });

      }



      return res.json(
        data || []
      );


    } catch (
      error
    ) {

      console.error(
        "Erro GET /api/ferias/solicitacoes:",
        error
      );


      return res
        .status(500)
        .json({

          error:
            "Erro interno ao buscar solicitações."

        });

    }

  }
);

// ==========================================================
// POST /api/ferias/solicitacoes
// ==========================================================
//
// COLABORADOR:
//
// Cria uma nova solicitação de férias.
//
// REGRAS:
//
// - somente colaborador;
// - precisa possuir período cadastrado;
// - período aquisitivo precisa estar concluído;
// - precisa possuir saldo;
// - quantidade solicitada não pode ultrapassar o saldo;
// - datas precisam ser válidas;
// - não permitimos solicitação duplicada pendente
//   para exatamente o mesmo período.
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


      const usuario =
        authResult.user;



      // ====================================================
      // SOMENTE COLABORADOR
      // ====================================================

      if (
        usuario.perfil !==
        "colaborador"
      ) {

        return res
          .status(403)
          .json({

            error:
              "Somente colaboradores podem solicitar férias."

          });

      }



      // ====================================================
      // DADOS RECEBIDOS
      // ====================================================

      const {

        data_inicio,

        data_fim,

        observacoes

      } =
        req.body;



      // ====================================================
      // CAMPOS OBRIGATÓRIOS
      // ====================================================

      if (
        !data_inicio
        ||
        !data_fim
      ) {

        return res
          .status(400)
          .json({

            error:
              "Informe a data de início e a data de término."

          });

      }



      // ====================================================
      // NORMALIZAR DATAS
      // ====================================================

      const inicio =
        createUtcDate(
          data_inicio
        );


      const fim =
        createUtcDate(
          data_fim
        );



      if (
        !inicio
        ||
        !fim
      ) {

        return res
          .status(400)
          .json({

            error:
              "Uma ou mais datas informadas são inválidas."

          });

      }



      // ====================================================
      // DATA FINAL NÃO PODE SER ANTERIOR
      // ====================================================

      if (
        fim <
        inicio
      ) {

        return res
          .status(400)
          .json({

            error:
              "A data de término não pode ser anterior à data de início."

          });

      }



      // ====================================================
      // NÃO PERMITIR FÉRIAS NO PASSADO
      // ====================================================

      const hoje =
        getTodayUtc();


      if (
        inicio <
        hoje
      ) {

        return res
          .status(400)
          .json({

            error:
              "A data de início das férias não pode estar no passado."

          });

      }



      // ====================================================
      // QUANTIDADE DE DIAS
      // ====================================================

      const quantidadeDias =
        calculateDaysBetween(
          inicio,
          fim
        );


      if (
        quantidadeDias <= 0
      ) {

        return res
          .status(400)
          .json({

            error:
              "A quantidade de dias solicitada é inválida."

          });

      }



      // ====================================================
      // BUSCAR PERÍODO DE FÉRIAS
      // ====================================================

      const {

        data:
          periodo,

        error:
          periodoError

      } =
        await supabaseAdmin
          .from(
            "periodos_ferias"
          )
          .select(
            "*"
          )
          .eq(
            "usuario_id",
            usuario.id
          )
          .order(
            "periodo_inicio",
            {

              ascending:
                false

            }
          )
          .limit(1)
          .maybeSingle();



      if (
        periodoError
      ) {

        console.error(
          "Erro ao buscar período de férias:",
          periodoError
        );


        return res
          .status(500)
          .json({

            error:
              "Não foi possível verificar seu período de férias."

          });

      }



      if (
        !periodo
      ) {

        return res
          .status(400)
          .json({

            error:
              "Nenhum período de férias foi cadastrado para você."

          });

      }



      // ====================================================
      // CALCULAR SITUAÇÃO ATUAL DO PERÍODO
      // ====================================================

      const periodoCalculado =
        calculateVacationPeriod(
          periodo
        );


      await synchronizeVacationPeriod(
        periodoCalculado
      );



      // ====================================================
      // PERÍODO AINDA NÃO CONCLUÍDO
      // ====================================================

      if (
        !periodoCalculado
          .periodo_concluido
      ) {

        return res
          .status(400)
          .json({

            error:
              "Seu período aquisitivo ainda não foi concluído."

          });

      }



      // ====================================================
      // SEM SALDO
      // ====================================================

      if (
        periodoCalculado
          .dias_disponiveis <= 0
      ) {

        return res
          .status(400)
          .json({

            error:
              "Você não possui saldo de férias disponível."

          });

      }



      // ====================================================
      // SALDO INSUFICIENTE
      // ====================================================

      if (
        quantidadeDias >
        periodoCalculado
          .dias_disponiveis
      ) {

        return res
          .status(400)
          .json({

            error:
              `Você possui somente ${periodoCalculado.dias_disponiveis} dias disponíveis.`

          });

      }



      // ====================================================
      // EVITAR SOLICITAÇÃO DUPLICADA PENDENTE
      // ====================================================

      const {

        data:
          solicitacaoDuplicada,

        error:
          duplicateError

      } =
        await supabaseAdmin
          .from(
            "solicitacoes_ferias"
          )
          .select(
            "id"
          )
          .eq(
            "usuario_id",
            usuario.id
          )
          .eq(
            "status",
            "pendente"
          )
          .eq(
            "data_inicio",
            data_inicio
          )
          .eq(
            "data_fim",
            data_fim
          )
          .maybeSingle();



      if (
        duplicateError
      ) {

        console.error(
          "Erro ao verificar solicitação duplicada:",
          duplicateError
        );


        return res
          .status(500)
          .json({

            error:
              "Não foi possível validar a solicitação."

          });

      }



      if (
        solicitacaoDuplicada
      ) {

        return res
          .status(400)
          .json({

            error:
              "Já existe uma solicitação pendente para esse mesmo período."

          });

      }



      // ====================================================
      // CRIAR SOLICITAÇÃO
      // ====================================================

      const {

        data:
          solicitacao,

        error:
          insertError

      } =
        await supabaseAdmin
          .from(
            "solicitacoes_ferias"
          )
          .insert({

            usuario_id:
              usuario.id,

            periodo_ferias_id:
              periodo.id,

            data_inicio,

            data_fim,

            quantidade_dias:
              quantidadeDias,

            observacoes:
              observacoes
              ? String(
                  observacoes
                ).trim()
              : null,

            status:
              "pendente"

          })
          .select()
          .single();



      if (
        insertError
      ) {

        console.error(
          "Erro ao criar solicitação:",
          insertError
        );


        return res
          .status(500)
          .json({

            error:
              "Não foi possível enviar a solicitação.",

            details:
              insertError.message

          });

      }



      return res
        .status(201)
        .json({

          message:
            "Solicitação enviada com sucesso.",

          solicitacao

        });


    } catch (
      error
    ) {

      console.error(
        "Erro POST /api/ferias/solicitacoes:",
        error
      );


      return res
        .status(500)
        .json({

          error:
            "Erro interno ao solicitar férias."

        });

    }

  }
);



// ==========================================================
// GET /api/ferias/admin/periodos/:usuarioId
// ==========================================================
//
// ADMIN:
//
// Consulta o período mais recente
// de um determinado colaborador.
//
// ==========================================================

router.get(
  "/admin/periodos/:usuarioId",
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


      const admin =
        authResult.user;



      // ====================================================
      // PRECISA SER ADMIN
      // ====================================================

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



      const usuarioId =
        req.params.usuarioId;



      // ====================================================
      // PERMISSÃO SOBRE COLABORADOR
      // ====================================================

      const permission =
        await validateEmployeePermission(
          admin,
          usuarioId
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
      // BUSCAR PERÍODO MAIS RECENTE
      // ====================================================

      const {

        data:
          periodo,

        error

      } =
        await supabaseAdmin
          .from(
            "periodos_ferias"
          )
          .select(
            "*"
          )
          .eq(
            "usuario_id",
            usuarioId
          )
          .order(
            "periodo_inicio",
            {

              ascending:
                false

            }
          )
          .limit(1)
          .maybeSingle();



      if (
        error
      ) {

        console.error(
          "Erro ao buscar período do colaborador:",
          error
        );


        return res
          .status(500)
          .json({

            error:
              "Não foi possível carregar o período de férias."

          });

      }



      // ====================================================
      // AINDA NÃO POSSUI PERÍODO
      // ====================================================

      if (
        !periodo
      ) {

        return res.json({

          colaborador:
            permission
              .colaborador,

          periodo:
            null

        });

      }



      // ====================================================
      // CALCULAR ESTADO ATUAL
      // ====================================================

      const periodoCalculado =
        calculateVacationPeriod(
          periodo
        );


      await synchronizeVacationPeriod(
        periodoCalculado
      );



      return res.json({

        colaborador:
          permission
            .colaborador,

        periodo:
          periodoCalculado

      });


    } catch (
      error
    ) {

      console.error(
        "Erro GET /api/ferias/admin/periodos/:usuarioId:",
        error
      );


      return res
        .status(500)
        .json({

          error:
            "Erro interno ao buscar o período de férias."

        });

    }

  }
);



// ==========================================================
// PUT /api/ferias/admin/periodos/:usuarioId
// ==========================================================
//
// ADMIN:
//
// Cadastra ou atualiza os dados básicos
// do período de férias.
//
// ADMIN INFORMA:
//
// - periodo_inicio
// - periodo_fim
// - dias_usados
// - data_vencimento
//
// BACKEND CALCULA:
//
// dias_direito
// status
//
// ==========================================================

router.put(
  "/admin/periodos/:usuarioId",
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


      const admin =
        authResult.user;



      // ====================================================
      // PRECISA SER ADMIN
      // ====================================================

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



      const usuarioId =
        req.params.usuarioId;



      // ====================================================
      // PERMISSÃO
      // ====================================================

      const permission =
        await validateEmployeePermission(
          admin,
          usuarioId
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

        periodo_inicio,

        periodo_fim,

        dias_usados,

        data_vencimento

      } =
        req.body;



      // ====================================================
      // VALIDAÇÃO DOS CAMPOS
      // ====================================================

      if (
        !periodo_inicio
        ||
        !periodo_fim
        ||
        dias_usados ===
          undefined
        ||
        !data_vencimento
      ) {

        return res
          .status(400)
          .json({

            error:
              "Preencha todos os dados do período de férias."

          });

      }



      // ====================================================
      // DATAS
      // ====================================================

      const inicio =
        createUtcDate(
          periodo_inicio
        );


      const fim =
        createUtcDate(
          periodo_fim
        );


      const vencimento =
        createUtcDate(
          data_vencimento
        );



      if (
        !inicio
        ||
        !fim
        ||
        !vencimento
      ) {

        return res
          .status(400)
          .json({

            error:
              "Uma ou mais datas informadas são inválidas."

          });

      }



      // ====================================================
      // FIM >= INÍCIO
      // ====================================================

      if (
        fim <
        inicio
      ) {

        return res
          .status(400)
          .json({

            error:
              "O fim do período não pode ser anterior ao início."

          });

      }



      // ====================================================
      // VENCIMENTO >= FIM
      // ====================================================

      if (
        vencimento <
        fim
      ) {

        return res
          .status(400)
          .json({

            error:
              "A data de vencimento não pode ser anterior ao fim do período aquisitivo."

          });

      }



      // ====================================================
      // DIAS USADOS
      // ====================================================

      const usedDays =
        Number(
          dias_usados
        );


      if (
        !Number.isInteger(
          usedDays
        )
        ||
        usedDays < 0
        ||
        usedDays >
          DIAS_FERIAS_PADRAO
      ) {

        return res
          .status(400)
          .json({

            error:
              "A quantidade de dias utilizados deve estar entre 0 e 30."

          });

      }



      // ====================================================
      // CALCULAR DIREITO AUTOMATICAMENTE
      // ====================================================

      const hoje =
        getTodayUtc();


      const periodoConcluido =

        hoje >
        fim;


      const diasDireito =

        periodoConcluido

          ? DIAS_FERIAS_PADRAO

          : 0;



      // ====================================================
      // STATUS
      // ====================================================

      let status =
        "em_aquisicao";


      if (
        periodoConcluido
        &&
        usedDays <
          DIAS_FERIAS_PADRAO
      ) {

        status =
          "disponivel";

      }


      if (
        periodoConcluido
        &&
        usedDays >=
          DIAS_FERIAS_PADRAO
      ) {

        status =
          "utilizado";

      }



      // ====================================================
      // DADOS A SEREM SALVOS
      // ====================================================

      const vacationData = {

        usuario_id:
          usuarioId,

        periodo_inicio,

        periodo_fim,

        dias_direito:
          diasDireito,

        dias_usados:
          usedDays,

        data_vencimento,

        status

      };



      // ====================================================
      // BUSCAR PERÍODO EXISTENTE
      // ====================================================

      const {

        data:
          periodoExistente,

        error:
          searchError

      } =
        await supabaseAdmin
          .from(
            "periodos_ferias"
          )
          .select(
            "id"
          )
          .eq(
            "usuario_id",
            usuarioId
          )
          .order(
            "periodo_inicio",
            {

              ascending:
                false

            }
          )
          .limit(1)
          .maybeSingle();



      if (
        searchError
      ) {

        console.error(
          "Erro ao verificar período existente:",
          searchError
        );


        return res
          .status(500)
          .json({

            error:
              "Não foi possível verificar o período existente."

          });

      }



      let periodoSalvo =
        null;



      // ====================================================
      // ATUALIZAR PERÍODO EXISTENTE
      // ====================================================

      if (
        periodoExistente
      ) {

        const {

          data,

          error

        } =
          await supabaseAdmin
            .from(
              "periodos_ferias"
            )
            .update(
              vacationData
            )
            .eq(
              "id",
              periodoExistente.id
            )
            .select()
            .single();



        if (
          error
        ) {

          console.error(
            "Erro ao atualizar período de férias:",
            error
          );


          return res
            .status(500)
            .json({

              error:
                "Não foi possível atualizar o período de férias.",

              details:
                error.message

            });

        }


        periodoSalvo =
          data;

      }



      // ====================================================
      // CRIAR PRIMEIRO PERÍODO
      // ====================================================

      else {

        const {

          data,

          error

        } =
          await supabaseAdmin
            .from(
              "periodos_ferias"
            )
            .insert(
              vacationData
            )
            .select()
            .single();



        if (
          error
        ) {

          console.error(
            "Erro ao cadastrar período de férias:",
            error
          );


          return res
            .status(500)
            .json({

              error:
                "Não foi possível cadastrar o período de férias.",

              details:
                error.message

            });

        }


        periodoSalvo =
          data;

      }



      // ====================================================
      // CALCULAR RESPOSTA FINAL
      // ====================================================

      const periodoCalculado =
        calculateVacationPeriod(
          periodoSalvo
        );



      // ====================================================
      // RESPOSTA
      // ====================================================

      return res.json({

        message:

          periodoExistente

            ? "Período de férias atualizado com sucesso."

            : "Período de férias cadastrado com sucesso.",


        colaborador:
          permission
            .colaborador,


        periodo:
          periodoCalculado

      });


    } catch (
      error
    ) {

      console.error(
        "Erro PUT /api/ferias/admin/periodos/:usuarioId:",
        error
      );


      return res
        .status(500)
        .json({

          error:
            "Erro interno ao salvar o período de férias."

        });

    }

  }
);

// ==========================================================
// GET /api/ferias/admin/solicitacoes
// ==========================================================
//
// ADMIN:
//
// Retorna somente solicitações pendentes.
//
// admin_principal:
// → pode visualizar todas.
//
// admin_setor:
// → vê somente colaboradores do próprio setor.
//
// ==========================================================

router.get(
  "/admin/solicitacoes",
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



      const admin =
        authResult.user;



      // ====================================================
      // PRECISA SER ADMIN
      // ====================================================

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
      // BUSCAR SOLICITAÇÕES PENDENTES
      // ====================================================

      const {

        data,

        error

      } =
        await supabaseAdmin
          .from(
            "solicitacoes_ferias"
          )
          .select(
            `
              *,
              usuario:usuario_id (
                id,
                nome,
                matricula,
                email,
                cargo,
                setor,
                perfil,
                ativo
              )
            `
          )
          .eq(
            "status",
            "pendente"
          )
          .order(
            "created_at",
            {

              ascending:
                false

            }
          );



      if (
        error
      ) {

        console.error(
          "Erro ao buscar solicitações de férias:",
          error
        );


        return res
          .status(500)
          .json({

            error:
              "Não foi possível buscar as solicitações de férias."

          });

      }



      let solicitacoes =
        data || [];



      // ====================================================
      // ADMIN DE SETOR
      // ====================================================
      //
      // Só pode visualizar solicitações
      // dos colaboradores do próprio setor.
      //
      // ====================================================

      if (
        admin.perfil ===
        "admin_setor"
      ) {

        solicitacoes =
          solicitacoes.filter(
            solicitacao => {

              return (

                solicitacao.usuario
                  ?.setor ===
                admin.setor

              );

            }
          );

      }



      // ====================================================
      // IGNORAR USUÁRIOS QUE NÃO SÃO COLABORADORES
      // ====================================================

      solicitacoes =
        solicitacoes.filter(
          solicitacao => {

            return (

              solicitacao.usuario
              &&
              solicitacao.usuario.perfil ===
                "colaborador"

            );

          }
        );



      return res.json(
        solicitacoes
      );


    } catch (
      error
    ) {

      console.error(
        "Erro GET /api/ferias/admin/solicitacoes:",
        error
      );


      return res
        .status(500)
        .json({

          error:
            "Erro interno ao buscar as solicitações."

        });

    }

  }
);



// ==========================================================
// PATCH /api/ferias/admin/solicitacoes/:id
// ==========================================================
//
// ADMIN:
//
// Responde uma solicitação.
//
// STATUS PERMITIDOS:
//
// aprovada
// aprovada_com_ressalvas
// recusada
//
// REGRAS:
//
// - somente Admin;
// - Admin de setor só responde seu próprio setor;
// - solicitação precisa estar pendente;
// - recusa precisa de observação;
// - ressalva precisa de observação;
// - aprovação consome saldo;
// - aprovação com ressalvas também consome saldo;
// - recusa NÃO consome saldo;
// - registra quem avaliou;
// - registra quando foi avaliada.
//
// ==========================================================

router.patch(
  "/admin/solicitacoes/:id",
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



      const admin =
        authResult.user;



      // ====================================================
      // PRECISA SER ADMIN
      // ====================================================

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



      const solicitacaoId =
        req.params.id;



      // ====================================================
      // DADOS
      // ====================================================

      const {

        status,

        observacao_admin

      } =
        req.body;



      // ====================================================
      // STATUS PERMITIDOS
      // ====================================================

      const allowedStatus = [

        "aprovada",

        "aprovada_com_ressalvas",

        "recusada"

      ];



      if (
        !allowedStatus.includes(
          status
        )
      ) {

        return res
          .status(400)
          .json({

            error:
              "Status da solicitação inválido."

          });

      }



      // ====================================================
      // OBSERVAÇÃO
      // ====================================================

      const adminObservation =
        String(
          observacao_admin || ""
        ).trim();



      if (
        (
          status ===
            "recusada"

          ||

          status ===
            "aprovada_com_ressalvas"
        )

        &&

        !adminObservation
      ) {

        return res
          .status(400)
          .json({

            error:
              "Informe uma observação para esta decisão."

          });

      }



      // ====================================================
      // BUSCAR SOLICITAÇÃO
      // ====================================================

      const {

        data:
          solicitacao,

        error:
          solicitacaoError

      } =
        await supabaseAdmin
          .from(
            "solicitacoes_ferias"
          )
          .select(
            `
              *,
              usuario:usuario_id (
                id,
                nome,
                matricula,
                email,
                cargo,
                setor,
                perfil,
                ativo
              )
            `
          )
          .eq(
            "id",
            solicitacaoId
          )
          .maybeSingle();



      if (
        solicitacaoError
      ) {

        console.error(
          "Erro ao buscar solicitação:",
          solicitacaoError
        );


        return res
          .status(500)
          .json({

            error:
              "Não foi possível carregar a solicitação."

          });

      }



      if (
        !solicitacao
      ) {

        return res
          .status(404)
          .json({

            error:
              "Solicitação não encontrada."

          });

      }



      // ====================================================
      // USUÁRIO PRECISA SER COLABORADOR
      // ====================================================

      if (
        !solicitacao.usuario
        ||
        solicitacao.usuario.perfil !==
          "colaborador"
      ) {

        return res
          .status(400)
          .json({

            error:
              "A solicitação não pertence a um colaborador válido."

          });

      }



      // ====================================================
      // SOLICITAÇÃO JÁ ANALISADA
      // ====================================================

      if (
        solicitacao.status !==
        "pendente"
      ) {

        return res
          .status(400)
          .json({

            error:
              "Esta solicitação já foi analisada."

          });

      }



      // ====================================================
      // ADMIN DE SETOR
      // ====================================================

      if (
        admin.perfil ===
          "admin_setor"

        &&

        solicitacao.usuario
          .setor !==
        admin.setor
      ) {

        return res
          .status(403)
          .json({

            error:
              "Você só pode analisar solicitações de colaboradores do seu próprio setor."

          });

      }



      // ====================================================
      // APROVAÇÃO CONSOME SALDO
      // ====================================================

      const approved =

        status ===
          "aprovada"

        ||

        status ===
          "aprovada_com_ressalvas";



      // ====================================================
      // VARIÁVEIS DE CONTROLE
      // ====================================================

      let periodoAtualizado =
        null;



      if (
        approved
      ) {

        // ==================================================
        // BUSCAR PERÍODO DA SOLICITAÇÃO
        // ==================================================

        const {

          data:
            periodo,

          error:
            periodoError

        } =
          await supabaseAdmin
            .from(
              "periodos_ferias"
            )
            .select(
              "*"
            )
            .eq(
              "id",
              solicitacao
                .periodo_ferias_id
            )
            .maybeSingle();



        if (
          periodoError
        ) {

          console.error(
            "Erro ao buscar período:",
            periodoError
          );


          return res
            .status(500)
            .json({

              error:
                "Não foi possível carregar o período de férias."

            });

        }



        if (
          !periodo
        ) {

          return res
            .status(404)
            .json({

              error:
                "Período de férias não encontrado."

            });

        }



        // ==================================================
        // VERIFICAR SE PERÍODO PERTENCE AO COLABORADOR
        // ==================================================

        if (
          String(
            periodo.usuario_id
          )
          !==
          String(
            solicitacao.usuario_id
          )
        ) {

          return res
            .status(400)
            .json({

              error:
                "O período de férias não pertence ao colaborador da solicitação."

            });

        }



        // ==================================================
        // CALCULAR PERÍODO ATUAL
        // ==================================================

        const periodoCalculado =
          calculateVacationPeriod(
            periodo
          );



        if (
          !periodoCalculado
            .periodo_concluido
        ) {

          return res
            .status(400)
            .json({

              error:
                "O período aquisitivo ainda não foi concluído."

            });

        }



        // ==================================================
        // QUANTIDADE SOLICITADA
        // ==================================================

        const requestedDays =
          Number(
            solicitacao
              .quantidade_dias || 0
          );



        if (
          !Number.isInteger(
            requestedDays
          )
          ||
          requestedDays <= 0
        ) {

          return res
            .status(400)
            .json({

              error:
                "A quantidade de dias da solicitação é inválida."

            });

        }



        // ==================================================
        // VERIFICAR SALDO ATUAL
        // ==================================================

        if (
          requestedDays >
          periodoCalculado
            .dias_disponiveis
        ) {

          return res
            .status(400)
            .json({

              error:
                `O colaborador possui somente ${periodoCalculado.dias_disponiveis} dias disponíveis.`

            });

        }



        // ==================================================
        // NOVO TOTAL UTILIZADO
        // ==================================================

        const novoTotalUsado =

          Number(
            periodoCalculado
              .dias_usados
          )

          +

          requestedDays;



        if (
          novoTotalUsado >
          DIAS_FERIAS_PADRAO
        ) {

          return res
            .status(400)
            .json({

              error:
                "A aprovação ultrapassaria o limite de 30 dias de férias."

            });

        }



        // ==================================================
        // NOVO STATUS DO PERÍODO
        // ==================================================

        const novoStatusPeriodo =

          novoTotalUsado >=
          DIAS_FERIAS_PADRAO

            ? "utilizado"

            : "disponivel";



        // ==================================================
        // ATUALIZAR SALDO
        // ==================================================

        const {

          data:
            periodoUpdate,

          error:
            updatePeriodoError

        } =
          await supabaseAdmin
            .from(
              "periodos_ferias"
            )
            .update({

              dias_direito:
                DIAS_FERIAS_PADRAO,

              dias_usados:
                novoTotalUsado,

              status:
                novoStatusPeriodo

            })
            .eq(
              "id",
              periodo.id
            )
            .select()
            .single();



        if (
          updatePeriodoError
        ) {

          console.error(
            "Erro ao atualizar saldo:",
            updatePeriodoError
          );


          return res
            .status(500)
            .json({

              error:
                "Não foi possível atualizar o saldo de férias.",

              details:
                updatePeriodoError.message

            });

        }



        periodoAtualizado =
          calculateVacationPeriod(
            periodoUpdate
          );

      }



      // ====================================================
      // ATUALIZAR SOLICITAÇÃO
      // ====================================================

      const {

        data:
          solicitacaoAtualizada,

        error:
          updateError

      } =
        await supabaseAdmin
          .from(
            "solicitacoes_ferias"
          )
          .update({

            status,

            observacao_admin:

              adminObservation

                ? adminObservation

                : null,

            avaliado_por:
              admin.id,

            data_avaliacao:
              new Date()
                .toISOString()

          })
          .eq(
            "id",
            solicitacaoId
          )
          .eq(
            "status",
            "pendente"
          )
          .select()
          .maybeSingle();



      if (
        updateError
      ) {

        console.error(
          "Erro ao atualizar solicitação:",
          updateError
        );


        return res
          .status(500)
          .json({

            error:
              "Não foi possível responder a solicitação.",

            details:
              updateError.message

          });

      }



      // ====================================================
      // PROTEÇÃO CONTRA CONCORRÊNCIA
      // ====================================================
      //
      // Se dois cliques chegarem praticamente juntos,
      // apenas um deles conseguirá alterar
      // status = pendente.
      //
      // ====================================================

      if (
        !solicitacaoAtualizada
      ) {

        return res
          .status(409)
          .json({

            error:
              "Esta solicitação já foi analisada por outro processo."

          });

      }



      // ====================================================
      // SUCESSO
      // ====================================================

      return res.json({

        message:

          status ===
          "aprovada"

            ? "Solicitação aprovada com sucesso."

            : status ===
              "aprovada_com_ressalvas"

              ? "Solicitação aprovada com ressalvas."

              : "Solicitação recusada.",


        solicitacao:
          solicitacaoAtualizada,


        periodo:
          periodoAtualizado

      });


    } catch (
      error
    ) {

      console.error(
        "Erro PATCH /api/ferias/admin/solicitacoes/:id:",
        error
      );


      return res
        .status(500)
        .json({

          error:
            "Erro interno ao analisar a solicitação."

        });

    }

  }
);



// ==========================================================
// EXPORTAR ROTAS
// ==========================================================

module.exports =
  router;