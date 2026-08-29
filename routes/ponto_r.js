const express = require("express");

const router = express.Router();

const supabase =
  require("../config/supabase");

const supabaseAdmin =
  require("../config/supabaseAdmin");

const VALID_POINT_TYPES = [
  "entrada",
  "intervalo",
  "retorno",
  "saida"
];

const POINT_TOLERANCE_MINUTES = 10;

// ==========================================================
// AUTENTICAÇÃO
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
    parts[0].toLowerCase() !==
      "bearer"
  ) {
    return null;
  }

  return parts[1];
}

async function getLoggedUser(req) {
  const token =
    getBearerToken(req);

  if (!token) {
    return {
      error:
        "Token de autenticação não informado.",
      status: 401
    };
  }

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
    console.error(
      "Erro ao validar token:",
      authError
    );

    return {
      error:
        "Sessão inválida ou expirada.",
      status: 401
    };
  }

  const {
    data: profile,
    error: profileError
  } =
    await supabaseAdmin
      .from("usuario")
      .select(`
        id,
        nome,
        email,
        matricula,
        cargo,
        setor,
        perfil,
        ativo
      `)
      .eq(
        "id",
        authData.user.id
      )
      .maybeSingle();

  if (profileError) {
    console.error(
      "Erro ao buscar perfil:",
      profileError
    );

    return {
      error:
        "Não foi possível validar o perfil.",
      status: 500
    };
  }

  if (!profile) {
    return {
      error:
        "Perfil do usuário não encontrado.",
      status: 403
    };
  }

  if (profile.ativo === false) {
    return {
      error:
        "Este usuário está inativo.",
      status: 403
    };
  }

  return {
    user: profile,
    authUser:
      authData.user
  };
}

function isAdmin(user) {
  return [
    "admin_principal",
    "admin_setor"
  ].includes(
    user?.perfil
  );
}

// ==========================================================
// DATA E HORA
// ==========================================================

function getBrazilDate() {
  return new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone:
        "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }
  ).format(
    new Date()
  );
}

function getBrazilTime() {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      timeZone:
        "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }
  ).format(
    new Date()
  );
}

function getIsoTimestamp() {
  return new Date().toISOString();
}

// ==========================================================
// HORÁRIOS
// ==========================================================

function normalizeTime(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const time =
    String(value)
      .trim()
      .substring(0, 5);

  if (
    !/^([01]\d|2[0-3]):[0-5]\d$/
      .test(time)
  ) {
    return null;
  }

  return time;
}

function timeToMinutes(value) {
  const normalized =
    normalizeTime(value);

  if (!normalized) {
    return null;
  }

  const [
    hours,
    minutes
  ] =
    normalized
      .split(":")
      .map(Number);

  return (
    hours * 60 +
    minutes
  );
}

function validateSchedule({
  entrada_prevista,
  intervalo_inicio,
  retorno_previsto,
  saida_prevista
}) {
  const entry =
    timeToMinutes(
      entrada_prevista
    );

  const breakStart =
    timeToMinutes(
      intervalo_inicio
    );

  const returnTime =
    timeToMinutes(
      retorno_previsto
    );

  const exit =
    timeToMinutes(
      saida_prevista
    );

  if (
    [
      entry,
      breakStart,
      returnTime,
      exit
    ].some(
      value => value === null
    )
  ) {
    return {
      valid: false,
      message:
        "Preencha todos os horários da jornada."
    };
  }

  if (
    !(
      entry < breakStart &&
      breakStart < returnTime &&
      returnTime < exit
    )
  ) {
    return {
      valid: false,
      message:
        "Os horários devem seguir a ordem: entrada, intervalo, retorno e saída."
    };
  }

  return {
    valid: true
  };
}

function validatePointSequence({
  entrada,
  intervalo,
  retorno,
  saida
}) {
  const values = {
    entrada:
      timeToMinutes(entrada),
    intervalo:
      timeToMinutes(intervalo),
    retorno:
      timeToMinutes(retorno),
    saida:
      timeToMinutes(saida)
  };

  if (
    values.intervalo !== null &&
    values.entrada === null
  ) {
    return {
      valid: false,
      message:
        "Não é possível registrar intervalo sem entrada."
    };
  }

  if (
    values.retorno !== null &&
    values.intervalo === null
  ) {
    return {
      valid: false,
      message:
        "Não é possível registrar retorno sem início do intervalo."
    };
  }

  if (
    values.saida !== null &&
    values.retorno === null
  ) {
    return {
      valid: false,
      message:
        "Não é possível registrar saída sem retorno do intervalo."
    };
  }

  if (
    values.entrada !== null &&
    values.intervalo !== null &&
    values.intervalo <=
      values.entrada
  ) {
    return {
      valid: false,
      message:
        "O intervalo precisa ocorrer depois da entrada."
    };
  }

  if (
    values.intervalo !== null &&
    values.retorno !== null &&
    values.retorno <=
      values.intervalo
  ) {
    return {
      valid: false,
      message:
        "O retorno precisa ocorrer depois do início do intervalo."
    };
  }

  if (
    values.retorno !== null &&
    values.saida !== null &&
    values.saida <=
      values.retorno
  ) {
    return {
      valid: false,
      message:
        "A saída precisa ocorrer depois do retorno do intervalo."
    };
  }

  return {
    valid: true
  };
}

