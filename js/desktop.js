const KEY = "nord-desktop-v2";

const ROLES = [
  ["finance", "Провожу платежи и работаю со счетами"],
  ["sales", "Работаю с договорами и клиентами"],
  ["hr", "Занимаюсь наймом и данными сотрудников"],
  ["logistics", "Организую доставки и работу с перевозчиками"],
  ["pm", "Веду проекты и переписку с подрядчиками"],
  ["other", "Другое / ничего из этого"]
];

const APPS = [
  { id: "mail", title: "Почта", icon: "assets/icons/icon-mail.png" },
  { id: "messenger", title: "Сообщения", icon: "assets/icons/icon-messenger.png" },
  { id: "browser", title: "Браузер", icon: "assets/icons/icon-browser.png" },
  { id: "files", title: "Файлы", icon: "assets/icons/icon-files.png" },
  { id: "calendar", title: "Календарь", icon: "assets/icons/icon-calendar.png" },
  { id: "security", title: "Безопасность", icon: "assets/icons/icon-security.png" },
  { id: "portal", title: "Портал", icon: "assets/icons/icon-portal.png" },
  { id: "settings", title: "Настройки", icon: "assets/icons/icon-settings.png", desk: false },
  { id: "review", title: "Разбор", icon: "assets/icons/icon-security.png", desk: false }
];

const PEOPLE = {
  misha: { name: "Миша Соколов", role: "Продажи", city: "Москва", avatar: "assets/people/misha.png" },
  director: { name: "Ирина Лебедева", role: "Генеральный директор", city: "в пути", avatar: "assets/people/director.png" },
  assistant: { name: "Павел Орлов", role: "Ассистент директора", city: "Москва", avatar: "assets/people/assistant.png" },
  colleague: { name: "Марина Котова", role: "Проектный офис", city: "Казань", avatar: "assets/people/colleague.png" },
  it: { name: "Сергей Плотников", role: "IT", city: "Москва", avatar: "assets/people/it.png" },
  hr: { name: "Ольга Репина", role: "Кадры", city: "Москва", avatar: "assets/people/hr.png" }
};

const MAILS = [
  {
    id: "director",
    person: "director",
    subject: "Срочно, пока есть связь",
    time: "10:14",
    preview: "assets/docs/preview-invoice.png",
    body: [
      "Я уже в самолёте, связь будет обрываться.",
      "Оплати сегодня счёт УЧ-1042. Реквизиты прислали отдельным письмом, сумма 186 400.",
      "Никому не пересылай и не звони — разберёмся после посадки."
    ]
  },
  {
    id: "invoice",
    sender: "Северный контур",
    subject: "Счёт УЧ-1042",
    time: "09:41",
    preview: "assets/docs/preview-invoice.png",
    body: [
      "Коллеги, направляем счёт УЧ-1042 на 186 400.",
      "Реквизиты изменились. Актуальные — в этом письме."
    ]
  },
  {
    id: "it",
    person: "it",
    subject: "Обновление клиента",
    time: "вчера",
    body: [
      "Сегодня вечером выйдет обновление.",
      "Ставьте его только из портала. Файл из письма запускать не нужно."
    ]
  }
];

const THREADS = {
  misha: [{ who: "misha", text: "Глянь почту. Там срочное от директора. Я бы сам не платил, пока реквизиты не сверены." }],
  director: [{ who: "director", text: "На связи буду урывками. Если что — пиши Павлу." }],
  assistant: [{ who: "assistant", text: "Директор просила не беспокоить её в полёте. Если письмо про оплату — пришлите тему, сверю по своим каналам." }],
  colleague: [{ who: "colleague", text: "Я на планёрке в 10:00. Если что-то срочное — лучше своими словами, без ссылок." }],
  it: [{ who: "it", text: "Обновление ставим с портала. Вложение «от IT» из почты можно не открывать." }],
  hr: [{ who: "hr", text: "Карту для зарплаты подтверждаем только в кабинете на портале. Форма из письма не нужна." }]
};

