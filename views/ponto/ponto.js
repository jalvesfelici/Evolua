
/*
==================================================
    SISTEMA DE PONTO - LOBIOS
==================================================
*/


// ================================================
// CONFIGURAÇÕES
// ================================================

const NOME_USUARIO = "Usuário Lobios";

const JORNADA_DIARIA = 8 * 60 * 60 * 1000;


// ================================================
// ELEMENTOS DA PÁGINA
// ================================================

const relogio = document.getElementById("relogio");
const dataAtual = document.getElementById("dataAtual");

const btnRegistrar = document.getElementById("btnRegistrar");

const tituloRegistro = document.getElementById("tituloRegistro");
const descricaoRegistro = document.getElementById("descricaoRegistro");

const status = document.getElementById("status");

const historicoBody = document.getElementById("historicoBody");

const contador = document.getElementById("contador");

const horasTrabalhadas = document.getElementById("horasTrabalhadas");

const barraProgresso = document.getElementById("barraProgresso");

const notificacao = document.getElementById("notificacao");

const nomeUsuario = document.getElementById("nomeUsuario");

const btnReset = document.getElementById("btnReset");

// ================================================
// TIPOS DE PONTO
// ================================================

const TIPOS_PONTO = {

    ENTRADA: "Entrada",

    INTERVALO: "Saída para intervalo",

    RETORNO: "Retorno do intervalo",

    SAIDA: "Saída"

};


// ================================================
// DATA ATUAL
// ================================================

function obterDataHoje() {

    const agora = new Date();

    return agora.toLocaleDateString("pt-BR");

}


// ================================================
// CHAVE DO STORAGE
// ================================================

function obterChaveStorage() {

    return `lobios_ponto_${obterDataHoje()}`;

}


// ================================================
// REGISTROS DO DIA
// ================================================

let registrosDoDia = [];


// ================================================
// CARREGAR REGISTROS DO BANCO
// ================================================

async function carregarRegistrosDoBanco() {

    const usuarioLogado =
        JSON.parse(
            localStorage.getItem("usuario_logado")
        );

    if (!usuarioLogado || !usuarioLogado.id) {

        console.error(
            "Usuário não identificado."
        );

        return;

    }

    try {

        const response =
            await fetch(
                `/api/ponto/${usuarioLogado.id}`
            );

        const resultado =
            await response.json();

        if (!response.ok) {

            throw new Error(
                resultado.error ||
                "Erro ao buscar ponto."
            );

        }

        registrosDoDia = [];

        const ponto = resultado.ponto;

        if (!ponto) {

            atualizarInterface();

            return;

        }

        // ==========================================
        // ENTRADA
        // ==========================================

        if (ponto.entrada) {

            registrosDoDia.push({
                tipo: TIPOS_PONTO.ENTRADA,
                data: ponto.data,
                horario: ponto.entrada,
                timestamp: new Date(
                    `${ponto.data}T${ponto.entrada}`
                ).getTime()
            });

        }

        // ==========================================
        // INTERVALO
        // ==========================================

        if (ponto.intervalo) {

            registrosDoDia.push({
                tipo: TIPOS_PONTO.INTERVALO,
                data: ponto.data,
                horario: ponto.intervalo,
                timestamp: new Date(
                    `${ponto.data}T${ponto.intervalo}`
                ).getTime()
            });

        }

        // ==========================================
        // RETORNO
        // ==========================================

        if (ponto.retorno) {

            registrosDoDia.push({
                tipo: TIPOS_PONTO.RETORNO,
                data: ponto.data,
                horario: ponto.retorno,
                timestamp: new Date(
                    `${ponto.data}T${ponto.retorno}`
                ).getTime()
            });

        }

        // ==========================================
        // SAÍDA
        // ==========================================

        if (ponto.saida) {

            registrosDoDia.push({
                tipo: TIPOS_PONTO.SAIDA,
                data: ponto.data,
                horario: ponto.saida,
                timestamp: new Date(
                    `${ponto.data}T${ponto.saida}`
                ).getTime()
            });

        }

        atualizarInterface();

    } catch (erro) {

        console.error(
            "Erro ao carregar ponto:",
            erro
        );

        mostrarNotificacao(
            "Não foi possível carregar o ponto."
        );

    }

}


// ================================================
// CARREGAR REGISTROS
// ================================================

function carregarRegistros() {

    return registrosDoDia;

}

// ================================================
// RELÓGIO
// ================================================

function atualizarRelogio() {

    const agora = new Date();


    const hora = agora.toLocaleTimeString(
        "pt-BR",
        {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        }
    );


    const data = agora.toLocaleDateString(
        "pt-BR",
        {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric"
        }
    );


    relogio.textContent = hora;

    dataAtual.textContent = data;

}


setInterval(
    atualizarRelogio,
    1000
);

atualizarRelogio();


// ================================================
// NOME DO USUÁRIO
// ================================================

nomeUsuario.textContent =
    NOME_USUARIO;


