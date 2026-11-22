(function workplace() {
  const Desk = window.Desk;
  const { state, persist } = Desk;
  const FIXED = new Set(["disk", "desktop", "docs", "downloads", "trash"]);
  const ME = { email: "user@nord.example" };

  const CONTACTS = [
    { dept: "Дирекция", name: "Ирина Сергеевна Лебедева", email: "i.lebedeva@nord.example" },
    { dept: "Дирекция", name: "Павел Игоревич Орлов", email: "p.orlov@nord.example" },
    { dept: "Продажи", name: "Михаил Андреевич Соколов", email: "m.sokolov@nord.example" },
    { dept: "Проектный офис", name: "Марина Олеговна Котова", email: "m.kotova@nord.example" },
    { dept: "IT", name: "Сергей Павлович Плотников", email: "s.plotnikov@nord.example" },
    { dept: "Кадры", name: "Ольга Викторовна Репина", email: "o.repina@nord.example" },
    { dept: "Информационная безопасность", name: "Кирилл Денисович Антонов", email: "k.antonov@nord.example" }
  ];

  let serial = 1;

  function el(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  function img(src) {
    const node = document.createElement("img");
    node.src = src;
    node.alt = "";
    return node;
  }

  function uid(prefix) {
    serial += 1;
    return `${prefix}${Date.now().toString(36)}${serial}`;
  }

  function me() {
    return { name: state.name.trim() || "Вы", email: ME.email };
  }

  function nowStamp() {
    return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }).format(new Date());
  }

  function seedNodes() {
    return {
      disk: { id: "disk", type: "drive", name: "Диск", parent: null },
      desktop: { id: "desktop", type: "folder", name: "Рабочий стол", parent: "disk" },
      docs: { id: "docs", type: "folder", name: "Документы", parent: "disk" },
      downloads: { id: "downloads", type: "folder", name: "Загрузки", parent: "disk" },
      trash: { id: "trash", type: "folder", name: "Корзина", parent: "disk" },
      invoice: { id: "invoice", type: "file", name: "Счёт УЧ-1042.pdf", parent: "docs", kind: "pdf", preview: "assets/docs/preview-invoice.png" },
      form: { id: "form", type: "file", name: "Форма кадров.pdf", parent: "docs", kind: "pdf", preview: "assets/docs/preview-form.png" },
      rules: { id: "rules", type: "file", name: "Регламент платежей.doc", parent: "docs", kind: "doc", note: "Реквизиты сверяют с договором на портале. Письмо с «новыми реквизитами» само по себе ничего не меняет." },
      exe: { id: "exe", type: "file", name: "Клиент обновления.exe", parent: "docs", kind: "exe", note: "Это установщик не с портала. В тренажёре он не запускается." }
    };
  }

  function seedLetters() {
    return [
      {
        id: "director",
        folder: "inbox",
        read: false,
        from: { name: "Ирина Лебедева", email: "i.lebedeva@nord.example" },
        to: [{ name: "Вы", email: ME.email }],
        cc: [],
        subject: "Срочно, пока есть связь",
        stamp: "20 ноября, 10:14",
        files: ["invoice"],
        thread: [{ author: "Ирина Лебедева", email: "i.lebedeva@nord.example", stamp: "20 ноября, 10:14", text: "Я уже в самолёте, связь будет обрываться.\n\nОплати сегодня счёт УЧ-1042. Реквизиты прислали отдельным письмом, сумма 186 400.\n\nНикому не пересылай и не звони — разберёмся после посадки." }]
      },
      {
        id: "invoice",
        folder: "inbox",
        read: false,
        from: { name: "Северный контур", email: "schet@severnyy-kontur.example" },
        to: [{ name: "Вы", email: ME.email }],
        cc: [{ name: "Ирина Лебедева", email: "i.lebedeva@nord.example" }],
        subject: "Счёт УЧ-1042",
        stamp: "20 ноября, 09:41",
        files: ["invoice"],
        thread: [{ author: "Северный контур", email: "schet@severnyy-kontur.example", stamp: "20 ноября, 09:41", text: "Коллеги, направляем счёт УЧ-1042 на 186 400.\n\nРеквизиты изменились. Актуальные — в этом письме." }]
      },
      {
        id: "it",
        folder: "inbox",
        read: true,
        from: { name: "Сергей Плотников", email: "s.plotnikov@nord.example" },
        to: [{ name: "Вы", email: ME.email }],
        cc: [],
        subject: "Обновление клиента",
        stamp: "19 ноября, 18:05",
        files: [],
        thread: [{ author: "Сергей Плотников", email: "s.plotnikov@nord.example", stamp: "19 ноября, 18:05", text: "Сегодня вечером выйдет обновление.\n\nСтавьте его только из портала. Файл из письма запускать не нужно." }]
      }
    ];
  }

  function boot() {
    const seed = seedNodes();
    if (!state.nodes) state.nodes = seed;
    else Object.keys(seed).forEach((id) => {
      if (!state.nodes[id]) state.nodes[id] = seed[id];
    });
    if (!state.letters) state.letters = seedLetters();
    if (!state.iconPos) state.iconPos = {};
    if (!state.mailUi) state.mailUi = { folder: "inbox", letter: "director", mode: "read", view: "mail", compose: null };
    if (!state.cwd) state.cwd = "docs";
    if (!state.browse) state.browse = { cols: ["disk", "docs"], sel: null };
    if (!state.guides) state.guides = {};
    if (!state.portalSection) state.portalSection = "pay";
    if (!state.payments) state.payments = [
      { date: "12 ноября", who: "ООО «Северная линия»", doc: "УЧ-0981", sum: "42 000", status: "Проведено" },
      { date: "4 ноября", who: "АО «Балтснаб»", doc: "УЧ-0974", sum: "118 200", status: "Проведено" },
      { date: "28 октября", who: "ИП Сорокин", doc: "УЧ-0910", sum: "15 600", status: "Проведено" }
    ];
    if (!state.events) state.events = seedEvents();
    if (!state.eventLog) state.eventLog = [];
    if (!state.cal) state.cal = { mode: "week", cursor: dateKey(new Date()), selected: "evt_001", form: null };
    if (!state.rooms) state.rooms = seedRooms();
    if (!state.chatOpen) state.chatOpen = "misha";
    if (!state.seen) state.seen = { "c-general": 0, "c-sales": 1, "c-projects": 1, "c-it": 1, "c-hr": 1, misha: 0, director: 1, assistant: 1, colleague: 1, it: 1, hr: 1 };
    if (!state.hiddenMsgs) state.hiddenMsgs = [];
    if (!state.chatDrafts) state.chatDrafts = {};
    if (!state.requests) state.requests = [{ id: "req1", kind: "Отпуск", detail: "2–6 декабря", status: "Согласовано" }];
    if (!state.tickets) state.tickets = [{ id: "t1", title: "Не печатает договор", who: "Марина Котова", status: "В работе" }];
    if (!state.accessReqs) state.accessReqs = [];
    if (!state.softReqs) state.softReqs = [];
    if (!state.vpn) state.vpn = { code: "", on: false };
    state.vpn.phase = "";
    if (!String(state.vpn.code || "").trim()) state.vpn.on = false;
    if (Array.isArray(state.installed) && !state.installed.includes("vpn")) state.installed.push("vpn");
    watchReminders();
    wrapBadges();
    state.browse.cols = (state.browse.cols || []).filter((id) => state.nodes[id] && state.nodes[id].type !== "file");
    if (!state.browse.cols.length) state.browse.cols = ["docs"];
    renderDesk();
    Desk.applyIcons();
    Desk.refreshBadges();
    document.getElementById("desk").addEventListener("contextmenu", onDeskMenu);
    document.addEventListener("pointerdown", (event) => {
      if (!event.target.closest("#menu")) closeMenu();
    });
    if (coachStep()) watchCoach();
    const vpnStat = document.getElementById("vpnStat");
    if (vpnStat) vpnStat.addEventListener("click", () => Desk.openApp("vpn"));
    paintVpnStat();
  }

  function children(id) {
    return Object.values(state.nodes).filter((node) => node.parent === id).sort((a, b) => {
      if (a.type !== b.type) return a.type === "folder" || a.type === "drive" ? -1 : 1;
      return a.name.localeCompare(b.name, "ru");
    });
  }

  function fileArt(node) {
    if (node.type !== "file") return "assets/icons/icon-files.png";
    if (node.kind === "pdf") return "assets/files/file-pdf.png";
    if (node.kind === "exe") return "assets/files/file-exe.png";
    return "assets/files/file-doc.png";
  }

  function renderDesk() {
    const icons = document.getElementById("icons");
    icons.replaceChildren();
    const items = [];
    APPS().forEach((app, index) => {
      items.push({ key: `app:${app.id}`, app: app.id, title: app.title, icon: app.icon, fallback: { x: 22, y: 28 + index * 100 } });
    });
    children("desktop").forEach((node, index) => {
      items.push({ key: `file:${node.id}`, file: node.id, title: node.name, icon: fileArt(node), fallback: { x: 150, y: 28 + index * 100 } });
    });
    items.forEach((item) => icons.appendChild(deskButton(item)));
  }

  function APPS() {
    return [
      ["mail", "Почта", "assets/icons/icon-mail.png"],
      ["messenger", "Сообщения", "assets/icons/icon-messenger.png"],
      ["browser", "Браузер", "assets/icons/icon-browser.png"],
      ["files", "Файлы", "assets/icons/icon-files.png"],
      ["calendar", "Календарь", "assets/icons/icon-calendar.png"],
      ["security", "Безопасность", "assets/icons/icon-security.png"],
      ["portal", "Портал", "assets/icons/icon-portal.png"],
      ["vpn", "VPN", "assets/icons/icon-vpn.svg"]
    ].map(([id, title, icon]) => ({ id, title, icon }));
  }

  function deskButton(item) {
    const pos = state.iconPos[item.key] || item.fallback;
    const button = el("button", "dicon");
    button.type = "button";
    if (item.app) button.dataset.app = item.app;
    const glyph = el("span", "glyph");
    glyph.appendChild(img(item.icon));
    if (item.app === "mail") {
      const badge = el("i", "badge");
      badge.id = "mailBadge";
      glyph.appendChild(badge);
    }
    button.append(glyph, el("span", "label", item.title));
    button.style.left = `${pos.x}px`;
    button.style.top = `${pos.y}px`;
    button.addEventListener("pointerdown", (event) => dragIcon(event, button, item));
    button.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (item.app) openMenu(event.clientX, event.clientY, [["Открыть", () => Desk.openApp(item.app)]]);
      else nodeMenu(state.nodes[item.file], event.clientX, event.clientY);
    });
    return button;
  }

  function dragIcon(event, button, item) {
    if (event.button !== 0) return;
    const desk = document.getElementById("desk").getBoundingClientRect();
    const start = { x: event.clientX, y: event.clientY, left: button.offsetLeft, top: button.offsetTop };
    let dragged = false;
    function move(ev) {
      const dx = ev.clientX - start.x;
      const dy = ev.clientY - start.y;
      if (!dragged && Math.hypot(dx, dy) < 5) return;
      dragged = true;
      const x = Math.max(8, Math.min(start.left + dx, desk.width - 100));
      const y = Math.max(8, Math.min(start.top + dy, desk.height - 170));
      button.style.left = `${x}px`;
      button.style.top = `${y}px`;
      state.iconPos[item.key] = { x, y };
    }
    function up() {
      button.removeEventListener("pointermove", move);
      button.removeEventListener("pointerup", up);
      if (dragged) persist();
      else if (item.app) Desk.openApp(item.app);
      else openNode(state.nodes[item.file]);
    }
    button.addEventListener("pointermove", move);
    button.addEventListener("pointerup", up);
  }

  function onDeskMenu(event) {
    if (event.target.closest(".dicon, .win, #bar, #tray, #onboard, #menu, #pop")) return;
    event.preventDefault();
    openMenu(event.clientX, event.clientY, [["Создать папку", () => createFolder("desktop", event.clientX, event.clientY)]]);
  }

  function openMenu(x, y, items) {
    const menu = document.getElementById("menu");
    const desk = document.getElementById("desk").getBoundingClientRect();
    menu.replaceChildren();
    items.forEach(([label, run]) => {
      const button = el("button", "", label);
      button.type = "button";
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        closeMenu();
        run();
      });
      menu.appendChild(button);
    });
    menu.hidden = false;
    menu.style.left = `${Math.max(8, Math.min(x - desk.left, desk.width - 210))}px`;
    menu.style.top = `${Math.max(8, Math.min(y - desk.top, desk.height - 160))}px`;
  }

  function closeMenu() {
    document.getElementById("menu").hidden = true;
  }

  function askText(title, value, done) {
    const pop = document.getElementById("pop");
    const form = el("form", "paper");
    const input = document.createElement("input");
    input.value = value;
    const save = el("button", "btn", "Сохранить");
    save.type = "submit";
    form.append(el("h3", "", title), input, save);
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      pop.hidden = true;
      done(input.value.trim());
    });
    pop.replaceChildren(form);
    pop.hidden = false;
    input.focus();
    input.select();
  }

  function chooseFolder(node, done) {
    const pop = document.getElementById("pop");
    const card = el("div", "paper");
    card.appendChild(el("h3", "", "Переместить"));
    const list = el("div", "pop-list");
    Object.values(state.nodes).filter((item) => item.type !== "file" && !inside(item.id, node.id) && item.id !== node.id).forEach((folder) => {
      const button = el("button", "btn ghost", folder.name);
      button.type = "button";
      button.addEventListener("click", () => {
        pop.hidden = true;
        done(folder.id);
      });
      list.appendChild(button);
    });
    card.appendChild(list);
    pop.replaceChildren(card);
    pop.hidden = false;
  }

  function inside(id, ancestorId) {
    let cursor = state.nodes[id];
    while (cursor) {
      if (cursor.id === ancestorId) return true;
      cursor = cursor.parent ? state.nodes[cursor.parent] : null;
    }
    return false;
  }

  function createFolder(parent, x, y) {
    const id = uid("dir");
    state.nodes[id] = { id, type: "folder", name: "Новая папка", parent };
    if (parent === "desktop") {
      const desk = document.getElementById("desk").getBoundingClientRect();
      state.iconPos[`file:${id}`] = { x: Math.max(8, x - desk.left - 40), y: Math.max(8, y - desk.top - 20) };
    }
    if (parent !== "desktop") state.cwd = parent;
    persist();
    renderDesk();
    Desk.applyIcons();
    Desk.refreshBadges();
    paintOpen("files");
    askText("Имя папки", "Новая папка", (name) => {
      state.nodes[id].name = name || "Новая папка";
      persist();
      renderDesk();
      Desk.applyIcons();
      Desk.refreshBadges();
      paintOpen("files");
    });
  }

  function renameNode(node) {
    if (FIXED.has(node.id)) return;
    askText("Новое имя", node.name, (name) => {
      if (!name) return;
      node.name = name;
      persist();
      renderDesk();
      Desk.applyIcons();
      Desk.refreshBadges();
      paintOpen("files");
    });
  }

  function deleteNode(node) {
    if (FIXED.has(node.id)) return;
    if (node.parent === "trash") removeTree(node.id);
    else node.parent = "trash";
    delete state.iconPos[`file:${node.id}`];
    persist();
    renderDesk();
    Desk.applyIcons();
    Desk.refreshBadges();
    paintOpen("files");
  }

  function removeTree(id) {
    children(id).forEach((node) => removeTree(node.id));
    delete state.nodes[id];
    delete state.iconPos[`file:${id}`];
  }

  function emptyTrash() {
    children("trash").forEach((node) => removeTree(node.id));
    persist();
    paintOpen("files");
  }

  function moveNode(node, parent) {
    if (FIXED.has(node.id) || inside(parent, node.id)) return;
    node.parent = parent;
    if (parent !== "desktop") delete state.iconPos[`file:${node.id}`];
    else if (!state.iconPos[`file:${node.id}`]) state.iconPos[`file:${node.id}`] = { x: 150, y: 28 };
    persist();
    renderDesk();
    Desk.applyIcons();
    Desk.refreshBadges();
    paintOpen("files");
  }

  function nodeMenu(node, x, y) {
    const items = [["Открыть", () => openNode(node)]];
    if (!FIXED.has(node.id)) {
      items.push(["Переименовать", () => renameNode(node)]);
      items.push(["Переместить", () => chooseFolder(node, (parent) => moveNode(node, parent))]);
      items.push([node.parent === "trash" ? "Удалить навсегда" : "Удалить", () => deleteNode(node)]);
    }
    openMenu(x, y, items);
  }

  function openNode(node) {
    if (!node) return;
    if (node.type !== "file") {
      state.browse.cols = node.parent === "disk" ? ["disk", node.id] : [node.id];
      state.browse.sel = null;
      state.cwd = node.id;
      Desk.openApp("files");
      return;
    }
    if (node.preview) Desk.openPreview(node.preview);
    else Desk.openNote(node.name, node.note || "Файл открыт.");
  }

  function copyNode(id, parent) {
    const source = state.nodes[id];
    if (!source) return;
    const copy = Object.assign({}, source, { id: uid("file"), parent });
    state.nodes[copy.id] = copy;
    if (parent === "desktop" && !state.iconPos[`file:${copy.id}`]) state.iconPos[`file:${copy.id}`] = { x: 150, y: 28 + children("desktop").length * 20 };
    persist();
    renderDesk();
    Desk.applyIcons();
    Desk.refreshBadges();
    paintOpen("files");
  }

  function paintOpen(id) {
    if (document.querySelector(`.win[data-app="${id}"]`)) Desk.paint(id);
  }

  function seedEvents() {
    const meet = new Date(Date.now() + 18 * 60000);
    meet.setSeconds(0, 0);
    const meetEnd = new Date(meet.getTime() + 30 * 60000);
    return [
      {
        id: "evt_001",
        title: "Планёрка проектного офиса",
        start: "2026-11-21T10:00",
        end: "2026-11-21T11:00",
        allDay: false,
        location: "Переговорная 3",
        description: "",
        guests: [{ email: "m.kotova@nord.example", status: "accepted" }],
        reminder: 15,
        isInvite: false,
        inviteStatus: null
      },
      {
        id: "evt_002",
        title: "Срок по счетам",
        start: "2026-11-21T16:30",
        end: "2026-11-21T17:00",
        allDay: false,
        location: "",
        description: "Счета, которые ещё не сверены с договором.",
        guests: [],
        reminder: 60,
        isInvite: false,
        inviteStatus: null
      },
      {
        id: "evt_003",
        title: "Срочное совещание",
        start: isoLocal(meet),
        end: isoLocal(meetEnd),
        allDay: false,
        location: "Онлайн",
        description: "Просьба подтвердить участие и открыть документ: https://nord-meet.example/urgent",
        guests: [{ email: "i.lebedeva@nord.example", status: "accepted" }],
        reminder: 15,
        isInvite: true,
        inviteStatus: null
      }
    ];
  }

  function logEvent(action, data) {
    if (!state.eventLog) state.eventLog = [];
    state.eventLog.push({ action, at: new Date().toISOString(), data: data || {} });
    persist();
  }

  let reminderWatch = false;
  function watchReminders() {
    if (reminderWatch) return;
    reminderWatch = true;
    function scan() {
      const now = Date.now();
      (state.events || []).forEach((event) => {
        if (!event.reminder || event.reminded || event.inviteStatus === "declined") return;
        const start = new Date(event.start).getTime();
        const when = start - event.reminder * 60000;
        if (now < when || now >= start) return;
        event.reminded = true;
        persist();
        Desk.toast({
          title: event.title,
          text: event.isInvite ? "Приглашение скоро начнётся." : "Скоро начнётся.",
          icon: "assets/icons/icon-calendar.png",
          ms: 12000,
          onClick: () => {
            state.cal.selected = event.id;
            state.cal.form = null;
            state.cal.cursor = event.start.slice(0, 10);
            Desk.openApp("calendar");
          }
        });
      });
    }
    scan();
    window.setInterval(scan, 15000);
  }

  function dateKey(date) {
    const pad = (n) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  function isoLocal(date) {
    const pad = (n) => String(n).padStart(2, "0");
    return `${dateKey(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  function parseDay(key) {
    const [year, month, day] = key.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  function sameDay(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  function addDays(date, count) {
    const next = new Date(date);
    next.setDate(next.getDate() + count);
    return next;
  }

  function startOfWeek(date) {
    const next = new Date(date);
    const shift = (next.getDay() + 6) % 7;
    next.setDate(next.getDate() - shift);
    next.setHours(0, 0, 0, 0);
    return next;
  }

  function contactByEmail(email) {
    return CONTACTS.find((person) => person.email === email);
  }

  function guestLabel(guest) {
    const person = contactByEmail(guest.email);
    const status = { pending: "ожидает", accepted: "принял", declined: "отклонил" }[guest.status] || "ожидает";
    return `${person ? person.name : guest.email} — ${status}`;
  }

  function shiftCursor(dir) {
    const cursor = parseDay(state.cal.cursor);
    if (state.cal.mode === "month") cursor.setMonth(cursor.getMonth() + dir);
    else cursor.setDate(cursor.getDate() + dir * (state.cal.mode === "week" ? 7 : 1));
    state.cal.cursor = dateKey(cursor);
  }

  function periodTitle() {
    const cursor = parseDay(state.cal.cursor);
    const month = new Intl.DateTimeFormat("ru-RU", { month: "long", year: "numeric" }).format(cursor);
    if (state.cal.mode === "month") return month;
    if (state.cal.mode === "day") return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" }).format(cursor);
    const start = startOfWeek(cursor);
    const end = addDays(start, 6);
    const left = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short" }).format(start);
    const right = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short" }).format(end);
    return `${left} – ${right}`;
  }

  function visibleDays() {
    const cursor = parseDay(state.cal.cursor);
    if (state.cal.mode === "day") return [cursor];
    return Array.from({ length: 7 }, (_, index) => addDays(startOfWeek(cursor), index));
  }

  function inWorkHours(event) {
    const start = new Date(event.start);
    const minutes = start.getHours() * 60 + start.getMinutes();
    return minutes >= 8 * 60 && minutes < 20 * 60;
  }

  function eventsOn(day, events) {
    return events.filter((event) => sameDay(new Date(event.start), day));
  }

  function paintCalendar(body) {
    const shell = el("div", "cal");
    shell.append(calendarSide(), calendarMain(), calendarDetail());
    body.appendChild(shell);
  }

  function calendarSide() {
    const side = el("aside", "cal-side");
    const create = el("button", "btn", "Создать");
    create.type = "button";
    create.addEventListener("click", () => {
      const start = new Date();
      start.setMinutes(0, 0, 0);
      start.setHours(start.getHours() + 1);
      const end = new Date(start.getTime() + 60 * 60000);
      state.cal.form = { id: null, title: "", start: isoLocal(start), end: isoLocal(end), allDay: false, location: "", description: "", guests: [], reminder: 15 };
      state.cal.selected = null;
      Desk.paint("calendar");
    });
    side.appendChild(create);
    side.appendChild(miniMonth());
    side.append(el("p", "place-label", "Календари"), el("p", "cal-own", "Рабочий"));
    return side;
  }

  function miniMonth() {
    const cursor = parseDay(state.cal.cursor);
    const box = el("div", "mini");
    const head = el("div", "mini-head");
    head.append(el("b", "", new Intl.DateTimeFormat("ru-RU", { month: "long" }).format(cursor)));
    box.appendChild(head);
    const grid = el("div", "mini-grid");
    ["П", "В", "С", "Ч", "П", "С", "В"].forEach((name) => grid.appendChild(el("span", "", name)));
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const lead = (first.getDay() + 6) % 7;
    for (let i = 0; i < lead; i += 1) grid.appendChild(el("span", "", ""));
    const days = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    for (let day = 1; day <= days; day += 1) {
      const date = new Date(cursor.getFullYear(), cursor.getMonth(), day);
      const button = el("button", sameDay(date, new Date()) ? "today" : "", String(day));
      button.type = "button";
      if (dateKey(date) === state.cal.cursor) button.classList.add("on");
      button.addEventListener("click", () => {
        state.cal.cursor = dateKey(date);
        Desk.paint("calendar");
      });
      grid.appendChild(button);
    }
    box.appendChild(grid);
    return box;
  }

  function calendarMain() {
    const main = el("div", "cal-main");
    const bar = el("div", "cal-bar");
    const prev = el("button", "btn ghost", "←");
    const next = el("button", "btn ghost", "→");
    const today = el("button", "btn ghost", "Сегодня");
    [prev, next, today].forEach((button) => { button.type = "button"; });
    prev.addEventListener("click", () => { shiftCursor(-1); Desk.paint("calendar"); });
    next.addEventListener("click", () => { shiftCursor(1); Desk.paint("calendar"); });
    today.addEventListener("click", () => { state.cal.cursor = dateKey(new Date()); Desk.paint("calendar"); });
    const modes = el("div", "cal-modes");
    [["day", "День"], ["week", "Неделя"], ["month", "Месяц"]].forEach(([id, title]) => {
      const button = el("button", state.cal.mode === id ? "on" : "", title);
      button.type = "button";
      button.addEventListener("click", () => { state.cal.mode = id; Desk.paint("calendar"); });
      modes.appendChild(button);
    });
    bar.append(prev, today, next, el("b", "cal-title", periodTitle()), modes);
    main.appendChild(bar);
    const board = el("div", "cal-board");
    if (state.cal.mode === "month") board.appendChild(monthGrid());
    else {
      const outside = visibleDays().flatMap((day) => eventsOn(day, state.events).filter((event) => !event.allDay && !inWorkHours(event)));
      if (outside.length) {
        const extra = el("div", "cal-extra");
        extra.appendChild(el("span", "", "Вне 08:00–20:00"));
        outside.forEach((event) => {
          const button = el("button", "chip", `${event.start.slice(11)} ${event.title}`);
          button.type = "button";
          button.addEventListener("click", () => openEvent(event.id));
          extra.appendChild(button);
        });
        board.appendChild(extra);
      }
      board.appendChild(timeGrid());
    }
    if (state.ledger && state.ledger.some((row) => row.id === "dir-pay")) {
      board.appendChild(el("p", "quiet", "Через 3 дня в расписании появится отметка: директор узнает о проведённом платеже."));
    }
    main.appendChild(board);
    return main;
  }

  function timeGrid() {
    const cursor = parseDay(state.cal.cursor);
    const days = state.cal.mode === "day" ? [cursor] : Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(cursor), i));
    const wrap = el("div", "cal-time");
    wrap.style.setProperty("--days", String(days.length));
    const head = el("div", "cal-time-head");
    head.appendChild(el("span", "cal-gutter", ""));
    days.forEach((day) => {
      const name = new Intl.DateTimeFormat("ru-RU", { weekday: "short", day: "numeric" }).format(day);
      head.appendChild(el("span", sameDay(day, new Date()) ? "today" : "", name));
    });
    const body = el("div", "cal-time-body");
    const hours = el("div", "cal-hours");
    for (let hour = 8; hour < 20; hour += 1) hours.appendChild(el("span", "", `${String(hour).padStart(2, "0")}:00`));
    body.appendChild(hours);
    days.forEach((day) => body.appendChild(dayColumn(day)));
    wrap.append(head, body);
    return wrap;
  }

  function dayColumn(day) {
    const col = el("div", "cal-col");
    for (let hour = 8; hour < 20; hour += 1) col.appendChild(el("i", "cal-hour"));
    eventsOn(day, state.events).forEach((event) => {
      if (event.allDay || !inWorkHours(event)) return;
      const block = el("button", `cal-event${event.isInvite ? " invite" : ""}${event.inviteStatus === "declined" ? " declined" : ""}`, event.title);
      block.type = "button";
      const startMin = Math.max(8 * 60, new Date(event.start).getHours() * 60 + new Date(event.start).getMinutes());
      const endMin = Math.min(20 * 60, new Date(event.end).getHours() * 60 + new Date(event.end).getMinutes());
      block.style.top = `${((startMin - 8 * 60) / (12 * 60)) * 100}%`;
      block.style.height = `${Math.max(7, ((endMin - startMin) / (12 * 60)) * 100)}%`;
      block.addEventListener("click", () => openEvent(event.id));
      col.appendChild(block);
    });
    return col;
  }

  function monthGrid() {
    const cursor = parseDay(state.cal.cursor);
    const grid = el("div", "cal-month");
    ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].forEach((name) => grid.appendChild(el("span", "cal-dow", name)));
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    let day = addDays(first, -((first.getDay() + 6) % 7));
    for (let i = 0; i < 42; i += 1) {
      const date = new Date(day);
      const cell = el("button", `cal-cell${date.getMonth() === cursor.getMonth() ? "" : " off"}${sameDay(date, new Date()) ? " today" : ""}`);
      cell.type = "button";
      cell.appendChild(el("b", "", String(date.getDate())));
      eventsOn(date, state.events).slice(0, 3).forEach((event) => {
        cell.appendChild(el("span", event.isInvite ? "chip invite" : "chip", event.title));
      });
      cell.addEventListener("click", () => {
        state.cal.cursor = dateKey(date);
        state.cal.mode = "day";
        Desk.paint("calendar");
      });
      grid.appendChild(cell);
      day = addDays(day, 1);
    }
    return grid;
  }

  function openEvent(id) {
    state.cal.selected = id;
    state.cal.form = null;
    state.cal.confirmDelete = null;
    Desk.paint("calendar");
  }

  function calendarDetail() {
    const aside = el("aside", "cal-detail");
    if (state.cal.form) aside.appendChild(eventForm());
    else if (state.cal.selected) aside.appendChild(eventCard());
    else aside.append(el("h2", "", "Событие"), el("p", "quiet", "Выберите встречу в сетке или создайте новую."));
    return aside;
  }

  function eventCard() {
    const event = state.events.find((item) => item.id === state.cal.selected);
    const card = el("div", "");
    if (!event) {
      card.appendChild(el("p", "", "Событие не найдено."));
      return card;
    }
    card.append(el("h2", "", event.title));
    if (event.isInvite) card.appendChild(el("p", "invite-mark", "Приглашение"));
    card.append(el("p", "", event.allDay ? "Весь день" : `${event.start.slice(11)} – ${event.end.slice(11)}`));
    if (event.location) card.append(el("p", "", event.location));
    if (event.description) {
      const text = el("p", "cal-desc");
      text.appendChild(linkedText(event, event.description));
      card.appendChild(text);
    }
    if (event.guests.length) {
      card.appendChild(el("p", "k", "Гости"));
      event.guests.forEach((guest) => card.appendChild(el("p", "", guestLabel(guest))));
    }
    if (event.isInvite && !event.inviteStatus) {
      const acts = el("div", "acts");
      const accept = el("button", "btn", "Принять");
      const decline = el("button", "btn ghost", "Отклонить");
      accept.type = "button";
      decline.type = "button";
      accept.addEventListener("click", () => answerInvite(event, "accepted", "calendar_invite_accept"));
      decline.addEventListener("click", () => answerInvite(event, "declined", "calendar_invite_decline"));
      acts.append(accept, decline);
      card.appendChild(acts);
    } else if (event.inviteStatus) {
      card.appendChild(el("p", "", event.inviteStatus === "accepted" ? "Вы приняли приглашение." : "Вы отклонили приглашение."));
    }
    const acts = el("div", "acts");
    const edit = el("button", "btn ghost", "Редактировать");
    const remove = el("button", "btn ghost", "Удалить");
    edit.type = "button";
    remove.type = "button";
    edit.addEventListener("click", () => {
      state.cal.form = Object.assign({}, event, { guests: event.guests.map((guest) => Object.assign({}, guest)) });
      Desk.paint("calendar");
    });
    remove.addEventListener("click", () => {
      if (event.guests.length && state.cal.confirmDelete !== event.id) {
        state.cal.confirmDelete = event.id;
        Desk.paint("calendar");
        return;
      }
      state.events = state.events.filter((item) => item.id !== event.id);
      state.cal.selected = null;
      state.cal.confirmDelete = null;
      persist();
      Desk.paint("calendar");
    });
    acts.append(edit, remove);
    card.appendChild(acts);
    if (state.cal.confirmDelete === event.id) card.appendChild(el("p", "quiet", "У встречи есть гости. Нажмите «Удалить» ещё раз."));
    return card;
  }

  function answerInvite(event, status, action) {
    event.inviteStatus = status;
    logEvent(action, { id: event.id });
    Desk.paint("calendar");
  }

  function linkedText(event, text) {
    const frag = document.createDocumentFragment();
    text.split(/(https?:\/\/[^\s]+)/).forEach((part) => {
      if (!/^https?:/.test(part)) {
        frag.appendChild(document.createTextNode(part));
        return;
      }
      const link = el("button", "cal-link", part);
      link.type = "button";
      link.addEventListener("click", () => {
        logEvent("calendar_link_click", { id: event.id, url: part });
        state.browserUrl = part;
        Desk.openApp("browser");
      });
      frag.appendChild(link);
    });
    return frag;
  }

  function eventForm() {
    const draft = state.cal.form;
    const box = el("form", "cal-form");
    box.appendChild(el("h2", "", draft.id ? "Редактирование" : "Новое событие"));
    const title = document.createElement("input");
    title.name = "title";
    title.placeholder = "Название";
    title.value = draft.title;
    title.required = true;
    const start = document.createElement("input");
    start.type = "datetime-local";
    start.value = draft.start;
    const end = document.createElement("input");
    end.type = "datetime-local";
    end.value = draft.end;
    const allDay = document.createElement("input");
    allDay.type = "checkbox";
    allDay.checked = Boolean(draft.allDay);
    const allWrap = el("label", "cal-check", "Весь день");
    allWrap.prepend(allDay);
    const location = document.createElement("input");
    location.placeholder = "Место";
    location.value = draft.location;
    const description = document.createElement("textarea");
    description.placeholder = "Описание";
    description.value = draft.description;
    const reminder = document.createElement("select");
    [[ "", "Без напоминания" ], [ "15", "За 15 минут" ], [ "60", "За 1 час" ], [ "1440", "За 1 день" ]].forEach(([value, label]) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      if (String(draft.reminder || "") === value) option.selected = true;
      reminder.appendChild(option);
    });
    const guest = document.createElement("input");
    guest.placeholder = "Гость, email";
    const hints = el("div", "suggest");
    guest.addEventListener("input", () => {
      hints.replaceChildren();
      const query = guest.value.trim().toLowerCase();
      if (query.length < 2) return;
      CONTACTS.filter((person) => person.name.toLowerCase().includes(query) || person.email.includes(query)).slice(0, 5).forEach((person) => {
        const button = el("button", "", `${person.name} · ${person.email}`);
        button.type = "button";
        button.addEventListener("click", () => {
          keepDraft(box);
          if (!state.cal.form.guests.some((item) => item.email === person.email)) {
            state.cal.form.guests.push({ email: person.email, status: "pending" });
          }
          Desk.paint("calendar");
        });
        hints.appendChild(button);
      });
    });
    box.append(title, start, end, allWrap, location, description, reminder, el("p", "k", "Гости"), guest, hints);
    draft.guests.forEach((person) => box.appendChild(el("p", "", guestLabel(person))));
    if (draft.error) box.appendChild(el("p", "quiet", draft.error));
    const acts = el("div", "acts");
    const save = el("button", "btn", "Сохранить");
    const cancel = el("button", "btn ghost", "Отмена");
    save.type = "submit";
    cancel.type = "button";
    cancel.addEventListener("click", () => {
      state.cal.form = null;
      Desk.paint("calendar");
    });
    box.addEventListener("submit", (event) => {
      event.preventDefault();
      keepDraft(box);
      const form = state.cal.form;
      if (!form.title.trim()) {
        form.error = "Нужно название.";
        Desk.paint("calendar");
        return;
      }
      if (!form.allDay && new Date(form.end) <= new Date(form.start)) {
        form.error = "Окончание должно быть позже начала.";
        Desk.paint("calendar");
        return;
      }
      const saved = {
        id: form.id || uid("evt"),
        title: form.title.trim(),
        start: form.allDay ? form.start.slice(0, 10) + "T00:00" : form.start,
        end: form.allDay ? form.start.slice(0, 10) + "T23:59" : form.end,
        allDay: Boolean(form.allDay),
        location: form.location.trim(),
        description: form.description,
        guests: form.guests,
        reminder: form.reminder ? Number(form.reminder) : null,
        isInvite: Boolean(form.isInvite),
        inviteStatus: form.inviteStatus || null,
        reminded: false
      };
      const fresh = !form.id;
      if (fresh) state.events.push(saved);
      else state.events = state.events.map((item) => item.id === saved.id ? saved : item);
      if (fresh) logEvent("calendar_event_create", { id: saved.id, title: saved.title });
      state.cal.selected = saved.id;
      state.cal.cursor = saved.start.slice(0, 10);
      state.cal.form = null;
      persist();
      Desk.paint("calendar");
      watchReminders();
    });
    acts.append(save, cancel);
    box.appendChild(acts);
    return box;
  }

  function keepDraft(box) {
    const form = state.cal.form;
    form.title = box.querySelector("[name=title]").value;
    const times = box.querySelectorAll("input[type=datetime-local]");
    form.start = times[0].value;
    form.end = times[1].value;
    form.allDay = box.querySelector("input[type=checkbox]").checked;
    const fields = box.querySelectorAll("input:not([type=checkbox]):not([type=datetime-local]):not([name=title])");
    form.location = fields[0].value;
    form.description = box.querySelector("textarea").value;
    form.reminder = box.querySelector("select").value;
  }

  const CHANNELS = [
    { id: "c-general", title: "общий", topic: "Новости компании, без рабочих файлов" },
    { id: "c-sales", title: "продажи", topic: "Сделки и счета клиентов" },
    { id: "c-projects", title: "проектный-офис", topic: "Планёрки и сроки" },
    { id: "c-it", title: "it", topic: "Доступ, обновления, сбои" },
    { id: "c-hr", title: "кадры", topic: "Отпуска и данные сотрудников" }
  ];

  const DM_PEOPLE = {
    misha: { name: "Миша Соколов", role: "Продажи", city: "Москва", avatar: "assets/people/misha.png" },
    director: { name: "Ирина Лебедева", role: "Генеральный директор", city: "в пути", avatar: "assets/people/director.png" },
    assistant: { name: "Павел Орлов", role: "Ассистент директора", city: "Москва", avatar: "assets/people/assistant.png" },
    colleague: { name: "Марина Котова", role: "Проектный офис", city: "Казань", avatar: "assets/people/colleague.png" },
    it: { name: "Сергей Плотников", role: "IT", city: "Москва", avatar: "assets/people/it.png" },
    hr: { name: "Ольга Репина", role: "Кадры", city: "Москва", avatar: "assets/people/hr.png" },
    security: { name: "Кирилл Антонов", role: "Информационная безопасность", city: "Москва", avatar: "" }
  };

  const DM_EMAIL = {
    "i.lebedeva@nord.example": "director",
    "p.orlov@nord.example": "assistant",
    "m.sokolov@nord.example": "misha",
    "m.kotova@nord.example": "colleague",
    "s.plotnikov@nord.example": "it",
    "o.repina@nord.example": "hr",
    "k.antonov@nord.example": "security"
  };

  function seedRooms() {
    return {
      "c-general": [{ id: "g1", who: "hr", text: "Добро пожаловать в НОРД. Вопросы по доступу пишите в #it.", at: "09:10" }],
      "c-sales": [{ id: "s1", who: "misha", text: "Если по «Северному контуру» придёт счёт, сверяйте его на портале, не в чате.", at: "09:40" }],
      "c-projects": [{ id: "p1", who: "colleague", text: "Планёрка в 10:00, переговорная 3. Повестка лежит в мероприятиях на портале.", at: "09:20" }],
      "c-it": [{ id: "i1", who: "it", text: "Обновление рабочего места ставим из портала. Файл из письма не запускаем.", at: "18:05" }],
      "c-hr": [{ id: "h1", who: "hr", text: "Заявление на отпуск подаётся на портале. В чат достаточно написать даты.", at: "11:00" }]
    };
  }

  function dmSeed(id) {
    const lines = {
      misha: [{ id: "dm-misha", who: "misha", text: "Глянь почту. Там срочное от директора. Я бы сам не платил, пока реквизиты не сверены.", at: "09:05" }],
      director: [{ id: "dm-dir", who: "director", text: "На связи буду урывками. Если что — пиши Павлу.", at: "08:40" }],
      assistant: [{ id: "dm-as", who: "assistant", text: "Директор просила не беспокоить её в полёте. Если письмо про оплату — пришлите тему, сверю по своим каналам.", at: "09:12" }],
      colleague: [{ id: "dm-col", who: "colleague", text: "Я на планёрке в 10:00. Если что-то срочное — лучше своими словами, без ссылок.", at: "09:30" }],
      it: [{ id: "dm-it", who: "it", text: "Обновление ставим с портала. Вложение «от IT» из почты можно не открывать.", at: "18:06" }],
      hr: [{ id: "dm-hr", who: "hr", text: "Карту для зарплаты подтверждаем только в кабинете на портале. Форма из письма не нужна.", at: "11:20" }]
    };
    return lines[id] || [];
  }

  function isChannel(id) {
    return String(id || "").startsWith("c-");
  }

  function chatLines(id) {
    const seed = isChannel(id) ? (state.rooms[id] || []) : dmSeed(id);
    const extra = isChannel(id) ? [] : (state.chat[id] || []);
    const roomExtra = isChannel(id) ? (state.chat[id] || []) : [];
    return seed.concat(roomExtra, extra).filter((line) => line && !state.hiddenMsgs.includes(line.id));
  }

  function unreadCountFor(id) {
    return Math.max(0, chatLines(id).length - (state.seen[id] || 0));
  }

  function unreadTotal() {
    return CHANNELS.reduce((sum, channel) => sum + unreadCountFor(channel.id), 0)
      + Object.keys(DM_PEOPLE).reduce((sum, id) => sum + unreadCountFor(id), 0);
  }

  function wrapBadges() {
    if (Desk.refreshBadges && !Desk.refreshBadges.wrapped) {
      const previous = Desk.refreshBadges;
      const wrapped = () => {
        previous();
        paintMsgBadge();
      };
      wrapped.wrapped = true;
      Desk.refreshBadges = wrapped;
    }
    paintMsgBadge();
  }

  function paintMsgBadge() {
    const icon = document.querySelector('.dicon[data-app="messenger"] .glyph');
    if (!icon) return;
    let badge = document.getElementById("msgBadge");
    if (!badge) {
      badge = el("i", "badge");
      badge.id = "msgBadge";
      icon.appendChild(badge);
    }
    const count = unreadTotal();
    badge.hidden = count === 0;
    badge.textContent = String(count);
  }

  function chatDraft(id) {
    if (!state.chatDrafts[id]) state.chatDrafts[id] = { text: "", files: [] };
    return state.chatDrafts[id];
  }

  function hasDraft(id) {
    const draft = state.chatDrafts[id];
    return !!(draft && (String(draft.text || "").trim() || (draft.files || []).length));
  }

  function saveChatDraft(id, text) {
    const draft = chatDraft(id);
    draft.text = text;
    if (!String(draft.text || "").trim() && !(draft.files || []).length) delete state.chatDrafts[id];
    persist();
  }

  function captureComposer() {
    const area = document.querySelector(".slack-compose textarea");
    if (area && state.chatOpen) saveChatDraft(state.chatOpen, area.value);
  }

  function openChat(id) {
    if (id !== state.chatOpen) captureComposer();
    state.chatOpen = id;
    state.seen[id] = chatLines(id).length;
    state.chatMenu = null;
    persist();
    Desk.paint("messenger");
    paintMsgBadge();
  }

  function postChat(id, line) {
    const pack = state.chat[id] || (state.chat[id] = []);
    pack.push(Object.assign({ id: uid("msg"), at: new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit" }).format(new Date()) }, line));
    if (!isChannel(id)) {
      pack.push({ id: uid("msg"), who: id, text: dmReply(id, line.text), at: "сейчас" });
    }
    state.seen[id] = chatLines(id).length;
    persist();
    paintMsgBadge();
  }

  function dmReply(id, text) {
    const money = /оплат|счет|счёт|реквизит|директор/i.test(text || "");
    if (id === "misha") return money ? "Я бы не платил из письма. Реквизиты должны совпасть с договором на портале." : "Почту открыл? Письмо от директора сверху.";
    if (id === "assistant") return "Тему увидел. Пока директор в полёте, сверю сам и напишу, её ли это просьба.";
    if (id === "it") return "Если файл пришёл письмом и называется обновлением — не запускай. Хватит портала.";
    if (id === "hr") return "Номер карты в письме лучше не оставлять. Нужная форма уже есть на портале.";
    if (id === "director") return "Сообщение дойдёт, когда появится сеть. С оплатой лучше дождаться сверки.";
    if (id === "security") return "Опишите, что произошло: от кого сообщение и что в нём просили. Пароль и код подтверждения сюда не пишите.";
    return "Если это была ссылка, лучше перескажи своими словами. Я открою сама, только когда пойму, от кого она.";
  }

  let focusComposer = false;

  function paintMessenger(body) {
    focusComposer = !!state.chatFocus;
    state.chatFocus = false;
    state.seen[state.chatOpen] = chatLines(state.chatOpen).length;
    persist();
    const shell = el("div", "slack");
    shell.append(chatSide(), chatMain(), chatAbout());
    body.appendChild(shell);
    const log = shell.querySelector(".slack-log");
    if (log) log.scrollTop = log.scrollHeight;
    paintMsgBadge();
  }

  function chatSide() {
    const side = el("aside", "slack-side");
    side.appendChild(el("header", "", "НОРД"));
    const search = document.createElement("input");
    search.placeholder = "Найти канал или человека";
    search.value = state.chatQuery || "";
    search.addEventListener("input", () => {
      captureComposer();
      state.chatQuery = search.value;
      Desk.paint("messenger");
      const again = document.querySelector(".slack-side input");
      if (again) {
        again.focus();
        again.setSelectionRange(again.value.length, again.value.length);
      }
    });
    side.appendChild(search);
    const scroll = el("div", "slack-scroll");
    const query = (state.chatQuery || "").trim().toLowerCase();
    scroll.appendChild(el("p", "slack-label", "Каналы"));
    CHANNELS.filter((channel) => !query || channel.title.includes(query)).forEach((channel) => {
      scroll.appendChild(chatButton(channel.id, `# ${channel.title}`, null, unreadCountFor(channel.id)));
    });
    scroll.appendChild(el("p", "slack-label", "Личные"));
    Object.keys(DM_PEOPLE).filter((id) => {
      const person = DM_PEOPLE[id];
      return !query || person.name.toLowerCase().includes(query) || person.role.toLowerCase().includes(query);
    }).forEach((id) => {
      scroll.appendChild(chatButton(id, DM_PEOPLE[id].name, DM_PEOPLE[id].avatar, unreadCountFor(id)));
    });
    if (query) {
      CONTACTS.filter((person) => person.name.toLowerCase().includes(query) || person.email.includes(query)).forEach((person) => {
        const id = DM_EMAIL[person.email];
        if (!id || scroll.querySelector(`[data-chat="${id}"]`)) return;
        scroll.appendChild(chatButton(id, person.name, "", 0));
      });
    }
    side.appendChild(scroll);
    return side;
  }

  function chatButton(id, title, avatar, unread) {
    const button = el("button", `slack-item${id === state.chatOpen ? " on" : ""}${unread ? " unread" : ""}`);
    button.type = "button";
    button.dataset.chat = id;
    if (avatar) {
      const photo = img(avatar);
      photo.alt = "";
      button.appendChild(photo);
    } else if (!String(id).startsWith("c-")) {
      button.appendChild(el("span", "msg-ava", title.slice(0, 1)));
    }
    button.appendChild(el("span", "slack-name", title));
    const marks = el("span", "slack-marks");
    if (hasDraft(id)) marks.appendChild(draftPencil());
    if (unread) marks.appendChild(el("i", "dot"));
    if (marks.childNodes.length) button.appendChild(marks);
    button.addEventListener("click", () => openChat(id));
    return button;
  }

  function draftPencil() {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("class", "draft-mark");
    svg.setAttribute("aria-label", "Черновик");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("fill", "currentColor");
    path.setAttribute("d", "M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z");
    svg.appendChild(path);
    return svg;
  }

  function fileChip(fileId, onRemove) {
    const node = state.nodes[fileId];
    const chip = el("div", "draft-file");
    chip.append(img(fileArt(node || { type: "file" })), el("span", "", node ? node.name : "Файл"));
    if (onRemove) {
      const remove = el("button", "draft-x", "×");
      remove.type = "button";
      remove.setAttribute("aria-label", "Убрать файл");
      remove.addEventListener("click", onRemove);
      chip.appendChild(remove);
    }
    return chip;
  }

  function chatMain() {
    const id = state.chatOpen;
    const channel = CHANNELS.find((item) => item.id === id);
    const person = DM_PEOPLE[id];
    const draft = state.chatDrafts[id] || { text: "", files: [] };
    const main = el("div", "slack-main");
    const head = el("div", "slack-head");
    head.append(el("b", "", channel ? `# ${channel.title}` : person.name), el("p", "quiet", channel ? channel.topic : person.role));
    const log = el("div", "slack-log");
    chatLines(id).forEach((line) => log.appendChild(messageRow(id, line)));
    const form = el("form", "slack-compose");
    if (draft.files.length) {
      const files = el("div", "draft-files");
      draft.files.forEach((fileId) => {
        files.appendChild(fileChip(fileId, () => {
          draft.files = draft.files.filter((item) => item !== fileId);
          saveChatDraft(id, area.value);
          Desk.paint("messenger");
        }));
      });
      form.appendChild(files);
    }
    const row = el("div", "compose-row");
    const attach = el("button", "btn ghost", "Файл");
    attach.type = "button";
    const area = document.createElement("textarea");
    area.rows = 1;
    area.placeholder = channel ? `Написать в #${channel.title}` : `Сообщение для ${person.name.split(" ")[0]}`;
    area.value = draft.text || "";
    attach.addEventListener("click", () => {
      saveChatDraft(id, area.value);
      state.pick = { kind: "chat", chat: id };
      state.browse.cols = ["disk", "docs"];
      state.browse.sel = null;
      Desk.openApp("files");
    });
    area.addEventListener("input", () => saveChatDraft(id, area.value));
    area.addEventListener("blur", () => saveChatDraft(id, area.value));
    area.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        form.requestSubmit();
      }
    });
    const send = el("button", "btn", "Отправить");
    send.type = "submit";
    row.append(attach, area, send);
    form.appendChild(row);
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const text = area.value.trim();
      const files = (chatDraft(id).files || []).slice();
      if (!text && !files.length) return;
      postChat(id, { who: "you", text, files });
      area.value = "";
      delete state.chatDrafts[id];
      persist();
      Desk.paint("messenger");
    });
    main.append(head, log, form);
    if (focusComposer) window.setTimeout(() => area.focus(), 0);
    return main;
  }

  function messageRow(roomId, line) {
    const author = line.who === "you" ? { name: state.name.trim() || "Вы", avatar: "" } : (DM_PEOPLE[line.who] || { name: "НОРД", avatar: "" });
    const row = el("article", "msg-row");
    if (author.avatar) row.appendChild(img(author.avatar));
    else row.appendChild(el("span", "msg-ava", author.name.slice(0, 1)));
    const body = el("div", "");
    const head = document.createElement("header");
    head.append(el("b", "", author.name), el("span", "", line.at || ""));
    body.appendChild(head);
    if (line.text) {
      const text = el("p", "");
      text.appendChild(linkedChat(line.text));
      body.appendChild(text);
    }
    const files = line.files || (line.file ? [line.file] : []);
    if (files.length) {
      const row = el("div", "msg-files");
      files.forEach((fileId) => row.appendChild(fileChip(fileId)));
      body.appendChild(row);
    }
    const more = el("button", "msg-more", "⋯");
    more.type = "button";
    more.addEventListener("click", (event) => {
      event.stopPropagation();
      state.chatMenu = state.chatMenu === line.id ? null : line.id;
      Desk.paint("messenger");
    });
    row.append(body, more);
    if (state.chatMenu === line.id) {
      const menu = el("div", "msg-menu");
      const copy = el("button", "", "Копировать");
      const remove = el("button", "", "Удалить у себя");
      copy.type = "button";
      remove.type = "button";
      copy.addEventListener("click", () => {
        if (navigator.clipboard) navigator.clipboard.writeText(line.text || "").catch(() => {});
        state.chatMenu = null;
        Desk.paint("messenger");
      });
      remove.addEventListener("click", () => {
        state.hiddenMsgs.push(line.id);
        state.chatMenu = null;
        state.seen[roomId] = chatLines(roomId).length;
        persist();
        Desk.paint("messenger");
      });
      menu.append(copy, remove);
      row.appendChild(menu);
    }
    return row;
  }

  function linkedChat(text) {
    const frag = document.createDocumentFragment();
    String(text).split(/(https?:\/\/[^\s]+)/).forEach((part) => {
      if (!/^https?:/.test(part)) {
        frag.appendChild(document.createTextNode(part));
        return;
      }
      const link = el("button", "cal-link", part);
      link.type = "button";
      link.addEventListener("click", () => {
        state.browserUrl = part;
        Desk.openApp("browser");
      });
      frag.appendChild(link);
    });
    return frag;
  }

  function chatAbout() {
    const aside = el("aside", "slack-about");
    const id = state.chatOpen;
    const channel = CHANNELS.find((item) => item.id === id);
    if (channel) {
      aside.append(el("h2", "", "О канале"), el("p", "", channel.topic), el("p", "k", "Участники"));
      const members = { "c-general": Object.keys(DM_PEOPLE), "c-sales": ["misha"], "c-projects": ["colleague", "assistant"], "c-it": ["it"], "c-hr": ["hr"] }[id] || [];
      members.forEach((member) => aside.appendChild(el("p", "", DM_PEOPLE[member].name)));
      aside.appendChild(el("p", "quiet", `${members.length + 1} участника, включая вас`));
      return aside;
    }
    const person = DM_PEOPLE[id];
    aside.append(el("h2", "", person.name), el("p", "", person.role), el("p", "k", "Город"), el("p", "", person.city));
    const contact = CONTACTS.find((item) => DM_EMAIL[item.email] === id);
    if (contact) aside.append(el("p", "k", "Почта"), el("p", "", contact.email));
    return aside;
  }

  function paint(id, body) {
    if (id === "files") {
      paintFiles(body);
      return true;
    }
    if (id === "mail") {
      paintMail(body);
      return true;
    }
    if (id === "portal") {
      paintPortal(body);
      return true;
    }
    if (id === "calendar") {
      paintCalendar(body);
      return true;
    }
    if (id === "messenger") {
      paintMessenger(body);
      return true;
    }
    if (id === "vpn") {
      paintVpn(body);
      return true;
    }
    return false;
  }

  let vpnBusy = false;

  function paintVpnStat() {
    const button = document.getElementById("vpnStat");
    if (!button) return;
    const on = !!(state.vpn && state.vpn.on);
    button.classList.toggle("on", on);
    button.replaceChildren(el("i", ""), el("span", "", on ? "VPN включён" : "VPN"));
    button.setAttribute("aria-label", on ? "VPN включён" : "VPN выключен");
  }

  function maskCode(code) {
    const text = String(code || "");
    if (text.length <= 10) return "код сохранён";
    return `${text.slice(0, 4)}…${text.slice(-4)}`;
  }

  function paintVpn(body) {
    const vpn = state.vpn;
    const hasCode = !!String(vpn.code || "").trim();
    const phase = vpn.phase || "";
    const shell = el("div", "vpn");
    const power = el("button", `vpn-power${vpn.on ? " on" : ""}${phase ? " busy" : ""}`);
    power.type = "button";
    power.disabled = !hasCode || !!phase;
    power.setAttribute("aria-pressed", vpn.on ? "true" : "false");
    power.setAttribute("aria-label", vpn.on ? "Выключить VPN" : "Включить VPN");
    power.innerHTML = `<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="36" r="16" fill="none" stroke="currentColor" stroke-width="4"/><path d="M32 12v16" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg>`;
    power.addEventListener("click", () => {
      if (vpnBusy || !hasCode) return;
      const next = !vpn.on;
      vpnBusy = true;
      vpn.phase = next ? "connect" : "disconnect";
      Desk.paint("vpn");
      window.setTimeout(() => {
        vpn.on = next;
        vpn.phase = "";
        vpnBusy = false;
        persist();
        Desk.paint("vpn");
        paintVpnStat();
      }, next ? 900 : 500);
    });
    const title = phase === "connect" ? "Подключение…" : phase === "disconnect" ? "Отключение…" : vpn.on ? "Подключено" : "Отключено";
    const note = !hasCode
      ? "Сначала вставьте код, который прислал IT."
      : vpn.on
        ? "Сеть компании включена. Пока это ни на что не влияет."
        : "Код сохранён. Включите сеть, когда она понадобится.";
    shell.append(power, el("h2", "", title), el("p", "quiet", note));
    const card = el("div", "vpn-card");
    card.appendChild(el("p", "k", "Код от IT"));
    if (hasCode && !vpn.editing) {
      const row = el("div", "vpn-saved");
      row.append(el("b", "", maskCode(vpn.code)), el("span", "", "можно заменить"));
      const edit = el("button", "btn vpn-btn", "Изменить");
      edit.type = "button";
      edit.addEventListener("click", () => {
        vpn.editing = true;
        Desk.paint("vpn");
      });
      card.append(row, edit);
    } else {
      const area = document.createElement("textarea");
      area.value = vpn.code || "";
      area.placeholder = "Вставьте код подключения";
      area.addEventListener("input", () => { vpn.draft = area.value; });
      const save = el("button", "btn vpn-btn", "Сохранить код");
      save.type = "button";
      save.addEventListener("click", () => {
        vpn.code = area.value.trim();
        vpn.draft = "";
        vpn.editing = false;
        if (!vpn.code) vpn.on = false;
        persist();
        Desk.paint("vpn");
        paintVpnStat();
      });
      card.appendChild(area);
      const actions = el("div", "vpn-actions");
      actions.appendChild(save);
      if (hasCode) {
        const cancel = el("button", "btn vpn-btn ghost", "Отмена");
        cancel.type = "button";
        cancel.addEventListener("click", () => {
          vpn.editing = false;
          vpn.draft = "";
          Desk.paint("vpn");
        });
        actions.appendChild(cancel);
      }
      card.appendChild(actions);
    }
    shell.appendChild(card);
    body.appendChild(shell);
  }

  function activeFolder() {
    const cols = state.browse.cols;
    return state.nodes[cols[cols.length - 1]] ? cols[cols.length - 1] : "docs";
  }

  function paintFiles(body) {
    const shell = el("div", "finder");
    shell.appendChild(finderSide());
    const main = el("div", "finder-main");
    main.append(finderBar(), finderView());
    shell.appendChild(main);
    body.appendChild(shell);
  }

  function finderSide() {
    const side = el("aside", "places");
    const places = ["desktop", "docs", "downloads", "trash", "disk"];
    const current = [...state.browse.cols].reverse().find((id) => places.includes(id));
    side.appendChild(el("p", "place-label", "Избранное"));
    [["desktop", "Рабочий стол"], ["docs", "Документы"], ["downloads", "Загрузки"], ["trash", "Корзина"]].forEach(([id, name]) => {
      side.appendChild(placeButton(id, name, current === id));
    });
    side.appendChild(el("p", "place-label", "Места"));
    side.appendChild(placeButton("disk", "Диск", current === "disk"));
    return side;
  }

  function placeButton(id, name, on) {
    const button = el("button", on ? "on" : "", name);
    button.type = "button";
    button.addEventListener("click", () => {
      state.browse.cols = [id];
      state.browse.sel = null;
      state.cwd = id;
      Desk.paint("files");
    });
    return button;
  }

  function finderBar() {
    const bar = el("div", "finder-bar");
    const back = el("button", "win-btn", "‹");
    back.type = "button";
    back.setAttribute("aria-label", "Назад");
    back.disabled = state.browse.cols.length < 2;
    back.addEventListener("click", () => {
      state.browse.cols.pop();
      state.browse.sel = null;
      state.cwd = activeFolder();
      Desk.paint("files");
    });
    const folder = state.nodes[activeFolder()];
    bar.append(back, el("strong", "", folder ? folder.name : "Файлы"));
    const make = el("button", "btn", "Создать папку");
    make.type = "button";
    make.addEventListener("click", () => createFolder(activeFolder(), 0, 0));
    bar.appendChild(make);
    if (activeFolder() === "trash") {
      const clear = el("button", "btn ghost", "Очистить корзину");
      clear.type = "button";
      clear.addEventListener("click", emptyTrash);
      bar.appendChild(clear);
    }
    if (state.pick && state.pick.kind === "save") {
      const source = state.nodes[state.pick.nodeId];
      const save = el("button", "btn", "Сохранить сюда");
      save.type = "button";
      if (source && /УЧ-1042/i.test(source.name)) save.dataset.coach = "pay-save";
      save.addEventListener("click", () => {
        const saved = state.nodes[state.pick.nodeId];
        const folder = activeFolder();
        const nodeId = state.pick.nodeId;
        transfer(saved ? `Сохранение «${saved.name}»` : "Сохранение файла", () => {
          copyNode(nodeId, folder);
          state.pick = null;
          if (saved && /УЧ-1042/i.test(saved.name)) coachDone("download");
          Desk.paint("files");
        });
      });
      bar.appendChild(save);
    }
    if (state.pick && state.pick.kind === "attach") bar.appendChild(el("span", "hint", "Выберите файл — он приложится к письму"));
    if (state.pick && state.pick.kind === "pay") bar.appendChild(el("span", "hint", "Выберите файл счёта на диске"));
    if (state.pick && state.pick.kind === "chat") bar.appendChild(el("span", "hint", "Выберите файл — он добавится к сообщению"));
    return bar;
  }

  function finderView() {
    const view = el("div", "finder-view");
    const cols = el("div", "cols");
    state.browse.cols.forEach((folderId, index) => {
      const column = el("div", "col");
      const items = children(folderId);
      if (!items.length) column.appendChild(el("p", "col-empty", "Папка пустая"));
      items.forEach((node) => {
        const open = node.type !== "file" && state.browse.cols[index + 1] === node.id;
        const selected = state.browse.sel === node.id || open;
        const row = el("button", `col-row${selected ? " on" : ""}`);
        row.type = "button";
        row.append(img(fileArt(node)), el("span", "", node.name));
        if (node.type !== "file") row.appendChild(el("i", "chev", "›"));
        if (state.pick && state.pick.kind === "pay" && /УЧ-1042/i.test(node.name)) row.dataset.coach = "pay-file";
        row.addEventListener("click", () => chooseNode(node, index));
        row.addEventListener("dblclick", () => {
          if (node.type === "file" && !(state.pick && (state.pick.kind === "attach" || state.pick.kind === "pay" || state.pick.kind === "chat"))) openNode(node);
        });
        row.addEventListener("contextmenu", (event) => {
          event.preventDefault();
          event.stopPropagation();
          nodeMenu(node, event.clientX, event.clientY);
        });
        column.appendChild(row);
      });
      column.addEventListener("contextmenu", (event) => {
        if (event.target !== column) return;
        event.preventDefault();
        openMenu(event.clientX, event.clientY, [["Создать папку", () => createFolder(folderId, 0, 0)]]);
      });
      cols.appendChild(column);
    });
    view.append(cols, finderPreview());
    return view;
  }

  function finderPreview() {
    const pane = el("aside", "preview-pane");
    const node = state.nodes[state.browse.sel];
    if (!node || node.type !== "file") {
      pane.append(el("p", "preview-empty", "Выберите файл"));
      return pane;
    }
    const shot = node.preview ? img(node.preview) : img(fileArt(node));
    shot.className = node.preview ? "page-shot" : "file-shot";
    pane.appendChild(shot);
    pane.appendChild(el("b", "", node.name));
    pane.appendChild(el("p", "preview-note", node.kind === "pdf" ? "PDF" : node.kind === "exe" ? "Программа" : "Документ"));
    const open = el("button", "btn", "Открыть");
    open.type = "button";
    open.addEventListener("click", () => openNode(node));
    pane.appendChild(open);
    return pane;
  }

  let transferring = false;
  function transfer(title, done) {
    if (transferring) return;
    transferring = true;
    const layer = el("div", "transfer");
    layer.setAttribute("role", "status");
    const card = el("div", "transfer-card");
    card.append(el("span", "spin"), el("p", "", title));
    layer.appendChild(card);
    document.getElementById("desk").appendChild(layer);
    window.setTimeout(() => {
      layer.classList.add("out");
      window.setTimeout(() => {
        layer.remove();
        transferring = false;
        done();
      }, 180);
    }, 900);
  }

  function chooseNode(node, colIndex) {
    if (state.pick && state.pick.kind === "attach" && node.type === "file") {
      transfer(`Загрузка «${node.name}»`, () => addAttachment(node.id));
      return;
    }
    if (state.pick && state.pick.kind === "chat" && node.type === "file") {
      const chatId = state.pick.chat || state.chatOpen;
      const fileId = node.id;
      transfer(`Загрузка «${node.name}»`, () => {
        const draft = chatDraft(chatId);
        if (!draft.files.includes(fileId)) draft.files.push(fileId);
        state.pick = null;
        state.chatOpen = chatId;
        state.chatFocus = true;
        persist();
        Desk.openApp("messenger");
      });
      return;
    }
    if (state.pick && state.pick.kind === "pay" && node.type === "file") {
      transfer(`Загрузка «${node.name}»`, () => {
        state.payFile = node.id;
        state.pick = null;
        state.portalSection = "pay";
        coachDone("upload");
        Desk.openApp("portal");
      });
      return;
    }
    state.browse.cols = state.browse.cols.slice(0, colIndex + 1);
    if (node.type !== "file") {
      state.browse.cols.push(node.id);
      state.browse.sel = null;
      state.cwd = node.id;
    } else {
      state.browse.sel = node.id;
      state.cwd = node.parent;
    }
    Desk.paint("files");
  }

  function addAttachment(id) {
    const compose = state.mailUi.compose;
    if (compose && !compose.files.includes(id)) compose.files.push(id);
    state.pick = null;
    state.mailUi.mode = "compose";
    Desk.openApp("mail");
  }

  function paintMail(body) {
    const ui = state.mailUi;
    const composing = ui.view === "mail" && ui.mode === "compose";
    const shell = el("div", `mail-shell${ui.view === "contacts" || composing ? " wide" : ""}`);
    shell.appendChild(folderRail());
    if (ui.view === "contacts") {
      shell.appendChild(contactBook());
      body.appendChild(shell);
      return;
    }
    if (composing) shell.appendChild(composer());
    else shell.append(letterList(), letterView());
    body.appendChild(shell);
  }

  function folderRail() {
    const rail = el("div", "folders");
    const write = el("button", "write", "Написать");
    write.type = "button";
    write.addEventListener("click", () => beginCompose());
    rail.appendChild(write);
    [["inbox", "Входящие"], ["sent", "Отправленные"], ["drafts", "Черновики"], ["spam", "Спам"], ["trash", "Удалённые"]].forEach(([id, title]) => {
      const count = id === "inbox"
        ? state.letters.filter((letter) => letter.folder === "inbox" && !letter.read).length
        : id === "drafts"
          ? state.letters.filter((letter) => letter.folder === "drafts").length
          : 0;
      const reading = state.mailUi.view === "mail" && state.mailUi.mode !== "compose" && state.mailUi.folder === id;
      const button = el("button", reading ? "on" : "", count ? `${title} · ${count}` : title);
      button.type = "button";
      button.addEventListener("click", () => openFolder(id));
      rail.appendChild(button);
    });
    const people = el("button", state.mailUi.view === "contacts" ? "on" : "", "Контакты");
    people.type = "button";
    people.addEventListener("click", () => {
      state.mailUi.view = "contacts";
      Desk.paint("mail");
    });
    rail.appendChild(people);
    return rail;
  }

  function letterList() {
    const list = el("div", "list");
    state.letters.filter((letter) => letter.folder === state.mailUi.folder).forEach((letter) => {
      const button = el("button", `row${letter.id === state.mailUi.letter ? " on" : ""}${letter.read ? "" : " unread"}`);
      button.type = "button";
      button.append(el("b", "", letter.from.name), el("span", "sub", letter.subject), el("small", "", letter.stamp));
      button.addEventListener("click", () => {
        if (letter.folder === "drafts") {
          editDraft(letter);
          return;
        }
        state.mailUi.letter = letter.id;
        state.mailUi.mode = "read";
        Desk.paint("mail");
      });
      list.appendChild(button);
    });
    if (!list.childElementCount) list.appendChild(el("p", "sheet quiet", "Писем нет."));
    return list;
  }

  function currentLetter() {
    return state.letters.find((letter) => letter.id === state.mailUi.letter && letter.folder === state.mailUi.folder) || state.letters.find((letter) => letter.folder === state.mailUi.folder);
  }

  function letterView() {
    const letter = currentLetter();
    const view = el("article", "sheet");
    if (!letter) {
      view.appendChild(el("p", "", "Выберите письмо."));
      return view;
    }
    state.mailUi.letter = letter.id;
    if (!letter.read) {
      letter.read = true;
      persist();
      renderDesk();
      Desk.applyIcons();
      Desk.refreshBadges();
    }
    view.append(el("h2", "", letter.subject), meta("От", personLine(letter.from)), meta("Кому", letter.to.map(personLine).join(", ")));
    if (letter.cc.length) view.appendChild(meta("Копия", letter.cc.map(personLine).join(", ")));
    view.appendChild(meta("Когда", letter.stamp));
    letter.thread.forEach((part) => {
      const block = el("div", "chain");
      block.append(el("b", "", part.author), el("p", "meta", `${part.email} · ${part.stamp}`), el("p", "", part.text));
      view.appendChild(block);
    });
    letter.files.forEach((id) => {
      const file = state.nodes[id];
      if (!file) return;
      const row = el("div", "acts");
      const open = el("button", "attach");
      open.type = "button";
      const thumb = file.preview ? img(file.preview) : img(fileArt(file));
      open.append(thumb, el("span", "", file.name));
      open.addEventListener("click", () => {
        if (letter.id === "director") Desk.addLedger("dir-file", "Открыто вложение с реквизитами из письма директора.", 2);
        if (file.preview) Desk.openPreview(file.preview);
        else Desk.openNote(file.name, file.note || "");
      });
      const save = el("button", "btn ghost", "Скачать");
      save.type = "button";
      if (/УЧ-1042/i.test(file.name) || id === "invoice") save.dataset.coach = "pay-download";
      save.addEventListener("click", () => {
        transfer(`Скачивание «${file.name}»`, () => {
          state.pick = { kind: "save", nodeId: id };
          state.browse.cols = ["downloads"];
          state.browse.sel = null;
          state.cwd = "downloads";
          Desk.openApp("files");
        });
      });
      row.append(open, save);
      view.appendChild(row);
    });
    const acts = el("div", "acts");
    const actions = letter.folder === "drafts"
      ? [["Продолжить", () => editDraft(letter)], ["Удалить", () => moveLetter(letter, "gone")]]
      : [["Ответить", () => startReply(letter, false)], ["Ответить всем", () => startReply(letter, true)], ["Переслать", () => startForward(letter)], ["Спам", () => moveLetter(letter, "spam")], ["Удалить", () => moveLetter(letter, letter.folder === "trash" ? "gone" : "trash")]];
    actions.forEach(([label, run]) => {
      const button = el("button", label === "Ответить" ? "btn" : "btn ghost", label);
      button.type = "button";
      button.addEventListener("click", run);
      acts.appendChild(button);
    });
    view.appendChild(acts);
    if (letter.id === "director" || letter.id === "invoice" || letter.files.includes("invoice")) offerPayCoach();
    return view;
  }

  const coachText = {
    "pay-download": "Счёт оплачивается в корпоративном портале. Для начала нужно сохранить счёт на компьютер.",
    "pay-save": "Сохраните счёт в папку на компьютере.",
    "pay-portal": "Зайдите в портал.",
    "pay-upload": "Загрузите счёт.",
    "pay-file": "Загрузите счёт.",
    "pay-confirm": "Для подтверждения, нажмите на кнопку оплаты."
  };

  function coachStep() {
    const value = state.guides && state.guides.payInvoice;
    return value === "download" || value === "portal" || value === "upload" || value === "pay" ? value : "";
  }

  function offerPayCoach() {
    if (coachStep() || state.guides.payInvoice === "done" || state.guides.payInvited) return;
    state.guides.payInvited = true;
    persist();
    Desk.toast({
      title: "Как оплачивать счета?",
      text: "Нажмите, и подсказки появятся на кнопках.",
      icon: "assets/icons/icon-portal.png",
      ms: 12000,
      onClick: () => {
        state.guides.payInvoice = "download";
        persist();
        watchCoach();
      }
    });
  }

  function coachDone(step) {
    if (coachStep() !== step) return;
    const next = { download: "portal", portal: "upload", upload: "pay", pay: "done" };
    state.guides.payInvoice = next[step];
    persist();
    if (state.guides.payInvoice === "done") clearCoach();
    else placeCoach();
  }

  function watchCoach() {
    if (watchCoach.timer) return;
    watchCoach.timer = window.setInterval(placeCoach, 250);
    placeCoach();
  }

  function clearCoach() {
    window.clearInterval(watchCoach.timer);
    watchCoach.timer = 0;
    const ring = document.getElementById("coachRing");
    const tip = document.getElementById("coachTip");
    if (ring) ring.remove();
    if (tip) tip.remove();
  }

  function coachTarget() {
    const step = coachStep();
    if (step === "download") return document.querySelector("[data-coach='pay-save']") || document.querySelector("[data-coach='pay-download']");
    if (step === "portal") return document.querySelector(".dicon[data-app='portal']");
    if (step === "upload") return document.querySelector("[data-coach='pay-file']") || document.querySelector("[data-coach='pay-upload']");
    if (step === "pay") return document.querySelector("[data-coach='pay-confirm']");
    return null;
  }

  function placeCoach() {
    const target = coachTarget();
    if (!target) {
      const ring = document.getElementById("coachRing");
      const tip = document.getElementById("coachTip");
      if (ring) ring.hidden = true;
      if (tip) tip.hidden = true;
      return;
    }
    if (placeCoach.last !== target) {
      placeCoach.last = target;
      target.scrollIntoView({ block: "center", inline: "nearest" });
    }
    const desk = document.getElementById("desk").getBoundingClientRect();
    const rect = target.getBoundingClientRect();
    let ring = document.getElementById("coachRing");
    let tip = document.getElementById("coachTip");
    if (!ring) {
      ring = document.createElement("div");
      ring.id = "coachRing";
      tip = document.createElement("div");
      tip.id = "coachTip";
      const skip = document.createElement("button");
      skip.type = "button";
      skip.className = "coach-skip";
      skip.textContent = "Пропустить";
      skip.addEventListener("click", () => {
        state.guides.payInvoice = "done";
        persist();
        clearCoach();
      });
      tip.append(document.createElement("p"), skip);
      document.getElementById("desk").append(ring, tip);
    }
    ring.hidden = false;
    tip.hidden = false;
    const pad = 6;
    ring.style.left = `${rect.left - desk.left - pad}px`;
    ring.style.top = `${rect.top - desk.top - pad}px`;
    ring.style.width = `${rect.width + pad * 2}px`;
    ring.style.height = `${rect.height + pad * 2}px`;
    tip.querySelector("p").textContent = coachText[target.dataset.coach || "pay-portal"];
    const width = 250;
    let left = rect.right - desk.left + 14;
    let top = rect.top - desk.top;
    if (left + width > desk.width - 12) left = Math.max(12, rect.left - desk.left - width - 14);
    if (top + 110 > desk.height - 80) top = Math.max(12, desk.height - 190);
    tip.style.left = `${left}px`;
    tip.style.top = `${top}px`;
  }

  function portalGroups() {
    return [
      ["Общее", [["news", "Новости"], ["digest", "Рассылка"], ["people", "Справочник"], ["events", "Мероприятия"], ["requests", "Заявления"]]],
      ["Финансы", [["pay", "Оплата контрагентам"], ["registry", "Реестр счетов"], ["history", "История платежей"], ["overdue", "Просрочка"], ["docs", "Договоры"]]],
      ["IT", [["access", "Заявки на доступ"], ["software", "Установка ПО"], ["tickets", "Тикеты"], ["incidents", "Инциденты"], ["updates", "Обновления"]]],
      ["Кадры", [["hr", "Кабинет сотрудника"]]]
    ];
  }

  function newsPage() {
    const page = el("div", "");
    page.append(el("h2", "", "Новости"), el("p", "quiet", "Объявления компании. Рабочие файлы здесь не раздают."));
    [
      ["20 ноября", "Срок сверки счетов", "Счета, которые не сверены с договором, сегодня до 16:30 остаются в работе."],
      ["18 ноября", "Клиент рабочего места 4.2", "Обновление ставится из раздела «Обновления». Письмо с вложением к нему не относится."],
      ["12 ноября", "Кадровый день", "Заявления на декабрь лучше подать до конца недели."]
    ].forEach(([date, title, text]) => {
      const card = el("article", "portal-card");
      card.append(el("span", "k", date), el("b", "", title), el("p", "", text));
      page.appendChild(card);
    });
    return page;
  }

  function digestPage() {
    const page = el("div", "");
    page.append(el("h2", "", "Рассылка"), el("p", "quiet", "Дайджест за неделю. Это не письмо и не просьба что-то оплатить."));
    const card = el("article", "portal-card");
    card.append(
      el("b", "", "Неделя 17–21 ноября"),
      el("p", "", "Проектный офис провёл планёрку. Продажи закрыли поставку «Северной линии». IT выложило клиент 4.2."),
      el("p", "", "На следующей неделе — кадровый день и сверка открытых счетов.")
    );
    page.appendChild(card);
    return page;
  }

  function peoplePage() {
    const page = el("div", "");
    page.append(el("h2", "", "Справочник"), el("p", "quiet", "Телефон и почта сотрудника. Просьбу из письма с этими данными лучше сверить здесь."));
    const phones = {
      "i.lebedeva@nord.example": "+7 495 000-10-01",
      "p.orlov@nord.example": "+7 495 000-10-02",
      "m.sokolov@nord.example": "+7 495 000-20-14",
      "m.kotova@nord.example": "+7 843 000-30-08",
      "s.plotnikov@nord.example": "+7 495 000-40-03",
      "o.repina@nord.example": "+7 495 000-50-06",
      "k.antonov@nord.example": "+7 495 000-60-09"
    };
    CONTACTS.forEach((person) => {
      const row = el("div", "info-row");
      const who = el("div", "");
      who.append(el("b", "", person.name), el("div", "meta", `${person.dept} · ${person.email}`), el("div", "meta", phones[person.email] || ""));
      const write = el("button", "btn ghost", "Написать");
      write.type = "button";
      write.addEventListener("click", () => {
        const id = DM_EMAIL[person.email];
        if (!id) return;
        state.chatOpen = id;
        Desk.openApp("messenger");
      });
      row.append(who, write);
      page.appendChild(row);
    });
    return page;
  }

  function eventsPage() {
    const page = el("div", "");
    page.append(el("h2", "", "Мероприятия"), el("p", "quiet", "Собрания компании. Личный календарь открывается отдельно."));
    (state.events || []).forEach((event) => {
      const row = el("div", "info-row");
      const text = el("div", "");
      text.append(el("b", "", event.title), el("div", "meta", `${event.start.replace("T", " ")}${event.isInvite ? " · приглашение" : ""}`));
      const open = el("button", "btn ghost", "В календарь");
      open.type = "button";
      open.addEventListener("click", () => {
        state.cal.selected = event.id;
        state.cal.cursor = event.start.slice(0, 10);
        state.cal.form = null;
        Desk.openApp("calendar");
      });
      row.append(text, open);
      page.appendChild(row);
    });
    return page;
  }

  function requestsPage() {
    const page = el("div", "");
    page.append(el("h2", "", "Заявления"), el("p", "quiet", "Отпуск, командировка, больничный или отгул. Статус виден здесь."));
    const form = el("form", "portal-form");
    const kind = document.createElement("select");
    ["Отпуск", "Командировка", "Больничный", "Отгул"].forEach((title) => {
      const option = document.createElement("option");
      option.textContent = title;
      kind.appendChild(option);
    });
    const detail = document.createElement("input");
    detail.placeholder = "Даты или город";
    const save = el("button", "btn", "Подать");
    save.type = "submit";
    form.append(kind, detail, save);
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!detail.value.trim()) return;
      state.requests.unshift({ id: uid("req"), kind: kind.value, detail: detail.value.trim(), status: "На рассмотрении" });
      persist();
      Desk.paint("portal");
    });
    page.appendChild(form);
    state.requests.forEach((item) => page.appendChild(statusRow(item.kind, item.detail, item.status)));
    return page;
  }

  function registryPage() {
    const page = el("div", "");
    page.append(el("h2", "", "Реестр счетов"), el("p", "quiet", "Входящие счета и статус согласования. Проведение — в оплате контрагентам."));
    const paid = (state.payments || []).some((item) => item.doc === "УЧ-1042");
    page.appendChild(simpleTable(
      ["Контрагент", "Документ", "Сумма", "Статус"],
      [
        ["ООО «Северный контур»", "УЧ-1042", "186 400", paid ? "Проведён" : "Ждёт файл"],
        ["АО «Балтснаб»", "УЧ-1050", "64 000", "На согласовании"],
        ["ИП Сорокин", "УЧ-1033", "9 800", "Отклонён"]
      ]
    ));
    return page;
  }

  function historyPage() {
    const page = el("div", "");
    page.append(el("h2", "", "История платежей"));
    const filter = document.createElement("input");
    filter.placeholder = "Контрагент, документ или сумма";
    filter.value = state.payFilter || "";
    filter.addEventListener("input", () => {
      state.payFilter = filter.value;
      Desk.paint("portal");
      const again = document.querySelector(".portal-page input");
      if (again) {
        again.focus();
        again.setSelectionRange(again.value.length, again.value.length);
      }
    });
    page.appendChild(filter);
    const query = (state.payFilter || "").trim().toLowerCase();
    const rows = (state.payments || []).filter((row) => !query || `${row.who} ${row.doc} ${row.sum} ${row.date}`.toLowerCase().includes(query));
    page.appendChild(simpleTable(["Дата", "Контрагент", "Документ", "Сумма", "Статус"], rows.map((row) => [row.date, row.who, row.doc, row.sum, row.status])));
    return page;
  }

  function overduePage() {
    const page = el("div", "");
    page.append(el("h2", "", "Просрочка"), el("p", "quiet", "Напоминание о счёте, срок которого уже сегодня."));
    const paid = (state.payments || []).some((item) => item.doc === "УЧ-1042");
    if (paid) page.appendChild(el("p", "", "Просроченных счетов нет."));
    else page.appendChild(statusRow("ООО «Северный контур»", "УЧ-1042 · 186 400 · срок сегодня", "Не проведён"));
    return page;
  }

  function docsPage() {
    const page = el("div", "");
    page.append(el("h2", "", "Договоры"), contract("ООО «Северный контур»", "Договор 14-С, поставка"), contract("АО «Балтснаб»", "Договор 08-Б"));
    return page;
  }

  function accessPage() {
    const page = el("div", "");
    page.append(el("h2", "", "Заявки на доступ"), el("p", "quiet", "Запрос на систему. Права появляются после согласования, не по письму."));
    const form = el("form", "portal-form");
    const system = document.createElement("input");
    system.placeholder = "Система, например почта или диск";
    const why = document.createElement("input");
    why.placeholder = "Зачем доступ";
    const save = el("button", "btn", "Отправить");
    save.type = "submit";
    form.append(system, why, save);
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!system.value.trim()) return;
      state.accessReqs.unshift({ id: uid("acc"), system: system.value.trim(), why: why.value.trim(), status: "На согласовании" });
      persist();
      Desk.paint("portal");
    });
    page.appendChild(form);
    state.accessReqs.forEach((item) => page.appendChild(statusRow(item.system, item.why || "Без пояснения", item.status)));
    return page;
  }

  function softwarePage() {
    const page = el("div", "");
    page.append(el("h2", "", "Установка ПО"), el("p", "quiet", "Каталог разрешённых программ. Установщик из письма сюда не входит."));
    [
      ["Клиент рабочего места 4.2", "Уже в разделе обновлений"],
      ["Редактор договоров", "Стоит на рабочих местах продаж"],
      ["Средство видеосвязи НОРД", "Для планёрок"]
    ].forEach(([title, note]) => {
      const row = el("div", "info-row");
      const text = el("div", "");
      text.append(el("b", "", title), el("div", "meta", note));
      const ask = el("button", "btn ghost", state.softReqs.includes(title) ? "Запрошено" : "Запросить");
      ask.type = "button";
      ask.disabled = state.softReqs.includes(title);
      ask.addEventListener("click", () => {
        state.softReqs.push(title);
        persist();
        Desk.paint("portal");
      });
      row.append(text, ask);
      page.appendChild(row);
    });
    return page;
  }

  function ticketsPage() {
    const page = el("div", "");
    page.append(el("h2", "", "Тикеты"), el("p", "quiet", "Обращение в поддержку и его статус."));
    const form = el("form", "portal-form");
    const title = document.createElement("input");
    title.placeholder = "Что случилось";
    const save = el("button", "btn", "Создать");
    save.type = "submit";
    form.append(title, save);
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!title.value.trim()) return;
      state.tickets.unshift({ id: uid("tkt"), title: title.value.trim(), who: state.name.trim() || "Вы", status: "Новый" });
      persist();
      Desk.paint("portal");
    });
    page.appendChild(form);
    state.tickets.forEach((item) => page.appendChild(statusRow(item.title, item.who, item.status)));
    return page;
  }

  function incidentsPage() {
    const page = el("div", "");
    page.append(el("h2", "", "Журнал инцидентов"), el("p", "quiet", "Записи IT. Сюда не добавляют пароли и коды."));
    page.appendChild(simpleTable(
      ["Дата", "Событие", "Статус"],
      [
        ["18 ноября", "Почта не принимала вложения час", "Закрыт"],
        ["4 ноября", "Краткий сбой входа на портал", "Закрыт"]
      ]
    ));
    return page;
  }

  function updatesPage() {
    const page = el("div", "");
    page.append(el("h2", "", "Обновления"), el("p", "", "Клиент рабочего места 4.2 от 18 ноября. Его ставят из этого раздела."));
    return page;
  }

  function hrPage() {
    const page = el("div", "");
    page.append(el("h2", "", "Кабинет сотрудника"), el("p", "", "Карта для зарплаты подтверждается здесь. Текущая заканчивается на 4412."));
    return page;
  }

  function statusRow(title, detail, status) {
    const row = el("div", "info-row");
    const text = el("div", "");
    text.append(el("b", "", title), el("div", "meta", detail));
    row.append(text, el("b", "", status));
    return row;
  }

  function simpleTable(headings, rows) {
    const table = document.createElement("table");
    table.className = "pay-table";
    const head = document.createElement("tr");
    headings.forEach((title) => head.appendChild(el("th", "", title)));
    table.appendChild(head);
    rows.forEach((row) => {
      const line = document.createElement("tr");
      row.forEach((value) => line.appendChild(el("td", "", value)));
      table.appendChild(line);
    });
    return table;
  }

  function paintPortal(body) {
    const shell = el("div", "portal");
    const nav = document.createElement("nav");
    const yours = (state.roles || []).includes("finance") ? "Финансы" : "Общее";
    portalGroups().forEach(([group, items]) => {
      nav.appendChild(el("p", "group", group === yours ? `${group} · ваш` : group));
      items.forEach(([id, title]) => {
        const button = el("button", state.portalSection === id ? "on" : "", title);
        button.type = "button";
        button.addEventListener("click", () => {
          state.portalSection = id;
          Desk.paint("portal");
        });
        nav.appendChild(button);
      });
    });
    const page = el("div", "portal-page");
    const pages = {
      news: newsPage,
      digest: digestPage,
      people: peoplePage,
      events: eventsPage,
      requests: requestsPage,
      pay: payPage,
      registry: registryPage,
      history: historyPage,
      overdue: overduePage,
      docs: docsPage,
      access: accessPage,
      software: softwarePage,
      tickets: ticketsPage,
      incidents: incidentsPage,
      updates: updatesPage,
      hr: hrPage
    };
    page.appendChild((pages[state.portalSection] || payPage)());
    shell.append(nav, page);
    body.appendChild(shell);
    if (coachStep() === "portal") coachDone("portal");
  }

  function contract(name, text) {
    const row = el("div", "pay-file");
    row.append(el("b", "", name), el("span", "", text));
    return row;
  }

  function payPage() {
    const page = el("div", "");
    page.append(el("h2", "", "Оплата контрагентам"), el("p", "quiet", "Счёт загружают файлом с компьютера и проводят здесь."));
    const file = state.nodes[state.payFile];
    const picked = el("div", "pay-file");
    if (file) {
      picked.append(img(fileArt(file)), el("b", "", file.name));
      const clear = el("button", "btn ghost", "Убрать");
      clear.type = "button";
      clear.addEventListener("click", () => {
        state.payFile = null;
        Desk.paint("portal");
      });
      picked.appendChild(clear);
    } else picked.appendChild(el("span", "", "Файл ещё не выбран"));
    const load = el("button", "btn", "Загрузить счёт");
    load.type = "button";
    load.dataset.coach = "pay-upload";
    load.addEventListener("click", () => {
      state.pick = { kind: "pay" };
      state.browse.cols = ["disk", "docs"];
      state.browse.sel = null;
      state.cwd = "docs";
      Desk.openApp("files");
    });
    const pay = el("button", file ? "btn" : "btn ghost", "Оплатить");
    pay.type = "button";
    pay.dataset.coach = "pay-confirm";
    pay.disabled = !file;
    pay.addEventListener("click", () => conductPayment(file));
    const acts = el("div", "acts");
    acts.append(load, pay);
    page.append(picked, acts);
    if (state.payNote) page.appendChild(el("p", "", state.payNote));
    const table = document.createElement("table");
    table.className = "pay-table";
    const head = document.createElement("tr");
    ["Дата", "Контрагент", "Документ", "Сумма", "Статус"].forEach((title) => head.appendChild(el("th", "", title)));
    table.appendChild(head);
    state.payments.forEach((row) => {
      const line = document.createElement("tr");
      [row.date, row.who, row.doc, row.sum, row.status].forEach((value) => line.appendChild(el("td", "", value)));
      table.appendChild(line);
    });
    page.appendChild(table);
    return page;
  }

  function conductPayment(node) {
    if (!node) return;
    const known = /УЧ-1042/i.test(node.name);
    const row = known
      ? { date: "21 ноября", who: "ООО «Северный контур»", doc: "УЧ-1042", sum: "186 400", status: "Проведено" }
      : { date: "21 ноября", who: "По файлу", doc: node.name.replace(/\.[^.]+$/, ""), sum: "—", status: "Проведено" };
    if (known && state.payments.some((item) => item.doc === "УЧ-1042")) state.payNote = "Этот счёт уже проведён.";
    else {
      state.payments.unshift(row);
      state.payNote = "Оплата проведена.";
      if (known) Desk.addLedger("dir-pay", "Счёт УЧ-1042 проведён в портале по файлу с диска.", 3);
    }
    state.payFile = null;
    coachDone("pay");
    persist();
    Desk.paint("portal");
    if (document.querySelector('.win[data-app="calendar"]')) Desk.paint("calendar");
  }

  function personLine(person) {
    return `${person.name} <${person.email}>`;
  }

  function meta(label, value) {
    const line = el("p", "meta");
    line.textContent = `${label}: ${value}`;
    return line;
  }

  function moveLetter(letter, folder) {
    if (folder === "gone") state.letters = state.letters.filter((item) => item.id !== letter.id);
    else letter.folder = folder;
    state.mailUi.folder = folder === "gone" ? "trash" : folder;
    state.mailUi.mode = "read";
    persist();
    renderDesk();
    Desk.applyIcons();
    Desk.refreshBadges();
    Desk.paint("mail");
  }

  function openFolder(id) {
    rememberDraft();
    state.mailUi.view = "mail";
    state.mailUi.folder = id;
    state.mailUi.mode = "read";
    state.mailUi.compose = null;
    Desk.paint("mail");
  }

  function beginCompose(extra) {
    rememberDraft();
    state.mailUi.view = "mail";
    state.mailUi.mode = "compose";
    state.mailUi.compose = Object.assign({ kind: "new", draftId: null, to: [], cc: [], subject: "", body: "", files: [], quote: "" }, extra || {});
    Desk.paint("mail");
  }

  function editDraft(letter) {
    const draft = letter.draft || {};
    state.mailUi.view = "mail";
    state.mailUi.folder = "drafts";
    state.mailUi.mode = "compose";
    state.mailUi.compose = {
      kind: draft.kind || "new",
      letterId: draft.letterId || null,
      draftId: letter.id,
      to: letter.to.slice(),
      cc: letter.cc.slice(),
      subject: letter.subject === "(без темы)" ? "" : letter.subject,
      body: draft.body || "",
      files: letter.files.slice(),
      quote: draft.quote || ""
    };
    Desk.paint("mail");
  }

  function composeHasText(compose) {
    return Boolean(compose && (compose.to.length || compose.cc.length || compose.subject.trim() || compose.body.trim() || compose.files.length));
  }

  function rememberDraft() {
    const compose = state.mailUi.compose;
    if (!compose) return;
    if (!composeHasText(compose)) {
      if (compose.draftId) state.letters = state.letters.filter((letter) => letter.id !== compose.draftId);
      persist();
      return;
    }
    let letter = compose.draftId && state.letters.find((item) => item.id === compose.draftId);
    if (!letter) {
      letter = { id: uid("draft") };
      state.letters.unshift(letter);
      compose.draftId = letter.id;
    }
    const author = me();
    const stamp = nowStamp();
    Object.assign(letter, {
      folder: "drafts",
      read: true,
      from: author,
      to: compose.to.slice(),
      cc: compose.cc.slice(),
      subject: compose.subject.trim() || "(без темы)",
      stamp,
      files: compose.files.slice(),
      thread: [{ author: author.name, email: author.email, stamp, text: compose.body }],
      draft: { kind: compose.kind, letterId: compose.letterId || null, quote: compose.quote || "", body: compose.body }
    });
    persist();
  }

  function startReply(letter, all) {
    beginCompose({
      kind: all ? "all" : "reply",
      letterId: letter.id,
      to: all ? peopleExceptMe(letter) : [letter.from],
      subject: letter.subject.startsWith("Re:") ? letter.subject : `Re: ${letter.subject}`,
      quote: letter.thread[letter.thread.length - 1].text
    });
  }

  function startForward(letter) {
    beginCompose({
      kind: "forward",
      subject: letter.subject.startsWith("Fwd:") ? letter.subject : `Fwd: ${letter.subject}`,
      files: letter.files.slice(),
      quote: letter.thread.map((part) => part.text).join("\n\n")
    });
  }

  function peopleExceptMe(letter) {
    const seen = new Set();
    return [letter.from, ...letter.to, ...letter.cc].filter((person) => {
      if (!person || person.email === ME.email || seen.has(person.email)) return false;
      seen.add(person.email);
      return true;
    });
  }

  function composer() {
    const compose = state.mailUi.compose;
    const view = el("form", "compose-form");
    view.appendChild(el("h2", "", compose.kind === "new" ? "Новое письмо" : compose.subject || "Черновик"));
    view.append(addressField("Кому", compose.to, "to"), addressField("Копия", compose.cc, "cc"));
    const subject = document.createElement("input");
    subject.value = compose.subject;
    subject.placeholder = "Тема";
    subject.addEventListener("input", () => { compose.subject = subject.value; });
    const subjectRow = el("div", "field-row");
    subjectRow.append(el("span", "", "Тема"), subject);
    view.appendChild(subjectRow);
    const area = document.createElement("textarea");
    area.className = "compose-body";
    area.value = compose.body;
    area.placeholder = "Текст письма";
    area.rows = 10;
    area.addEventListener("input", () => { compose.body = area.value; });
    view.appendChild(area);
    if (compose.quote) view.appendChild(el("p", "quiet", compose.quote));
    const chips = el("div", "chips");
    compose.files.forEach((id) => {
      const file = state.nodes[id];
      if (!file) return;
      const chip = el("span", "chip");
      const remove = el("button", "", "×");
      remove.type = "button";
      remove.addEventListener("click", () => {
        compose.files = compose.files.filter((item) => item !== id);
        Desk.paint("mail");
      });
      chip.append(el("span", "", file.name), remove);
      chips.appendChild(chip);
    });
    view.appendChild(chips);
    const acts = el("div", "acts");
    const attach = el("button", "btn ghost", "Приложить файл");
    attach.type = "button";
    attach.addEventListener("click", () => {
      state.pick = { kind: "attach" };
      state.browse.cols = ["docs"];
      state.browse.sel = null;
      state.cwd = "docs";
      Desk.openApp("files");
    });
    const draft = el("button", "btn ghost", "В черновики");
    draft.type = "button";
    draft.addEventListener("click", () => {
      rememberDraft();
      state.mailUi.folder = "drafts";
      state.mailUi.mode = "read";
      state.mailUi.compose = null;
      Desk.paint("mail");
    });
    const send = el("button", "btn", "Отправить");
    send.type = "submit";
    acts.append(attach, draft, send);
    view.appendChild(acts);
    view.addEventListener("submit", (event) => {
      event.preventDefault();
      sendMail();
    });
    return view;
  }

  function addressField(label, list, key) {
    const wrap = el("div", "");
    const row = el("div", "field-row");
    const input = document.createElement("input");
    input.placeholder = "Имя или почта";
    const chips = el("div", "chips");
    list.forEach((person) => chips.appendChild(chip(person, list)));
    input.addEventListener("input", () => showSuggest(wrap, input, list));
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        addTyped(list, input.value);
        input.value = "";
        Desk.paint("mail");
      }
    });
    row.append(el("span", "", label), input);
    wrap.append(row, chips);
    wrap.dataset.key = key;
    return wrap;
  }

  function chip(person, list) {
    const node = el("span", "chip");
    const remove = el("button", "", "×");
    remove.type = "button";
    remove.addEventListener("click", () => {
      const index = list.findIndex((item) => item.email === person.email);
      if (index >= 0) list.splice(index, 1);
      Desk.paint("mail");
    });
    node.append(el("span", "", person.email), remove);
    return node;
  }

  function showSuggest(wrap, input, list) {
    const old = wrap.querySelector(".suggest");
    if (old) old.remove();
    const query = input.value.trim().toLowerCase();
    if (!query) return;
    const found = CONTACTS.filter((person) => person.name.toLowerCase().includes(query) || person.email.includes(query)).slice(0, 5);
    if (!found.length) return;
    const box = el("div", "suggest");
    found.forEach((person) => {
      const button = el("button", "", `${person.name} · ${person.email}`);
      button.type = "button";
      button.addEventListener("click", () => {
        pushPerson(list, { name: person.name, email: person.email });
        Desk.paint("mail");
      });
      box.appendChild(button);
    });
    wrap.appendChild(box);
  }

  function addTyped(list, value) {
    const text = value.trim();
    if (!text) return;
    const found = CONTACTS.find((person) => person.email === text || person.name.toLowerCase() === text.toLowerCase());
    if (found) pushPerson(list, { name: found.name, email: found.email });
    else if (text.includes("@")) pushPerson(list, { name: text.split("@")[0], email: text });
  }

  function pushPerson(list, person) {
    if (!list.some((item) => item.email === person.email)) list.push(person);
  }

  function sendMail() {
    const compose = state.mailUi.compose;
    if (!compose.to.length || (!compose.body.trim() && !compose.files.length)) return;
    const author = me();
    const stamp = nowStamp();
    if (compose.kind === "reply" || compose.kind === "all") {
      const letter = state.letters.find((item) => item.id === compose.letterId);
      if (letter) {
        letter.thread.push({ author: author.name, email: author.email, stamp, text: compose.body });
        if (letter.id === "director" && agrees(compose.body)) Desk.addLedger("dir-reply", "В ответе согласились заняться оплатой.", 1);
      }
    }
    if (compose.draftId) state.letters = state.letters.filter((letter) => letter.id !== compose.draftId);
    const outgoing = {
      id: uid("mail"),
      folder: "sent",
      read: true,
      from: author,
      to: compose.to.slice(),
      cc: compose.cc.slice(),
      subject: compose.subject || "(без темы)",
      stamp,
      files: compose.files.slice(),
      thread: [{ author: author.name, email: author.email, stamp, text: compose.quote ? `${compose.body}\n\n${compose.quote}` : compose.body }]
    };
    state.letters.unshift(outgoing);
    state.mailUi.folder = "sent";
    state.mailUi.letter = outgoing.id;
    state.mailUi.mode = "read";
    state.mailUi.compose = null;
    persist();
    Desk.paint("mail");
  }

  function agrees(text) {
    if (/не\s|откаж|подожд|свер|уточн|\?/.test(text)) return false;
    return /оплачу|переведу|отправлю деньги/.test(text);
  }

  function contactBook() {
    const view = el("div", "sheet");
    view.append(el("h2", "", "Контакты"), el("p", "", "Почту сотрудника можно взять отсюда и вписать в письмо. Подозрительное пересылают сами, в информационную безопасность."));
    const groups = [];
    CONTACTS.forEach((person) => {
      if (!groups.includes(person.dept)) groups.push(person.dept);
    });
    groups.forEach((dept) => {
      view.appendChild(el("h3", "", dept));
      CONTACTS.filter((person) => person.dept === dept).forEach((person) => {
        const row = el("div", "info-row");
        const who = el("div", "");
        who.append(el("b", "", person.name), el("div", "meta", person.email));
        const write = el("button", "btn ghost", "Написать");
        write.type = "button";
        write.addEventListener("click", () => {
          beginCompose({ to: [{ name: person.name, email: person.email }] });
        });
        row.append(who, write);
        view.appendChild(row);
      });
    });
    return view;
  }

  function dress(win) {
    if (win.dataset.dressed) return;
    win.dataset.dressed = "1";
    const bar = win.querySelector(".win-bar");
    const close = bar.querySelector(".close");
    const max = el("button", "win-btn", "□");
    max.type = "button";
    max.setAttribute("aria-label", "На весь экран");
    max.addEventListener("click", () => {
      const on = win.classList.toggle("max");
      max.textContent = on ? "❐" : "□";
    });
    close.before(max);
    ["e", "s", "se"].forEach((dir) => {
      const grip = el("i", `grip ${dir}`);
      grip.addEventListener("pointerdown", (event) => resize(event, win, dir, max));
      win.appendChild(grip);
    });
  }

  function resize(event, win, dir, max) {
    event.stopPropagation();
    win.classList.remove("max");
    max.textContent = "□";
    const start = { x: event.clientX, y: event.clientY, w: win.offsetWidth, h: win.offsetHeight };
    function move(ev) {
      if (dir !== "s") win.style.width = `${Math.max(460, start.w + ev.clientX - start.x)}px`;
      if (dir !== "e") win.style.height = `${Math.max(300, start.h + ev.clientY - start.y)}px`;
    }
    function up() {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  window.Workplace = { paint, dress, boot };
  boot();
}());
