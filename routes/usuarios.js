const express = require("express");
const router = express.Router();

const supabase =
  require("../config/supabase");

const supabaseAdmin =
  require("../config/supabaseAdmin");

const allowedSectors = [
  "Operacional",
  "Logística",
  "Administrativo",
  "Tecnologia",
  "RH",
  "Financeiro",
  "Marketing"
];

const allowedCreationProfiles = [
  "admin_setor",
  "colaborador"
];

/* ==========================================================
   AUTENTICAÇÃO
========================================================== */

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
        "Não foi possível validar o perfil do usuário.",
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

function normalizeText(value) {
  return String(
    value || ""
  ).trim();
}

function normalizeEmail(value) {
  return String(
    value || ""
  )
    .trim()
    .toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    .test(email);
}

/* ==========================================================
   GET /api/usuarios

   Cada administrador visualiza somente colaboradores
   ativos pertencentes ao próprio setor.
========================================================== */

router.get(
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

      const loggedAdmin =
        authResult.user;

      if (!isAdmin(loggedAdmin)) {
        return res
          .status(403)
          .json({
            error:
              "Você não possui permissão para visualizar funcionários."
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
            ativo,
            criado_por,
            created_at
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

      if (error) {
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

      return res.json(
        employees || []
      );

    } catch (error) {
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

/* ==========================================================
   POST /api/usuarios

   REGRAS:

   admin_setor:
   - cria somente colaboradores;
   - colaborador pertence obrigatoriamente ao próprio setor.

   admin_principal:
   - cria colaboradores no próprio setor;
   - pode criar admin_setor para qualquer setor.

   Nenhum usuário pode criar admin_principal.
========================================================== */

router.post(
  "/",
  async (req, res) => {
    let createdAuthUserId =
      null;

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

      const creatorAdmin =
        authResult.user;

      if (!isAdmin(creatorAdmin)) {
        return res
          .status(403)
          .json({
            error:
              "Você não possui permissão para criar usuários."
          });
      }

      let {
        nome,
        matricula,
        email,
        senha,
        cargo,
        setor,
        perfil
      } = req.body;

      nome =
        normalizeText(nome);

      matricula =
        normalizeText(
          matricula
        );

      email =
        normalizeEmail(email);

      senha =
        String(
          senha || ""
        );

      cargo =
        normalizeText(cargo);

      setor =
        normalizeText(setor);

      perfil =
        normalizeText(perfil);

      if (
        !nome ||
        !matricula ||
        !email ||
        !senha ||
        !cargo ||
        !perfil
      ) {
        return res
          .status(400)
          .json({
            error:
              "Preencha todos os campos obrigatórios."
          });
      }

      if (!isValidEmail(email)) {
        return res
          .status(400)
          .json({
            error:
              "Informe um e-mail válido."
          });
      }

      if (senha.length < 6) {
        return res
          .status(400)
          .json({
            error:
              "A senha precisa possuir pelo menos 6 caracteres."
          });
      }

      if (
        !allowedCreationProfiles
          .includes(perfil)
      ) {
        return res
          .status(400)
          .json({
            error:
              "Perfil de usuário inválido."
          });
      }

      if (
        perfil ===
          "admin_setor" &&
        creatorAdmin.perfil !==
          "admin_principal"
      ) {
        return res
          .status(403)
          .json({
            error:
              "Somente o administrador principal pode criar administradores de setor."
          });
      }

      /*
       * Colaboradores sempre recebem o setor do
       * administrador que está realizando o cadastro.
       * O setor enviado pelo frontend é ignorado.
       */
      if (
        perfil ===
        "colaborador"
      ) {
        if (!creatorAdmin.setor) {
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

      /*
       * Somente o administrador principal pode chegar
       * neste ponto criando um administrador de setor.
       */
      if (
        perfil ===
        "admin_setor"
      ) {
        if (!setor) {
          return res
            .status(400)
            .json({
              error:
                "Informe o setor do administrador."
            });
        }

        if (
          !allowedSectors
            .includes(setor)
        ) {
          return res
            .status(400)
            .json({
              error:
                "Setor do administrador inválido."
            });
        }
      }

      if (
        !allowedSectors
          .includes(setor)
      ) {
        return res
          .status(400)
          .json({
            error:
              "Setor inválido."
          });
      }

      /* E-mail duplicado */

      const {
        data: existingEmail,
        error: emailCheckError
      } =
        await supabaseAdmin
          .from("usuario")
          .select("id")
          .eq(
            "email",
            email
          )
          .maybeSingle();

      if (emailCheckError) {
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

      if (existingEmail) {
        return res
          .status(409)
          .json({
            error:
              "Já existe um usuário cadastrado com este e-mail."
          });
      }

      /* Matrícula duplicada */

      const {
        data: existingRegistration,
        error:
          registrationCheckError
      } =
        await supabaseAdmin
          .from("usuario")
          .select("id")
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

      if (existingRegistration) {
        return res
          .status(409)
          .json({
            error:
              "Já existe um usuário cadastrado com esta matrícula."
          });
      }

      /* Criar conta no Supabase Auth */

      const {
        data: authData,
        error: authError
      } =
        await supabaseAdmin
          .auth
          .admin
          .createUser({
            email,
            password:
              senha,

            email_confirm:
              true,

            user_metadata: {
              nome,
              matricula,
              cargo,
              setor,
              perfil
            }
          });

      if (authError) {
        console.error(
          "Erro ao criar usuário no Auth:",
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

      createdAuthUserId =
        authData?.user?.id;

      if (!createdAuthUserId) {
        return res
          .status(500)
          .json({
            error:
              "O Supabase não retornou o ID do novo usuário."
          });
      }

      /* Criar perfil profissional */

      const {
        data: profileData,
        error: profileError
      } =
        await supabaseAdmin
          .from("usuario")
          .insert({
            id:
              createdAuthUserId,

            nome,
            email,
            matricula,
            cargo,
            setor,
            perfil,

            ativo:
              true,

            criado_por:
              creatorAdmin.id
          })
          .select()
          .single();

      if (profileError) {
        console.error(
          "Erro ao criar perfil:",
          profileError
        );

        const {
          error: rollbackError
        } =
          await supabaseAdmin
            .auth
            .admin
            .deleteUser(
              createdAuthUserId
            );

        if (rollbackError) {
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

      if (createdAuthUserId) {
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

/* ==========================================================
   PUT /api/usuarios/:id

   Edita um colaborador existente.

   REGRAS:
   - somente administradores;
   - somente colaboradores;
   - somente colaboradores do próprio setor;
   - setor e perfil não podem ser alterados;
   - senha é atualizada somente no Supabase Auth;
   - senha nunca é armazenada na tabela usuario.
========================================================== */

router.put(
  "/:id",
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
              "Você não possui permissão para editar funcionários."
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

      const userId =
        normalizeText(
          req.params.id
        );

      if (!userId) {
        return res
          .status(400)
          .json({
            error:
              "Usuário não informado."
          });
      }

      if (
        String(userId) ===
        String(loggedAdmin.id)
      ) {
        return res
          .status(403)
          .json({
            error:
              "Esta rota não pode ser utilizada para editar sua própria conta."
          });
      }

      const {
        data: targetUser,
        error: targetError
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

      if (targetError) {
        console.error(
          "Erro ao buscar colaborador:",
          targetError
        );

        return res
          .status(500)
          .json({
            error:
              "Não foi possível localizar o colaborador.",
            details:
              targetError.message
          });
      }

      if (!targetUser) {
        return res
          .status(404)
          .json({
            error:
              "Colaborador não encontrado."
          });
      }

      if (
        targetUser.perfil !==
        "colaborador"
      ) {
        return res
          .status(403)
          .json({
            error:
              "Administradores não podem ser editados pela área de funcionários."
          });
      }

      if (
        targetUser.ativo ===
        false
      ) {
        return res
          .status(409)
          .json({
            error:
              "Este colaborador está inativo."
          });
      }

      /*
       * Proteção principal:
       * independentemente do frontend, o Admin não
       * consegue editar alguém de outro setor.
       */
      if (
        targetUser.setor !==
        loggedAdmin.setor
      ) {
        return res
          .status(403)
          .json({
            error:
              "Você não possui permissão para editar colaboradores de outro setor."
          });
      }

      let {
        nome,
        matricula,
        email,
        cargo,
        senha
      } = req.body;

      nome =
        normalizeText(nome);

      matricula =
        normalizeText(
          matricula
        );

      email =
        normalizeEmail(email);

      cargo =
        normalizeText(cargo);

      senha =
        senha === undefined ||
        senha === null
          ? ""
          : String(senha);

      if (
        !nome ||
        !matricula ||
        !email ||
        !cargo
      ) {
        return res
          .status(400)
          .json({
            error:
              "Preencha todos os dados obrigatórios do colaborador."
          });
      }

      if (!isValidEmail(email)) {
        return res
          .status(400)
          .json({
            error:
              "Informe um e-mail válido."
          });
      }

      if (
        senha &&
        senha.length < 6
      ) {
        return res
          .status(400)
          .json({
            error:
              "A nova senha precisa possuir pelo menos 6 caracteres."
          });
      }

      /* Verificar e-mail duplicado */

      const {
        data: emailOwner,
        error: emailCheckError
      } =
        await supabaseAdmin
          .from("usuario")
          .select("id")
          .eq(
            "email",
            email
          )
          .neq(
            "id",
            targetUser.id
          )
          .maybeSingle();

      if (emailCheckError) {
        console.error(
          "Erro ao verificar novo e-mail:",
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

      if (emailOwner) {
        return res
          .status(409)
          .json({
            error:
              "Já existe outro usuário cadastrado com este e-mail."
          });
      }

      /* Verificar matrícula duplicada */

      const {
        data: registrationOwner,
        error:
          registrationCheckError
      } =
        await supabaseAdmin
          .from("usuario")
          .select("id")
          .eq(
            "matricula",
            matricula
          )
          .neq(
            "id",
            targetUser.id
          )
          .maybeSingle();

      if (
        registrationCheckError
      ) {
        console.error(
          "Erro ao verificar nova matrícula:",
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

      if (registrationOwner) {
        return res
          .status(409)
          .json({
            error:
              "Já existe outro usuário cadastrado com esta matrícula."
          });
      }

      /*
       * O setor nunca é recebido do frontend.
       * O colaborador continua no mesmo setor do Admin.
       */
      const updatedProfile = {
        nome,
        matricula,
        email,
        cargo,
        setor:
          loggedAdmin.setor
      };

      /*
       * Atualizamos primeiro o perfil profissional.
       * Caso o Auth falhe em seguida, fazemos rollback.
       */
      const {
        data: updatedUser,
        error: updateProfileError
      } =
        await supabaseAdmin
          .from("usuario")
          .update(
            updatedProfile
          )
          .eq(
            "id",
            targetUser.id
          )
          .select(`
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
          `)
          .single();

      if (updateProfileError) {
        console.error(
          "Erro ao atualizar perfil:",
          updateProfileError
        );

        return res
          .status(500)
          .json({
            error:
              "Não foi possível atualizar os dados do colaborador.",
            details:
              updateProfileError.message
          });
      }

      const authUpdate = {
        email,

        user_metadata: {
          nome,
          matricula,
          cargo,
          setor:
            loggedAdmin.setor,
          perfil:
            "colaborador"
        }
      };

      if (senha) {
        authUpdate.password =
          senha;
      }

      const {
        error: authUpdateError
      } =
        await supabaseAdmin
          .auth
          .admin
          .updateUserById(
            targetUser.id,
            authUpdate
          );

      if (authUpdateError) {
        console.error(
          "Erro ao atualizar usuário no Auth:",
          authUpdateError
        );

        /*
         * Rollback dos dados profissionais.
         * A tabela volta aos valores anteriores caso
         * a atualização no Auth não seja concluída.
         */
        const {
          error: rollbackError
        } =
          await supabaseAdmin
            .from("usuario")
            .update({
              nome:
                targetUser.nome,

              matricula:
                targetUser.matricula,

              email:
                targetUser.email,

              cargo:
                targetUser.cargo,

              setor:
                targetUser.setor
            })
            .eq(
              "id",
              targetUser.id
            );

        if (rollbackError) {
          console.error(
            "Erro ao restaurar perfil após falha no Auth:",
            rollbackError
          );
        }

        return res
          .status(500)
          .json({
            error:
              "Não foi possível atualizar os dados de acesso do colaborador.",
            details:
              authUpdateError.message
          });
      }

      return res.json({
        message:
          senha
            ? "Dados e senha do colaborador atualizados com sucesso."
            : "Dados do colaborador atualizados com sucesso.",

        usuario:
          updatedUser
      });

    } catch (error) {
      console.error(
        "Erro inesperado ao editar colaborador:",
        error
      );

      return res
        .status(500)
        .json({
          error:
            "Erro interno ao editar colaborador."
        });
    }
  }
);

/* ==========================================================
   DELETE /api/usuarios/:id

   Exclusão lógica:
   - perfil permanece no banco para preservar histórico;
   - usuario.ativo passa para false;
   - acesso no Supabase Auth é removido.

   Somente colaboradores do próprio setor podem ser
   removidos através desta rota.
========================================================== */

router.delete(
  "/:id",
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
              "Você não possui permissão para excluir usuários."
          });
      }

      const userId =
        normalizeText(
          req.params.id
        );

      if (!userId) {
        return res
          .status(400)
          .json({
            error:
              "Usuário não informado."
          });
      }

      if (
        String(userId) ===
        String(loggedAdmin.id)
      ) {
        return res
          .status(403)
          .json({
            error:
              "Você não pode excluir sua própria conta."
          });
      }

      const {
        data: targetUser,
        error: targetError
      } =
        await supabaseAdmin
          .from("usuario")
          .select(`
            id,
            nome,
            email,
            setor,
            perfil,
            ativo
          `)
          .eq(
            "id",
            userId
          )
          .maybeSingle();

      if (targetError) {
        console.error(
          "Erro ao buscar usuário para exclusão:",
          targetError
        );

        return res
          .status(500)
          .json({
            error:
              "Não foi possível localizar o usuário.",
            details:
              targetError.message
          });
      }

      if (!targetUser) {
        return res
          .status(404)
          .json({
            error:
              "Usuário não encontrado."
          });
      }

      if (
        targetUser.perfil !==
        "colaborador"
      ) {
        return res
          .status(403)
          .json({
            error:
              "Administradores não podem ser excluídos pela área de funcionários."
          });
      }

      if (
        !loggedAdmin.setor ||
        targetUser.setor !==
          loggedAdmin.setor
      ) {
        return res
          .status(403)
          .json({
            error:
              "Você não possui permissão para excluir colaboradores de outro setor."
          });
      }

      if (
        targetUser.ativo ===
        false
      ) {
        return res
          .status(409)
          .json({
            error:
              "Este usuário já está inativo."
          });
      }

      /*
       * Desativamos primeiro o perfil.
       * O registro permanece para preservar históricos.
       */
      const {
        error: disableError
      } =
        await supabaseAdmin
          .from("usuario")
          .update({
            ativo: false
          })
          .eq(
            "id",
            targetUser.id
          );

      if (disableError) {
        console.error(
          "Erro ao desativar usuário:",
          disableError
        );

        return res
          .status(500)
          .json({
            error:
              "Não foi possível excluir o funcionário.",
            details:
              disableError.message
          });
      }

      /*
       * Remove o acesso do usuário ao sistema.
       */
      const {
        error: authDeleteError
      } =
        await supabaseAdmin
          .auth
          .admin
          .deleteUser(
            targetUser.id
          );

      if (authDeleteError) {
        console.error(
          "Erro ao excluir usuário do Auth:",
          authDeleteError
        );

        /*
         * Rollback:
         * se o Auth não for removido, o perfil volta
         * a ficar ativo.
         */
        const {
          error: rollbackError
        } =
          await supabaseAdmin
            .from("usuario")
            .update({
              ativo: true
            })
            .eq(
              "id",
              targetUser.id
            );

        if (rollbackError) {
          console.error(
            "Erro ao reativar usuário após falha no Auth:",
            rollbackError
          );
        }

        return res
          .status(500)
          .json({
            error:
              "Não foi possível remover o acesso do funcionário.",
            details:
              authDeleteError.message
          });
      }

      return res.json({
        message:
          "Funcionário excluído com sucesso."
      });

    } catch (error) {
      console.error(
        "Erro inesperado ao excluir funcionário:",
        error
      );

      return res
        .status(500)
        .json({
          error:
            "Erro interno ao excluir funcionário."
        });
    }
  }
);

module.exports = router;