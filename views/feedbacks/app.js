// ==========================================================
// EVOLUA+
// FEEDBACKS - COLABORADOR
// APP.JS
// ==========================================================
//
// RESPONSABILIDADES:
//
// - validar sessão;
// - exibir usuário logado;
// - carregar feedbacks recebidos;
// - carregar solicitações feitas pelo colaborador;
// - alternar abas;
// - pesquisar;
// - filtrar por status;
// - abrir detalhes;
// - solicitar feedback;
// - responder feedback do Admin;
// - marcar feedback como ciente;
// - atualizar contadores;
// - navegação lateral;
// - logout.
//
// ==========================================================



// ==========================================================
// ==========================================================
// SESSÃO
// ==========================================================
// ==========================================================

const accessToken =
  localStorage.getItem(
    "access_token"
  );


let loggedUser =
  null;



// ==========================================================
// RECUPERAR USUÁRIO
// ==========================================================

try {

  const storedUser =
    localStorage.getItem(
      "usuario_logado"
    );


  if (
    storedUser
  ) {

    loggedUser =
      JSON.parse(
        storedUser
      );

  }

} catch (
  error
) {

  console.error(
    "Erro ao recuperar usuário salvo:",
    error
  );

}



// ==========================================================
// LIMPAR SESSÃO
// ==========================================================

function clearSession() {

  localStorage.removeItem(
    "access_token"
  );


  localStorage.removeItem(
    "usuario_logado"
  );

}



// ==========================================================
// VALIDAR SESSÃO
// ==========================================================

function validateSession() {

  if (
    !accessToken
    ||
    !loggedUser
  ) {

    window.location.href =
      "/login/";


    return false;

  }


  if (
    loggedUser.perfil !==
    "colaborador"
  ) {

    if (
      [
        "admin_principal",
        "admin_setor"
      ].includes(
        loggedUser.perfil
      )
    ) {

      window.location.href =
        "/admin/";

    } else {

      window.location.href =
        "/login/";

    }


    return false;

  }


  if (
    loggedUser.ativo ===
    false
  ) {

    clearSession();


    window.location.href =
      "/login/";


    return false;

  }


  return true;

}



// ==========================================================
// HEADERS AUTENTICADOS
// ==========================================================

function getAuthHeaders(
  includeJson = false
) {

  const headers = {

    Authorization:
      `Bearer ${accessToken}`

  };


  if (
    includeJson
  ) {

    headers[
      "Content-Type"
    ] =
      "application/json";

  }


  return headers;

}



// ==========================================================
// TRATAR 401
// ==========================================================

function handleUnauthorized(
  response
) {

  if (
    response.status !==
    401
  ) {

    return false;

  }


  clearSession();


  alert(
    "Sua sessão expirou. Faça login novamente."
  );


  window.location.href =
    "/login/";


  return true;

}



// ==========================================================
// JSON SEGURO
// ==========================================================

async function getResponseData(
  response
) {

  try {

    return await response.json();

  } catch (
    error
  ) {

    return {};

  }

}



// ==========================================================
// ==========================================================
// ESTADO DA TELA
// ==========================================================
// ==========================================================

let receivedFeedbacks =
  [];


let feedbackRequests =
  [];


let currentFeedback =
  null;


let activeTab =
  "received";



// ==========================================================
// ==========================================================
// UTILITÁRIOS
// ==========================================================
// ==========================================================

function escapeHTML(
  value
) {

  return String(
    value ?? ""
  )
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );

}



// ==========================================================
// INICIAIS
// ==========================================================

function getInitials(
  name
) {

  const parts =
    String(
      name || ""
    )
      .trim()
      .split(
        /\s+/
      )
      .filter(
        Boolean
      );


  if (
    parts.length ===
    0
  ) {

    return "--";

  }


  if (
    parts.length ===
    1
  ) {

    return parts[0]
      .substring(
        0,
        2
      )
      .toUpperCase();

  }


  return (
    parts[0][0]
    +
    parts[
      parts.length - 1
    ][0]
  )
    .toUpperCase();

}



// ==========================================================
// FORMATAR DATA
// ==========================================================

function formatDateTime(
  value
) {

  if (
    !value
  ) {

    return "-";

  }


  const date =
    new Date(
      value
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return "-";

  }


  return date.toLocaleString(
    "pt-BR",
    {

      dateStyle:
        "short",

      timeStyle:
        "short"

    }
  );

}



// ==========================================================
// RESUMIR TEXTO
// ==========================================================

function truncateText(
  value,
  limit = 180
) {

  const text =
    String(
      value || ""
    )
      .trim();


  if (
    text.length <=
    limit
  ) {

    return text;

  }


  return (
    text.substring(
      0,
      limit
    )
    +
    "..."
  );

}



// ==========================================================
// DEFINIR TEXTO
// ==========================================================

function setText(
  id,
  value
) {

  const element =
    document.getElementById(
      id
    );


  if (
    element
  ) {

    element.textContent =
      String(
        value
      );

  }

}



// ==========================================================
// MENSAGEM GLOBAL
// ==========================================================

function showGlobalMessage(
  message,
  type = "info"
) {

  const element =
    document.getElementById(
      "globalMessage"
    );


  if (
    !element
  ) {

    return;

  }


  element.textContent =
    message;


  element.className =
    `global-message show ${type}`;


  window.setTimeout(
    () => {

      element.className =
        "global-message";


      element.textContent =
        "";

    },
    4500
  );

}