const FILES = [
  { name: "Счёт УЧ-1042", icon: "assets/files/file-pdf.png", preview: "assets/docs/preview-invoice.png" },
  { name: "Форма кадров", icon: "assets/files/file-pdf.png", preview: "assets/docs/preview-form.png" },
  { name: "Регламент платежей", icon: "assets/files/file-doc.png", note: "Реквизиты сверяют с договором на портале. Письмо с «новыми реквизитами» само по себе ничего не меняет." },
  { name: "Клиент обновления", icon: "assets/files/file-exe.png", note: "Это установщик не с портала. В тренажёре он не запускается." }
];

const state = load();
const wins = new Map();
let z = 20;
let activeMail = "director";
let activeChat = "misha";
let portalCard = "check";

function fresh() {
  return {
    name: "",
    mfa: false,
    mfaReminded: false,
    roles: [],
    installed: null,
    onboardingDone: false,
    passwordLabel: "",
    read: { director: false, invoice: false, it: true },
    flagged: {},
    reviewSeen: false,
    chat: {},
    ledger: []
  };
}

function load() {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) return Object.assign(fresh(), JSON.parse(raw));
  } catch (err) { /* keep the fresh desk */ }
  return fresh();
}

function persist() {
  sessionStorage.setItem(KEY, JSON.stringify(state));
}

function appById(id) {
  return APPS.find((app) => app.id === id);
}

function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text != null) node.textContent = text;
  return node;
}

function img(src, alt) {
  const node = document.createElement("img");
  node.src = src;
  node.alt = alt || "";
  return node;
}

function unreadCount() {
  if (state.letters) return state.letters.filter((letter) => letter.folder === "inbox" && !letter.read).length;
  return MAILS.filter((mail) => !state.read[mail.id]).length;
}

function mount() {
  const icons = document.getElementById("icons");
  APPS.filter((app) => app.desk !== false).forEach((app) => {
    const button = el("button", "dicon");
    button.type = "button";
    button.dataset.app = app.id;
    const glyph = el("span", "glyph");
    glyph.appendChild(img(app.icon, app.title));
    if (app.id === "mail") {
      const badge = el("i", "badge");
      badge.id = "mailBadge";
      glyph.appendChild(badge);
    }
    button.appendChild(glyph);
    button.appendChild(el("span", "label", app.title));
    button.addEventListener("click", () => openApp(app.id));
    icons.appendChild(button);
  });
  document.getElementById("bell").addEventListener("click", () => {
    const tray = document.getElementById("tray");
    tray.hidden = !tray.hidden;
    if (!tray.hidden && state.onboardingDone && !state.mfa) {
      state.mfaReminded = true;
      persist();
      refreshBadges();
    }
  });
  document.getElementById("who").addEventListener("click", () => openApp("settings"));
  document.getElementById("noteList").addEventListener("click", (event) => {
    const note = event.target.closest("[data-app]");
    if (!note) return;
    document.getElementById("tray").hidden = true;
    if (note.dataset.app) openApp(note.dataset.app);
  });
  document.getElementById("preview").addEventListener("click", (event) => {
    if (event.target.id === "preview") closePreview();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closePreview();
  });
  paintWho();
  applyIcons();
  paintNotes();
  refreshBadges();
  tick();
  setInterval(tick, 10000);
}

function applyIcons() {
  document.querySelectorAll(".dicon").forEach((button) => {
    const id = button.dataset.app;
    if (!id) return;
    const off = state.onboardingDone && state.installed && id !== "security" && !state.installed.includes(id);
    button.classList.toggle("off", off);
  });
}

function paintWho() {
  const name = state.name.trim();
  document.getElementById("whoName").textContent = name || "Сотрудник";
  document.getElementById("whoMark").textContent = (name || "С").slice(0, 1).toUpperCase();
}

function tick() {
  const now = new Date();
  document.getElementById("clock").textContent = new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit" }).format(now);
  document.getElementById("date").textContent = new Intl.DateTimeFormat("ru-RU", { weekday: "short", day: "numeric", month: "short" }).format(now);
}

function refreshBadges() {
  const count = unreadCount();
  const badge = document.getElementById("mailBadge");
  badge.hidden = count === 0;
  badge.textContent = String(count);
  const bell = document.getElementById("bellBadge");
  const pending = currentNotes().length;
  bell.hidden = pending === 0;
  bell.textContent = String(pending || "");
}

