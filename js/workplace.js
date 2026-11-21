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
    state.browse.cols = (state.browse.cols || []).filter((id) => state.nodes[id] && state.nodes[id].type !== "file");
    if (!state.browse.cols.length) state.browse.cols = ["docs"];
    renderDesk();
    Desk.applyIcons();
    Desk.refreshBadges();
    document.getElementById("desk").addEventListener("contextmenu", onDeskMenu);
    document.addEventListener("pointerdown", (event) => {
      if (!event.target.closest("#menu")) closeMenu();
    });
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
      ["portal", "Портал", "assets/icons/icon-portal.png"]
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

  function paint(id, body) {
    if (id === "files") {
      paintFiles(body);
      return true;
    }
    if (id === "mail") {
      paintMail(body);
      return true;
    }
    return false;
  }

  function activeFolder() {
    const cols = state.browse.cols;
    return state.nodes[cols[cols.length - 1]] ? cols[cols.length - 1] : "docs";
  }

  function paintFiles(body) {
    const win = body.closest(".win");
    if (win && !win.dataset.finder) {
      win.dataset.finder = "1";
      win.style.width = "min(1040px, calc(100vw - 40px))";
      win.style.height = "min(680px, calc(100vh - 100px))";
    }
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
      const save = el("button", "btn", "Сохранить сюда");
      save.type = "button";
      save.addEventListener("click", () => {
        copyNode(state.pick.nodeId, activeFolder());
        state.pick = null;
        Desk.paint("files");
      });
      bar.appendChild(save);
    }
    if (state.pick && state.pick.kind === "attach") bar.appendChild(el("span", "hint", "Выберите файл — он приложится к письму"));
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
        row.addEventListener("click", () => chooseNode(node, index));
        row.addEventListener("dblclick", () => {
          if (node.type === "file" && !(state.pick && state.pick.kind === "attach")) openNode(node);
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

  function chooseNode(node, colIndex) {
    if (state.pick && state.pick.kind === "attach" && node.type === "file") {
      addAttachment(node.id);
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
      save.addEventListener("click", () => {
        state.pick = { kind: "save", nodeId: id };
        state.browse.cols = ["downloads"];
        state.browse.sel = null;
        state.cwd = "downloads";
        Desk.openApp("files");
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
    if (letter.id === "director" && !state.ledger.some((row) => row.id === "dir-pay")) {
      const pay = el("button", "btn ghost", "Оплатить по письму");
      pay.type = "button";
      pay.addEventListener("click", () => {
        Desk.addLedger("dir-pay", "Оплата прошла по реквизитам, которые пришли в письме.", 3);
        Desk.paint("mail");
      });
      acts.appendChild(pay);
    }
    view.appendChild(acts);
    return view;
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