// ==========================================================
// ==========================================================
// MODAIS
// ==========================================================
// ==========================================================

function openModal(
  modalId
) {

  const modal =
    document.getElementById(
      modalId
    );


  if (
    !modal
  ) {

    return;

  }


  modal.classList.add(
    "show"
  );


  document.body.classList.add(
    "modal-open"
  );

}



// ==========================================================
// FECHAR MODAL
// ==========================================================

function closeModal(
  modalId
) {

  const modal =
    document.getElementById(
      modalId
    );


  if (
    !modal
  ) {

    return;

  }


  modal.classList.remove(
    "show"
  );


  const anotherOpenModal =
    document.querySelector(
      ".modal-overlay.show"
    );


  if (
    !anotherOpenModal
  ) {

    document.body.classList.remove(
      "modal-open"
    );

  }


  if (
    [
      "feedbackDetailsModal",
      "requestDetailsModal"
    ].includes(
      modalId
    )
  ) {

    currentFeedback =
      null;

  }

}



// ==========================================================
// CLIQUE FORA
// ==========================================================

document
  .querySelectorAll(
    ".modal-overlay"
  )
  .forEach(
    modal => {

      modal.addEventListener(
        "click",
        event => {

          if (
            event.target ===
            modal
          ) {

            closeModal(
              modal.id
            );

          }

        }
      );

    }
  );



// ==========================================================
// ESC
// ==========================================================

document.addEventListener(
  "keydown",
  event => {

    if (
      event.key !==
      "Escape"
    ) {

      return;

    }


    const opened =
      document.querySelector(
        ".modal-overlay.show"
      );


    if (
      opened
    ) {

      closeModal(
        opened.id
      );

    }

  }
);



// ==========================================================
// ==========================================================
// USUÁRIO LOGADO
// ==========================================================
// ==========================================================

function renderLoggedUser() {

  if (
    !loggedUser
  ) {

    return;

  }


  setText(
    "userName",
    loggedUser.nome
    ||
    "Colaborador"
  );


  setText(
    "userRole",
    loggedUser.cargo
    ||
    "Colaborador"
  );


  setText(
    "userAvatar",
    getInitials(
      loggedUser.nome
    )
  );


  setText(
    "requestResponsibleText",
    loggedUser.setor

      ? `responsável do setor ${loggedUser.setor}`

      : "responsável do seu setor"
  );

}



// ==========================================================
// ==========================================================
// NAVEGAÇÃO SIDEBAR
// ==========================================================
// ==========================================================

document
  .querySelectorAll(
    "[data-link]"
  )
  .forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          const destination =
            button.dataset.link;


          if (
            destination
          ) {

            window.location.href =
              destination;

          }

        }
      );

    }
  );



// ==========================================================
// ==========================================================
// LABELS
// ==========================================================
// ==========================================================

function getTypeLabel(
  type
) {

  const labels = {

    positivo:
      "Positivo",

    desenvolvimento:
      "Desenvolvimento",

    atencao:
      "Atenção",

    solicitacao:
      "Solicitação"

  };


  return labels[
    type
  ]
  ||
  "Feedback";

}



// ==========================================================
// CLASSE DO TIPO
// ==========================================================

function getTypeClass(
  type
) {

  const classes = {

    positivo:
      "positive",

    desenvolvimento:
      "development",

    atencao:
      "attention",

    solicitacao:
      "request"

  };


  return classes[
    type
  ]
  ||
  "development";

}



// ==========================================================
// ÍCONE DO TIPO
// ==========================================================

function getTypeIcon(
  type
) {

  const icons = {

    positivo:
      "fa-thumbs-up",

    desenvolvimento:
      "fa-chart-line",

    atencao:
      "fa-triangle-exclamation",

    solicitacao:
      "fa-comment-dots"

  };


  return icons[
    type
  ]
  ||
  "fa-comments";

}



// ==========================================================
// STATUS
// ==========================================================

function getStatusLabel(
  status
) {

  const labels = {

    pendente:
      "Pendente",

    visualizado:
      "Visualizado",

    aguardando_resposta:
      "Aguardando sua resposta",

    respondido:
      "Respondido",

    ciente:
      "Ciente"

  };


  return labels[
    status
  ]
  ||
  status
  ||
  "-";

}



// ==========================================================
// CLASSE DO STATUS
// ==========================================================

function getStatusClass(
  status
) {

  const classes = {

    pendente:
      "pending",

    visualizado:
      "viewed",

    aguardando_resposta:
      "waiting",

    respondido:
      "answered",

    ciente:
      "acknowledged"

  };


  return classes[
    status
  ]
  ||
  "viewed";

}



// ==========================================================
// ASSUNTO
// ==========================================================

function getSubjectLabel(
  subject
) {

  const labels = {

    desempenho_geral:
      "Desempenho geral",

    desempenho_tecnico:
      "Desempenho técnico",

    comunicacao:
      "Comunicação",

    organizacao:
      "Organização",

    produtividade:
      "Produtividade",

    relacionamento:
      "Relacionamento",

    desenvolvimento_profissional:
      "Desenvolvimento profissional",

    outro:
      "Outro"

  };


  return labels[
    subject
  ]
  ||
  "Feedback";

}



// ==========================================================
// ==========================================================
// CARREGAR FEEDBACKS
// ==========================================================
// ==========================================================

