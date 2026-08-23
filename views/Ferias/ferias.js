// ==========================================================
// EVOLUA+
// FÉRIAS - FRONTEND
// ==========================================================
//
// Este arquivo:
//
// - identifica o colaborador logado;
// - busca férias no backend;
// - busca solicitações;
// - calcula visualmente os dias;
// - envia novas solicitações;
// - atualiza as tabelas.
//
// ==========================================================



// ==========================================================
// SESSÃO
// ==========================================================

const accessToken =
  localStorage.getItem(
    "access_token"
  );


let loggedUser =
  null;


try {

  const storedUser =
    localStorage.getItem(
      "usuario_logado"
    );


  if (storedUser) {

    loggedUser =
      JSON.parse(
        storedUser
      );

  }

} catch (error) {

  console.error(
    "Erro ao carregar usuário:",
    error
  );

}



// ==========================================================
// DADOS DA PÁGINA
// ==========================================================

let periodoAtual =
  null;


let solicitacoes =
  [];



// ==========================================================
// ELEMENTOS DO MODAL
// ==========================================================

const modal =
  document.getElementById(
    "modalSolicitacao"
  );


const abrirModalBtn =
  document.getElementById(
    "abrirModal"
  );


const btnNovaSolicitacao =
  document.getElementById(
    "btnNovaSolicitacao"
  );


const fecharModalBtn =
  document.getElementById(
    "fecharModal"
  );


const cancelarModalBtn =
  document.getElementById(
    "cancelarModal"
  );


const formSolicitacao =
  document.getElementById(
    "formSolicitacao"
  );


const dataInicio =
  document.getElementById(
    "dataInicio"
  );


const dataFim =
  document.getElementById(
    "dataFim"
  );


const quantidadeDias =
  document.getElementById(
    "quantidadeDias"
  );


const observacoes =
  document.getElementById(
    "observacoes"
  );


const salvarSolicitacao =
  document.getElementById(
    "salvarSolicitacao"
  );



// ==========================================================
// VALIDAR ACESSO
// ==========================================================

function validarSessao() {

  if (
    !accessToken ||
    !loggedUser
  ) {

    window.location.href =
      "/login/";

    return false;

  }


  // Somente colaborador utiliza esta tela.

  if (
    loggedUser.perfil !==
    "colaborador"
  ) {

    window.location.href =
      "/admin/";

    return false;

  }


  if (
    loggedUser.ativo ===
    false
  ) {

    limparSessao();


    window.location.href =
      "/login/";

    return false;

  }


  return true;

}



// ==========================================================
// LIMPAR SESSÃO
// ==========================================================

function limparSessao() {

  localStorage.removeItem(
    "access_token"
  );


  localStorage.removeItem(
    "usuario_logado"
  );

}



// ==========================================================
// HEADERS
// ==========================================================

function getAuthHeaders(
  incluirJson = false
) {

  const headers = {

    Authorization:
      `Bearer ${accessToken}`

  };


  if (incluirJson) {

    headers["Content-Type"] =
      "application/json";

  }


  return headers;

}



// ==========================================================
// TRATAR TOKEN EXPIRADO
// ==========================================================

function tratarNaoAutorizado(
  response
) {

  if (
    response.status !== 401
  ) {

    return false;

  }


  limparSessao();


  alert(
    "Sua sessão expirou. Faça login novamente."
  );


  window.location.href =
    "/login/";


  return true;

}



// ==========================================================
// EXIBIR USUÁRIO
// ==========================================================

function renderizarUsuario() {

  const nome =
    document.getElementById(
      "loggedUserName"
    );


  const setor =
    document.getElementById(
      "loggedUserSector"
    );


  if (nome) {

    nome.textContent =
      loggedUser.nome;

  }


  if (setor) {

    setor.textContent =
      loggedUser.setor;

  }

}



// ==========================================================
// FORMATAR DATA
// ==========================================================
//
// Recebe:
//
// 2026-08-21
//
// Retorna:
//
// 21/08/2026
//
// ==========================================================