function currentNotes() {
  if (!state.onboardingDone) return [];
  const list = [];
  if (!state.mfa && !state.mfaReminded) {
    list.push(["Безопасность", "Второй ключ пока выключен. Его можно включить в приложении «Безопасность».", "security"]);
  }
  if (state.ledger.length && !state.reviewSeen) {
    list.push(["Разбор", "Можно посмотреть, что уже произошло с письмом.", "review"]);
  }
  return list;
}

function paintNotes() {
  const box = document.getElementById("noteList");
  box.replaceChildren();
  const notes = currentNotes();
  if (!notes.length) {
    box.appendChild(el("p", "quiet", "Пока новых уведомлений нет."));
    return;
  }
  notes.forEach(([title, text, app]) => {
    const button = el("button", "note");
    button.type = "button";
    button.dataset.app = app;
    button.append(el("strong", "", title), el("p", "", text));
    box.appendChild(button);
  });
}

function addLedger(id, text, exposure) {
  if (state.ledger.some((row) => row.id === id)) return;
  state.ledger.push({ id, text, exposure });
  persist();
  paintNotes();
  refreshBadges();
}

function openApp(id, options) {
  const app = appById(id);
  if (!app) return;
  const forced = options && options.force;
  if (!state.onboardingDone && !forced) return;
  if (state.onboardingDone && state.installed && app.desk !== false && id !== "security" && !state.installed.includes(id)) {
    openNote(app.title, "Приложение не установлено, поэтому события из него не приходят.");
    return;
  }
  const existing = wins.get(id);
  if (existing) {
    existing.classList.remove("min");
    focusWin(existing);
    paint(id);
    return;
  }
  const win = el("section", "win");
  win.dataset.app = id;
  const shift = wins.size;
  win.style.left = `${88 + shift * 26}px`;
  win.style.top = `${36 + shift * 22}px`;
  const bar = el("header", "win-bar");
  bar.appendChild(img(app.icon, ""));
  bar.appendChild(el("strong", "", app.title));
  bar.appendChild(el("span", "grow"));
  const min = el("button", "win-btn", "–");
  min.type = "button";
  min.setAttribute("aria-label", "Свернуть");
  min.addEventListener("click", () => win.classList.add("min"));
  const close = el("button", "win-btn close", "×");
  close.type = "button";
  close.setAttribute("aria-label", "Закрыть");
  close.addEventListener("click", () => closeWin(id));
  bar.append(min, close);
  win.append(bar, el("div", "win-body"));
  document.getElementById("windows").appendChild(win);
  wins.set(id, win);
  drag(bar, win);
  win.addEventListener("pointerdown", () => focusWin(win));
  addTask(id);
  focusWin(win);
  paint(id);
  if (window.Workplace) window.Workplace.dress(win);
}

function closeWin(id) {
  const win = wins.get(id);
  if (win) win.remove();
  wins.delete(id);
  const task = document.querySelector(`#tasks [data-app="${id}"]`);
  if (task) task.remove();
}

function focusWin(win) {
  win.style.zIndex = String(++z);
  document.querySelectorAll("#tasks .task").forEach((button) => {
    button.classList.toggle("on", button.dataset.app === win.dataset.app);
  });
}

function addTask(id) {
  const app = appById(id);
  const button = el("button", "task");
  button.type = "button";
  button.dataset.app = id;
  button.append(img(app.icon, ""), el("span", "", app.title));
  button.addEventListener("click", () => {
    const win = wins.get(id);
    if (!win) return;
    const front = win.style.zIndex === String(z) && !win.classList.contains("min");
    if (front) win.classList.add("min");
    else {
      win.classList.remove("min");
      focusWin(win);
    }
  });
  document.getElementById("tasks").appendChild(button);
}

