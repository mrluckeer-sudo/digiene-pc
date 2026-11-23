(function onboard() {
  const desk = window.Desk;
  if (!desk || desk.state.onboardingDone) return;

  const { state, persist, paintWho, applyIcons, paintNotes, refreshBadges, ROLES } = desk;
  const root = document.getElementById("onboard");
  const installIds = ["mail", "messenger", "browser", "files", "calendar", "portal", "vpn"];
  let step = 0;
  let hintTimer = 0;
  let passwordLabel = "";

  const apps = [
    ["mail", "Почта", "assets/icons/icon-mail.png"],
    ["messenger", "Сообщения", "assets/icons/icon-messenger.png"],
    ["browser", "Браузер", "assets/icons/icon-browser.png"],
    ["files", "Файлы", "assets/icons/icon-files.png"],
    ["calendar", "Календарь", "assets/icons/icon-calendar.png"],
    ["portal", "Портал", "assets/icons/icon-portal.png"],
    ["vpn", "VPN", "assets/icons/icon-vpn.svg"]
  ];

  root.hidden = false;
  draw();

  function el(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  function button(label, onClick) {
    const node = el("button", "btn", label);
    node.type = "button";
    node.addEventListener("click", onClick);
    return node;
  }

  function crack(value) {
    const words = value.trim().split(/[\s-]+/).filter(Boolean);
    const mixed = /[a-zа-яё]/i.test(value) && /\d/.test(value);
    if (!value.trim()) return { label: "пока пусто", rank: 0 };
    if ((words.length >= 3 && value.trim().length >= 10) || (value.length >= 12 && mixed)) return { label: "несколько лет", rank: 4 };
    if (value.length >= 10) return { label: "несколько месяцев", rank: 3 };
    if (value.length >= 8) return { label: "около дня", rank: 2 };
    if (value.length >= 6) return { label: "пара часов", rank: 1 };
    return { label: "несколько секунд", rank: 0 };
  }

  function leaveBoot() {
    document.getElementById("desk").classList.remove("booting", "show-tray");
    document.getElementById("tray").hidden = true;
  }

  function draw() {
    window.clearTimeout(hintTimer);
    leaveBoot();
    root.className = "";
    root.replaceChildren();
    const card = el("div", "obCard");
    card.id = "obCard";
    if (step === 0) screenTeaser(card);
    else if (step === 1) screenWho(card);
    else if (step === 2) screenAvatar(card);
    else if (step === 3) screenBoot(card);
    else if (step === 4) screenPassword(card);
    else if (step === 5) screenKey(card);
    else if (step === 6) screenApps(card);
    else screenRules(card);
    card.appendChild(skipControl());
    root.appendChild(card);
  }

  function skipControl() {
    const node = button("Пропустить онбординг", complete);
    node.classList.add("ghost", "skip");
    return node;
  }

  function screenTeaser(card) {
    card.append(
      el("p", "ob-kicker", "5 минут · только имя"),
      el("h1", "", "Твой рабочий день"),
      el("p", "", "Твои данные. Твои правила. Без регистрации — только имя, и сразу рабочий стол."),
      button("Получить рабочее место", () => { step = 1; draw(); })
    );
  }

  function screenWho(card) {
    card.append(el("p", "ob-kicker", "Кто ты"), el("h1", "", "Твой рабочий день"), el("p", "", "Отметь всё, что подходит. Роль можно сменить позже."));
    const name = document.createElement("input");
    name.placeholder = "Имя";
    name.value = state.name;
    name.style.cssText = "width:100%;margin:8px 0 12px;padding:10px 12px;border-radius:12px;border:1px solid rgba(27,42,74,.12)";
    const box = el("div", "choices");
    ROLES.forEach(([id, title]) => {
      const label = el("label", "choice");
      const input = document.createElement("input");
      input.type = "checkbox";
      input.value = id;
      input.checked = state.roles.includes(id);
      label.append(input, el("span", "", title));
      box.appendChild(label);
    });
    const next = button("Дальше", () => {
      const roles = [...box.querySelectorAll("input:checked")].map((input) => input.value);
      if (!name.value.trim() || !roles.length) return;
      state.name = name.value.trim();
      state.roles = roles;
      persist();
      paintWho();
      step = 2;
      draw();
    });
    function sync() {
      next.disabled = !name.value.trim() || !box.querySelector("input:checked");
    }
    name.addEventListener("input", sync);
    box.addEventListener("change", sync);
    card.append(name, box, next);
    sync();
  }

  function screenBoot(card) {
    root.classList.add("boot");
    document.getElementById("desk").classList.add("booting", "show-tray");
    const tray = document.getElementById("tray");
    const list = document.getElementById("noteList");
    tray.hidden = false;
    list.replaceChildren();
    const note = el("button", "note");
    note.type = "button";
    note.append(el("strong", "", "Добро пожаловать"), el("p", "", "Это тренажёр. Письма и платежи никуда не уходят."));
    list.appendChild(note);
    card.append(
      el("h1", "", "Компьютер включается"),
      el("p", "", "Это твой рабочий компьютер. Тут почта, мессенджер, файлы и остальные рабочие приложения. Всё как у тебя. Только деньги ненастоящие — это тренажёр."),
      button("Дальше", () => { step = 4; draw(); })
    );
  }

  function screenPassword(card) {
    card.append(el("p", "ob-kicker", "Учётная запись от IT"), el("h1", "", "Придумай пароль"), el("p", "", "Живой индикатор показывает, как быстро такой пароль перебирают."));
    const field = document.createElement("input");
    field.type = "password";
    field.placeholder = "Пароль";
    field.autocomplete = "new-password";
    field.style.cssText = "width:100%;margin-top:8px;padding:10px 12px;border-radius:12px;border:1px solid rgba(27,42,74,.12)";
    const meter = el("div", "meter");
    meter.appendChild(el("i"));
    const label = el("p", "quiet", "Время взлома: пока пусто");
    const hint = el("p", "", "");
    hint.hidden = true;
    const next = button("Сохранить пароль", () => {
      if (!field.value.trim()) return;
      state.passwordLabel = `взлом: ${passwordLabel}`;
      persist();
      step = 5;
      draw();
    });
    next.disabled = true;
    field.addEventListener("input", () => {
      const result = crack(field.value);
      passwordLabel = result.label;
      meter.className = `meter r${result.rank}`;
      label.textContent = `Время взлома: ${result.label}`;
      next.disabled = !field.value.trim();
    });
    hintTimer = window.setTimeout(() => {
      hint.hidden = false;
      hint.textContent = "Три слова подряд — уже хорошо. Например: синий-кот-молоко.";
    }, 3000);
    card.append(field, meter, label, hint, next);
  }

  function screenKey(card) {
    card.append(
      el("p", "ob-kicker", "Второй ключ"),
      el("h1", "", "Даже если пароль узнают"),
      el("p", "", "Без второго ключа в учётную запись не войти. Включить можно сейчас или позже.")
    );
    const row = el("div", "acts");
    row.append(
      button("Включить", () => chooseKey(true)),
      button("Позже", () => chooseKey(false))
    );
    row.querySelectorAll(".btn")[1].classList.add("ghost");
    card.appendChild(row);
  }

  function chooseKey(on) {
    state.mfa = on;
    persist();
    step = 6;
    draw();
  }

  function screenAvatar(card) {
    card.append(el("p", "ob-kicker", "Как тебя видят"), el("h1", "", "Выбери аватар"), el("p", "", "Эти портреты свободны. Лица коллег уже заняты."));
    let picked = state.avatar || "";
    const board = el("div", "face-board");
    Object.entries(desk.PLAYER_FACES).forEach(([title, files]) => {
      const group = el("div", "face-group");
      group.appendChild(el("p", "k", title));
      const row = el("div", "face-row");
      files.forEach((src) => {
        const choice = el("button", picked === src ? "face on" : "face");
        choice.type = "button";
        const photo = document.createElement("img");
        photo.src = src;
        photo.alt = "";
        choice.appendChild(photo);
        choice.addEventListener("click", () => {
          picked = src;
          board.querySelectorAll(".face").forEach((node) => node.classList.toggle("on", node === choice));
          next.disabled = false;
        });
        row.appendChild(choice);
      });
      group.appendChild(row);
      board.appendChild(group);
    });
    const next = button("Дальше", () => {
      if (!picked) return;
      state.avatar = picked;
      persist();
      paintWho();
      step = 3;
      draw();
    });
    next.disabled = !picked;
    card.append(board, next);
  }

  function screenApps(card) {
    card.append(el("p", "ob-kicker", "Рабочие приложения"), el("h1", "", "Что здесь есть"), el("p", "", "Все приложения уже стоят. Ниже — зачем каждое нужно в работе и в учебном дне."));
    const list = el("div", "app-blurbs");
    const about = {
      mail: ["Письма коллег, контрагентов и служб компании.", "Сюда приходят просьба директора, счёт и письмо про обновление."],
      messenger: ["Короткая переписка с сотрудниками.", "Миша пишет про письмо директора, а Сергей из IT присылает инвайт-код для VPN."],
      browser: ["Открывает рабочие сайты.", "Через него смотрят внутренний портал."],
      files: ["Документы и папки на компьютере.", "Здесь лежат счёт, форма кадров и регламент."],
      calendar: ["Встречи и сроки дня.", "Показывает, если по рабочему письму уже есть действие."],
      portal: ["Договоры, обновления и оплата контрагентам.", "Счёт из письма проводят здесь: файл скачивают и загружают с диска."],
      vpn: ["Подключение к сети компании по инвайт-коду.", "Код приходит сообщением от Сергея Плотникова. По регламенту портал без включённого VPN не открывают."]
    };
    apps.forEach(([id, title, icon]) => {
      const row = el("div", "app-blurb");
      const image = document.createElement("img");
      image.src = icon;
      image.alt = "";
      const text = el("div", "");
      const [work, scene] = about[id];
      text.append(el("b", "", title), el("p", "", `Для работы: ${work}`), el("p", "", `В учебном дне: ${scene}`));
      row.append(image, text);
      list.appendChild(row);
    });
    card.append(list, button("Дальше", () => { step = 7; draw(); }));
  }

  function screenRules(card) {
    const photo = document.createElement("img");
    photo.src = "assets/people/woman_1.png";
    photo.alt = "";
    photo.className = "ava";
    const who = el("span", "who-line");
    const text = el("span", "who-text");
    text.append(el("b", "", "Марина Котова"), el("small", "", "заметка коллеги"));
    who.append(photo, text);
    const list = document.createElement("ol");
    list.className = "rules";
    ["Тут будут писать мошенники. И коллеги. Иногда их сложно отличить.", "Ошибаться можно. Важно, что ты сделаешь после.", "После сессии будет короткий разбор: что произошло и почему. Не оценка."].forEach((line) => {
      list.appendChild(el("li", "", line));
    });
    card.append(who, el("h1", "", "Пара правил"), list, button("К рабочему столу", complete));
  }

  function complete() {
    state.installed = installIds.slice();
    state.onboardingDone = true;
    persist();
    paintWho();
    applyIcons();
    paintNotes();
    refreshBadges();
    leaveBoot();
    root.hidden = true;
    root.replaceChildren();
    window.setTimeout(() => {
      desk.toast({
        app: "messenger",
        chat: "misha",
        icon: "assets/people/man_1.png",
        title: "Миша Соколов",
        text: "Глянь почту. Там срочное от директора. Я бы сам не платил, пока реквизиты не сверены."
      });
    }, 700);
    window.setTimeout(() => {
      desk.toast({
        app: "messenger",
        chat: "it",
        icon: "assets/people/man_4.png",
        title: "Сергей Плотников",
        text: "Прислал инвайт-код для VPN. По регламенту в портал без включённого VPN заходить нельзя."
      });
    }, 2200);
  }
}());
