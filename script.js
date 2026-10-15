// Interacciones de demostración para Biblioteca Escolar.
// Los registros se guardan en localStorage de este navegador; no hay servidor ni base de datos.
const sampleRecords = [
  { id: 1, student: "Lucía Gómez", book: "El principito — Antoine de Saint-Exupéry", date: "2026-10-01", dueDate: "2026-10-15", status: "Prestado" },
  { id: 2, student: "Mateo Ruiz", book: "Martín Fierro — José Hernández", date: "2026-09-22", dueDate: "2026-10-06", status: "Devuelto" }
];

const STORAGE_KEY = "itr-biblioteca-demo-records";
let currentAction = "prestamo";
let toastTimer;

function getRecords() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : sampleRecords;
  } catch (error) {
    return sampleRecords;
  }
}

function saveRecords(records) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (error) {
    // Si el navegador bloquea el almacenamiento, la interfaz igual puede usarse durante la sesión.
  }
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3000);
}

function closePanels() {
  document.getElementById("workspace").classList.add("hidden");
  document.getElementById("records-panel").classList.add("hidden");
}

function openWorkspace(action) {
  currentAction = action;
  const panel = document.getElementById("workspace");
  const title = document.getElementById("workspace-title");
  const dueWrap = document.getElementById("due-date-wrap");
  const submit = document.getElementById("loan-submit");
  const message = document.getElementById("form-message");
  document.getElementById("records-panel").classList.add("hidden");
  panel.classList.remove("hidden");
  message.textContent = "";

  if (action === "devolucion") {
    title.textContent = "Registrar devolución";
    dueWrap.classList.add("hidden");
    submit.textContent = "Confirmar devolución";
  } else {
    title.textContent = "Nuevo préstamo";
    dueWrap.classList.remove("hidden");
    submit.textContent = "Confirmar préstamo";
  }

  document.getElementById("loan-date").value = new Date().toISOString().slice(0, 10);
  panel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function openHistory() {
  closePanels();
  document.getElementById("records-panel").classList.remove("hidden");
  renderRecords();
  document.getElementById("records-panel").scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderRecords(filter = "") {
  const tbody = document.getElementById("records-body");
  const records = getRecords();
  const term = filter.trim().toLowerCase();
  const filtered = records.filter(record =>
    `${record.student} ${record.book} ${record.status}`.toLowerCase().includes(term)
  );
  tbody.innerHTML = "";

  if (!filtered.length) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 5;
    cell.textContent = "No se encontraron registros.";
    row.appendChild(cell);
    tbody.appendChild(row);
    return;
  }

  filtered.forEach(record => {
    const row = document.createElement("tr");
    [record.student, record.book, record.date].forEach(value => {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.appendChild(cell);
    });

    const statusCell = document.createElement("td");
    const badge = document.createElement("span");
    badge.className = "status" + (record.status === "Devuelto" ? " returned" : "");
    badge.textContent = record.status;
    statusCell.appendChild(badge);
    row.appendChild(statusCell);

    const actionCell = document.createElement("td");
    if (record.status === "Prestado") {
      const button = document.createElement("button");
      button.className = "small-button";
      button.type = "button";
      button.textContent = "Marcar devuelto";
      button.addEventListener("click", () => markReturned(record.id));
      actionCell.appendChild(button);
    } else {
      actionCell.textContent = "—";
    }
    row.appendChild(actionCell);
    tbody.appendChild(row);
  });
}

function markReturned(id) {
  const records = getRecords().map(record =>
    record.id === id ? { ...record, status: "Devuelto" } : record
  );
  saveRecords(records);
  renderRecords(document.getElementById("search-input").value);
  showToast("Devolución registrada en el prototipo.");
}

document.querySelectorAll("[data-action]").forEach(button => {
  button.addEventListener("click", () => {
    const action = button.dataset.action;
    if (action === "historial") openHistory();
    else openWorkspace(action);
  });
});

document.querySelectorAll(".nav-link").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".nav-link").forEach(link => link.classList.remove("active"));
    button.classList.add("active");
    const section = button.dataset.section;

    if (section === "inicio") {
      closePanels();
      document.getElementById("inicio").scrollIntoView({ behavior: "smooth" });
    } else if (section === "prestamos") {
      openWorkspace("prestamo");
    } else if (section === "historial") {
      openHistory();
    } else if (section === "libros") {
      document.getElementById("search-input").focus();
      showToast("Podés buscar libros por título, autor o código.");
      document.getElementById("search-panel")?.scrollIntoView({ behavior: "smooth" });
    } else if (section === "alumnos") {
      showToast("En esta versión de demostración, los alumnos se ingresan al registrar un préstamo.");
    }
  });
});

