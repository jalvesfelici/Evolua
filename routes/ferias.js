// ==========================================================
// EVOLUA+
// ROTAS DE FÉRIAS
// ==========================================================
//
// RESPONSABILIDADES:
//
// COLABORADOR
// - consultar o próprio período de férias;
// - consultar as próprias solicitações;
// - solicitar férias.
//
// ADMIN
// - consultar período de um colaborador;
// - cadastrar/alterar período inicial;
// - visualizar solicitações;
// - aprovar/reprovar solicitações.
//
// ==========================================================


// ==========================================================
// IMPORTAÇÕES
// ==========================================================

const express =
  require("express");


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
// PEGAR TOKEN
// ==========================================================

function getBearerToken(req) {

  const authorization =
    req.headers.authorization;


  if (!authorization) {

    return null;

  }


  const parts =
    authorization.split(" ");


  if (
    parts.length !== 2 ||
    parts[0].toLowerCase() !== "bearer"
  ) {

    return null;

  }


  return parts[1];

}



// ==========================================================
// IDENTIFICAR USUÁRIO LOGADO
// ==========================================================

async function getLoggedUser(req) {

  const token =
    getBearerToken(req);


  if (!token) {

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
    data: authData,
    error: authError
  } =
    await supabase
      .auth
      .getUser(token);


  if (
    authError ||
    !authData?.user
  ) {

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
    data: usuario,
    error: usuarioError
  } =
    await supabaseAdmin
      .from("usuario")
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
    usuarioError ||
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


  if (
    usuario.ativo === false
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
// VERIFICAR ADMINISTRADOR
// ==========================================================

function isAdmin(usuario) {

  return (

    usuario.perfil ===
      "admin_principal"

    ||

    usuario.perfil ===
      "admin_setor"

  );

}



// ==========================================================
// VERIFICAR SE ADMIN PODE GERENCIAR COLABORADOR
// ==========================================================

async function validateEmployeePermission(
  admin,
  usuarioId
) {

  const {
    data: colaborador,
    error
  } =
    await supabaseAdmin
      .from("usuario")
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
    error ||
    !colaborador
  ) {

    return {

      error:
        "Colaborador não encontrado.",

      status:
        404

    };

  }


  if (
    colaborador.perfil !==
    "colaborador"
  ) {

    return {

      error:
        "Períodos de férias só podem ser cadastrados para colaboradores.",

      status:
        400

    };

  }


  // Admin de setor só pode mexer
  // nos colaboradores do próprio setor.

  if (
    admin.perfil ===
      "admin_setor"

    &&

    admin.setor !==
      colaborador.setor
  ) {

    return {

      error:
        "Você não pode gerenciar férias de outro setor.",

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
// COLABORADOR:
//
// Busca seu período atual.
//
// ==========================================================

router.get(
  "/minhas",
  async (req, res) => {

    try {

      const authResult =
        await getLoggedUser(req);


      if (authResult.error) {

        return res
          .status(authResult.status)
          .json({

            error:
              authResult.error

          });

      }


      const usuario =
        authResult.user;


      const {
        data: periodo,
        error
      } =
        await supabaseAdmin
          .from("periodos_ferias")
          .select("*")
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


      if (error) {

        console.error(
          "Erro ao buscar férias:",
          error
        );


        return res
          .status(500)
          .json({

            error:
              "Não foi possível carregar as férias."

          });

      }


      if (!periodo) {

        return res.json({

          usuario,

          periodo:
            null

        });

      }


      const diasDisponiveis =
        Number(
          periodo.dias_direito
        ) -
        Number(
          periodo.dias_usados
        );


      return res.json({

        usuario,

        periodo: {

          ...periodo,

          dias_disponiveis:
            diasDisponiveis

        }

      });


    } catch (error) {

      console.error(
        "Erro em GET /api/ferias/minhas:",
        error
      );


      return res
        .status(500)
        .json({

          error:
            "Erro interno ao carregar férias."

        });

    }

  }
);



// ==========================================================
// GET /api/ferias/solicitacoes
// ==========================================================
//
// COLABORADOR:
//
// Retorna somente suas solicitações.
//
// ==========================================================

router.get(
  "/solicitacoes",
  async (req, res) => {

    try {

      const authResult =
        await getLoggedUser(req);


      if (authResult.error) {

        return res
          .status(authResult.status)
          .json({

            error:
              authResult.error

          });

      }


      const usuario =
        authResult.user;


      const {
        data,
        error
      } =
        await supabaseAdmin
          .from(
            "solicitacoes_ferias"
          )
          .select("*")
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


      if (error) {

        console.error(
          "Erro ao buscar solicitações:",
          error
        );


        return res
          .status(500)
          .json({

            error:
              "Não foi possível buscar as solicitações."

          });

      }


      return res.json(
        data || []
      );


    } catch (error) {

      console.error(
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
// Solicita férias.
//
// ==========================================================

router.post(
  "/solicitacoes",
  async (req, res) => {

    try {

      const authResult =
        await getLoggedUser(req);


      if (authResult.error) {

        return res
          .status(authResult.status)
          .json({

            error:
              authResult.error

          });

      }


      const usuario =
        authResult.user;


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


      const {

        data_inicio,

        data_fim,

        observacoes

      } =
        req.body;


      if (
        !data_inicio ||
        !data_fim
      ) {

        return res
          .status(400)
          .json({

            error:
              "Informe a data de início e término."

          });

      }


      // ====================================================
      // CALCULAR DIAS
      // ====================================================

      const inicio =
        new Date(
          `${data_inicio}T00:00:00Z`
        );


      const fim =
        new Date(
          `${data_fim}T00:00:00Z`
        );


      if (
        Number.isNaN(
          inicio.getTime()
        )
        ||
        Number.isNaN(
          fim.getTime()
        )
        ||
        fim < inicio
      ) {

        return res
          .status(400)
          .json({

            error:
              "Período informado é inválido."

          });

      }


      const quantidadeDias =
        Math.floor(

          (
            fim.getTime() -
            inicio.getTime()
          )

          /

          86400000

        ) + 1;


      // ====================================================
      // PERÍODO ATUAL
      // ====================================================

      const {
        data: periodo,
        error: periodoError
      } =
        await supabaseAdmin
          .from(
            "periodos_ferias"
          )
          .select("*")
          .eq(
            "usuario_id",
            usuario.id
          )
          .eq(
            "status",
            "disponivel"
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
        periodoError ||
        !periodo
      ) {

        return res
          .status(400)
          .json({

            error:
              "Nenhum período de férias disponível."

          });

      }


      const diasDisponiveis =
        Number(
          periodo.dias_direito
        ) -
        Number(
          periodo.dias_usados
        );


      if (
        quantidadeDias >
        diasDisponiveis
      ) {

        return res
          .status(400)
          .json({

            error:
              `Você possui somente ${diasDisponiveis} dias disponíveis.`

          });

      }


      // ====================================================
      // CRIAR SOLICITAÇÃO
      // ====================================================

      const {
        data,
        error
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
              observacoes || null,

            status:
              "pendente"

          })
          .select()
          .single();


      if (error) {

        console.error(
          "Erro ao criar solicitação:",
          error
        );


        return res
          .status(500)
          .json({

            error:
              "Não foi possível criar a solicitação."

          });

      }


      return res
        .status(201)
        .json({

          message:
            "Solicitação enviada com sucesso.",

          solicitacao:
            data

        });


    } catch (error) {

      console.error(
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
// Busca o período mais recente de um colaborador.
//
// Usaremos esta rota ao clicar no botão
// "Férias" da tabela de funcionários.
//
// ==========================================================

router.get(
  "/admin/periodos/:usuarioId",
  async (req, res) => {

    try {

      const authResult =
        await getLoggedUser(req);


      if (authResult.error) {

        return res
          .status(authResult.status)
          .json({

            error:
              authResult.error

          });

      }


      const admin =
        authResult.user;


      if (
        !isAdmin(admin)
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


      const permission =
        await validateEmployeePermission(
          admin,
          usuarioId
        );


      if (permission.error) {

        return res
          .status(
            permission.status
          )
          .json({

            error:
              permission.error

          });

      }


      const {
        data: periodo,
        error
      } =
        await supabaseAdmin
          .from(
            "periodos_ferias"
          )
          .select("*")
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


      if (error) {

        console.error(
          "Erro ao buscar período:",
          error
        );


        return res
          .status(500)
          .json({

            error:
              "Não foi possível carregar o período de férias."

          });

      }


      return res.json({

        colaborador:
          permission.colaborador,

        periodo:
          periodo || null,

        dias_disponiveis:
          periodo
            ? (
                Number(
                  periodo.dias_direito
                )
                -
                Number(
                  periodo.dias_usados
                )
              )
            : 0

      });


    } catch (error) {

      console.error(
        error
      );


      return res
        .status(500)
        .json({

          error:
            "Erro interno ao carregar período de férias."

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
// CADASTRA OU ATUALIZA O PERÍODO INICIAL.
//
// Dados enviados:
//
// periodo_inicio
// periodo_fim
// dias_direito
// dias_usados
// data_vencimento
//
// ==========================================================

router.put(
  "/admin/periodos/:usuarioId",
  async (req, res) => {

    try {

      const authResult =
        await getLoggedUser(req);


      if (authResult.error) {

        return res
          .status(authResult.status)
          .json({

            error:
              authResult.error

          });

      }


      const admin =
        authResult.user;


      if (
        !isAdmin(admin)
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


      const permission =
        await validateEmployeePermission(
          admin,
          usuarioId
        );


      if (permission.error) {

        return res
          .status(
            permission.status
          )
          .json({

            error:
              permission.error

          });

      }


      const {

        periodo_inicio,

        periodo_fim,

        dias_direito,

        dias_usados,

        data_vencimento

      } =
        req.body;


      // ====================================================
      // CAMPOS OBRIGATÓRIOS
      // ====================================================

      if (
        !periodo_inicio ||
        !periodo_fim ||
        dias_direito === undefined ||
        dias_usados === undefined ||
        !data_vencimento
      ) {

        return res
          .status(400)
          .json({

            error:
              "Preencha todas as informações do período de férias."

          });

      }


      const diasDireito =
        Number(
          dias_direito
        );


      const diasUsados =
        Number(
          dias_usados
        );


      // ====================================================
      // VALIDAÇÕES
      // ====================================================

      if (
        !Number.isInteger(
          diasDireito
        )
        ||
        diasDireito <= 0
      ) {

        return res
          .status(400)
          .json({

            error:
              "Dias de direito inválidos."

          });

      }


      if (
        !Number.isInteger(
          diasUsados
        )
        ||
        diasUsados < 0
      ) {

        return res
          .status(400)
          .json({

            error:
              "Dias utilizados inválidos."

          });

      }


      if (
        diasUsados >
        diasDireito
      ) {

        return res
          .status(400)
          .json({

            error:
              "Os dias utilizados não podem ser maiores que os dias de direito."

          });

      }


      if (
        periodo_fim <
        periodo_inicio
      ) {

        return res
          .status(400)
          .json({

            error:
              "O fim do período não pode ser anterior ao início."

          });

      }


      // ====================================================
      // VERIFICAR PERÍODO EXISTENTE
      // ====================================================

      const {
        data: periodoExistente,
        error: searchError
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


      if (searchError) {

        return res
          .status(500)
          .json({

            error:
              "Não foi possível verificar o período existente.",

            details:
              searchError.message

          });

      }


      // ====================================================
      // DADOS QUE SERÃO SALVOS
      // ====================================================

      const vacationData = {

        usuario_id:
          usuarioId,

        periodo_inicio,

        periodo_fim,

        dias_direito:
          diasDireito,

        dias_usados:
          diasUsados,

        data_vencimento,

        status:
          diasUsados < diasDireito
            ? "disponivel"
            : "utilizado"

      };


      let periodoSalvo;


      // ====================================================
      // ATUALIZAR
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


        if (error) {

          console.error(
            "Erro ao atualizar férias:",
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
      // CRIAR
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


        if (error) {

          console.error(
            "Erro ao cadastrar férias:",
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
      // SALDO CALCULADO
      // ====================================================

      const diasDisponiveis =
        Number(
          periodoSalvo.dias_direito
        )
        -
        Number(
          periodoSalvo.dias_usados
        );


      return res.json({

        message:
          periodoExistente
            ? "Período de férias atualizado com sucesso."
            : "Período de férias cadastrado com sucesso.",

        colaborador:
          permission.colaborador,

        periodo: {

          ...periodoSalvo,

          dias_disponiveis:
            diasDisponiveis

        }

      });


    } catch (error) {

      console.error(
        "Erro ao salvar período de férias:",
        error
      );


      return res
        .status(500)
        .json({

          error:
            "Erro interno ao salvar período de férias."

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
// Admin principal vê tudo.
//
// Admin de setor vê somente o próprio setor.
//
// ==========================================================

router.get(
  "/admin/solicitacoes",
  async (req, res) => {

    try {

      const authResult =
        await getLoggedUser(req);


      if (authResult.error) {

        return res
          .status(authResult.status)
          .json({

            error:
              authResult.error

          });

      }


      const admin =
        authResult.user;


      if (
        !isAdmin(admin)
      ) {

        return res
          .status(403)
          .json({

            error:
              "Acesso permitido somente para administradores."

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
            `
              *,
              usuario:usuario_id (
                id,
                nome,
                matricula,
                cargo,
                setor
              )
            `
          )
          .order(
            "created_at",
            {
              ascending:
                false
            }
          );


      if (error) {

        console.error(
          error
        );


        return res
          .status(500)
          .json({

            error:
              "Não foi possível buscar as solicitações."

          });

      }


      let solicitacoes =
        data || [];


      if (
        admin.perfil ===
        "admin_setor"
      ) {

        solicitacoes =
          solicitacoes.filter(

            item =>
              item.usuario?.setor ===
              admin.setor

          );

      }


      return res.json(
        solicitacoes
      );


    } catch (error) {

      console.error(
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
// PATCH /api/ferias/admin/solicitacoes/:id
// ==========================================================

router.patch(
  "/admin/solicitacoes/:id",
  async (req, res) => {

    try {

      const authResult =
        await getLoggedUser(req);


      if (authResult.error) {

        return res
          .status(authResult.status)
          .json({

            error:
              authResult.error

          });

      }


      const admin =
        authResult.user;


      if (
        !isAdmin(admin)
      ) {

        return res
          .status(403)
          .json({

            error:
              "Acesso permitido somente para administradores."

          });

      }


      const solicitacaoId =
        Number(
          req.params.id
        );


      const {

        status,

        motivo_reprovacao

      } =
        req.body;


      if (
        status !== "aprovada"
        &&
        status !== "reprovada"
      ) {

        return res
          .status(400)
          .json({

            error:
              "Status inválido."

          });

      }


      const {
        data: solicitacao,
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
                setor
              )
            `
          )
          .eq(
            "id",
            solicitacaoId
          )
          .maybeSingle();


      if (
        error ||
        !solicitacao
      ) {

        return res
          .status(404)
          .json({

            error:
              "Solicitação não encontrada."

          });

      }


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


      if (
        admin.perfil ===
          "admin_setor"

        &&

        solicitacao.usuario?.setor !==
          admin.setor
      ) {

        return res
          .status(403)
          .json({

            error:
              "Você não pode analisar solicitações de outro setor."

          });

      }


      // ====================================================
      // APROVAÇÃO
      // ====================================================

      if (
        status ===
        "aprovada"
      ) {

        const {
          data: periodo,
          error: periodoError
        } =
          await supabaseAdmin
            .from(
              "periodos_ferias"
            )
            .select("*")
            .eq(
              "id",
              solicitacao.periodo_ferias_id
            )
            .maybeSingle();


        if (
          periodoError ||
          !periodo
        ) {

          return res
            .status(404)
            .json({

              error:
                "Período de férias não encontrado."

            });

        }


        const novoTotalUsado =
          Number(
            periodo.dias_usados
          )
          +
          Number(
            solicitacao.quantidade_dias
          );


        if (
          novoTotalUsado >
          periodo.dias_direito
        ) {

          return res
            .status(400)
            .json({

              error:
                "O colaborador não possui saldo suficiente."

            });

        }


        const novoStatusPeriodo =
          novoTotalUsado >=
          periodo.dias_direito

            ? "utilizado"

            : "disponivel";


        const {
          error: updatePeriodoError
        } =
          await supabaseAdmin
            .from(
              "periodos_ferias"
            )
            .update({

              dias_usados:
                novoTotalUsado,

              status:
                novoStatusPeriodo

            })
            .eq(
              "id",
              periodo.id
            );


        if (
          updatePeriodoError
        ) {

          return res
            .status(500)
            .json({

              error:
                "Não foi possível atualizar o saldo."

            });

        }

      }


      // ====================================================
      // ATUALIZAR SOLICITAÇÃO
      // ====================================================

      const {
        data: updated,
        error: updateError
      } =
        await supabaseAdmin
          .from(
            "solicitacoes_ferias"
          )
          .update({

            status,

            motivo_reprovacao:
              status ===
                "reprovada"
                ? motivo_reprovacao || null
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
          .select()
          .single();


      if (
        updateError
      ) {

        return res
          .status(500)
          .json({

            error:
              "Não foi possível atualizar a solicitação."

          });

      }


      return res.json({

        message:
          status === "aprovada"
            ? "Férias aprovadas com sucesso."
            : "Solicitação reprovada.",

        solicitacao:
          updated

      });


    } catch (error) {

      console.error(
        error
      );


      return res
        .status(500)
        .json({

          error:
            "Erro interno ao analisar solicitação."

        });

    }

  }
);



// ==========================================================
// EXPORTAR
// ==========================================================

module.exports =
  router;