async function loadFeedbacks() {

  showLoadingStates();


  try {

    const response =
      await fetch(
        "/api/feedbacks",
        {

          method:
            "GET",

          headers:
            getAuthHeaders()

        }
      );


    if (
      handleUnauthorized(
        response
      )
    ) {

      return;

    }


    const result =
      await getResponseData(
        response
      );


    if (
      !response.ok
    ) {

      throw new Error(

        result.error
        ||
        result.details
        ||
        "Não foi possível carregar seus feedbacks."

      );

    }


    receivedFeedbacks =
      Array.isArray(
        result.recebidos
      )
        ? result.recebidos
        : [];


    feedbackRequests =
      Array.isArray(
        result.solicitacoes
      )
        ? result.solicitacoes
        : [];


    if (
      result.usuario
    ) {

      loggedUser = {

        ...loggedUser,

        ...result.usuario

      };


      localStorage.setItem(
        "usuario_logado",
        JSON.stringify(
          loggedUser
        )
      );


      renderLoggedUser();

    }


    renderSummary(
      result.resumo
      ||
      null
    );


    renderFeedbackLists();


  } catch (
    error
  ) {

    console.error(
      "Erro ao carregar feedbacks:",
      error
    );


    receivedFeedbacks =
      [];


    feedbackRequests =
      [];


    renderSummary();


    renderFeedbackLists();


    showGlobalMessage(
      error.message,
      "error"
    );

  }

}



// ==========================================================
// LOADING
// ==========================================================

function showLoadingStates() {

  const received =
    document.getElementById(
      "receivedFeedbackList"
    );


  const requests =
    document.getElementById(
      "requestFeedbackList"
    );


  const html = `

    <div class="loading-state">

      <i class="fa-solid fa-spinner fa-spin"></i>

      <span>
        Carregando feedbacks...
      </span>

    </div>

  `;


  if (
    received
  ) {

    received.innerHTML =
      html;

  }


  if (
    requests
  ) {

    requests.innerHTML =
      html;

  }

}



// ==========================================================
// ==========================================================
// RESUMO
// ==========================================================
// ==========================================================

function renderSummary(
  backendSummary = null
) {

  let newFeedbacks;

  let waitingResponse;

  let pendingRequests;

  let answered;



  if (
    backendSummary
  ) {

    newFeedbacks =
      Number(
        backendSummary.novos
        ||
        0
      );


    waitingResponse =
      Number(
        backendSummary.aguardando_resposta
        ||
        0
      );


    pendingRequests =
      Number(
        backendSummary.solicitacoes_pendentes
        ||
        0
      );


    answered =
      Number(
        backendSummary.respondidos
        ||
        0
      );

  } else {

    newFeedbacks =
      receivedFeedbacks.filter(
        feedback =>
          feedback.status ===
          "pendente"
          &&
          !feedback.visualizado_em
      ).length;


    waitingResponse =
      receivedFeedbacks.filter(
        feedback =>
          feedback.status ===
          "aguardando_resposta"
      ).length;


    pendingRequests =
      feedbackRequests.filter(
        feedback =>
          [
            "pendente",
            "visualizado"
          ].includes(
            feedback.status
          )
      ).length;


    answered =
      [
        ...receivedFeedbacks,
        ...feedbackRequests
      ]
        .filter(
          feedback =>
            feedback.status ===
            "respondido"
        )
        .length;

  }


  setText(
    "summaryNewFeedbacks",
    newFeedbacks
  );


  setText(
    "summaryWaitingResponse",
    waitingResponse
  );


  setText(
    "summaryPendingRequests",
    pendingRequests
  );


  setText(
    "summaryAnswered",
    answered
  );


  setText(
    "receivedTabCounter",
    receivedFeedbacks.length
  );


  setText(
    "requestsTabCounter",
    feedbackRequests.length
  );


  // ========================================================
  // CONTADOR DA SIDEBAR
  // ========================================================

  setText(
    "feedbackMenuCounter",
    newFeedbacks
    +
    waitingResponse
  );

}



// ==========================================================
// ==========================================================
// ABAS
// ==========================================================
// ==========================================================

function switchFeedbackTab(
  tab
) {

  activeTab =
    tab;


  document
    .querySelectorAll(
      ".feedback-tab"
    )
    .forEach(
      button => {

        button.classList.toggle(
          "active",
          button.dataset.feedbackTab ===
          tab
        );

      }
    );


  const receivedContent =
    document.getElementById(
      "receivedFeedbacksContent"
    );


  const requestsContent =
    document.getElementById(
      "requestsFeedbacksContent"
    );


  if (
    receivedContent
  ) {

    receivedContent.classList.toggle(
      "active",
      tab ===
      "received"
    );

  }


  if (
    requestsContent
  ) {

    requestsContent.classList.toggle(
      "active",
      tab ===
      "requests"
    );

  }


  renderFeedbackLists();

}



// ==========================================================
// LISTENERS DAS ABAS
// ==========================================================

document
  .querySelectorAll(
    "[data-feedback-tab]"
  )
  .forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          switchFeedbackTab(
            button.dataset.feedbackTab
          );

        }
      );

    }
  );



// ==========================================================
// ==========================================================
// FILTROS
// ==========================================================
// ==========================================================