function formatarData(
  data
) {

  if (!data) {

    return "-";

  }


  const partes =
    String(data)
      .substring(0, 10)
      .split("-");


  if (
    partes.length !== 3
  ) {

    return data;

  }


  return (
    `${partes[2]}/${partes[1]}/${partes[0]}`
  );

}



// ==========================================================
// CALCULAR DIAS ENTRE DATAS
// ==========================================================

function calcularDiasEntreDatas(
  inicio,
  fim
) {

  if (
    !inicio ||
    !fim
  ) {

    return 0;

  }


  const dataInicial =
    new Date(
      `${inicio}T00:00:00Z`
    );


  const dataFinal =
    new Date(
      `${fim}T00:00:00Z`
    );


  if (
    dataFinal <
    dataInicial
  ) {

    return 0;

  }


  const diferenca =
    dataFinal.getTime() -
    dataInicial.getTime();


  return (
    Math.floor(
      diferenca /
      86400000
    ) + 1
  );

}



// ==========================================================
// BUSCAR PERÍODO DE FÉRIAS
// ==========================================================

async function carregarFerias() {

  try {

    const response =
      await fetch(
        "/api/ferias/minhas",
        {

          method:
            "GET",

          headers:
            getAuthHeaders()

        }
      );


    if (
      tratarNaoAutorizado(
        response
      )
    ) {

      return;

    }


    const result =
      await response.json();


    if (!response.ok) {

      throw new Error(
        result.error ||
        "Não foi possível carregar as férias."
      );

    }


    periodoAtual =
      result.periodo;


    renderizarPeriodo();


  } catch (error) {

    console.error(
      "Erro ao carregar férias:",
      error
    );


    mostrarPeriodoVazio();

  }

}



// ==========================================================
// RENDERIZAR PERÍODO
// ==========================================================

function renderizarPeriodo() {

  // ========================================================
  // COLABORADOR SEM PERÍODO
  // ========================================================

  if (!periodoAtual) {

    mostrarPeriodoVazio();

    return;

  }


  const direito =
    Number(
      periodoAtual.dias_direito || 0
    );


  const usados =
    Number(
      periodoAtual.dias_usados || 0
    );


  const disponiveis =
    Number(
      periodoAtual.dias_disponiveis || 0
    );


  // ========================================================
  // CARDS
  // ========================================================

  document.getElementById(
    "saldoDisponivel"
  ).textContent =
    `${disponiveis} dias`;


  document.getElementById(
    "diasUsados"
  ).textContent =
    `${usados} dias`;


  document.getElementById(
    "proximoVencimento"
  ).textContent =
    formatarData(
      periodoAtual.data_vencimento
    );


  document.getElementById(
    "statusFerias"
  ).textContent =
    disponiveis > 0
      ? "Disponível"
      : "Sem saldo";


  document.getElementById(
    "statusFeriasDescricao"
  ).textContent =
    disponiveis > 0
      ? "Você possui dias disponíveis."
      : "Todo o saldo deste período foi utilizado.";



  // ========================================================
  // PERÍODO
  // ========================================================

  document.getElementById(
    "periodoAquisitivo"
  ).textContent =

    `${formatarData(
      periodoAtual.periodo_inicio
    )} - ${formatarData(
      periodoAtual.periodo_fim
    )}`;


  document.getElementById(
    "diasDireito"
  ).textContent =
    `${direito} dias`;


  document.getElementById(
    "periodoDiasUsados"
  ).textContent =
    `${usados} dias`;


  document.getElementById(
    "periodoInicio"
  ).textContent =
    formatarData(
      periodoAtual.periodo_inicio
    );


  document.getElementById(
    "timelineSaldo"
  ).textContent =
    `${disponiveis} dias disponíveis`;


  document.getElementById(
    "periodoVencimento"
  ).textContent =
    formatarData(
      periodoAtual.data_vencimento
    );


  document.getElementById(
    "periodoStatus"
  ).textContent =
    disponiveis > 0
      ? "Disponível"
      : "Utilizado";



  // ========================================================
  // RESUMO
  // ========================================================

  document.getElementById(
    "resumoDireito"
  ).textContent =
    `${direito} dias`;


  document.getElementById(
    "resumoUsados"
  ).textContent =
    `${usados} dias`;


  document.getElementById(
    "resumoDisponiveis"
  ).textContent =
    `${disponiveis} dias`;


  document.getElementById(
    "saldoModalInfo"
  ).textContent =
    `Saldo disponível: ${disponiveis} dias`;



  // ========================================================
  // HABILITAR / DESABILITAR SOLICITAÇÃO
  // ========================================================

  const possuiSaldo =
    disponiveis > 0;


  abrirModalBtn.disabled =
    !possuiSaldo;


  btnNovaSolicitacao.disabled =
    !possuiSaldo;

}