function drag(bar, win) {
  bar.addEventListener("pointerdown", (event) => {
    if (event.target.closest("button")) return;
    win.classList.remove("max");
    const desk = document.getElementById("desk").getBoundingClientRect();
    const originX = event.clientX - win.offsetLeft;
    const originY = event.clientY - win.offsetTop;
    function move(ev) {
      const x = Math.max(8, Math.min(ev.clientX - desk.left - originX, desk.width - win.offsetWidth - 8));
      const y = Math.max(8, Math.min(ev.clientY - desk.top - originY, desk.height - 96));
      win.style.left = `${x}px`;
      win.style.top = `${y}px`;
    }
    function up() {
      bar.removeEventListener("pointermove", move);
      bar.removeEventListener("pointerup", up);
    }
    bar.addEventListener("pointermove", move);
    bar.addEventListener("pointerup", up);
  });
}

function paint(id) {
  const win = wins.get(id);
  if (!win) return;
  const body = win.querySelector(".win-body");
  body.replaceChildren();
  if (window.Workplace && window.Workplace.paint(id, body)) return;
  const painters = { mail: paintMail, messenger: paintMessenger, browser: paintBrowser, files: paintFiles, calendar: paintCalendar, security: paintSecurity, portal: paintPortal, settings: paintSettings, review: paintReview };
  painters[id](body);
}

function personLine(id) {
  const person = PEOPLE[id];
  const line = el("span", "who-line");
  const photo = img(person.avatar, person.name);
  photo.className = "ava";
  const text = el("span", "who-text");
  text.append(el("b", "", person.name), el("small", "", person.role));
  line.append(photo, text);
  return line;
}

function paintMail(body) {
  state.read[activeMail] = true;
  persist();
  refreshBadges();
  const wrap = el("div", "split");
  const list = el("div", "list");
  MAILS.forEach((mail) => {
    const button = el("button", `row${mail.id === activeMail ? " on" : ""}${state.read[mail.id] ? "" : " unread"}`);
    button.type = "button";
    button.append(el("b", "", mail.person ? PEOPLE[mail.person].name : mail.sender), el("span", "sub", mail.subject), el("small", "", mail.time));
    button.addEventListener("click", () => {
      activeMail = mail.id;
      paint("mail");
    });
    list.appendChild(button);
  });
  const mail = MAILS.find((item) => item.id === activeMail);
  const view = el("article", "sheet");
  view.appendChild(mail.person ? personLine(mail.person) : el("b", "", mail.sender));
  view.appendChild(el("h2", "", mail.subject));
  mail.body.forEach((line) => view.appendChild(el("p", "", line)));
  if (mail.preview) {
    const attach = el("button", "attach");
    attach.type = "button";
    attach.append(img(mail.preview, "Счёт"), el("span", "", mail.id === "director" ? "Реквизиты к оплате" : "Счёт УЧ-1042"));
    attach.addEventListener("click", () => {
      if (mail.id === "director") addLedger("dir-file", "Открыто вложение с реквизитами из письма директора.", 2);
      openPreview(mail.preview);
    });
    view.appendChild(attach);
  }
  if (state.flagged[mail.id]) view.appendChild(el("p", "flag", "Отмечено для службы безопасности. В тренажёре письмо никуда не ушло."));
  if (state.ledger.some((row) => row.id === "dir-pay") && mail.id === "director") {
    view.appendChild(el("p", "quiet", "Оплата по реквизитам из письма отмечена. Деньги ненастоящие, след остался."));
  }
  const acts = el("div", "acts");
  const reply = el("button", "btn", "Ответить");
  const ask = el("button", "btn ghost", "Спросить ассистента");
  const flag = el("button", "btn ghost", "Отметить для ИБ");
  [reply, ask, flag].forEach((button) => { button.type = "button"; });
  reply.addEventListener("click", () => openComposer(view, mail));
  ask.addEventListener("click", () => askAssistant(mail));
  flag.addEventListener("click", () => {
    state.flagged[mail.id] = true;
    if (mail.id === "director") addLedger("dir-report", "Письмо директора отметили для службы безопасности.", 0);
    persist();
    paint("mail");
  });
  acts.append(reply, ask, flag);
  if (mail.id === "director" && state.ledger.length) {
    const review = el("button", "btn ghost", "Открыть разбор");
    review.type = "button";
    review.addEventListener("click", () => openApp("review"));
    acts.appendChild(review);
  }
  view.appendChild(acts);
  wrap.append(list, view);
  body.appendChild(wrap);
}