function getFilteredFeedbacks(
  list
) {

  const search =
    document
      .getElementById(
        "feedbackSearch"
      )
      ?.value
      ?.trim()
      ?.toLowerCase()
    ||
    "";


  const status =
    document
      .getElementById(
        "feedbackStatusFilter"
      )
      ?.value
    ||
    "";


  return list.filter(
    feedback => {

      if (
        status
        &&
        feedback.status !==
        status
      ) {

        return false;

      }


      if (
        !search
      ) {

        return true;

      }


      const content = [

        feedback.titulo,

        feedback.mensagem,

        feedback.resposta,

        getTypeLabel(
          feedback.tipo
        ),

        getSubjectLabel(
          feedback.assunto
        ),

        feedback.admin
          ?.nome,

        feedback.admin
          ?.cargo

      ]
        .join(
          " "
        )
        .toLowerCase();


      return content.includes(
        search
      );

    }
  );

}



// ==========================================================
// EVENTOS DOS FILTROS
// ==========================================================

document
  .getElementById(
    "feedbackSearch"
  )
  ?.addEventListener(
    "input",
    renderFeedbackLists
  );


document
  .getElementById(
    "feedbackStatusFilter"
  )
  ?.addEventListener(
    "change",
    renderFeedbackLists
  );



// ==========================================================
// ==========================================================
// RENDERIZAR AS DUAS LISTAS
// ==========================================================
// ==========================================================

function renderFeedbackLists() {

  renderReceivedFeedbacks();


  renderRequests();

}



// ==========================================================
// ==========================================================
// FEEDBACKS RECEBIDOS
// ==========================================================
// ==========================================================

function renderReceivedFeedbacks() {

  const container =
    document.getElementById(
      "receivedFeedbackList"
    );


  if (
    !container
  ) {

    return;

  }


  container.innerHTML =
    "";


  const filtered =
    getFilteredFeedbacks(
      receivedFeedbacks
    );


  if (
    filtered.length ===
    0
  ) {

    container.innerHTML = `

      <div class="empty-state">

        <i class="fa-solid fa-comments"></i>

        <strong>
          Nenhum feedback encontrado
        </strong>

        <span>
          Quando seu responsável enviar um feedback, ele aparecerá aqui.
        </span>

      </div>

    `;


    return;

  }


  filtered.forEach(
    feedback => {

      const card =
        createFeedbackCard(
          feedback,
          false
        );


      container.appendChild(
        card
      );

    }
  );

}



// ==========================================================
// ==========================================================
// SOLICITAÇÕES
// ==========================================================
// ==========================================================

function renderRequests() {

  const container =
    document.getElementById(
      "requestFeedbackList"
    );


  if (
    !container
  ) {

    return;

  }


  container.innerHTML =
    "";


  const filtered =
    getFilteredFeedbacks(
      feedbackRequests
    );


  if (
    filtered.length ===
    0
  ) {

    container.innerHTML = `

      <div class="empty-state">

        <i class="fa-solid fa-paper-plane"></i>

        <strong>
          Nenhuma solicitação encontrada
        </strong>

        <span>
          Você ainda não solicitou nenhum feedback ao seu responsável.
        </span>

      </div>

    `;


    return;

  }


  filtered.forEach(
    feedback => {

      const card =
        createFeedbackCard(
          feedback,
          true
        );


      container.appendChild(
        card
      );

    }
  );

}



// ==========================================================
// ==========================================================
// CRIAR CARD
// ==========================================================
// ==========================================================

function createFeedbackCard(
  feedback,
  isRequest = false
) {

  const card =
    document.createElement(
      "article"
    );


  card.className =
    "feedback-card";


  if (
    !isRequest
    &&
    !feedback.visualizado_em
  ) {

    card.classList.add(
      "unread"
    );

  }


  const type =
    isRequest
      ? "solicitacao"
      : feedback.tipo;


  const typeClass =
    getTypeClass(
      type
    );


  const responsibleName =
    feedback.admin
      ?.nome
    ||
    "Responsável";


  const responsibleRole =
    feedback.admin
      ?.cargo
    ||
    feedback.admin
      ?.setor
    ||
    "Administrador";


  const title =
    feedback.titulo
    ||
    "Feedback";


  const preview =
    feedback.mensagem
    ||
    "";


  card.innerHTML = `

    <div
      class="
        feedback-card-icon
        ${typeClass}
      "
    >

      <i
        class="
          fa-solid
          ${getTypeIcon(
            type
          )}
        "
      ></i>

    </div>


    <div class="feedback-card-content">

      <div class="feedback-card-top">

        <h3>

          ${escapeHTML(
            title
          )}

        </h3>


        ${
          isRequest

            ? `

                <span class="subject-badge">

                  ${escapeHTML(
                    getSubjectLabel(
                      feedback.assunto
                    )
                  )}

                </span>

              `

            : `

                <span
                  class="
                    type-badge
                    ${typeClass}
                  "
                >

                  ${escapeHTML(
                    getTypeLabel(
                      feedback.tipo
                    )
                  )}

                </span>

              `
        }


        <span
          class="
            status-badge
            ${getStatusClass(
              feedback.status
            )}
          "
        >

          ${escapeHTML(
            getStatusLabel(
              feedback.status
            )
          )}

        </span>

      </div>


      <p class="feedback-card-description">

        ${escapeHTML(
          truncateText(
            preview
          )
        )}

      </p>


      <div class="feedback-card-meta">

        <span>

          <i class="fa-solid fa-user-tie"></i>

          ${escapeHTML(
            responsibleName
          )}

          ${
            responsibleRole

              ? ` • ${escapeHTML(
                  responsibleRole
                )}`

              : ""
          }

        </span>


        <span>

          <i class="fa-regular fa-calendar"></i>

          ${formatDateTime(
            feedback.created_at
          )}

        </span>

      </div>

    </div>


    <div class="feedback-card-actions">

      <button
        type="button"
        class="secondary-button"
        data-open-feedback="${feedback.id}"
      >

        <i class="fa-regular fa-eye"></i>

        Ver detalhes

      </button>

    </div>

  `;


  card
    .querySelector(
      `[data-open-feedback="${feedback.id}"]`
    )
    .addEventListener(
      "click",
      () => {

        if (
          isRequest
        ) {

          openRequestDetails(
            feedback.id
          );

        } else {

          openFeedbackDetails(
            feedback.id
          );

        }

      }
    );


  return card;

}