// ================================================
// DESCOBRIR PRÓXIMO PONTO
// ================================================

function obterProximoTipo() {

    const registros = carregarRegistros();

    const quantidade = registros.length;


    switch (quantidade) {

        case 0:
            return TIPOS_PONTO.ENTRADA;

        case 1:
            return TIPOS_PONTO.INTERVALO;

        case 2:
            return TIPOS_PONTO.RETORNO;

        case 3:
            return TIPOS_PONTO.SAIDA;

        default:
            return null;

    }

}


// ================================================
// ATUALIZAR INTERFACE
// ================================================

function atualizarInterface() {

    const registros = carregarRegistros();

    const proximoTipo = obterProximoTipo();


    // --------------------------------------------
    // BOTÃO
    // --------------------------------------------

    if (!proximoTipo) {

        btnRegistrar.disabled = true;

        btnRegistrar.innerHTML =
            "<span>Ponto do dia concluído</span>";

        tituloRegistro.textContent =
            "Jornada concluída";

        descricaoRegistro.textContent =
            "Todos os registros do dia já foram realizados.";

        status.textContent =
            "Jornada encerrada";

    } else {

        btnRegistrar.disabled = false;

        btnRegistrar.innerHTML =
            `<span>Registrar ${proximoTipo}</span>`;

        tituloRegistro.textContent =
            `Registrar ${proximoTipo}`;

        descricaoRegistro.textContent =
            obterDescricao(proximoTipo);

        status.textContent =
            `Próximo registro: ${proximoTipo}`;

    }


    // --------------------------------------------
    // HISTÓRICO
    // --------------------------------------------

    atualizarHistorico(registros);


    // --------------------------------------------
    // RESUMO
    // --------------------------------------------

    atualizarResumo(registros);


    // --------------------------------------------
    // HORAS TRABALHADAS
    // --------------------------------------------

    atualizarHorasTrabalhadas(registros);

}


// ================================================
// DESCRIÇÃO DO PONTO
// ================================================

function obterDescricao(tipo) {

    switch (tipo) {

        case TIPOS_PONTO.ENTRADA:

            return "Registre o horário em que você iniciou sua jornada.";

        case TIPOS_PONTO.INTERVALO:

            return "Registre sua saída para o intervalo.";

        case TIPOS_PONTO.RETORNO:

            return "Registre seu retorno do intervalo.";

        case TIPOS_PONTO.SAIDA:

            return "Registre o horário em que você encerrou sua jornada.";

        default:

            return "";

    }

}


// ================================================
// REGISTRAR PONTO
// ================================================

btnRegistrar.addEventListener(
    "click",
    registrarPonto
);

async function registrarPonto() {

    const proximoTipo = obterProximoTipo();

    if (!proximoTipo) {

        mostrarNotificacao(
            "A jornada de hoje já foi concluída."
        );

        return;

    }

    // ================================================
    // USUÁRIO LOGADO
    // ================================================

    const usuarioLogado =
        JSON.parse(
            localStorage.getItem("usuario_logado")
        );

    if (!usuarioLogado || !usuarioLogado.id) {

        mostrarNotificacao(
            "Usuário não identificado."
        );

        return;

    }

    // ================================================
    // CONVERTER TIPO
    // ================================================

    const tipo = {

        "Entrada": "entrada",

        "Saída para intervalo": "intervalo",

        "Retorno do intervalo": "retorno",

        "Saída": "saida"

    }[proximoTipo];


    try {

        // ============================================
        // ENVIAR PARA A API
        // ============================================

        const response =
            await fetch(
                "/api/ponto",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({

                        usuario_id:
                            usuarioLogado.id,

                        tipo:
                            tipo

                    })
                }
            );


        const resultado =
            await response.json();


        // ============================================
        // ERRO
        // ============================================

        if (!response.ok) {

            throw new Error(
                resultado.error ||
                "Não foi possível registrar o ponto."
            );

        }


        // ============================================
        // SUCESSO
        // ============================================

        mostrarNotificacao(
            resultado.mensagem
        );


        // ============================================
        // ATUALIZAR DADOS DO BANCO
        // ============================================

        await carregarRegistrosDoBanco();

    } catch (erro) {

        console.error(
            "Erro ao registrar ponto:",
            erro
        );

        mostrarNotificacao(
            erro.message
        );

    }

}
// ================================================
// HISTÓRICO
// ================================================

function atualizarHistorico(registros) {

    historicoBody.innerHTML = "";


    if (registros.length === 0) {

        historicoBody.innerHTML = `
            <tr class="sem-registros">
                <td colspan="3">
                    Nenhum ponto registrado hoje.
                </td>
            </tr>
        `;

        contador.textContent =
            "0 registros";

        return;

    }


    registros.forEach(
        (registro) => {

            const linha =
                document.createElement("tr");


            const tipoClasse =
                obterClasseBadge(
                    registro.tipo
                );


            linha.innerHTML = `

                <td>
                    <span class="badge ${tipoClasse}">
                        ${registro.tipo}
                    </span>
                </td>

                <td>
                    ${registro.data}
                </td>

                <td>
                    <strong>
                        ${registro.horario}
                    </strong>
                </td>

            `;


            historicoBody.appendChild(
                linha
            );

        }
    );


    contador.textContent =
        registros.length === 1
            ? "1 registro"
            : `${registros.length} registros`;

}