function agreesToPay(text) {
  if (/не\s|откаж|подожд|свер|уточн|\?/.test(text)) return false;
  return /оплачу|переведу|отправлю деньги/.test(text);
}

function askAssistant(mail) {
  if (mail.id === "director") addLedger("dir-ask", "Попросили ассистента проверить, точно ли пишет директор.", 0);
  if (state.installed && !state.installed.includes("messenger")) {
    openNote("Павел Орлов", "Ирина так счета не проводит. Пока она в полёте, реквизиты из письма не используйте.");
    return;
  }
  activeChat = "assistant";
  openApp("messenger");
}

function confirmPay(view) {
  if (view.querySelector(".pay-ask")) return;
  const box = el("div", "pay-ask");
  box.appendChild(el("p", "", "Отметить оплату 186 400 по реквизитам из этого письма?"));
  const yes = el("button", "btn", "Да, по реквизитам письма");
  yes.type = "button";
  yes.addEventListener("click", () => {
    addLedger("dir-pay", "Оплата прошла по реквизитам, которые пришли в письме.", 3);
    paint("mail");
    if (wins.has("calendar")) paint("calendar");
  });
  box.appendChild(yes);
  view.appendChild(box);
}

function openComposer(view, mail) {
  if (view.querySelector(".composer")) return;
  const form = el("form", "composer");
  const area = document.createElement("textarea");
  area.placeholder = "Короткий ответ";
  area.required = true;
  const send = el("button", "btn", "Отправить");
  send.type = "submit";
  form.append(area, send);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const text = area.value.trim();
    if (!text) return;
    if (mail && mail.id === "director" && agreesToPay(text)) addLedger("dir-reply", "В ответе согласились заняться оплатой.", 1);
    view.insertBefore(el("p", "mine", text), form);
    view.insertBefore(el("p", "quiet", "Ответ сохранён только на этом рабочем столе."), form);
    form.remove();
  });
  view.appendChild(form);
  area.focus();
}

function paintMessenger(body) {
  const wrap = el("div", "split msg");
  const list = el("div", "list");
  Object.keys(THREADS).forEach((id) => {
    const person = PEOPLE[id];
    const button = el("button", `row${id === activeChat ? " on" : ""}`);
    button.type = "button";
    const photo = img(person.avatar, "");
    photo.className = "ava";
    const lines = threadLines(id);
    const text = el("span", "who-text");
    text.append(el("b", "", person.name), el("span", "sub", lines[lines.length - 1].text));
    button.append(photo, text);
    button.addEventListener("click", () => {
      activeChat = id;
      paint("messenger");
    });
    list.appendChild(button);
  });
  const column = el("div", "thread-col");
  const thread = el("div", "thread");
  thread.appendChild(personLine(activeChat));
  const log = el("div", "log");
  threadLines(activeChat).forEach((line) => {
    log.appendChild(el("p", line.who === "you" ? "bubble mine" : "bubble", line.text));
  });
  thread.appendChild(log);
  const form = el("form", "composer");
  const input = document.createElement("input");
  input.placeholder = `Написать ${PEOPLE[activeChat].name.split(" ")[0]}`;
  const send = el("button", "btn", "Отправить");
  send.type = "submit";
  form.append(input, send);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    const pack = state.chat[activeChat] || (state.chat[activeChat] = []);
    pack.push({ who: "you", text }, { who: activeChat, text: replyFor(activeChat, text) });
    persist();
    paint("messenger");
  });
  column.append(thread, form);
  const card = el("aside", "card");
  const person = PEOPLE[activeChat];
  card.append(el("span", "k", "Город"), el("span", "", person.city), el("span", "k", "Роль"), el("span", "", person.role));
  wrap.append(list, column, card);
  body.appendChild(wrap);
}

function threadLines(id) {
  return THREADS[id].concat(state.chat[id] || []);
}

