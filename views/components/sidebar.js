(() => {
    const sidebar = document.getElementById("sidebar");
    if (!sidebar) return;

    const currentPage = document.body.dataset.page || "";

    const items = [
        {
            id: "dashboard",
            label: "Dashboard",
            icon: "fa-house",
            href: "/dashboard/"
        },
        {
            id: "ferias",
            label: "Férias",
            icon: "fa-calendar-days",
            href: "/ferias/"
        },
        {
            id: "ponto",
            label: "Ponto",
            icon: "fa-clock",
            href: "/ponto/"
        },
        {
            id: "treinamentos",
            label: "Treinamentos",
            icon: "fa-graduation-cap",
            href: "/treinamentos/"
        },
        
        {
            id: "feedbacks",
            label: "Feedbacks",
            icon: "fa-comments",
            href: "/feedbacks/",
            counter: true
        }
    ];

    const menu = items.map(item => {
        const classes = ["menu-item"];

        if (item.id === currentPage) {
            classes.push("active");
        }

        if (item.disabled) {
            classes.push("disabled");
        }

        const counter = item.counter
            ? '<span class="menu-counter" id="feedbackMenuCounter">0</span>'
            : "";

        if (item.disabled) {
            return `
                <button
                    type="button"
                    class="${classes.join(" ")}"
                    disabled
                >
                    <i class="fa-solid ${item.icon}"></i>
                    <span>${item.label}</span>
                    ${counter}
                </button>
            `;
        }

        return `
            <button
                type="button"
                class="${classes.join(" ")}"
                data-link="${item.href}"
            >
                <i class="fa-solid ${item.icon}"></i>
                <span>${item.label}</span>
                ${counter}
            </button>
        `;
    }).join("");

    sidebar.className = "sidebar";

    sidebar.innerHTML = `
        <div class="logo">
            <div class="logo-icon">
                <i class="fa-solid fa-chart-line"></i>
            </div>

            <div>
                <h2>Evolua+</h2>
                <span>Portal de Carreiras</span>
            </div>
        </div>

        <div class="portal-badge">
            <i class="fa-solid fa-user"></i>

            <div>
                <strong>COLABORADOR</strong>
                <span>Área do colaborador</span>
            </div>
        </div>

        <nav class="menu">
            ${menu}
        </nav>

        <div class="sidebar-user">
            <div class="avatar" id="userAvatar">
                --
            </div>

            <div class="user-info">
                <strong id="userName">
                    Carregando...
                </strong>

                <span id="userRole">
                    Colaborador
                </span>
            </div>

            <button
                type="button"
                class="logout-button"
                id="logoutButton"
                title="Sair"
            >
                <i class="fa-solid fa-arrow-right-from-bracket"></i>
            </button>
        </div>
    `;

    sidebar
        .querySelectorAll("[data-link]")
        .forEach(item => {
            item.addEventListener("click", () => {
                const destination = item.dataset.link;

                if (destination) {
                    window.location.href = destination;
                }
            });
        });
})();