// ==========================================================
// USUÁRIOS E JORNADAS
// ==========================================================

async function getUserById(userId) {
  const {
    data,
    error
  } =
    await supabaseAdmin
      .from("usuario")
      .select(`
        id,
        nome,
        email,
        matricula,
        cargo,
        setor,
        perfil,
        ativo
      `)
      .eq(
        "id",
        userId
      )
      .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

async function getEmployeeSchedule(
  userId
) {
  const {
    data,
    error
  } =
    await supabaseAdmin
      .from("jornada_trabalho")
      .select(`
        id,
        usuario_id,
        entrada_prevista,
        intervalo_inicio,
        retorno_previsto,
        saida_prevista,
        tolerancia_minutos,
        criado_por,
        atualizado_por,
        created_at,
        updated_at
      `)
      .eq(
        "usuario_id",
        userId
      )
      .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

async function validateAdminEmployeeAccess(
  loggedAdmin,
  userId
) {
  const employee =
    await getUserById(userId);

  if (!employee) {
    return {
      error:
        "Colaborador não encontrado.",
      status: 404
    };
  }

  if (
    employee.perfil !==
      "colaborador" ||
    employee.ativo === false
  ) {
    return {
      error:
        "O usuário informado não é um colaborador ativo.",
      status: 400
    };
  }

  if (
    employee.setor !==
    loggedAdmin.setor
  ) {
    return {
      error:
        "Você não possui acesso a colaboradores de outro setor.",
      status: 403
    };
  }

  return {
    employee
  };
}

// ==========================================================
// CÁLCULOS DO PONTO
// ==========================================================

function getExpectedWorkMinutes(
  schedule
) {
  if (!schedule) {
    return 0;
  }

  const entry =
    timeToMinutes(
      schedule.entrada_prevista
    );

  const breakStart =
    timeToMinutes(
      schedule.intervalo_inicio
    );

  const returnTime =
    timeToMinutes(
      schedule.retorno_previsto
    );

  const exit =
    timeToMinutes(
      schedule.saida_prevista
    );

  if (
    [
      entry,
      breakStart,
      returnTime,
      exit
    ].some(
      value => value === null
    )
  ) {
    return 0;
  }

  return (
    breakStart -
    entry +
    exit -
    returnTime
  );
}

function calculatePointValues(
  point,
  schedule
) {
  const entry =
    timeToMinutes(
      point.entrada
    );

  const breakStart =
    timeToMinutes(
      point.intervalo
    );

  const returnTime =
    timeToMinutes(
      point.retorno
    );

  const exit =
    timeToMinutes(
      point.saida
    );

  let workedMinutes = 0;

  if (
    entry !== null &&
    breakStart !== null
  ) {
    workedMinutes +=
      Math.max(
        breakStart - entry,
        0
      );
  }

  if (
    returnTime !== null &&
    exit !== null
  ) {
    workedMinutes +=
      Math.max(
        exit - returnTime,
        0
      );
  }

  const expectedMinutes =
    getExpectedWorkMinutes(
      schedule
    );

  const overtimeMinutes =
    point.saida
      ? Math.max(
          workedMinutes -
            expectedMinutes,
          0
        )
      : 0;

  const tolerance =
    Number(
      schedule
        ?.tolerancia_minutos ??
      POINT_TOLERANCE_MINUTES
    );

  const expectedEntry =
    timeToMinutes(
      schedule
        ?.entrada_prevista
    );

  const expectedReturn =
    timeToMinutes(
      schedule
        ?.retorno_previsto
    );

  const lateEntry =
    entry !== null &&
    expectedEntry !== null &&
    entry >
      expectedEntry +
        tolerance
      ? entry -
        expectedEntry
      : 0;

  const lateReturn =
    returnTime !== null &&
    expectedReturn !== null &&
    returnTime >
      expectedReturn +
        tolerance
      ? returnTime -
        expectedReturn
      : 0;

  let status =
    "incomplete";

  if (
    point.entrada &&
    point.intervalo &&
    point.retorno &&
    point.saida
  ) {
    if (
      lateEntry > 0 ||
      lateReturn > 0
    ) {
      status =
        "delay";
    } else if (
      overtimeMinutes > 0
    ) {
      status =
        "overtime";
    } else {
      status =
        "normal";
    }
  }

  return {
    horas_trabalhadas:
      Number(
        (
          workedMinutes / 60
        ).toFixed(2)
      ),

    horas_extras:
      Number(
        (
          overtimeMinutes / 60
        ).toFixed(2)
      ),

    atraso_entrada_minutos:
      lateEntry,

    atraso_retorno_minutos:
      lateReturn,

    status
  };
}

// ==========================================================
// GET /api/ponto/admin/jornadas
// ==========================================================

router.get(
  "/admin/jornadas",
  async (req, res) => {
    try {
      const authResult =
        await getLoggedUser(req);

      if (authResult.error) {
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

      if (!isAdmin(loggedAdmin)) {
        return res
          .status(403)
          .json({
            error:
              "Você não possui permissão para visualizar jornadas."
          });
      }

      if (!loggedAdmin.setor) {
        return res
          .status(400)
          .json({
            error:
              "O administrador não possui um setor definido."
          });
      }

      const {
        data: employees,
        error: employeesError
      } =
        await supabaseAdmin
          .from("usuario")
          .select(`
            id,
            nome,
            matricula,
            cargo,
            setor
          `)
          .eq(
            "perfil",
            "colaborador"
          )
          .eq(
            "setor",
            loggedAdmin.setor
          )
          .eq(
            "ativo",
            true
          )
          .order(
            "nome",
            {
              ascending: true
            }
          );

      if (employeesError) {
        console.error(
          "Erro ao buscar colaboradores:",
          employeesError
        );

        return res
          .status(500)
          .json({
            error:
              "Não foi possível carregar os colaboradores."
          });
      }

      const ids =
        (employees || []).map(
          employee =>
            employee.id
        );

      if (!ids.length) {
        return res.json({
          jornadas: []
        });
      }

      const {
        data: schedules,
        error: schedulesError
      } =
        await supabaseAdmin
          .from("jornada_trabalho")
          .select(`
            id,
            usuario_id,
            entrada_prevista,
            intervalo_inicio,
            retorno_previsto,
            saida_prevista,
            tolerancia_minutos,
            criado_por,
            atualizado_por,
            created_at,
            updated_at
          `)
          .in(
            "usuario_id",
            ids
          );

      if (schedulesError) {
        console.error(
          "Erro ao carregar jornadas:",
          schedulesError
        );

        return res
          .status(500)
          .json({
            error:
              "Não foi possível carregar as jornadas.",

            details:
              schedulesError.message
          });
      }

      return res.json({
        jornadas:
          schedules || []
      });

    } catch (error) {
      console.error(
        "Erro inesperado ao carregar jornadas:",
        error
      );

      return res
        .status(500)
        .json({
          error:
            "Erro interno ao carregar as jornadas."
        });
    }
  }
);

// ==========================================================
// GET /api/ponto/admin/jornadas/:usuario_id
// ==========================================================

router.get(
  "/admin/jornadas/:usuario_id",
  async (req, res) => {
    try {
      const authResult =
        await getLoggedUser(req);

      if (authResult.error) {
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

      if (!isAdmin(loggedAdmin)) {
        return res
          .status(403)
          .json({
            error:
              "Você não possui permissão para visualizar jornadas."
          });
      }

      const userId =
        String(
          req.params.usuario_id ||
          ""
        ).trim();

      const access =
        await validateAdminEmployeeAccess(
          loggedAdmin,
          userId
        );

      if (access.error) {
        return res
          .status(
            access.status
          )
          .json({
            error:
              access.error
          });
      }

      const schedule =
        await getEmployeeSchedule(
          userId
        );

      if (!schedule) {
        return res
          .status(404)
          .json({
            error:
              "Jornada ainda não configurada."
          });
      }

      return res.json({
        jornada:
          schedule
      });

    } catch (error) {
      console.error(
        "Erro ao consultar jornada:",
        error
      );

      return res
        .status(500)
        .json({
          error:
            "Erro interno ao consultar a jornada."
        });
    }
  }
);

// ==========================================================
// PUT /api/ponto/admin/jornadas/:usuario_id
// ==========================================================

router.put(
  "/admin/jornadas/:usuario_id",
  async (req, res) => {
    try {
      const authResult =
        await getLoggedUser(req);

      if (authResult.error) {
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

      if (!isAdmin(loggedAdmin)) {
        return res
          .status(403)
          .json({
            error:
              "Você não possui permissão para configurar jornadas."
          });
      }

      const userId =
        String(
          req.params.usuario_id ||
          ""
        ).trim();

      const access =
        await validateAdminEmployeeAccess(
          loggedAdmin,
          userId
        );

      if (access.error) {
        return res
          .status(
            access.status
          )
          .json({
            error:
              access.error
          });
      }

      const payload = {
        entrada_prevista:
          normalizeTime(
            req.body
              .entrada_prevista
          ),

        intervalo_inicio:
          normalizeTime(
            req.body
              .intervalo_inicio
          ),

        retorno_previsto:
          normalizeTime(
            req.body
              .retorno_previsto
          ),

        saida_prevista:
          normalizeTime(
            req.body
              .saida_prevista
          ),

        tolerancia_minutos:
          POINT_TOLERANCE_MINUTES
      };

      const validation =
        validateSchedule(
          payload
        );

      if (!validation.valid) {
        return res
          .status(400)
          .json({
            error:
              validation.message
          });
      }

      const existing =
        await getEmployeeSchedule(
          userId
        );

      const now =
        getIsoTimestamp();

      let query;

      if (existing) {
        query =
          supabaseAdmin
            .from(
              "jornada_trabalho"
            )
            .update({
              ...payload,

              atualizado_por:
                loggedAdmin.id,

              updated_at:
                now
            })
            .eq(
              "usuario_id",
              userId
            );

      } else {
        query =
          supabaseAdmin
            .from(
              "jornada_trabalho"
            )
            .insert({
              usuario_id:
                userId,

              ...payload,

              criado_por:
                loggedAdmin.id,

              atualizado_por:
                loggedAdmin.id,

              created_at:
                now,

              updated_at:
                now
            });
      }

      const {
        data: schedule,
        error: saveError
      } =
        await query
          .select()
          .single();

      if (saveError) {
        console.error(
          "Erro ao salvar jornada:",
          saveError
        );

        return res
          .status(500)
          .json({
            error:
              "Não foi possível salvar a jornada.",

            details:
              saveError.message
          });
      }

      return res.json({
        message:
          "Jornada configurada com sucesso.",

        jornada:
          schedule
      });

    } catch (error) {
      console.error(
        "Erro inesperado ao salvar jornada:",
        error
      );

      return res
        .status(500)
        .json({
          error:
            "Erro interno ao salvar a jornada."
        });
    }
  }
);

// ==========================================================
// POST /api/ponto
//
// COLABORADOR REGISTRA:
// entrada
// intervalo
// retorno
// saida
// ==========================================================

router.post(
  "/",
  async (req, res) => {
    try {
      const authResult =
        await getLoggedUser(req);

      if (authResult.error) {
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

      if (
        loggedUser.perfil !==
        "colaborador"
      ) {
        return res
          .status(403)
          .json({
            error:
              "Somente colaboradores podem registrar o próprio ponto."
          });
      }

      const type =
        String(
          req.body.tipo || ""
        )
          .trim()
          .toLowerCase();

      if (
        !VALID_POINT_TYPES.includes(
          type
        )
      ) {
        return res
          .status(400)
          .json({
            error:
              "Tipo de marcação inválido."
          });
      }

      const schedule =
        await getEmployeeSchedule(
          loggedUser.id
        );

      if (!schedule) {
        return res
          .status(400)
          .json({
            error:
              "Sua jornada de trabalho ainda não foi configurada pelo administrador."
          });
      }

      const today =
        getBrazilDate();

      const currentTime =
        getBrazilTime();

      const {
        data: currentPoint,
        error: pointError
      } =
        await supabaseAdmin
          .from(
            "registro_ponto"
          )
          .select(`
            id,
            usuario_id,
            data,
            entrada,
            intervalo,
            retorno,
            saida,
            horas_trabalhadas,
            horas_extras,
            atraso_entrada_minutos,
            atraso_retorno_minutos,
            status,
            observacao_admin,
            documento_url,
            documento_nome,
            created_at,
            updated_at
          `)
          .eq(
            "usuario_id",
            loggedUser.id
          )
          .eq(
            "data",
            today
          )
          .maybeSingle();

      if (pointError) {
        console.error(
          "Erro ao consultar ponto:",
          pointError
        );

        return res
          .status(500)
          .json({
            error:
              "Não foi possível consultar o ponto.",

            details:
              pointError.message
          });
      }

      // ======================================================
      // PRIMEIRA MARCAÇÃO DO DIA
      // ======================================================

      if (!currentPoint) {
        if (
          type !== "entrada"
        ) {
          return res
            .status(400)
            .json({
              error:
                "A primeira marcação do dia precisa ser a entrada."
            });
        }

        const pointValues = {
          entrada:
            currentTime,

          intervalo:
            null,

          retorno:
            null,

          saida:
            null
        };

        const calculation =
          calculatePointValues(
            pointValues,
            schedule
          );

        const {
          data: createdPoint,
          error: createError
        } =
          await supabaseAdmin
            .from(
              "registro_ponto"
            )
            .insert({
              usuario_id:
                loggedUser.id,

              data:
                today,

              entrada:
                currentTime,

              intervalo:
                null,

              retorno:
                null,

              saida:
                null,

              horas_trabalhadas:
                calculation
                  .horas_trabalhadas,

              horas_extras:
                calculation
                  .horas_extras,

              atraso_entrada_minutos:
                calculation
                  .atraso_entrada_minutos,

              atraso_retorno_minutos:
                calculation
                  .atraso_retorno_minutos,

              status:
                calculation.status,

              updated_at:
                getIsoTimestamp()
            })
            .select()
            .single();

        if (createError) {
          console.error(
            "Erro ao registrar entrada:",
            createError
          );

          return res
            .status(500)
            .json({
              error:
                "Não foi possível registrar a entrada.",

              details:
                createError.message
            });
        }

        return res
          .status(201)
          .json({
            message:
              "Entrada registrada com sucesso.",

            ponto:
              createdPoint,

            jornada:
              schedule
          });
      }

      // ======================================================
      // EVITAR DUPLICIDADE
      // ======================================================

      if (
        type === "entrada" &&
        currentPoint.entrada
      ) {
        return res
          .status(409)
          .json({
            error:
              "A entrada já foi registrada hoje."
          });
      }

      if (
        type === "intervalo"
      ) {
        if (
          !currentPoint.entrada
        ) {
          return res
            .status(400)
            .json({
              error:
                "Registre a entrada primeiro."
            });
        }

        if (
          currentPoint.intervalo
        ) {
          return res
            .status(409)
            .json({
              error:
                "O início do intervalo já foi registrado."
            });
        }
      }

      if (
        type === "retorno"
      ) {
        if (
          !currentPoint.intervalo
        ) {
          return res
            .status(400)
            .json({
              error:
                "Registre o início do intervalo primeiro."
            });
        }

        if (
          currentPoint.retorno
        ) {
          return res
            .status(409)
            .json({
              error:
                "O retorno do intervalo já foi registrado."
            });
        }
      }

      if (
        type === "saida"
      ) {
        if (
          !currentPoint.retorno
        ) {
          return res
            .status(400)
            .json({
              error:
                "Registre o retorno do intervalo primeiro."
            });
        }

        if (
          currentPoint.saida
        ) {
          return res
            .status(409)
            .json({
              error:
                "A saída já foi registrada."
            });
        }
      }

      const updatedValues = {
        entrada:
          currentPoint.entrada,

        intervalo:
          currentPoint.intervalo,

        retorno:
          currentPoint.retorno,

        saida:
          currentPoint.saida,

        [type]:
          currentTime
      };

      const sequence =
        validatePointSequence(
          updatedValues
        );

      if (!sequence.valid) {
        return res
          .status(400)
          .json({
            error:
              sequence.message
          });
      }

      const calculation =
        calculatePointValues(
          updatedValues,
          schedule
        );

      const updateData = {
        [type]:
          currentTime,

        horas_trabalhadas:
          calculation
            .horas_trabalhadas,

        horas_extras:
          calculation
            .horas_extras,

        atraso_entrada_minutos:
          calculation
            .atraso_entrada_minutos,

        atraso_retorno_minutos:
          calculation
            .atraso_retorno_minutos,

        status:
          calculation.status,

        updated_at:
          getIsoTimestamp()
      };

      const {
        data: updatedPoint,
        error: updateError
      } =
        await supabaseAdmin
          .from(
            "registro_ponto"
          )
          .update(
            updateData
          )
          .eq(
            "id",
            currentPoint.id
          )
          .eq(
            "usuario_id",
            loggedUser.id
          )
          .select()
          .single();

      if (updateError) {
        console.error(
          "Erro ao registrar ponto:",
          updateError
        );

        return res
          .status(500)
          .json({
            error:
              "Não foi possível registrar o ponto.",

            details:
              updateError.message
          });
      }

      const messages = {
        intervalo:
          "Início do intervalo registrado com sucesso.",

        retorno:
          "Retorno do intervalo registrado com sucesso.",

        saida:
          "Saída registrada com sucesso."
      };

      return res.json({
        message:
          messages[type] ||
          "Ponto registrado com sucesso.",

        ponto:
          updatedPoint,

        jornada:
          schedule
      });

    } catch (error) {
      console.error(
        "Erro inesperado ao registrar ponto:",
        error
      );

      return res
        .status(500)
        .json({
          error:
            "Erro interno ao registrar o ponto."
        });
    }
  }
);

// ==========================================================
// GET /api/ponto/admin
//
// ADMIN VISUALIZA OS REGISTROS DOS COLABORADORES
// DO PRÓPRIO SETOR.
// ==========================================================

router.get(
  "/admin",
  async (req, res) => {
    try {
      const authResult =
        await getLoggedUser(req);

      if (authResult.error) {
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

      if (!isAdmin(loggedAdmin)) {
        return res
          .status(403)
          .json({
            error:
              "Você não possui permissão para visualizar os registros de ponto."
          });
      }

      if (!loggedAdmin.setor) {
        return res
          .status(400)
          .json({
            error:
              "O administrador não possui um setor definido."
          });
      }

      const month =
        String(
          req.query.mes || ""
        ).trim();

      const requestedUserId =
        String(
          req.query.usuario_id ||
          ""
        ).trim();

      if (
        month &&
        !/^\d{4}-\d{2}$/
          .test(month)
      ) {
        return res
          .status(400)
          .json({
            error:
              "O mês informado é inválido."
          });
      }

      let employeesQuery =
        supabaseAdmin
          .from("usuario")
          .select(`
            id,
            nome,
            matricula,
            cargo,
            setor,
            perfil,
            ativo
          `)
          .eq(
            "perfil",
            "colaborador"
          )
          .eq(
            "setor",
            loggedAdmin.setor
          )
          .eq(
            "ativo",
            true
          );

      if (requestedUserId) {
        employeesQuery =
          employeesQuery.eq(
            "id",
            requestedUserId
          );
      }

      const {
        data: employees,
        error: employeesError
      } =
        await employeesQuery;

      if (employeesError) {
        console.error(
          "Erro ao buscar colaboradores:",
          employeesError
        );

        return res
          .status(500)
          .json({
            error:
              "Não foi possível buscar os colaboradores.",

            details:
              employeesError.message
          });
      }

      if (
        requestedUserId &&
        !employees?.length
      ) {
        return res
          .status(403)
          .json({
            error:
              "Você não possui acesso a este colaborador."
          });
      }

      if (!employees?.length) {
        return res.json({
          registros: []
        });
      }

      const employeeIds =
        employees.map(
          employee =>
            employee.id
        );

      // ======================================================
      // CARREGAR JORNADAS
      // ======================================================

      const {
        data: schedules,
        error: schedulesError
      } =
        await supabaseAdmin
          .from(
            "jornada_trabalho"
          )
          .select(`
            id,
            usuario_id,
            entrada_prevista,
            intervalo_inicio,
            retorno_previsto,
            saida_prevista,
            tolerancia_minutos
          `)
          .in(
            "usuario_id",
            employeeIds
          );

      if (schedulesError) {
        console.error(
          "Erro ao buscar jornadas:",
          schedulesError
        );

        return res
          .status(500)
          .json({
            error:
              "Não foi possível carregar as jornadas.",

            details:
              schedulesError.message
          });
      }

      const schedulesByUser =
        new Map(
          (schedules || []).map(
            schedule => [
              String(
                schedule.usuario_id
              ),
              schedule
            ]
          )
        );

      // ======================================================
      // CONSULTA DE PONTO
      // ======================================================

      let pointQuery =
        supabaseAdmin
          .from(
            "registro_ponto"
          )
          .select(`
            id,
            usuario_id,
            data,
            entrada,
            intervalo,
            retorno,
            saida,
            horas_trabalhadas,
            horas_extras,
            atraso_entrada_minutos,
            atraso_retorno_minutos,
            status,
            observacao_admin,
            documento_url,
            documento_nome,
            created_at,
            updated_at
          `)
          .in(
            "usuario_id",
            employeeIds
          )
          .order(
            "data",
            {
              ascending: false
            }
          );

      if (month) {
        const [
          year,
          monthNumber
        ] =
          month
            .split("-")
            .map(Number);

        const start =
          `${year}-${String(
            monthNumber
          ).padStart(
            2,
            "0"
          )}-01`;

        const nextMonth =
          new Date(
            Date.UTC(
              year,
              monthNumber,
              1
            )
          );

        const end =
          `${nextMonth.getUTCFullYear()}-${String(
            nextMonth.getUTCMonth() +
              1
          ).padStart(
            2,
            "0"
          )}-01`;

        pointQuery =
          pointQuery
            .gte(
              "data",
              start
            )
            .lt(
              "data",
              end
            );
      }

      const {
        data: points,
        error: pointsError
      } =
        await pointQuery;

      if (pointsError) {
        console.error(
          "Erro ao buscar registros de ponto:",
          pointsError
        );

        return res
          .status(500)
          .json({
            error:
              "Não foi possível buscar os registros de ponto.",

            details:
              pointsError.message
          });
      }

      const employeesById =
        new Map(
          employees.map(
            employee => [
              String(employee.id),
              employee
            ]
          )
        );

      const result =
        (points || []).map(
          point => {
            const employee =
              employeesById.get(
                String(
                  point.usuario_id
                )
              );

            const schedule =
              schedulesByUser.get(
                String(
                  point.usuario_id
                )
              ) || null;

            return {
              ...point,

              usuario: employee
                ? {
                    id:
                      employee.id,

                    nome:
                      employee.nome,

                    matricula:
                      employee.matricula,

                    cargo:
                      employee.cargo,

                    setor:
                      employee.setor
                  }
                : null,

              nome:
                employee?.nome ||
                "Colaborador",

              matricula:
                employee?.matricula ||
                "",

              cargo:
                employee?.cargo ||
                "",

              setor:
                employee?.setor ||
                "",

              jornada:
                schedule
            };
          }
        );

      return res.json({
        registros:
          result
      });

    } catch (error) {
      console.error(
        "Erro inesperado ao carregar ponto do Admin:",
        error
      );

      return res
        .status(500)
        .json({
          error:
            "Erro interno ao consultar os registros de ponto."
        });
    }
  }
);

// ==========================================================
// PUT /api/ponto/admin/:registro_id
//
// ADMIN ALTERA UM REGISTRO DE PONTO.
//
// SOMENTE COLABORADORES DO MESMO SETOR.
// O MOTIVO DA ALTERAÇÃO É OBRIGATÓRIO.
// ==========================================================

router.put(
  "/admin/:registro_id",
  async (req, res) => {
    try {
      const authResult =
        await getLoggedUser(req);

      if (authResult.error) {
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

      if (!isAdmin(loggedAdmin)) {
        return res
          .status(403)
          .json({
            error:
              "Você não possui permissão para alterar registros de ponto."
          });
      }

      if (!loggedAdmin.setor) {
        return res
          .status(400)
          .json({
            error:
              "O administrador não possui um setor definido."
          });
      }

      const recordId =
        String(
          req.params
            .registro_id || ""
        ).trim();

      if (!recordId) {
        return res
          .status(400)
          .json({
            error:
              "Registro de ponto não informado."
          });
      }

      const reason =
        String(
          req.body
            .motivo_alteracao ||
          ""
        ).trim();

      if (!reason) {
        return res
          .status(400)
          .json({
            error:
              "Informe o motivo da alteração."
          });
      }

      const {
        data: currentPoint,
        error: pointError
      } =
        await supabaseAdmin
          .from(
            "registro_ponto"
          )
          .select(`
            id,
            usuario_id,
            data,
            entrada,
            intervalo,
            retorno,
            saida,
            horas_trabalhadas,
            horas_extras,
            atraso_entrada_minutos,
            atraso_retorno_minutos,
            status,
            observacao_admin,
            documento_url,
            documento_nome,
            created_at,
            updated_at
          `)
          .eq(
            "id",
            recordId
          )
          .maybeSingle();

      if (pointError) {
        console.error(
          "Erro ao buscar registro de ponto:",
          pointError
        );

        return res
          .status(500)
          .json({
            error:
              "Não foi possível localizar o registro de ponto.",

            details:
              pointError.message
          });
      }

      if (!currentPoint) {
        return res
          .status(404)
          .json({
            error:
              "Registro de ponto não encontrado."
          });
      }

      const access =
        await validateAdminEmployeeAccess(
          loggedAdmin,
          currentPoint.usuario_id
        );

      if (access.error) {
        return res
          .status(
            access.status
          )
          .json({
            error:
              access.error
          });
      }

      const employee =
        access.employee;

      const schedule =
        await getEmployeeSchedule(
          employee.id
        );

      if (!schedule) {
        return res
          .status(400)
          .json({
            error:
              "A jornada deste colaborador ainda não foi configurada."
          });
      }

      const providedValues = {
        entrada:
          req.body.entrada,

        intervalo:
          req.body.intervalo,

        retorno:
          req.body.retorno,

        saida:
          req.body.saida
      };

      const values = {
        entrada:
          normalizeTime(
            providedValues.entrada
          ),

        intervalo:
          normalizeTime(
            providedValues.intervalo
          ),

        retorno:
          normalizeTime(
            providedValues.retorno
          ),

        saida:
          normalizeTime(
            providedValues.saida
          )
      };

      for (
        const field of [
          "entrada",
          "intervalo",
          "retorno",
          "saida"
        ]
      ) {
        const original =
          providedValues[field];

        if (
          original !== null &&
          original !== undefined &&
          original !== "" &&
          !values[field]
        ) {
          return res
            .status(400)
            .json({
              error:
                `O horário informado para ${field} é inválido.`
            });
        }
      }

      const sequence =
        validatePointSequence(
          values
        );

      if (!sequence.valid) {
        return res
          .status(400)
          .json({
            error:
              sequence.message
          });
      }

      const calculation =
        calculatePointValues(
          values,
          schedule
        );

      const updateData = {
        entrada:
          values.entrada,

        intervalo:
          values.intervalo,

        retorno:
          values.retorno,

        saida:
          values.saida,

        horas_trabalhadas:
          calculation
            .horas_trabalhadas,

        horas_extras:
          calculation
            .horas_extras,

        atraso_entrada_minutos:
          calculation
            .atraso_entrada_minutos,

        atraso_retorno_minutos:
          calculation
            .atraso_retorno_minutos,

        status:
          calculation.status,

        observacao_admin:
          reason,

        updated_at:
          getIsoTimestamp()
      };

      const {
        data: updatedPoint,
        error: updateError
      } =
        await supabaseAdmin
          .from(
            "registro_ponto"
          )
          .update(
            updateData
          )
          .eq(
            "id",
            currentPoint.id
          )
          .select()
          .single();

      if (updateError) {
        console.error(
          "Erro ao atualizar registro de ponto:",
          updateError
        );

        return res
          .status(500)
          .json({
            error:
              "Não foi possível alterar o registro de ponto.",

            details:
              updateError.message
          });
      }

      // ======================================================
      // AUDITORIA
      //
      // A alteração do ponto não é desfeita caso a auditoria
      // falhe, mas o erro é registrado no servidor.
      // ======================================================

      const {
        error: auditError
      } =
        await supabaseAdmin
          .from(
            "registro_ponto_auditoria"
          )
          .insert({
            registro_ponto_id:
              currentPoint.id,

            usuario_id:
              employee.id,

            admin_id:
              loggedAdmin.id,

            motivo:
              reason,

            valores_anteriores: {
              entrada:
                currentPoint.entrada,

              intervalo:
                currentPoint.intervalo,

              retorno:
                currentPoint.retorno,

              saida:
                currentPoint.saida,

              horas_trabalhadas:
                currentPoint
                  .horas_trabalhadas,

              horas_extras:
                currentPoint
                  .horas_extras,

              atraso_entrada_minutos:
                currentPoint
                  .atraso_entrada_minutos,

              atraso_retorno_minutos:
                currentPoint
                  .atraso_retorno_minutos,

              status:
                currentPoint.status,

              observacao_admin:
                currentPoint
                  .observacao_admin
            },

            valores_novos: {
              entrada:
                updatedPoint.entrada,

              intervalo:
                updatedPoint.intervalo,

              retorno:
                updatedPoint.retorno,

              saida:
                updatedPoint.saida,

              horas_trabalhadas:
                updatedPoint
                  .horas_trabalhadas,

              horas_extras:
                updatedPoint
                  .horas_extras,

              atraso_entrada_minutos:
                updatedPoint
                  .atraso_entrada_minutos,

              atraso_retorno_minutos:
                updatedPoint
                  .atraso_retorno_minutos,

              status:
                updatedPoint.status,

              observacao_admin:
                updatedPoint
                  .observacao_admin
            }
          });

      if (auditError) {
        console.warn(
          "O registro de ponto foi alterado, mas houve erro ao salvar a auditoria:",
          auditError
        );
      }

      return res.json({
        message:
          "Registro de ponto alterado com sucesso.",

        ponto: {
          ...updatedPoint,

          usuario: {
            id:
              employee.id,

            nome:
              employee.nome,

            matricula:
              employee.matricula,

            cargo:
              employee.cargo,

            setor:
              employee.setor
          },

          jornada:
            schedule
        }
      });

    } catch (error) {
      console.error(
        "Erro inesperado ao alterar registro de ponto:",
        error
      );

      return res
        .status(500)
        .json({
          error:
            "Erro interno ao alterar o registro de ponto."
        });
    }
  }
);

// ==========================================================
// GET /api/ponto/:usuario_id
//
// COLABORADOR:
// pode consultar somente o próprio ponto.
//
// ADMIN:
// pode consultar somente colaborador do próprio setor.
// ==========================================================

router.get(
  "/:usuario_id",
  async (req, res) => {
    try {
      const authResult =
        await getLoggedUser(req);

      if (authResult.error) {
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

      const requestedUserId =
        String(
          req.params.usuario_id ||
          ""
        ).trim();

      if (!requestedUserId) {
        return res
          .status(400)
          .json({
            error:
              "Usuário não informado."
          });
      }

      if (
        loggedUser.perfil ===
          "colaborador" &&
        String(
          loggedUser.id
        ) !==
          requestedUserId
      ) {
        return res
          .status(403)
          .json({
            error:
              "Você só pode consultar o próprio ponto."
          });
      }

      const requestedUser =
        await getUserById(
          requestedUserId
        );

      if (!requestedUser) {
        return res
          .status(404)
          .json({
            error:
              "Usuário não encontrado."
          });
      }

      if (
        requestedUser.perfil !==
        "colaborador"
      ) {
        return res
          .status(400)
          .json({
            error:
              "O usuário informado não é um colaborador."
          });
      }

      if (
        requestedUser.ativo ===
        false
      ) {
        return res
          .status(403)
          .json({
            error:
              "Este colaborador está inativo."
          });
      }

      if (
        isAdmin(loggedUser) &&
        requestedUser.setor !==
          loggedUser.setor
      ) {
        return res
          .status(403)
          .json({
            error:
              "Você não possui acesso ao ponto de colaboradores de outro setor."
          });
      }

      const schedule =
        await getEmployeeSchedule(
          requestedUser.id
        );

      const today =
        getBrazilDate();

      const {
        data: point,
        error: pointError
      } =
        await supabaseAdmin
          .from(
            "registro_ponto"
          )
          .select(`
            id,
            usuario_id,
            data,
            entrada,
            intervalo,
            retorno,
            saida,
            horas_trabalhadas,
            horas_extras,
            atraso_entrada_minutos,
            atraso_retorno_minutos,
            status,
            observacao_admin,
            documento_url,
            documento_nome,
            created_at,
            updated_at
          `)
          .eq(
            "usuario_id",
            requestedUser.id
          )
          .eq(
            "data",
            today
          )
          .maybeSingle();

      if (pointError) {
        console.error(
          "Erro ao buscar ponto:",
          pointError
        );

        return res
          .status(500)
          .json({
            error:
              "Não foi possível consultar o ponto.",

            details:
              pointError.message
          });
      }

      return res.json({
        usuario: {
          id:
            requestedUser.id,

          nome:
            requestedUser.nome,

          matricula:
            requestedUser.matricula,

          cargo:
            requestedUser.cargo,

          setor:
            requestedUser.setor
        },

        jornada:
          schedule || null,

        ponto:
          point || null
      });

    } catch (error) {
      console.error(
        "Erro inesperado ao consultar ponto:",
        error
      );

      return res
        .status(500)
        .json({
          error:
            "Erro interno ao consultar o ponto."
        });
    }
  }
);

// ==========================================================
// EXPORTAÇÃO
// ==========================================================

module.exports = router;