// ==========================================================
// PERÍODO NÃO CADASTRADO
// ==========================================================

function mostrarPeriodoVazio() {

  periodoAtual =
    null;


  document.getElementById(
    "saldoDisponivel"
  ).textContent =
    "0 dias";


  document.getElementById(
    "diasUsados"
  ).textContent =
    "0 dias";


  document.getElementById(
    "proximoVencimento"
  ).textContent =
    "-";


  document.getElementById(
    "statusFerias"
  ).textContent =
    "Indisponível";


  document.getElementById(
    "statusFeriasDescricao"
  ).textContent =
    "Nenhum período de férias cadastrado.";


  document.getElementById(
    "periodoAquisitivo"
  ).textContent =
    "-";


  document.getElementById(
    "periodoStatus"
  ).textContent =
    "Não cadastrado";


  document.getElementById(
    "saldoModalInfo"
  ).textContent =
    "Nenhum período disponível.";


  abrirModalBtn.disabled =
    true;


  btnNovaSolicitacao.disabled =
    true;

}



// ==========================================================
// CARREGAR SOLICITAÇÕES
// ==========================================================

async function carregarSolicitacoes() {

  try {

    const response =
      await fetch(
        "/api/ferias/solicitacoes",
        {

          method:
            "GET",

          headers:
            getAuthHeaders()

        }
      );


    if (
      tratarNaoAutorizado(
        response
      )
    ) {

      return;

    }


    const result =
      await response.json();


    if (!response.ok) {

      throw new Error(
        result.error ||
        "Não foi possível carregar as solicitações."
      );

    }


    solicitacoes =
      Array.isArray(result)
        ? result
        : [];


    renderizarSolicitacoes();


  } catch (error) {

    console.error(
      "Erro ao carregar solicitações:",
      error
    );


    solicitacoes =
      [];


    renderizarSolicitacoes();

  }

}



// ==========================================================
// STATUS
// ==========================================================

function getStatusLabel(
  status
) {

  if (
    status ===
    "aprovada"
  ) {

    return "Aprovada";

  }


  if (
    status ===
    "reprovada"
  ) {

    return "Reprovada";

  }


  return "Pendente";

}



function getStatusClass(
  status
) {

  if (
    status ===
    "aprovada"
  ) {

    return "success";

  }


  if (
    status ===
    "reprovada"
  ) {

    return "danger";

  }


  return "warning";

}



// ==========================================================
// RENDERIZAR SOLICITAÇÕES
// ==========================================================