function replyFor(id, text) {
  const money = /оплат|счет|счёт|реквизит|директор/i.test(text);
  if (id === "misha") return money ? "Я бы не платил из письма. Реквизиты должны совпасть с договором на портале." : "Почту открыл? Письмо от директора сверху.";
  if (id === "assistant") return "Тему увидел. Пока директор в полёте, сверю сам и напишу, её ли это просьба.";
  if (id === "it") return "Если файл пришёл письмом и называется обновлением — не запускай. Хватит портала.";
  if (id === "hr") return "Номер карты в письме лучше не оставлять. Нужная форма уже есть на портале.";
  if (id === "director") return "Сообщение дойдёт, когда появится сеть. С оплатой лучше дождаться сверки.";
  return "Если это была ссылка, лучше перескажи своими словами. Я открою сама, только когда пойму, от кого она.";
}

function paintBrowser(body) {
  const bar = el("form", "addr");
  const input = document.createElement("input");
  input.value = state.browserUrl || "https://portal.nord.example";
  input.spellcheck = false;
  const go = el("button", "btn", "Открыть");
  go.type = "submit";
  const page = el("div", "page");
  function show(url) {
    page.replaceChildren();
    const ours = /portal\.nord\.example/i.test(url);
    page.append(el("p", "k", url.trim() || "пустой адрес"), el("h2", "", ours ? "Портал НОРД" : "Адрес вне контура компании"));
    page.appendChild(el("p", "", ours
      ? "Внутренний сайт. Реквизиты, кадры и обновления берут отсюда."
      : "Страница открылась в тренажёре и ничего не отправила. Рабочие сервисы живут на адресе портала."));
  }
  bar.append(input, go);
  bar.addEventListener("submit", (event) => {
    event.preventDefault();
    show(input.value);
  });
  show(input.value);
  body.append(bar, page);
}

function paintFiles(body) {
  const grid = el("div", "files");
  FILES.forEach((file) => {
    const button = el("button", "file");
    button.type = "button";
    button.append(img(file.icon, ""), el("span", "", file.name));
    button.addEventListener("click", () => {
      if (file.preview) openPreview(file.preview);
      else openNote(file.name, file.note);
    });
    grid.appendChild(button);
  });
  body.appendChild(grid);
}

function paintCalendar(body) {
  const day = el("div", "day");
  day.appendChild(el("h2", "", "Сегодня"));
  const rows = [["10:00", "Планёрка проектного офиса"], ["16:30", "Срок по счетам, которые ещё не сверены"]];
  if (state.ledger.some((row) => row.id === "dir-pay")) rows.push(["через 3 дня", "Настоящий директор узнает о платеже, который просили держать в тайне"]);
  else if (state.ledger.some((row) => row.id === "dir-reply" || row.id === "dir-file")) rows.push(["сейчас", "Письмо «от директора» просит ускорить оплату"]);
  rows.forEach(([time, title]) => {
    const slot = el("div", "slot");
    slot.append(el("b", "", time), el("span", "", title));
    day.appendChild(slot);
  });
  body.appendChild(day);
}

function paintSecurity(body) {
  const box = el("div", "sec");
  const password = el("div", "info-row");
  password.append(el("div", "", "Пароль учётной записи"), el("b", "", state.passwordLabel || "задан"));
  const row = el("div", "switch-row");
  const label = el("div", "");
  label.append(el("b", "", "Второй ключ"), el("div", "k", state.mfa ? "Для входа мало одного пароля." : "Пока выключен. Пароля достаточно, чтобы войти."));
  const toggle = el("button", `switch${state.mfa ? " on" : ""}`, state.mfa ? "Включён" : "Выключен");
  toggle.type = "button";
  toggle.addEventListener("click", () => {
    state.mfa = !state.mfa;
    persist();
    paint("security");
  });
  row.append(label, toggle);
  box.append(password, row);
  body.appendChild(box);
}

function paintPortal(body) {
  const head = el("div", "sheet");
  head.append(el("h2", "", "Внутренний портал"), el("p", "", "Официальные реквизиты, кадры и обновления лежат здесь, а не во вложениях."));
  const tiles = el("div", "tiles");
  [
    ["check", "Проверка контрагента", "Номер договора и счёт смотрят здесь. Письмо «реквизиты изменились» карточку не меняет."],
    ["it", "Обновления", "Клиент компании ставится отсюда. Файл из почты сюда не относится."],
    ["hr", "Кабинет сотрудника", "Карта для зарплаты подтверждается в этом кабинете."],
    ["rules", "Регламент", "Просьбу об оплате, даже от директора, можно сверить с ассистентом."]
  ].forEach(([id, title, text]) => {
    const tile = el("button", `tile${portalCard === id ? " on" : ""}`);
    tile.type = "button";
    tile.append(el("b", "", title), el("p", "", text));
    tile.addEventListener("click", () => {
      portalCard = id;
      paint("portal");
    });
    tiles.appendChild(tile);
  });
  body.append(head, tiles);
}

