const express = require("express");

const router = express.Router();

const supabase = require("../config/supabase");

// ==========================================================
// POST /api/ponto
// Registrar ponto
// ==========================================================

router.post("/", async (req, res) => {
    try {

        const {
            usuario_id,
            tipo
        } = req.body;

        // ==================================================
        // VALIDAÇÃO
        // ==================================================

        if (!usuario_id || !tipo) {
            return res.status(400).json({
                error: "usuario_id e tipo são obrigatórios."
            });
        }

        const tiposPermitidos = [
            "entrada",
            "intervalo",
            "retorno",
            "saida"
        ];

        if (!tiposPermitidos.includes(tipo)) {
            return res.status(400).json({
                error: "Tipo de ponto inválido."
            });
        }

        // ==================================================
        // BUSCAR COLABORADOR
        // ==================================================

        const {
            data: colaborador,
            error: colaboradorError
        } = await supabase
            .from("colaboradores")
            .select("id")
            .eq("usuario_id", usuario_id)
            .maybeSingle();

        if (colaboradorError) {

            console.error(
                "Erro ao buscar colaborador:",
                colaboradorError
            );

            return res.status(500).json({
                error: "Erro ao buscar colaborador."
            });
        }

        if (!colaborador) {

            return res.status(404).json({
                error: "Colaborador não encontrado."
            });
        }

        // ==================================================
        // ID DO COLABORADOR
        // ==================================================

        const colaborador_id = colaborador.id;

        // ==================================================
        // DATA E HORÁRIO ATUAIS
        // ==================================================

        const agora = new Date();

        const data =
            agora.toISOString().split("T")[0];

        const horario =
            agora.toTimeString().substring(0, 8);

        // ==================================================
        // PROCURAR PONTO DO DIA
        // ==================================================

        const {
            data: pontoExistente,
            error: buscaError
        } = await supabase
            .from("ponto")
            .select("*")
            .eq("colaborador_id", colaborador_id)
            .eq("data", data)
            .maybeSingle();

        if (buscaError) {

            console.error(
                "Erro ao buscar ponto:",
                buscaError
            );

            return res.status(500).json({
                error: "Erro ao buscar ponto."
            });
        }

        // ==================================================
        // PRIMEIRA BATIDA DO DIA
        // ==================================================

        if (!pontoExistente) {

            if (tipo !== "entrada") {

                return res.status(400).json({
                    error: "O primeiro registro deve ser uma entrada."
                });
            }

            const {
                data: novoPonto,
                error: insertError
            } = await supabase
                .from("ponto")
                .insert({
                    colaborador_id: colaborador_id,
                    data: data,
                    entrada: horario,
                    status: "normal"
                })
                .select()
                .single();

            if (insertError) {

                console.error(
                    "Erro ao criar ponto:",
                    insertError
                );

                return res.status(500).json({
                    error: "Não foi possível registrar o ponto."
                });
            }

            return res.status(201).json({
                mensagem: "Entrada registrada com sucesso.",
                ponto: novoPonto
            });
        }

        // ==================================================
        // DEFINIR COLUNA
        // ==================================================

        const coluna = {
            entrada: "entrada",
            intervalo: "intervalo",
            retorno: "retorno",
            saida: "saida"
        }[tipo];

        // ==================================================
        // IMPEDIR DUPLICAÇÃO
        // ==================================================

        if (pontoExistente[coluna]) {

            return res.status(400).json({
                error: `O registro de ${tipo} já foi realizado.`
            });
        }

        // ==================================================
        // ATUALIZAÇÃO
        // ==================================================

        const atualizacao = {
            [coluna]: horario
        };

        // ==================================================
        // CALCULAR HORAS TRABALHADAS
        // ==================================================

        if (
            tipo === "saida" &&
            pontoExistente.entrada &&
            pontoExistente.retorno
        ) {

            const entrada = new Date(
                `${data}T${pontoExistente.entrada}`
            );

            const retorno = new Date(
                `${data}T${pontoExistente.retorno}`
            );

            const saida = new Date(
                `${data}T${horario}`
            );

            const periodo1 =
                pontoExistente.intervalo
                    ? (
                        new Date(
                            `${data}T${pontoExistente.intervalo}`
                        ) - entrada
                    )
                    : 0;

            const periodo2 =
                saida - retorno;

            const total =
                periodo1 + periodo2;

            const horas =
                total / (1000 * 60 * 60);

            atualizacao.horas_trabalhadas =
                Number(horas.toFixed(2));

            atualizacao.horas_extras =
                horas > 8
                    ? Number((horas - 8).toFixed(2))
                    : 0;
        }

        // ==================================================
        // ATUALIZAR BANCO
        // ==================================================

        const {
            data: pontoAtualizado,
            error: updateError
        } = await supabase
            .from("ponto")
            .update(atualizacao)
            .eq("id", pontoExistente.id)
            .select()
            .single();

        if (updateError) {

            console.error(
                "Erro ao atualizar ponto:",
                updateError
            );

            return res.status(500).json({
                error: "Não foi possível atualizar o ponto."
            });
        }

        // ==================================================
        // SUCESSO
        // ==================================================

        return res.status(200).json({
            mensagem: `${tipo} registrado com sucesso.`,
            ponto: pontoAtualizado
        });

    } catch (error) {

        console.error(
            "Erro inesperado no ponto:",
            error
        );

        return res.status(500).json({
            error: "Erro interno ao registrar ponto."
        });
    }
});

// ==========================================================
// EXPORTAR
// ==========================================================

module.exports = router;