function renderizarSolicitacoes() {

  const tabelaPendentes =
    document.getElementById(
      "tabelaSolicitacoes"
    );


  const tabelaHistorico =
    document.getElementById(
      "tabelaHistorico"
    );


  tabelaPendentes.innerHTML =
    "";


  tabelaHistorico.innerHTML =
    "";



  const pendentes =
    solicitacoes.filter(
      item =>
        item.status ===
        "pendente"
    );


  const historico =
    solicitacoes.filter(
      item =>
        item.status !==
        "pendente"
    );



  // ========================================================
  // PENDENTES
  // ========================================================

  if (
    pendentes.length ===
    0
  ) {

    tabelaPendentes.innerHTML = `

      <tr>

        <td
          colspan="4"
          style="
            text-align:center;
            color:#5f6f86;
            padding:24px;
          "
        >
          Nenhuma solicitação aguardando análise.
        </td>

      </tr>

    `;

  }


  pendentes.forEach(
    solicitacao => {

      const row =
        document.createElement(
          "tr"
        );


      row.innerHTML = `

        <td>

          ${formatarData(
            solicitacao.data_inicio
          )}

          -

          ${formatarData(
            solicitacao.data_fim
          )}

        </td>


        <td>

          ${solicitacao.quantidade_dias}

        </td>


        <td>

          <span
            class="
              status-pill
              ${getStatusClass(
                solicitacao.status
              )}
            "
          >

            ${getStatusLabel(
              solicitacao.status
            )}

          </span>

        </td>


        <td>

          ${formatarData(
            solicitacao.created_at
          )}

        </td>

      `;


      tabelaPendentes.appendChild(
        row
      );

    }
  );



  // ========================================================
  // HISTÓRICO
  // ========================================================

  if (
    historico.length ===
    0
  ) {

    tabelaHistorico.innerHTML = `

      <tr>

        <td
          colspan="4"
          style="
            text-align:center;
            color:#5f6f86;
            padding:24px;
          "
        >
          Nenhuma solicitação analisada.
        </td>

      </tr>

    `;

  }


  historico.forEach(
    solicitacao => {

      const row =
        document.createElement(
          "tr"
        );


      let observacao =
        solicitacao.observacoes ||
        "-";


      if (
        solicitacao.status ===
          "reprovada"
        &&
        solicitacao.motivo_reprovacao
      ) {

        observacao =
          solicitacao.motivo_reprovacao;

      }


      row.innerHTML = `

        <td>

          ${formatarData(
            solicitacao.data_inicio
          )}

          -

          ${formatarData(
            solicitacao.data_fim
          )}

        </td>


        <td>

          ${solicitacao.quantidade_dias}
          dias

        </td>


        <td>

          <span
            class="
              status-pill
              ${getStatusClass(
                solicitacao.status
              )}
            "
          >

            ${getStatusLabel(
              solicitacao.status
            )}

          </span>

        </td>


        <td>

          ${observacao}

        </td>

      `;


      tabelaHistorico.appendChild(
        row
      );

    }
  );

}



// ==========================================================
// ABRIR MODAL
// ==========================================================

function abrirModal() {

  if (!periodoAtual) {

    alert(
      "Você ainda não possui um período de férias disponível."
    );

    return;

  }


  formSolicitacao.reset();


  quantidadeDias.value =
    "0 dias";


  modal.classList.add(
    "open"
  );


  modal.setAttribute(
    "aria-hidden",
    "false"
  );


  dataInicio.focus();

}



// ==========================================================
// FECHAR MODAL
// ==========================================================

function fecharModal() {

  modal.classList.remove(
    "open"
  );


  modal.setAttribute(
    "aria-hidden",
    "true"
  );


  formSolicitacao.reset();


  quantidadeDias.value =
    "0 dias";


  limparMensagem();

}



// ==========================================================
// ATUALIZAR QUANTIDADE DE DIAS
// ==========================================================

function atualizarQuantidadeDias() {

  const total =
    calcularDiasEntreDatas(
      dataInicio.value,
      dataFim.value
    );


  quantidadeDias.value =
    `${total} ${
      total === 1
        ? "dia"
        : "dias"
    }`;

}



// ==========================================================
// ENVIAR SOLICITAÇÃO
// ==========================================================