function paintSettings(body) {
  const box = el("div", "sheet narrow");
  box.append(el("h2", "", "Рабочее место"), el("p", "", "Имя видно на панели. Пока оно хранится только в этой вкладке."));
  const form = el("form", "composer stack");
  const input = document.createElement("input");
  input.value = state.name;
  input.placeholder = "Как к вам обращаться";
  const save = el("button", "btn", "Сохранить");
  save.type = "submit";
  const note = el("p", "quiet", "");
  form.append(input, save);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    state.name = input.value.trim();
    persist();
    paintWho();
    note.textContent = "Имя обновлено.";
  });
  const roles = el("div", "choices");
  ROLES.forEach(([id, title]) => {
    const label = el("label", "choice");
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = state.roles.includes(id);
    input.addEventListener("change", () => {
      state.roles = ROLES.map(([role]) => role).filter((role) => roles.querySelector(`[data-role="${role}"]`).checked);
      persist();
    });
    input.dataset.role = id;
    label.append(input, el("span", "", title));
    roles.appendChild(label);
  });
  box.append(form, note, el("h2", "", "Твой рабочий день"), roles);
  body.appendChild(box);
}

function paintReview(body) {
  state.reviewSeen = true;
  persist();
  paintNotes();
  refreshBadges();
  const box = el("div", "sheet");
  box.append(el("h2", "", "Что произошло"), el("p", "", "Это не оценка. Коротко, какой след оставило письмо."));
  if (!state.ledger.length) box.appendChild(el("p", "", "Пока действий нет."));
  state.ledger.forEach((row) => {
    box.appendChild(el("p", "", `${row.text} ${row.exposure > 0 ? `След +${row.exposure}.` : "След не вырос."}`));
  });
  const sum = state.ledger.reduce((total, row) => total + row.exposure, 0);
  box.appendChild(el("p", "", sum ? `О платеже из письма уже можно сложить след ${sum}.` : "След платежа не вырос."));
  box.appendChild(el("p", state.mfa ? "" : "flag", state.mfa
    ? "Второй ключ включён. Одного пароля для входа мало."
    : "Второй ключ выключен. Пароля достаточно, чтобы войти в эту учётную запись."));
  body.appendChild(box);
}

function openPreview(src) {
  const layer = document.getElementById("preview");
  layer.replaceChildren(img(src, "Документ"));
  layer.hidden = false;
}

function openNote(title, text) {
  const layer = document.getElementById("preview");
  const paper = el("div", "paper");
  paper.append(el("h3", "", title), el("p", "", text));
  layer.replaceChildren(paper);
  layer.hidden = false;
}

function closePreview() {
  document.getElementById("preview").hidden = true;
}

mount();

function toast(options) {
  const layer = document.getElementById("toasts");
  if (!layer) return;
  const node = el("button", "toast");
  node.type = "button";
  if (options.icon) node.appendChild(img(options.icon, ""));
  const text = el("span", "toast-text");
  text.append(el("b", "", options.title), el("span", "", options.text));
  node.appendChild(text);
  let gone = false;
  function close() {
    if (gone) return;
    gone = true;
    node.classList.add("out");
    window.setTimeout(() => node.remove(), 260);
  }
  node.addEventListener("click", () => {
    close();
    if (typeof options.onClick === "function") {
      options.onClick();
      return;
    }
    if (options.chat) activeChat = options.chat;
    if (options.app) openApp(options.app);
  });
  layer.appendChild(node);
  window.setTimeout(close, options.ms || 6500);
}

window.Desk = { state, persist, openApp, paint, paintWho, applyIcons, paintNotes, refreshBadges, addLedger, openPreview, openNote, toast, ROLES };