// ==========================================================
// ==========================================================
// SOLICITAR FEEDBACK
// ==========================================================
// ==========================================================

function openRequestFeedbackModal() {

  const form =
    document.getElementById(
      "requestFeedbackForm"
    );


  if (
    form
  ) {

    form.reset();

  }


  setText(
    "requestResponsibleText",
    loggedUser?.setor

      ? `responsável do setor ${loggedUser.setor}`

      : "responsável do seu setor"
  );


  openModal(
    "requestFeedbackModal"
  );

}



// ==========================================================
// BOTÕES PARA ABRIR SOLICITAÇÃO
// ==========================================================

document
  .getElementById(
    "openRequestFeedbackButton"
  )
  ?.addEventListener(
    "click",
    openRequestFeedbackModal
  );


document
  .getElementById(
    "openRequestFeedbackSecondaryButton"
  )
  ?.addEventListener(
    "click",
    openRequestFeedbackModal
  );



// ==========================================================
// ENVIAR SOLICITAÇÃO
// ==========================================================

document
  .getElementById(
    "requestFeedbackForm"
  )
  ?.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      const button =
        document.getElementById(
          "submitFeedbackRequestButton"
        );


      if (
        button?.disabled
      ) {

        return;

      }


      const payload = {

        assunto:
          document
            .getElementById(
              "requestFeedbackSubject"
            )
            .value,

        titulo:
          document
            .getElementById(
              "requestFeedbackTitle"
            )
            .value
            .trim(),

        mensagem:
          document
            .getElementById(
              "requestFeedbackMessage"
            )
            .value
            .trim()

      };


      if (
        !payload.assunto
        ||
        !payload.titulo
        ||
        !payload.mensagem
      ) {

        alert(
          "Preencha todos os campos da solicitação."
        );


        return;

      }


      const original =
        button.innerHTML;


      button.disabled =
        true;


      button.innerHTML = `

        <i class="fa-solid fa-spinner fa-spin"></i>

        Enviando...

      `;


      try {

        const response =
          await fetch(
            "/api/feedbacks/solicitacoes",
            {

              method:
                "POST",

              headers:
                getAuthHeaders(
                  true
                ),

              body:
                JSON.stringify(
                  payload
                )

            }
          );


        if (
          handleUnauthorized(
            response
          )
        ) {

          return;

        }


        const result =
          await getResponseData(
            response
          );


        if (
          !response.ok
        ) {

          throw new Error(

            result.error
            ||
            result.details
            ||
            "Não foi possível enviar a solicitação."

          );

        }


        closeModal(
          "requestFeedbackModal"
        );


        await loadFeedbacks();


        switchFeedbackTab(
          "requests"
        );


        showGlobalMessage(
          result.message
          ||
          "Solicitação de feedback enviada com sucesso.",
          "success"
        );


      } catch (
        error
      ) {

        console.error(
          "Erro ao solicitar feedback:",
          error
        );


        alert(
          error.message
        );


      } finally {

        button.disabled =
          false;


        button.innerHTML =
          original;

      }

    }
  );



// ==========================================================
// ==========================================================
// ABRIR FEEDBACK RECEBIDO
// ==========================================================
// ==========================================================

async function openFeedbackDetails(
  feedbackId
) {

  const content =
    document.getElementById(
      "feedbackDetailsContent"
    );


  if (
    !content
  ) {

    return;

  }


  content.innerHTML = `

    <div class="loading-state">

      <i class="fa-solid fa-spinner fa-spin"></i>

      <span>
        Carregando feedback...
      </span>

    </div>

  `;


  openModal(
    "feedbackDetailsModal"
  );


  try {

    const response =
      await fetch(
        `/api/feedbacks/${feedbackId}`,
        {

          method:
            "GET",

          headers:
            getAuthHeaders()

        }
      );


    if (
      handleUnauthorized(
        response
      )
    ) {

      return;

    }


    const result =
      await getResponseData(
        response
      );


    if (
      !response.ok
    ) {

      throw new Error(

        result.error
        ||
        "Não foi possível abrir o feedback."

      );

    }


    currentFeedback =
      result;


    updateFeedbackInLocalLists(
      result
    );


    renderSummary();


    renderReceivedFeedbacks();


    renderFeedbackDetailsContent(
      result
    );


  } catch (
    error
  ) {

    console.error(
      "Erro ao abrir feedback:",
      error
    );


    content.innerHTML = `

      <div class="empty-state">

        <i class="fa-solid fa-triangle-exclamation"></i>

        <strong>
          Não foi possível abrir o feedback
        </strong>

        <span>

          ${escapeHTML(
            error.message
          )}

        </span>

      </div>

    `;

  }

}



// ==========================================================
// RENDER DETALHES RECEBIDOS
// ==========================================================