formSolicitacao.addEventListener(
  "submit",
  async event => {

    event.preventDefault();


    if (
      !dataInicio.value ||
      !dataFim.value
    ) {

      mostrarMensagem(
        "Informe as datas de início e término.",
        "error"
      );

      return;

    }


    const totalDias =
      calcularDiasEntreDatas(
        dataInicio.value,
        dataFim.value
      );


    if (
      totalDias <= 0
    ) {

      mostrarMensagem(
        "O período informado é inválido.",
        "error"
      );

      return;

    }


    if (
      periodoAtual &&
      totalDias >
      periodoAtual.dias_disponiveis
    ) {

      mostrarMensagem(
        `Você possui somente ${periodoAtual.dias_disponiveis} dias disponíveis.`,
        "error"
      );

      return;

    }


    try {

      salvarSolicitacao.disabled =
        true;


      salvarSolicitacao.textContent =
        "Enviando...";


      const response =
        await fetch(
          "/api/ferias/solicitacoes",
          {

            method:
              "POST",

            headers:
              getAuthHeaders(
                true
              ),

            body:
              JSON.stringify({

                data_inicio:
                  dataInicio.value,

                data_fim:
                  dataFim.value,

                observacoes:
                  observacoes.value
                    .trim()

              })

          }
        );


      if (
        tratarNaoAutorizado(
          response
        )
      ) {

        return;

      }


      const result =
        await response.json();


      if (!response.ok) {

        throw new Error(
          result.error ||
          "Não foi possível enviar a solicitação."
        );

      }


      fecharModal();


      await carregarSolicitacoes();


      alert(
        "Solicitação de férias enviada com sucesso!"
      );


    } catch (error) {

      console.error(
        "Erro ao solicitar férias:",
        error
      );


      mostrarMensagem(
        error.message,
        "error"
      );


    } finally {

      salvarSolicitacao.disabled =
        false;


      salvarSolicitacao.textContent =
        "Enviar solicitação";

    }

  }
);



// ==========================================================
// MENSAGENS
// ==========================================================

function mostrarMensagem(
  mensagem,
  tipo
) {

  const container =
    document.getElementById(
      "formMessage"
    );


  container.textContent =
    mensagem;


  container.className =
    `form-message ${tipo}`;

}



function limparMensagem() {

  const container =
    document.getElementById(
      "formMessage"
    );


  container.textContent =
    "";


  container.className =
    "form-message";

}



// ==========================================================
// EVENTOS DAS DATAS
// ==========================================================

dataInicio.addEventListener(
  "change",
  atualizarQuantidadeDias
);


dataFim.addEventListener(
  "change",
  atualizarQuantidadeDias
);



// ==========================================================
// BOTÕES DO MODAL
// ==========================================================

abrirModalBtn.addEventListener(
  "click",
  abrirModal
);


btnNovaSolicitacao.addEventListener(
  "click",
  abrirModal
);


fecharModalBtn.addEventListener(
  "click",
  fecharModal
);


cancelarModalBtn.addEventListener(
  "click",
  fecharModal
);



// ==========================================================
// FECHAR CLICANDO FORA
// ==========================================================

modal.addEventListener(
  "click",
  event => {

    if (
      event.target ===
      modal
    ) {

      fecharModal();

    }

  }
);



// ==========================================================
// VOLTAR PARA TREINAMENTOS
// ==========================================================

document
  .getElementById(
    "voltarTreinamentos"
  )
  .addEventListener(
    "click",
    () => {

      window.location.href =
        "/treinamentos/";

    }
  );



// ==========================================================
// ESC
// ==========================================================

document.addEventListener(
  "keydown",
  event => {

    if (
      event.key ===
      "Escape"
      &&
      modal.classList.contains(
        "open"
      )
    ) {

      fecharModal();

    }

  }
);



// ==========================================================
// INICIALIZAÇÃO
// ==========================================================

async function initializeFerias() {

  // Verifica se realmente existe
  // um colaborador autenticado.

  const sessionValid =
    validarSessao();


  if (!sessionValid) {

    return;

  }


  renderizarUsuario();


  // Primeiro carregamos o período.
  await carregarFerias();


  // Depois as solicitações.
  await carregarSolicitacoes();

}



// ==========================================================
// INICIAR
// ==========================================================

document.addEventListener(
  "DOMContentLoaded",
  initializeFerias
);