// ================================================
// CLASSES DOS BADGES
// ================================================

function obterClasseBadge(tipo) {

    switch (tipo) {

        case TIPOS_PONTO.ENTRADA:

            return "badge-entrada";

        case TIPOS_PONTO.INTERVALO:

            return "badge-intervalo";

        case TIPOS_PONTO.RETORNO:

            return "badge-retorno";

        case TIPOS_PONTO.SAIDA:

            return "badge-saida";

        default:

            return "";

    }

}


// ================================================
// RESUMO
// ================================================

function atualizarResumo(registros) {

    const horaEntrada =
        document.getElementById(
            "horaEntrada"
        );

    const horaIntervalo =
        document.getElementById(
            "horaIntervalo"
        );

    const horaRetorno =
        document.getElementById(
            "horaRetorno"
        );

    const horaSaida =
        document.getElementById(
            "horaSaida"
        );


    horaEntrada.textContent =
        encontrarHorario(
            registros,
            TIPOS_PONTO.ENTRADA
        );


    horaIntervalo.textContent =
        encontrarHorario(
            registros,
            TIPOS_PONTO.INTERVALO
        );


    horaRetorno.textContent =
        encontrarHorario(
            registros,
            TIPOS_PONTO.RETORNO
        );


    horaSaida.textContent =
        encontrarHorario(
            registros,
            TIPOS_PONTO.SAIDA
        );

}


// ================================================
// ENCONTRAR HORÁRIO
// ================================================

function encontrarHorario(
    registros,
    tipo
) {

    const registro =
        registros.find(
            item => item.tipo === tipo
        );


    if (!registro) {

        return "--:--";

    }


    return registro.horario.substring(
        0,
        5
    );

}


// ================================================
// CALCULAR HORAS TRABALHADAS
// ================================================

function calcularHorasTrabalhadas(
    registros
) {

    if (
        registros.length < 2
    ) {

        return 0;

    }


    let total = 0;


    // Entrada → Intervalo
    if (
        registros[0] &&
        registros[1]
    ) {

        total +=
            registros[1].timestamp -
            registros[0].timestamp;

    }


    // Retorno → Saída
    if (
        registros[2] &&
        registros[3]
    ) {

        total +=
            registros[3].timestamp -
            registros[2].timestamp;

    }


    return total;

}


// ================================================
// FORMATAR TEMPO
// ================================================

function formatarTempo(
    milissegundos
) {

    if (milissegundos < 0) {

        milissegundos = 0;

    }


    const segundos =
        Math.floor(
            milissegundos / 1000
        );


    const horas =
        Math.floor(
            segundos / 3600
        );


    const minutos =
        Math.floor(
            (segundos % 3600) / 60
        );


    const segundosRestantes =
        segundos % 60;


    return [

        String(horas).padStart(2, "0"),

        String(minutos).padStart(2, "0"),

        String(segundosRestantes)
            .padStart(2, "0")

    ].join(":");

}


// ================================================
// ATUALIZAR HORAS TRABALHADAS
// ================================================

function atualizarHorasTrabalhadas(
    registros
) {

    const total =
        calcularHorasTrabalhadas(
            registros
        );


    horasTrabalhadas.textContent =
        formatarTempo(total);


    const percentual =
        Math.min(
            (total / JORNADA_DIARIA) * 100,
            100
        );


    barraProgresso.style.width =
        `${percentual}%`;

}


// ================================================
// NOTIFICAÇÃO
// ================================================

function mostrarNotificacao(
    mensagem
) {

    notificacao.textContent =
        mensagem;


    notificacao.classList.add(
        "mostrar"
    );


    setTimeout(
        () => {

            notificacao.classList.remove(
                "mostrar"
            );

        },
        3500
    );

}


// ================================================
// RESETAR MARCAÇÕES DO DIA
// ================================================

if (btnReset) {

    btnReset.addEventListener(
        "click",
        resetarPonto
    );

}

function resetarPonto() {

    const confirmar = confirm(
        "Tem certeza que deseja resetar as marcações da tela para teste?"
    );

    if (!confirmar) {
        return;
    }

    // ATENÇÃO:
    // Este botão NÃO apaga nada do banco.
    // Ele serve apenas para limpar a tela durante os testes.

    registrosDoDia = [];

    mostrarNotificacao(
        "Tela resetada para teste."
    );

    atualizarInterface();

}

// ================================================
// INICIALIZAÇÃO
// ================================================

carregarRegistrosDoBanco();