document.getElementById("search-form").addEventListener("submit", event => {
  event.preventDefault();
  const term = document.getElementById("search-input").value.trim();
  const message = document.getElementById("search-message");
  const allBooks = [
    "El principito — Antoine de Saint-Exupéry",
    "Martín Fierro — José Hernández",
    "El inventor de juegos — Pablo De Santis",
    "Ficciones — Jorge Luis Borges",
    "Don Quijote de la Mancha — Miguel de Cervantes"
  ];
  const matches = allBooks.filter(book => book.toLowerCase().includes(term.toLowerCase()));
  if (!term) {
    message.textContent = "Escribí un título, autor o código para buscar.";
    return;
  }
  message.textContent = matches.length
    ? `Resultado${matches.length > 1 ? "s" : ""}: ${matches.join(" · ")}`
    : "No encontramos ese libro en los datos de ejemplo. Probá con otro título o autor.";
  if (document.getElementById("records-panel").classList.contains("hidden") === false) {
    renderRecords(term);
  }
});

document.getElementById("loan-form").addEventListener("submit", event => {
  event.preventDefault();
  const student = document.getElementById("student-name").value.trim();
  const book = document.getElementById("book-select").value;
  const date = document.getElementById("loan-date").value;
  const dueDate = document.getElementById("due-date").value;
  const message = document.getElementById("form-message");

  if (!student || !book || !date) {
    message.textContent = "Completá el nombre, el libro y la fecha.";
    return;
  }
  if (currentAction === "prestamo" && dueDate && dueDate < date) {
    message.textContent = "La fecha prevista de devolución no puede ser anterior al préstamo.";
    return;
  }

  const records = getRecords();
  if (currentAction === "devolucion") {
    const existing = records.find(record => record.book === book && record.status === "Prestado");
    if (existing) {
      saveRecords(records.map(record => record.id === existing.id
        ? { ...record, status: "Devuelto", returnDate: date }
        : record));
      message.textContent = "Devolución registrada correctamente.";
    } else {
      records.unshift({ id: Date.now(), student, book, date, dueDate: "", status: "Devuelto" });
      saveRecords(records);
      message.textContent = "Se agregó una devolución de ejemplo al historial.";
    }
    showToast("Devolución registrada en el prototipo.");
  } else {
    records.unshift({ id: Date.now(), student, book, date, dueDate, status: "Prestado" });
    saveRecords(records);
    message.textContent = "Préstamo registrado correctamente en este navegador.";
    showToast("Préstamo registrado en el prototipo.");
  }
  document.getElementById("loan-form").reset();
  document.getElementById("loan-date").value = new Date().toISOString().slice(0, 10);
});

document.getElementById("close-workspace").addEventListener("click", () => {
  closePanels();
});
document.getElementById("close-records").addEventListener("click", closePanels);

// Fecha actual por defecto y carga inicial del historial.
document.getElementById("loan-date").value = new Date().toISOString().slice(0, 10);
saveRecords(getRecords());

// ---------- Menú de usuario ----------
const USER_KEY = "itr-biblioteca-demo-user";
const userMenu = document.getElementById("user-menu");
const userButton = document.getElementById("user-button");
const userDropdown = document.getElementById("user-dropdown");

function getUserName() {
  try { return localStorage.getItem(USER_KEY) || "Usuario"; } catch (error) { return "Usuario"; }
}

function setUserName(name) {
  const clean = name.trim().slice(0, 30) || "Usuario";
  try { localStorage.setItem(USER_KEY, clean); } catch (error) { /* sin almacenamiento */ }
  renderUser(clean);
}

function renderUser(name = getUserName()) {
  document.getElementById("user-name").textContent = name;
  document.getElementById("user-avatar").textContent = name.charAt(0).toUpperCase();
}

function toggleUserMenu(open) {
  const show = open ?? userDropdown.classList.contains("hidden");
  userDropdown.classList.toggle("hidden", !show);
  userButton.setAttribute("aria-expanded", String(show));
}

userButton.addEventListener("click", () => toggleUserMenu());
document.addEventListener("click", event => {
  if (!userMenu.contains(event.target)) toggleUserMenu(false);
});
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !userDropdown.classList.contains("hidden")) {
    toggleUserMenu(false);
    userButton.focus();
  }
});

userDropdown.addEventListener("click", event => {
  const item = event.target.closest("[data-user-action]");
  if (!item) return;
  toggleUserMenu(false);
  const action = item.dataset.userAction;

  if (action === "rename") {
    const name = prompt("¿Cómo querés que te llamemos?", getUserName());
    if (name !== null) {
      setUserName(name);
      showToast(`¡Hola, ${getUserName()}!`);
    }
  } else if (action === "history") {
    openHistory();
  } else if (action === "reset") {
    if (confirm("Se van a borrar los préstamos cargados y volver a los datos de ejemplo. ¿Continuar?")) {
      saveRecords(sampleRecords);
      if (!document.getElementById("records-panel").classList.contains("hidden")) renderRecords();
      showToast("Datos de ejemplo restablecidos.");
    }
  } else if (action === "logout") {
    try { localStorage.removeItem(USER_KEY); } catch (error) { /* sin almacenamiento */ }
    renderUser("Usuario");
    closePanels();
    window.scrollTo({ top: 0, behavior: "smooth" });
    showToast("Sesión cerrada.");
  }
});

renderUser();
