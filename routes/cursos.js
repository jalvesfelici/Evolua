// ==========================================================
// ROTAS DE TREINAMENTOS
// ==========================================================
//
// Este arquivo será responsável por:
//
// GET    /api/cursos
// POST   /api/cursos
// PATCH  /api/cursos/:id/desativar
//
// Posteriormente poderemos acrescentar:
//
// PUT    /api/cursos/:id
// GET    /api/cursos/:id
//
// ==========================================================


const express = require("express");


// Criamos um roteador do Express.
const router = express.Router();


// Importamos nossa conexão com o Supabase.
const supabase = require("../config/supabase");



// ==========================================================
// GET /api/cursos
// ==========================================================
//
// Busca todos os cursos ativos.
//
// Também buscamos as atividades relacionadas
// a cada curso.
//
// ==========================================================

router.get("/", async (req, res) => {

  try {

    const {
      data,
      error
    } = await supabase

      .from("cursos")

      .select(`
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
      `)

      // Por enquanto mostramos apenas cursos ativos.
      .eq(
        "ativo",
        true
      )

      // Cursos mais novos primeiro.
      .order(
        "created_at",
        {
          ascending: false
        }
      );


    // Caso o Supabase retorne algum erro.
    if (error) {

      console.error(
        "Erro Supabase:",
        error
      );


      return res
        .status(500)
        .json({
          erro:
            "Não foi possível buscar os cursos."
        });

    }


    // Ordenamos as atividades de cada curso.
    const cursos = (data || []).map(
      curso => {

        const atividades =
          curso.atividades_curso || [];


        atividades.sort(
          (a, b) =>
            (a.ordem || 0) -
            (b.ordem || 0)
        );


        return {
          ...curso,

          atividades_curso:
            atividades
        };

      }
    );


    // Retornamos os cursos.
    return res.json(
      cursos
    );

  } catch (erro) {

    console.error(
      "Erro inesperado ao buscar cursos:",
      erro
    );


    return res
      .status(500)
      .json({
        erro:
          "Erro interno do servidor."
      });

  }

});



// ==========================================================
// POST /api/cursos
// ==========================================================
//
// Cria:
//
// 1. O curso.
// 2. As atividades relacionadas.
//
// Esperamos receber:
//
// {
//   titulo,
//   descricao,
//   carga_horaria,
//   area,
//   nivel,
//   setor_responsavel,
//   setor_destino,
//   classificacao,
//   curso_externo,
//   link_externo,
//   atividades: []
// }
//
// ==========================================================

router.post("/", async (req, res) => {

  try {

    // Pegamos os dados enviados pelo frontend.
    const {

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

      atividades

    } = req.body;



    // ======================================================
    // VALIDAÇÕES BÁSICAS
    // ======================================================

    if (
      !titulo ||
      !descricao ||
      !carga_horaria ||
      !area ||
      !nivel ||
      !setor_responsavel ||
      !setor_destino ||
      !classificacao
    ) {

      return res
        .status(400)
        .json({
          erro:
            "Preencha todos os campos obrigatórios."
        });

    }



    // ======================================================
    // CRIAR O CURSO
    // ======================================================

    const {
      data: cursoCriado,
      error: erroCurso
    } = await supabase

      .from("cursos")

      .insert({

        titulo:
          titulo.trim(),

        descricao:
          descricao.trim(),

        carga_horaria:
          Number(carga_horaria),

        area,

        nivel,

        setor_responsavel,

        setor_destino,

        classificacao,

        curso_externo:
          Boolean(curso_externo),

        link_externo:
          link_externo || null,

        ativo:
          true

      })

      // Precisamos receber o curso criado
      // para descobrir o seu ID.
      .select()

      .single();



    // Caso falhe a criação do curso.
    if (erroCurso) {

      console.error(
        "Erro ao criar curso:",
        erroCurso
      );


      return res
        .status(500)
        .json({
          erro:
            "Não foi possível criar o curso."
        });

    }



    // ======================================================
    // CRIAR AS ATIVIDADES
    // ======================================================

    if (
      Array.isArray(atividades) &&
      atividades.length > 0
    ) {

      // Transformamos as atividades recebidas
      // no formato da tabela atividades_curso.
      const atividadesParaSalvar =
        atividades.map(
          (atividade, index) => ({

            // Ligação da atividade ao curso.
            curso_id:
              cursoCriado.id,

            titulo:
              atividade.titulo.trim(),

            descricao:
              atividade.descricao
                ? atividade.descricao.trim()
                : null,

            tipo:
              atividade.tipo,

            recurso:
              atividade.recurso || null,

            ordem:
              index + 1

          })
        );


      const {
        error: erroAtividades
      } = await supabase

        .from(
          "atividades_curso"
        )

        .insert(
          atividadesParaSalvar
        );



      // Caso tenha ocorrido erro nas atividades.
      if (erroAtividades) {

        console.error(
          "Erro ao criar atividades:",
          erroAtividades
        );


        // Para não deixar um curso incompleto
        // aparecendo na plataforma,
        // desativamos o curso.
        await supabase

          .from("cursos")

          .update({
            ativo: false
          })

          .eq(
            "id",
            cursoCriado.id
          );


        return res
          .status(500)
          .json({
            erro:
              "O curso foi criado, mas ocorreu um erro ao salvar as atividades."
          });

      }

    }



    // ======================================================
    // BUSCAR O CURSO COMPLETO
    // ======================================================
    //
    // Buscamos novamente para devolver também
    // as atividades cadastradas.
    //
    // ======================================================

    const {
      data: cursoCompleto,
      error: erroBusca
    } = await supabase

      .from("cursos")

      .select(`
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
          ordem
        )
      `)

      .eq(
        "id",
        cursoCriado.id
      )

      .single();



    if (erroBusca) {

      console.error(
        "Erro ao buscar curso criado:",
        erroBusca
      );

    }



    // Retornamos status 201 = recurso criado.
    return res
      .status(201)
      .json({
        mensagem:
          "Treinamento criado com sucesso.",

        curso:
          cursoCompleto || cursoCriado
      });

  } catch (erro) {

    console.error(
      "Erro inesperado ao criar curso:",
      erro
    );


    return res
      .status(500)
      .json({
        erro:
          "Erro interno do servidor."
      });

  }

});



// ==========================================================
// PATCH /api/cursos/:id/desativar
// ==========================================================
//
// Fazemos soft delete.
//
// Em vez de:
//
// DELETE FROM cursos
//
// fazemos:
//
// ativo = false
//
// Assim preservamos o histórico.
//
// ==========================================================

router.patch(
  "/:id/desativar",
  async (req, res) => {

    try {

      // Pegamos o ID que veio na URL.
      const cursoId =
        req.params.id;


      const {
        data,
        error
      } = await supabase

        .from("cursos")

        .update({

          ativo:
            false

        })

        .eq(
          "id",
          cursoId
        )

        .select()

        .single();



      if (error) {

        console.error(
          "Erro ao desativar curso:",
          error
        );


        return res
          .status(500)
          .json({
            erro:
              "Não foi possível remover o treinamento."
          });

      }


      return res.json({

        mensagem:
          "Treinamento removido da plataforma.",

        curso:
          data

      });

    } catch (erro) {

      console.error(
        "Erro inesperado ao desativar curso:",
        erro
      );


      return res
        .status(500)
        .json({
          erro:
            "Erro interno do servidor."
        });

    }

  }
);



// ==========================================================
// EXPORTAR ROTAS
// ==========================================================

module.exports = router;