function renderFeedbackDetailsContent(
  feedback
) {

  const content =
    document.getElementById(
      "feedbackDetailsContent"
    );


  if (
    !content
  ) {

    return;

  }


  const admin =
    feedback.admin
    ||
    {};


  const typeClass =
    getTypeClass(
      feedback.tipo
    );


  let actionNotice =
    "";


  let buttons =
    "";


  if (
    feedback.status ===
    "aguardando_resposta"
  ) {

    actionNotice = `

      <div
        class="
          feedback-action-notice
          waiting
        "
      >

        <i class="fa-solid fa-reply"></i>

        <span>
          Este feedback exige uma resposta sua.
        </span>

      </div>

    `;


    buttons = `

      <button
        type="button"
        class="primary-button"
        id="respondCurrentFeedbackButton"
      >

        <i class="fa-solid fa-reply"></i>

        Responder feedback

      </button>

    `;

  } else if (
    feedback.status ===
    "respondido"
  ) {

    actionNotice = `

      <div
        class="
          feedback-action-notice
          success
        "
      >

        <i class="fa-solid fa-circle-check"></i>

        <span>
          Sua resposta foi enviada.
        </span>

      </div>

    `;

  } else if (
    feedback.status ===
    "ciente"
  ) {

    actionNotice = `

      <div
        class="
          feedback-action-notice
          success
        "
      >

        <i class="fa-solid fa-check"></i>

        <span>
          Você já confirmou ciência deste feedback.
        </span>

      </div>

    `;

  } else if (
    feedback.exige_resposta ===
    false
  ) {

    actionNotice = `

      <div
        class="
          feedback-action-notice
          info
        "
      >

        <i class="fa-solid fa-circle-info"></i>

        <span>
          Este feedback não exige resposta. Confirme que está ciente após a leitura.
        </span>

      </div>

    `;


    buttons = `

      <button
        type="button"
        class="primary-button"
        id="acknowledgeCurrentFeedbackButton"
      >

        <i class="fa-solid fa-check"></i>

        Marcar como ciente

      </button>

    `;

  }


  content.innerHTML = `

    <div class="feedback-detail-header">

      <div class="feedback-detail-type">

        <span
          class="
            type-badge
            ${typeClass}
          "
        >

          ${escapeHTML(
            getTypeLabel(
              feedback.tipo
            )
          )}

        </span>

      </div>


      <h2>

        ${escapeHTML(
          feedback.titulo
          ||
          "Feedback"
        )}

      </h2>


      <div class="feedback-detail-meta">

        <span>

          <i class="fa-solid fa-user-tie"></i>

          ${escapeHTML(
            admin.nome
            ||
            "Responsável"
          )}

        </span>


        <span>

          <i class="fa-solid fa-building"></i>

          ${escapeHTML(
            admin.setor
            ||
            loggedUser?.setor
            ||
            "-"
          )}

        </span>


        <span>

          <i class="fa-regular fa-calendar"></i>

          ${formatDateTime(
            feedback.created_at
          )}

        </span>


        <span
          class="
            status-badge
            ${getStatusClass(
              feedback.status
            )}
          "
        >

          ${escapeHTML(
            getStatusLabel(
              feedback.status
            )
          )}

        </span>

      </div>

    </div>


    <div class="feedback-message-box">

      <span>
        Feedback recebido
      </span>


      <p>

        ${escapeHTML(
          feedback.mensagem
          ||
          ""
        )}

      </p>

    </div>


    ${
      feedback.resposta

        ? `

            <div class="feedback-response-box">

              <span>
                Sua resposta
              </span>


              <p>

                ${escapeHTML(
                  feedback.resposta
                )}

              </p>

            </div>

          `

        : ""
    }


    ${actionNotice}


    ${
      buttons

        ? `

            <div class="feedback-detail-actions">

              ${buttons}

            </div>

          `

        : ""
    }

  `;


  document
    .getElementById(
      "respondCurrentFeedbackButton"
    )
    ?.addEventListener(
      "click",
      () => {

        openRespondFeedbackModal(
          feedback
        );

      }
    );


  document
    .getElementById(
      "acknowledgeCurrentFeedbackButton"
    )
    ?.addEventListener(
      "click",
      () => {

        prepareAcknowledge(
          feedback.id
        );

      }
    );

}



// ==========================================================
// ==========================================================
// RESPONDER FEEDBACK DO ADMIN
// ==========================================================
// ==========================================================

function openRespondFeedbackModal(
  feedback
) {

  document.getElementById(
    "respondFeedbackId"
  ).value =
    feedback.id;


  document.getElementById(
    "respondFeedbackText"
  ).value =
    "";


  const context =
    document.getElementById(
      "respondFeedbackContext"
    );


  if (
    context
  ) {

    context.innerHTML = `

      <strong>

        ${escapeHTML(
          feedback.titulo
          ||
          "Feedback"
        )}

      </strong>


      <p>

        ${escapeHTML(
          truncateText(
            feedback.mensagem,
            300
          )
        )}

      </p>

    `;

  }


  openModal(
    "respondFeedbackModal"
  );

}



// ==========================================================
// ENVIAR RESPOSTA
// ==========================================================

document
  .getElementById(
    "respondFeedbackForm"
  )
  ?.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      const feedbackId =
        document.getElementById(
          "respondFeedbackId"
        ).value;


      const responseText =
        document
          .getElementById(
            "respondFeedbackText"
          )
          .value
          .trim();


      if (
        !feedbackId
        ||
        !responseText
      ) {

        alert(
          "Digite sua resposta."
        );


        return;

      }


      const button =
        document.getElementById(
          "submitFeedbackResponseButton"
        );


      if (
        button.disabled
      ) {

        return;

      }


      const original =
        button.innerHTML;


      button.disabled =
        true;


      button.innerHTML = `

        <i class="fa-solid fa-spinner fa-spin"></i>

        Enviando...

      `;


      try {

        const response =
          await fetch(
            `/api/feedbacks/${feedbackId}/responder`,
            {

              method:
                "PATCH",

              headers:
                getAuthHeaders(
                  true
                ),

              body:
                JSON.stringify({

                  resposta:
                    responseText

                })

            }
          );


        if (
          handleUnauthorized(
            response
          )
        ) {

          return;

        }


        const result =
          await getResponseData(
            response
          );


        if (
          !response.ok
        ) {

          throw new Error(

            result.error
            ||
            "Não foi possível enviar sua resposta."

          );

        }


        closeModal(
          "respondFeedbackModal"
        );


        closeModal(
          "feedbackDetailsModal"
        );


        await loadFeedbacks();


        showGlobalMessage(
          result.message
          ||
          "Resposta enviada com sucesso.",
          "success"
        );


      } catch (
        error
      ) {

        console.error(
          "Erro ao responder feedback:",
          error
        );


        alert(
          error.message
        );


      } finally {

        button.disabled =
          false;


        button.innerHTML =
          original;

      }

    }
  );



// ==========================================================
// ==========================================================
// ABRIR SOLICITAÇÃO DO COLABORADOR
// ==========================================================
// ==========================================================

async function openRequestDetails(
  feedbackId
) {

  const content =
    document.getElementById(
      "requestDetailsContent"
    );


  if (
    !content
  ) {

    return;

  }


  content.innerHTML = `

    <div class="loading-state">

      <i class="fa-solid fa-spinner fa-spin"></i>

      <span>
        Carregando solicitação...
      </span>

    </div>

  `;


  openModal(
    "requestDetailsModal"
  );


  try {

    const response =
      await fetch(
        `/api/feedbacks/${feedbackId}`,
        {

          method:
            "GET",

          headers:
            getAuthHeaders()

        }
      );


    if (
      handleUnauthorized(
        response
      )
    ) {

      return;

    }


    const result =
      await getResponseData(
        response
      );


    if (
      !response.ok
    ) {

      throw new Error(

        result.error
        ||
        "Não foi possível abrir a solicitação."

      );

    }


    currentFeedback =
      result;


    updateFeedbackInLocalLists(
      result
    );


    renderSummary();


    renderRequests();


    renderRequestDetailsContent(
      result
    );


  } catch (
    error
  ) {

    console.error(
      "Erro ao abrir solicitação:",
      error
    );


    content.innerHTML = `

      <div class="empty-state">

        <i class="fa-solid fa-triangle-exclamation"></i>

        <strong>
          Não foi possível abrir a solicitação
        </strong>

        <span>

          ${escapeHTML(
            error.message
          )}

        </span>

      </div>

    `;

  }

}



// ==========================================================
// RENDER SOLICITAÇÃO
// ==========================================================

function renderRequestDetailsContent(
  feedback
) {

  const content =
    document.getElementById(
      "requestDetailsContent"
    );


  if (
    !content
  ) {

    return;

  }


  const admin =
    feedback.admin
    ||
    {};


  let notice =
    "";


  let button =
    "";


  if (
    [
      "pendente",
      "visualizado"
    ].includes(
      feedback.status
    )
  ) {

    notice = `

      <div
        class="
          feedback-action-notice
          waiting
        "
      >

        <i class="fa-regular fa-clock"></i>

        <span>
          Sua solicitação ainda está aguardando resposta do responsável.
        </span>

      </div>

    `;

  }


  if (
    feedback.status ===
    "respondido"
  ) {

    notice = `

      <div
        class="
          feedback-action-notice
          info
        "
      >

        <i class="fa-solid fa-comment-dots"></i>

        <span>
          Seu responsável respondeu à solicitação.
        </span>

      </div>

    `;


    button = `

      <button
        type="button"
        class="primary-button"
        id="acknowledgeRequestButton"
      >

        <i class="fa-solid fa-check"></i>

        Marcar como ciente

      </button>

    `;

  }


  if (
    feedback.status ===
    "ciente"
  ) {

    notice = `

      <div
        class="
          feedback-action-notice
          success
        "
      >

        <i class="fa-solid fa-check"></i>

        <span>
          Você já confirmou ciência da resposta recebida.
        </span>

      </div>

    `;

  }


  content.innerHTML = `

    <div class="feedback-detail-header">

      <div class="feedback-detail-type">

        <span class="subject-badge">

          ${escapeHTML(
            getSubjectLabel(
              feedback.assunto
            )
          )}

        </span>

      </div>


      <h2>

        ${escapeHTML(
          feedback.titulo
          ||
          "Solicitação de feedback"
        )}

      </h2>


      <div class="feedback-detail-meta">

        <span>

          <i class="fa-solid fa-user-tie"></i>

          ${escapeHTML(
            admin.nome
            ||
            "Responsável do setor"
          )}

        </span>


        <span>

          <i class="fa-regular fa-calendar"></i>

          ${formatDateTime(
            feedback.created_at
          )}

        </span>


        <span
          class="
            status-badge
            ${getStatusClass(
              feedback.status
            )}
          "
        >

          ${escapeHTML(
            getStatusLabel(
              feedback.status
            )
          )}

        </span>

      </div>

    </div>


    <div class="feedback-message-box">

      <span>
        Sua solicitação
      </span>


      <p>

        ${escapeHTML(
          feedback.mensagem
          ||
          ""
        )}

      </p>

    </div>


    ${
      feedback.resposta

        ? `

            <div class="feedback-response-box">

              <span>
                Resposta do responsável
              </span>


              <p>

                ${escapeHTML(
                  feedback.resposta
                )}

              </p>

            </div>

          `

        : ""
    }


    ${notice}


    ${
      button

        ? `

            <div class="feedback-detail-actions">

              ${button}

            </div>

          `

        : ""
    }

  `;


  document
    .getElementById(
      "acknowledgeRequestButton"
    )
    ?.addEventListener(
      "click",
      () => {

        prepareAcknowledge(
          feedback.id
        );

      }
    );

}



// ==========================================================
// ==========================================================
// ATUALIZAR OBJETO LOCAL
// ==========================================================
// ==========================================================

function updateFeedbackInLocalLists(
  updated
) {

  receivedFeedbacks =
    receivedFeedbacks.map(
      feedback => {

        if (
          String(
            feedback.id
          )
          ===
          String(
            updated.id
          )
        ) {

          return {

            ...feedback,

            ...updated

          };

        }


        return feedback;

      }
    );


  feedbackRequests =
    feedbackRequests.map(
      feedback => {

        if (
          String(
            feedback.id
          )
          ===
          String(
            updated.id
          )
        ) {

          return {

            ...feedback,

            ...updated

          };

        }


        return feedback;

      }
    );

}



// ==========================================================
// ==========================================================
// CONFIRMAR CIÊNCIA
// ==========================================================
// ==========================================================

function prepareAcknowledge(
  feedbackId
) {

  document.getElementById(
    "acknowledgeFeedbackId"
  ).value =
    feedbackId;


  openModal(
    "acknowledgeModal"
  );

}



// ==========================================================
// MARCAR COMO CIENTE
// ==========================================================

document
  .getElementById(
    "confirmAcknowledgeButton"
  )
  ?.addEventListener(
    "click",
    async event => {

      const feedbackId =
        document.getElementById(
          "acknowledgeFeedbackId"
        ).value;


      if (
        !feedbackId
      ) {

        return;

      }


      const button =
        event.currentTarget;


      if (
        button.disabled
      ) {

        return;

      }


      const original =
        button.innerHTML;


      button.disabled =
        true;


      button.innerHTML = `

        <i class="fa-solid fa-spinner fa-spin"></i>

        Salvando...

      `;


      try {

        const response =
          await fetch(
            `/api/feedbacks/${feedbackId}/ciente`,
            {

              method:
                "PATCH",

              headers:
                getAuthHeaders(
                  true
                ),

              body:
                JSON.stringify({})

            }
          );


        if (
          handleUnauthorized(
            response
          )
        ) {

          return;

        }


        const result =
          await getResponseData(
            response
          );


        if (
          !response.ok
        ) {

          throw new Error(

            result.error
            ||
            "Não foi possível confirmar ciência."

          );

        }


        closeModal(
          "acknowledgeModal"
        );


        closeModal(
          "feedbackDetailsModal"
        );


        closeModal(
          "requestDetailsModal"
        );


        await loadFeedbacks();


        showGlobalMessage(
          result.message
          ||
          "Feedback marcado como ciente.",
          "success"
        );


      } catch (
        error
      ) {

        console.error(
          "Erro ao marcar feedback como ciente:",
          error
        );


        alert(
          error.message
        );


      } finally {

        button.disabled =
          false;


        button.innerHTML =
          original;

      }

    }
  );



// ==========================================================
// ==========================================================
// ATUALIZAR
// ==========================================================
// ==========================================================

document
  .getElementById(
    "refreshFeedbacksButton"
  )
  ?.addEventListener(
    "click",
    loadFeedbacks
  );



// ==========================================================
// ==========================================================
// LOGOUT
// ==========================================================
// ==========================================================

function logout() {

  const confirmed =
    confirm(
      "Deseja sair do Evolua+?"
    );


  if (
    !confirmed
  ) {

    return;

  }


  clearSession();


  window.location.href =
    "/login/";

}



// ==========================================================
// BOTÃO LOGOUT
// ==========================================================

document
  .getElementById(
    "logoutButton"
  )
  ?.addEventListener(
    "click",
    logout
  );



// ==========================================================
// ==========================================================
// INICIALIZAÇÃO
// ==========================================================
// ==========================================================

async function initializeFeedbacks() {

  // ========================================================
  // 1. VALIDAR SESSÃO
  // ========================================================

  if (
    !validateSession()
  ) {

    return;

  }


  // ========================================================
  // 2. USUÁRIO
  // ========================================================

  renderLoggedUser();


  // ========================================================
  // 3. ABA INICIAL
  // ========================================================

  switchFeedbackTab(
    "received"
  );


  // ========================================================
  // 4. DADOS
  // ========================================================

  await loadFeedbacks();

}



// ==========================================================
// INICIAR
// ==========================================================

if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    initializeFeedbacks
  );

} else {

  initializeFeedbacks();

}



// ==========================================================
// ==========================================================
// FUNÇÕES UTILIZADAS PELO HTML
// ==========================================================
// ==========================================================

window.openModal =
  openModal;


window.closeModal =
  closeModal;


window.openRequestFeedbackModal =
  openRequestFeedbackModal;


window.openFeedbackDetails =
  openFeedbackDetails;


window.openRequestDetails =
  openRequestDetails;


window.logout =
  logout;


// ==========================================================
// FIM
// ==========================================================