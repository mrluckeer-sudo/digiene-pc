/* Уровень «Первое утро». Подключается только со страницы /stage-1. */
(function stage1() {
  const Desk = window.Desk;
  if (!Desk || window.NORD_STAGE !== "1") return;
  const { state, persist } = Desk;
  const TEMP = "Welcome2026!";
  const VPN = "NORD-VPN-19";
  const SUPPORT = "it-support@nord.example";
  const PHISH_MAIL = "o.berezin@nord-portal.example";
  const BUSY = new Set(["misha", "assistant", "hr"]);

  function el(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  function stamp() {
    return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }).format(new Date());
  }

  function translit(value) {
    const map = { а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "i", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "c", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya" };
    return String(value || "").toLowerCase().split("").map((ch) => map[ch] != null ? map[ch] : ch).join("").replace(/[^a-z]/g, "");
  }

  function loginOf() {
    const name = translit(state.name);
    const surname = translit(state.surname);
    return `${(name[0] || "i")}.${surname || "ivanov"}`;
  }

  function crack(value) {
    const words = value.trim().split(/[\s-]+/).filter(Boolean);
    const mixed = /[a-zа-яё]/i.test(value) && /\d/.test(value);
    if ((words.length >= 3 && value.trim().length >= 10) || (value.length >= 12 && mixed)) return "strong";
    if (value.length >= 10) return "strong";
    return "weak";
  }

  function blank() {
    return {
      login: "",
      password: TEMP,
      passwordRank: "temp",
      portalIn: false,
      portalVpn: null,
      portalAt: 0,
      accessAt: 0,
      billAt: 0,
      billNag: 0,
      linkChoice: "",
      pageReadyUrl: "",
      phishIn: false,
      code: "",
      codeSent: false,
      ilyaPhase: "none",
      contactedSupport: false,
      contactedKirill: false,
      supportAnswered: false,
      kirillAnswered: false,
      phishAnswered: false,
      sessionsKilled: false,
      recovered: false,
      started: 0,
      lastAction: 0,
      phishAt: 0,
      changedAt: 0,
      ilyaAt: 0,
      c01At: 0,
      c02At: 0,
      c03At: 0,
      c04At: 0,
      nudgeAt: 0,
      debrief: false,
      exposure: []
    };
  }

  function scene() {
    if (!state.stage) state.stage = blank();
    return state.stage;
  }

  function touch() {
    const row = scene();
    row.lastAction = Date.now();
    persist();
  }

  function addExposure(id, text, points, skill) {
    const row = scene();
    if (row.exposure.some((item) => item.id === id)) return;
    row.exposure.push({ id, text, points, skill });
    persist();
  }

  function addLetter(letter) {
    state.letters = state.letters || [];
    state.letters.unshift(letter);
    state.mailUi = state.mailUi || { folder: "inbox", letter: letter.id, mode: "read", view: "mail", compose: null };
    persist();
    Desk.refreshBadges();
    const win = document.querySelector('.win[data-app="mail"]');
    if (win && !win.classList.contains("min")) Desk.paint("mail");
  }

  function pushChat(id, text) {
    const pack = state.chat[id] || (state.chat[id] = []);
    pack.push({ id: `s${Date.now()}`, who: id, text, at: "сейчас" });
    if (state.chatOpen !== id) state.seen[id] = Math.max(0, (state.seen[id] || 0) - 0);
    persist();
    Desk.refreshBadges();
    const win = document.querySelector('.win[data-app="messenger"]');
    if (win && !win.classList.contains("min")) Desk.paint("messenger");
  }

  function prepare() {
    if (!state.stage) state.stage = blank();
    state.guides = state.guides || {};
    if (!state.letters || !state.letters.some((letter) => letter.id === "welcome")) {
      state.letters = [];
      state.mailUi = { folder: "inbox", letter: "", mode: "read", view: "mail", compose: null };
    }
    if (!state.stage.started) {
      state.chatOpen = "it";
      state.seen = { "c-general": 1, "c-sales": 1, "c-projects": 1, "c-it": 1, "c-hr": 1, misha: 1, director: 1, assistant: 1, colleague: 1, it: 0, hr: 1, security: 1, ilya: 0 };
    }
    persist();
  }

  function player() {
    const login = scene().login || loginOf();
    return { name: [state.name, state.surname].filter(Boolean).join(" ") || "Вы", email: `${login}@nord.example` };
  }

  function preview(text) {
    const clean = String(text || "").replace(/\s+/g, " ").trim();
    if (clean.length <= 72) return clean;
    return `${clean.slice(0, 72).trim()}…`;
  }

  function mailToast(title, subject, icon, letterId) {
    Desk.toast({ app: "mail", title, text: subject, icon, letterId, ms: 9000 });
  }

  function chatToast(chat, title, text, icon) {
    Desk.toast({ app: "messenger", chat, title, text: preview(text), icon, ms: 9000 });
  }

  function begin() {
    const row = scene();
    row.login = loginOf();
    row.started = Date.now();
    row.lastAction = row.started;
    sendWelcome();
    if (!tick.timer) tick.timer = window.setInterval(tick, 2000);
    tick();
  }

  function whoName() {
    return [state.name, state.surname].filter((part) => part && String(part).trim()).join(" ") || "коллега";
  }

  function hello(id) {
    const said = (state.chat[id] || []).some((line) => line.who === id);
    if (said || !state.name) return "";
    return `${state.name}, здравствуйте. `;
  }

  function addTrail(id, title, text) {
    const row = scene();
    row.trail = row.trail || [];
    if (row.trail.some((item) => item.id === id)) return;
    row.trail.push({ id, title, text, stamp: stamp() });
    persist();
    if (document.querySelector('.win[data-app="portal"]')) Desk.paint("portal");
  }

  function directorNote(id, subject, text) {
    if ((state.letters || []).some((letter) => letter.id === id)) return;
    addLetter({
      id,
      folder: "inbox",
      read: false,
      from: { name: "Ирина Лебедева", email: "i.lebedeva@nord.example" },
      to: [player()],
      cc: [],
      subject,
      stamp: stamp(),
      files: [],
      thread: [{ author: "Ирина Лебедева", email: "i.lebedeva@nord.example", stamp: stamp(), text }]
    });
    mailToast("Ирина Лебедева", subject, "assets/people/woman_2.png", id);
  }

  function paintJournal() {
    const page = el("div", "account-page");
    page.append(el("h2", "", "Журнал"), el("p", "quiet", "Что произошло в учётной записи."));
    const items = scene().trail || [];
    if (!items.length) {
      page.appendChild(el("p", "", "Записей пока нет."));
      return page;
    }
    items.forEach((item) => {
      const card = el("div", "portal-card");
      card.append(el("b", "", item.title), el("p", "", item.text), el("p", "quiet", item.stamp));
      page.appendChild(card);
    });
    return page;
  }

  function sendWelcome() {
    if (state.letters.some((letter) => letter.id === "welcome")) return;
    addLetter({
      id: "welcome",
      folder: "inbox",
      read: false,
      from: { name: "Ирина Лебедева", email: "i.lebedeva@nord.example" },
      to: [player()],
      cc: [],
      subject: "Добро пожаловать в команду",
      stamp: stamp(),
      files: [],
      thread: [{
        author: "Ирина Лебедева",
        email: "i.lebedeva@nord.example",
        stamp: stamp(),
        text: `${state.name || "Коллега"}, здравствуйте. Рада, что вы присоединились к команде.\n\nВ ближайшее время откроем рабочие доступы. Доступ к порталу обязательно будет: без него в компании не работают.`
      }]
    });
    mailToast("Ирина Лебедева", "Добро пожаловать в команду", "assets/people/woman_2.png", "welcome");
  }

  function sendAccess() {
    const row = scene();
    if (row.accessAt) return;
    row.accessAt = Date.now();
    row.login = row.login || loginOf();
    addLetter({
      id: "access",
      folder: "inbox",
      read: false,
      from: { name: "Сергей Плотников", email: "s.plotnikov@nord.example" },
      to: [player()],
      cc: [],
      subject: "Учётная запись портала",
      stamp: stamp(),
      files: [],
      thread: [{
        author: "Сергей Плотников",
        email: "s.plotnikov@nord.example",
        stamp: stamp(),
        text: `${state.name || "Коллега"}, здравствуйте.\n\nЛогин: ${row.login}\nВременный пароль: ${TEMP}\nВход: https://nord.portal.example/\n\nПароль лучше сменить при первом входе. Поддержка: ${SUPPORT}.`
      }]
    });
    mailToast("Сергей Плотников", "Учётная запись портала", "assets/people/man_4.png", "access");
  }

  function sendBill() {
    const row = scene();
    if (row.billAt) return;
    row.billAt = Date.now();
    addLetter({
      id: "bill",
      folder: "inbox",
      read: false,
      from: { name: "Марина Котова", email: "m.kotova@nord.example" },
      to: [player()],
      cc: [],
      subject: "Проверьте контрагента и оплатите счёт",
      stamp: stamp(),
      files: ["invoice"],
      thread: [{
        author: "Марина Котова",
        email: "m.kotova@nord.example",
        stamp: stamp(),
        text: `${state.name || "Коллега"}, добрый день. Нужно сверить контрагента «Северный контур» с договором на портале и оплатить счёт УЧ-1042 на 186 400. Файл во вложении.\n\nЭто задача на сегодня, первый день как раз чтобы провести её через портал.`
      }]
    });
    mailToast("Марина Котова", "Проверьте контрагента и оплатите счёт", "assets/people/woman_1.png", "bill");
  }

  function nagBill() {
    const row = scene();
    row.billNag = Date.now();
    const line = `${hello("colleague")}Счёт УЧ-1042 всё ещё не проведён. Сверьте контрагента на портале и оплатите сегодня. Если так и останется тишина, напишу руководителю. Первый рабочий день, давайте без этого.`;
    pushChat("colleague", line);
    chatToast("colleague", "Марина Котова", line, "assets/people/woman_1.png");
  }

  function billPaid() {
    return (state.payments || []).some((item) => item.doc === "УЧ-1042");
  }

  function sendPhish() {
    const row = scene();
    if (row.phishAt) return;
    row.phishAt = Date.now();
    addLetter({
      id: "phish",
      folder: "inbox",
      read: false,
      from: { name: "Олег Березин", email: PHISH_MAIL },
      to: [{ name: state.name || "Вы", email: player().email }],
      cc: [],
      subject: "Подтвердите учётную запись",
      stamp: stamp(),
      files: [],
      thread: [{
        author: "Олег Березин",
        email: PHISH_MAIL,
        stamp: stamp(),
        text: "Обнаружена подозрительная активность. Подтвердите учётную запись по ссылке, иначе доступ будет ограничен: https://nord-portal.example/login"
      }]
    });
    mailToast("Олег Березин", "Подтвердите учётную запись", "", "phish");
  }

  function sendVpn() {
    const row = scene();
    if (row.vpnSent) return;
    row.vpnSent = true;
    row.vpnSentAt = Date.now();
    const line = `${hello("it")}Для входа в портал нужен VPN. Инвайт-код: ${VPN}. Доступ к порталу пришлю на почту следом.`;
    pushChat("it", line);
    const lines = state.chat.it;
    if (lines && lines.length) lines[lines.length - 1].code = VPN;
    persist();
    chatToast("it", "Сергей Плотников", line, "assets/people/man_4.png");
    if (window.NordCoach) NordCoach.vpn();
  }

  function issueCode() {
    const row = scene();
    row.code = String(100000 + Math.floor(Math.random() * 900000));
    row.codeSentAt = Date.now();
    addLetter({
      id: `code${row.code}`,
      folder: "inbox",
      read: false,
      from: { name: "Портал НОРД", email: "portal@nord.example" },
      to: [{ name: state.name || "Вы", email: player().email }],
      cc: [],
      subject: "Код подтверждения",
      stamp: stamp(),
      files: [],
      thread: [{
        author: "Портал НОРД",
        email: "portal@nord.example",
        stamp: stamp(),
        text: `Код для смены пароля: ${row.code}. Никому его не сообщайте.`
      }]
    });
    mailToast("Портал НОРД", "Код подтверждения", "", `code${row.code}`);
  }

  function sendPasswordChanged(id) {
    const letterId = id || `pwd${Date.now()}`;
    if ((state.letters || []).some((letter) => letter.id === letterId)) return;
    addLetter({
      id: letterId,
      folder: "inbox",
      read: false,
      from: { name: "Портал НОРД", email: "portal@nord.example" },
      to: [player()],
      cc: [],
      subject: "Пароль учётной записи изменён",
      stamp: stamp(),
      files: [],
      thread: [{
        author: "Портал НОРД",
        email: "portal@nord.example",
        stamp: stamp(),
        text: `Пароль от вашей учётной записи ${player().email} был изменён. Если это были не вы, то обратитесь в службу информационной безопасности.`
      }]
    });
    mailToast("Портал НОРД", "Пароль учётной записи изменён", "", letterId);
  }

  function sendIlya() {
    const row = scene();
    if (row.ilyaAt) return;
    row.ilyaAt = Date.now();
    row.ilyaPhase = "asked";
    const line = `${hello("ilya")}Это Илья из IT. Проверяем, что коды подтверждения доходят. Скинь последний код из письма, я сверю с логами. Только быстро, проверка до конца дня.`;
    pushChat("ilya", line);
    chatToast("ilya", "Илья Фомин", line);
  }

  function sendAlert(id, subject, text) {
    addLetter({
      id,
      folder: "inbox",
      read: false,
      from: { name: "Портал НОРД", email: "portal@nord.example" },
      to: [{ name: state.name || "Вы", email: player().email }],
      cc: [],
      subject,
      stamp: stamp(),
      files: [],
      thread: [{ author: "Портал НОРД", email: "portal@nord.example", stamp: stamp(), text }]
    });
    Desk.toast({ app: "mail", title: "Портал НОРД", text: subject, letterId: id, ms: 9000 });
  }

  function markRecovered() {
    const row = scene();
    if (!row.phishIn && !row.codeSent) return;
    if (row.sessionsKilled && row.changedAt > Math.max(row.c01At, row.c03At, 0)) {
      row.recovered = true;
      addExposure("recover", "После инцидента пароль сменили и завершили чужие сессии.", 0, "Восстановление");
      persist();
    }
  }

  function tick() {
    const row = scene();
    if (!row.started || row.debrief || !state.onboardingDone) return;
    const now = Date.now();
    if (!row.vpnSent && now - row.started > 20000) sendVpn();
    if (row.vpnSent && !row.vpnSentAt) row.vpnSentAt = row.started + 20000;
    if (!row.accessAt && row.vpnSentAt && ((state.vpn && state.vpn.on) || now - row.vpnSentAt > 20000)) sendAccess();
    if (row.accessAt && !row.billAt && now - row.accessAt > 120000) sendBill();
    if (row.billAt && !billPaid() && !row.billNag && now - row.billAt > 180000) nagBill();
    if (row.billNag && !row.portalIn && !billPaid() && now - row.billNag > 120000) row.stall = true;
    if (row.portalIn && row.portalAt && !row.phishAt && now - row.portalAt > 30000) sendPhish();
    if (row.passwordRank !== "temp" && row.code && !row.ilyaAt && !row.phishIn && now - row.changedAt > 12000) sendIlya();
    if (row.ilyaPhase === "asked" && !row.codeSent && now - row.ilyaAt > 50000) {
      row.ilyaPhase = "nudged";
      pushChat("ilya", "Ну что, скинешь код? Без него проверка встанет.");
    }
    if (row.ilyaPhase === "nudged" && !row.codeSent && now - row.ilyaAt > 110000) {
      row.ilyaPhase = "left";
      persist();
    }
    if (row.phishIn && !row.c01At) {
      row.c01At = now;
      const who = [state.surname, state.name].filter(Boolean).join(" ");
      const clock = new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      sendAlert("c01", "Вход в портал с нового устройства", `${who}, в ${clock} осуществлён вход в портал с нового устройства. Если это были не вы, то обратитесь в службу безопасности. Если это были вы, то проигнорируйте это письмо.`);
      addExposure("phish", "На поддельной странице введены настоящие логин и пароль.", 3, "Распознавание фишинга");
    }
    if (row.c01At && !row.recovered && !row.c02At && now - row.c01At > 180000) {
      row.c02At = now;
      addTrail("pay", "Заявка на платёж", "В журнале учётной записи появилась заявка на платёж. Сессия входа из другой геолокации к этому моменту ещё была открыта.");
      directorNote("pay-ask", "Что за платёж?", `${whoName()}, что происходит? С вашей учётной записи на портале ушла заявка на платёж. Для первого дня это уже разговор со службой безопасности: кого вы пустили в аккаунт и почему сессию не закрыли. Жду объяснение сегодня.`);
    }
    if (row.codeSent && !row.c03At) {
      row.c03At = now;
      sendPasswordChanged("c03");
      addExposure("code", "Код подтверждения отправлен человеку вне компании.", 3, "Социальная инженерия");
    }
    if (row.c03At && !row.recovered && !row.c04At && now - row.c03At > 180000) {
      row.c04At = now;
      addTrail("file", "Скачан файл клиентов", "С учётной записи скачан файл с данными клиентов. Вход перед этим был подтверждён кодом из письма.");
      directorNote("file-ask", "Файл с клиентами", `${whoName()}, с вашей учётной записи скачали файл с данными клиентов. Если код подтверждения ушёл не вам, почему его передали? Опишите, кому писали и что открывали. Это уже последствия, не черновик.`);
    }
    const quiet = row.phishAt && !row.phishIn && !row.codeSent && !row.contactedSupport && !row.contactedKirill;
    const ilyaSettled = row.passwordRank === "temp" || row.ilyaPhase === "left" || row.ilyaPhase === "refused" || row.ilyaPhase === "got";
    if (quiet && ilyaSettled && !row.nudgeAt && now - row.lastAction > 240000) {
      row.nudgeAt = now;
      const line = `${hello("security")}Мы заметили подозрительную активность в вашем аккаунте. Пожалуйста, свяжитесь со мной и опишите, что приходило.`;
      pushChat("security", line);
      chatToast("security", "Кирилл Антонов", line, "assets/people/man_2.png");
    }
    if (row.nudgeAt && !row.contactedKirill && !row.contactedSupport && now - row.nudgeAt > 120000) row.silence = true;
    const heardAfter = (row.supportAnsweredAt || 0) > row.phishAt || (row.kirillAnsweredAt || 0) > row.phishAt;
    const clean = row.phishAt && !row.phishIn && !row.codeSent && ilyaSettled && heardAfter;
    if (clean) row.clean = true;
  }

  function openDebrief(reason) {
    const row = scene();
    if (row.debrief) return;
    row.debrief = true;
    row.reason = reason;
    if (row.portalIn && row.portalVpn === false) addExposure("vpn", "Вход в портал без VPN.", 2, "Гигиена канала");
    if (row.portalIn && row.passwordRank === "temp") addExposure("temp", "В портал вошли и оставили временный пароль.", 2, "Пароли");
    if (row.passwordRank === "weak") addExposure("weak", "Временный пароль сменили на слабый.", 1, "Пароли");
    persist();
    const old = document.getElementById("debrief");
    if (old) old.remove();
    const root = el("div", "debrief");
    root.id = "debrief";
    const card = el("div", "debrief-card");
    card.append(el("p", "k", "Уровень пройден"), el("h1", "", "Что о тебе теперь знают"));
    if (reason === "stall") card.appendChild(el("p", "", "До портала дело не дошло. Марина Котова просила сверить контрагента и оплатить счёт, потом написала, что иначе сообщит руководителю."));
    else if (!row.exposure.length) card.appendChild(el("p", "", "Чужим людям логин, пароль и код не достались."));
    row.exposure.forEach((item) => {
      const line = el("p", "debrief-row");
      line.append(el("b", "", item.points ? `+${item.points}` : "0"), el("span", "", item.text));
      card.appendChild(line);
    });
    card.appendChild(el("h2", "", "Куда можно было написать"));
    const channels = [
      ["Поддержка it-support", row.contactedSupport ? "Подтвердили, что таких сотрудников в IT нет." : "Письмо не отправляли."],
      ["Кирилл Антонов", row.contactedKirill ? "Спросил, что уже отправили, и объяснил правило про код." : "В информационную безопасность не писали."],
      ["Ответ Олегу Березину", row.phishAnswered ? "Ответил сам автор письма и снова прислал ссылку." : "На фишинговое письмо не отвечали."],
      ["Молчание", reason === "silence" ? "На предупреждение Кирилла не ответили." : "Сообщить о странном письме — тоже действие."]
    ];
    channels.forEach(([name, text]) => {
      const line = el("p", "debrief-row");
      line.append(el("b", "", name), el("span", "", text));
      card.appendChild(line);
    });
    card.appendChild(el("h2", "", "Навыки"));
    const skills = [
      ["Пароли", row.passwordRank === "strong" ? "Да" : "Нет"],
      ["Гигиена канала", row.portalVpn ? "Да" : "Нет"],
      ["Распознавание фишинга", row.phishIn ? "Нет" : "Да"],
      ["Социальная инженерия", row.codeSent ? "Нет" : "Да"],
      ["Коммуникация", row.contactedSupport || row.contactedKirill ? "Да" : "Нет"],
      ["Восстановление", row.phishIn || row.codeSent ? (row.recovered ? "Да" : "Нет") : "Не потребовалось"]
    ];
    skills.forEach(([name, value]) => {
      const line = el("p", "debrief-row");
      line.append(el("b", "", name), el("span", "", value));
      card.appendChild(line);
    });
    card.appendChild(el("p", "", "Письмо Сергея Плотникова было настоящим. Письмо Олега Березина и сообщение Ильи Фомина пришли не от сотрудников компании. Ссылка Олега открылась сразу в браузере, а домен был nord-portal.example."));
    root.appendChild(card);
    document.body.appendChild(root);
  }

  function richText(text) {
    const p = el("p", "");
    String(text || "").split(/(https?:\/\/[^\s]+)/).forEach((part) => {
      if (!/^https?:/.test(part)) {
        p.appendChild(document.createTextNode(part));
        return;
      }
      const link = el("button", "cal-link", part);
      link.type = "button";
      link.addEventListener("click", () => openLink(part));
      p.appendChild(link);
    });
    return p;
  }

  function openLink(url) {
    touch();
    scene().pageReadyUrl = "";
    state.browserUrl = url;
    Desk.openApp("browser");
  }

  function chooseLink(choice) {
    const row = scene();
    row.linkChoice = choice;
    persist();
    if (choice === "app") Desk.openApp("portal");
    else Desk.paint("browser");
  }

  function paintBrowser(body) {
    const row = scene();
    const url = state.browserUrl || "https://nord.portal.example/";
    const bar = el("form", "addr");
    const input = document.createElement("input");
    input.value = url;
    input.spellcheck = false;
    const go = el("button", "btn", "Открыть");
    go.type = "submit";
    bar.append(input, go);
    const frame = el("div", "browser-frame");
    const page = el("div", "page stage-page");
    const host = (url.match(/^https?:\/\/([^/]+)/i) || [, ""])[1];
    frame.append(bar, page);
    bar.addEventListener("submit", (event) => {
      event.preventDefault();
      row.pageReadyUrl = "";
      state.browserUrl = input.value.trim();
      Desk.paint("browser");
    });
    if (row.pageReadyUrl !== url) {
      page.append(el("p", "k", host || url), el("h2", "", "Загрузка…"));
      window.setTimeout(() => {
        if (state.browserUrl !== url) return;
        row.pageReadyUrl = url;
        Desk.paint("browser");
      }, 1200);
      body.appendChild(frame);
      return true;
    }
    page.appendChild(el("p", "k", host || url));
    if (/^nord-portal\.example$/i.test(host)) paintPhish(page);
    else if (/^nord\.portal\.example$/i.test(host)) {
      paintPortalSite(page);
      if (!row.linkChoice) frame.appendChild(linkBanner());
    } else page.append(el("h2", "", "Страница вне контура"), el("p", "", "Адрес не совпадает с порталом компании."));
    body.appendChild(frame);
    return true;
  }

  function linkBanner() {
    const card = el("div", "browser-choice");
    const close = el("button", "x", "×");
    close.type = "button";
    close.setAttribute("aria-label", "Закрыть");
    close.addEventListener("click", () => chooseLink("browser"));
    const browser = el("button", "btn ghost", "Продолжить в браузере");
    const app = el("button", "btn", "Открыть в приложении «Портал»");
    browser.type = "button";
    app.type = "button";
    browser.addEventListener("click", () => chooseLink("browser"));
    app.addEventListener("click", () => chooseLink("app"));
    card.append(close, browser, app);
    return card;
  }

  function paintGate(page, onSuccess) {
    const row = scene();
    const form = el("form", "gate");
    const login = document.createElement("input");
    login.placeholder = "Логин";
    login.autocomplete = "off";
    const password = document.createElement("input");
    password.type = "password";
    password.placeholder = "Пароль";
    const submit = el("button", "btn", "Войти");
    submit.type = "submit";
    const note = el("p", "quiet", "");
    form.append(login, password, submit, note);
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      touch();
      if (login.value.trim().toLowerCase() !== row.login || password.value !== row.password) {
        note.textContent = "Неверный логин или пароль.";
        return;
      }
      const first = !row.portalIn;
      row.portalIn = true;
      row.portalVpn = !!(state.vpn && state.vpn.on);
      if (first) row.portalAt = Date.now();
      persist();
      if (onSuccess) onSuccess();
      else Desk.paint("portal");
      tick();
    });
    page.appendChild(form);
  }

  function paintPortalSite(page) {
    const row = scene();
    page.append(el("h2", "", "Портал НОРД"), el("p", "", "Внутренний сайт компании. Учётную запись можно открыть здесь или в приложении «Портал»."));
    if (row.portalIn) {
      page.appendChild(el("p", "", `Вы вошли как ${row.login}.`));
      return;
    }
    paintGate(page, () => Desk.paint("browser"));
  }

  function paintPhish(page) {
    page.append(el("h2", "", "Вход в портал НОРД"), el("p", "", "Подтвердите учётную запись, чтобы доступ не ограничили."));
    const form = el("form", "gate");
    const login = document.createElement("input");
    login.placeholder = "Логин";
    login.autocomplete = "off";
    const password = document.createElement("input");
    password.type = "password";
    password.placeholder = "Пароль";
    const submit = el("button", "btn", "Войти");
    submit.type = "submit";
    const note = el("p", "quiet", "");
    form.append(login, password, submit, note);
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      touch();
      const row = scene();
      const okLogin = login.value.trim().toLowerCase() === row.login;
      const okPassword = password.value === row.password;
      if (!okLogin || !okPassword) {
        note.textContent = "Неверные данные.";
        return;
      }
      row.phishIn = true;
      persist();
      page.replaceChildren(el("p", "k", "nord-portal.example"), el("h2", "", "Вход выполнен"), el("p", "", "Учётная запись подтверждена."));
      tick();
    });
    page.appendChild(form);
  }

  function paintLogin(body) {
    const wrap = el("div", "stage-login");
    wrap.append(el("p", "k", "Портал НОРД"), el("h2", "", "Вход"));
    if (scene().portalIn) wrap.appendChild(el("p", "", "Вы уже вошли."));
    else paintGate(wrap);
    body.appendChild(wrap);
  }

  let accountTimer = 0;

  function paintAccount() {
    window.clearInterval(accountTimer);
    accountTimer = 0;
    const row = scene();
    const page = el("div", "account-page");
    page.append(el("h2", "", "Аккаунт"), el("p", "quiet", player().email));
    const kill = el("button", "btn ghost", "Завершить все сессии");
    kill.type = "button";
    kill.addEventListener("click", () => {
      touch();
      row.sessionsKilled = true;
      markRecovered();
      Desk.toast({ title: "Портал", text: "Все сессии, кроме этой, завершены.", ms: 4000 });
      tick();
      Desk.paint("portal");
    });
    page.appendChild(kill);
    if (row.sessionsKilled) page.appendChild(el("p", "", "Все сессии, кроме этой, завершены."));
    page.appendChild(passwordForm(row));
    return page;
  }

  function passwordForm(row) {
    const waiting = !!(row.pendingPassword && row.codeSentAt && row.password !== row.pendingPassword);
    const form = el("form", "account-form");
    form.addEventListener("submit", (event) => event.preventDefault());
    form.appendChild(el("h3", "", "Смена пароля"));
    const note = el("p", "quiet", "");
    if (!waiting) {
      const current = document.createElement("input");
      current.type = "password";
      current.autocomplete = "off";
      const next = document.createElement("input");
      next.type = "password";
      next.autocomplete = "new-password";
      const again = document.createElement("input");
      again.type = "password";
      again.autocomplete = "new-password";
      const send = el("button", "btn", "Получить код");
      send.type = "submit";
      function problem() {
        if (!current.value) return "Введите текущий пароль.";
        if (current.value !== row.password) return "Неверный текущий пароль.";
        if (!next.value || !again.value) return "Введите новый пароль дважды.";
        if (next.value !== again.value) return "Пароли не совпадают.";
        if (next.value === current.value) return "Новый пароль совпадает с текущим.";
        return "";
      }
      function sync() {
        note.textContent = current.value || next.value || again.value ? problem() : "";
        send.disabled = !!problem();
      }
      [current, next, again].forEach((field) => field.addEventListener("input", sync));
      form.addEventListener("submit", () => {
        note.textContent = problem();
        if (problem()) return;
        row.pendingPassword = next.value;
        issueCode();
        Desk.paint("portal");
      });
      form.append(field("Текущий пароль", current), field("Новый пароль", next), field("Повторите новый пароль", again), note, send);
      sync();
      return form;
    }
    form.appendChild(el("p", "", `Введите код подтверждения смены пароля, который был выслан на почту ${player().email}`));
    const code = document.createElement("input");
    code.inputMode = "numeric";
    code.placeholder = "Код из письма";
    code.autocomplete = "off";
    const timer = el("p", "quiet", "");
    const resend = el("button", "btn ghost", "Запросить код повторно");
    resend.type = "button";
    const confirm = el("button", "btn", "Сменить пароль");
    confirm.type = "submit";
    confirm.disabled = true;
    function left() {
      return Math.max(0, 30 - Math.floor((Date.now() - row.codeSentAt) / 1000));
    }
    function paintTimer() {
      const seconds = left();
      if (seconds <= 0) {
        timer.textContent = "";
        resend.hidden = false;
        window.clearInterval(accountTimer);
        accountTimer = 0;
        return;
      }
      resend.hidden = true;
      timer.textContent = `0:${String(seconds).padStart(2, "0")}`;
    }
    paintTimer();
    if (left() > 0) accountTimer = window.setInterval(paintTimer, 1000);
    resend.addEventListener("click", () => {
      issueCode();
      Desk.paint("portal");
    });
    code.addEventListener("input", () => {
      confirm.disabled = !code.value.trim();
      note.textContent = "";
    });
    form.addEventListener("submit", () => {
      if (code.value.trim() !== row.code) {
        note.textContent = "Код не совпадает с последним письмом.";
        return;
      }
      row.password = row.pendingPassword;
      row.passwordRank = crack(row.pendingPassword);
      row.changedAt = Date.now();
      row.pendingPassword = "";
      row.codeSentAt = 0;
      touch();
      markRecovered();
      sendPasswordChanged();
      Desk.toast({ title: "Портал", text: "Пароль изменён.", ms: 4000 });
      Desk.paint("portal");
      tick();
    });
    form.append(code, timer, resend, note, confirm);
    return form;
  }

  function field(title, input) {
    const label = el("label", "account-field", title);
    label.appendChild(input);
    return label;
  }

  function looksLikeCode(text) {
    const code = scene().code;
    if (!code) return false;
    return String(text || "").replace(/\D/g, "").includes(code);
  }

  function handleChat(id, line) {
    touch();
    const text = String(line.text || "");
    const row = scene();
    if (BUSY.has(id)) {
      window.setTimeout(() => pushChat(id, `${hello(id)}Я на совещании, напишу позже.`), 900);
      return true;
    }
    if (id === "ilya") {
      if (looksLikeCode(text)) {
        row.codeSent = true;
        row.ilyaPhase = "got";
        window.setTimeout(() => {
          pushChat("ilya", "Принял, сверяю с логом.");
          tick();
        }, 900);
        return true;
      }
      if (/\d{4,}/.test(text)) {
        window.setTimeout(() => pushChat("ilya", "Не сходится. Нужен код из последнего письма портала."), 900);
        return true;
      }
      return false;
    }
    if (id === "security") {
      row.contactedKirill = true;
      row.kirillAnswered = true;
      row.kirillAnsweredAt = Date.now();
      persist();
      return false;
    }
    return false;
  }

  function note(id) {
    const name = state.name || "сотрудник";
    const common = `Новый сотрудник: ${name}. Первое утро в компании НОРД.`;
    const notes = {
      director: `${common} Ты уже отправила приветственное письмо. Доступ к порталу присылает Сергей Плотников. Марина Котова просит сверить контрагента «Северный контур» и оплатить счёт УЧ-1042. Если с учётной записи ушёл платёж или скачали файл клиентов, ты спрашиваешь, что человек открывал и кому писал.`,
      it: `${common} Ты уже отправил инвайт-код VPN NORD-VPN-19 и следом письмо с логином и временным паролем. Коды подтверждения не просишь и чужой код верным не называешь.`,
      colleague: `${common} Ты просила сверить контрагента «Северный контур» с договором на портале и оплатить счёт УЧ-1042 на 186 400. Можно спокойно объяснять, где смотреть договор и что делать, если что-то не сходится.`,
      security: `${common} Человек может описывать письмо Олега Березина или сообщение Ильи Фомина. Помоги разобрать, что произошло. Пароль и код подтверждения в переписку не проси.`,
      support: `${common} В штате IT нет Олега Березина и Ильи Фомина. Коды и пароли никому не сообщают. Если к письму приложен снимок, его можно учесть.`,
      oleg: `${common} Ты отправил письмо «Подтвердите учётную запись» со ссылкой https://nord-portal.example/login. Отвечай в той же переписке и держись версии, что это портал компании.`,
      ilya: `${common} Ты написал в мессенджер, что проверяешь доставку кодов, и просишь последний код из письма портала. На сомнения отвечай спокойно и по делу. Сам не говори, что код сошёлся.`
    };
    return notes[id] || common;
  }

  function personById(id) {
    const people = {
      director: { name: "Ирина Лебедева", email: "i.lebedeva@nord.example", icon: "assets/people/woman_2.png" },
      it: { name: "Сергей Плотников", email: "s.plotnikov@nord.example", icon: "assets/people/man_4.png" },
      colleague: { name: "Марина Котова", email: "m.kotova@nord.example", icon: "assets/people/woman_1.png" },
      security: { name: "Кирилл Антонов", email: "k.antonov@nord.example", icon: "assets/people/man_2.png" },
      support: { name: "Поддержка IT", email: SUPPORT, icon: "" },
      oleg: { name: "Олег Березин", email: PHISH_MAIL, icon: "" },
      ilya: { name: "Илья Фомин", email: "i.fomin@nord-portal.example", icon: "" }
    };
    return people[id];
  }

  function personaByEmail(email) {
    const found = ["director", "it", "colleague", "security", "support", "oleg"].find((id) => personById(id).email === email);
    return found || "";
  }

  function mailFallback(id) {
    const lines = {
      director: "Вижу письмо. Напишите своими словами, что уже сделали и что смущает. Если это про доступ или странную просьбу, не пересылайте код и пароль.",
      it: "Письмо получил. Если вопрос про вход, сначала VPN, потом письмо с логином. Код подтверждения в ответ присылать не нужно.",
      colleague: "Счёт УЧ-1042 на месте. Контрагента «Северный контур» сверяют с договором на портале, и только потом проводят оплату. Напишите, на каком шаге застряли.",
      security: "Опишите ситуацию: от кого письмо или сообщение и что просили сделать. Ссылку лучше пересказать, а код и пароль сюда не вставляйте.",
      support: "Обращение получили. Олега Березина и Ильи Фомина в IT нет. Коды и пароли никому не отправляйте. Если есть снимок переписки, приложите его к этому письму.",
      oleg: "Да, это портал. Переходите по ссылке из письма и подтвердите учётную запись, иначе доступ ограничат."
    };
    return lines[id] || "";
  }

  function onSent(letter) {
    touch();
    const emails = letter.to.concat(letter.cc || []).map((person) => person.email);
    const row = scene();
    if (emails.includes(SUPPORT)) row.contactedSupport = true;
    if (emails.includes("k.antonov@nord.example")) row.contactedKirill = true;
    if (emails.includes(PHISH_MAIL)) row.phishAnswered = true;
    const persona = emails.map(personaByEmail).find(Boolean);
    persist();
    if (!persona) return;
    const source = (letter.replyTo && (state.letters || []).find((item) => item.id === letter.replyTo)) || letter;
    const author = personById(persona);
    const history = (source.thread || []).map((part) => ({
      from: part.email === player().email ? "you" : persona,
      role: part.email === player().email ? "user" : "assistant",
      text: part.text
    }));
    const delay = 8000 + Math.floor(Math.random() * 4000);
    function deliver(text) {
      const clean = String(text || "").trim();
      if (!clean) return;
      source.thread.push({ author: author.name, email: author.email, stamp: stamp(), text: clean });
      source.read = false;
      if (persona === "support") {
        row.supportAnswered = true;
        row.supportAnsweredAt = Date.now();
      }
      if (persona === "security") {
        row.kirillAnswered = true;
        row.kirillAnsweredAt = Date.now();
      }
      persist();
      mailToast(author.name, source.subject, author.icon, source.id);
      const win = document.querySelector('.win[data-app="mail"]');
      if (win && !win.classList.contains("min") && state.mailUi && state.mailUi.letter === source.id) Desk.paint("mail");
      tick();
    }
    window.setTimeout(() => {
      if (!window.NordAI || !NordAI.enabled()) {
        deliver(mailFallback(persona));
        return;
      }
      NordAI.reply({
        personaId: persona,
        player: state.name,
        channel: "mail",
        note: note(persona),
        messages: history
      }).then((res) => {
        if (res && res.ignore) return;
        deliver((res && res.text) || mailFallback(persona));
      });
    }, delay);
  }

  function capture(abs) {
    const node = document.getElementById("desk");
    const scale = 0.65;
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(80, Math.round(abs.width * scale));
    canvas.height = Math.max(60, Math.round(abs.height * scale));
    const ctx = canvas.getContext("2d");
    ctx.scale(scale, scale);
    ctx.fillStyle = "#e7eef2";
    ctx.fillRect(0, 0, abs.width, abs.height);
    ctx.fillStyle = "#1b2a4a";
    ctx.font = "15px Manrope, sans-serif";
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    let current = walker.nextNode();
    while (current) {
      const text = current.textContent.replace(/\s+/g, " ").trim();
      if (text) {
        const range = document.createRange();
        range.selectNodeContents(current);
        const box = range.getBoundingClientRect();
        if (box.width > 2 && box.bottom > abs.top && box.top < abs.bottom && box.right > abs.left && box.left < abs.right) {
          ctx.fillText(text.slice(0, 90), box.left - abs.left, box.top - abs.top + 16);
        }
      }
      current = walker.nextNode();
    }
    const id = `shot${Date.now()}`;
    const when = new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit" }).format(new Date());
    state.nodes[id] = { id, type: "file", name: `Снимок ${when}.png`, parent: "downloads", kind: "img", preview: canvas.toDataURL("image/png") };
    persist();
    Desk.toast({ app: "files", title: "Снимок сохранён", text: "Файл лежит в папке «Загрузки».", ms: 6000 });
  }

  function armShot() {
    const desk = document.getElementById("desk");
    const old = document.getElementById("shotPick");
    if (old) old.remove();
    const layer = document.createElement("div");
    layer.id = "shotPick";
    const frame = document.createElement("div");
    frame.className = "shot-rect";
    frame.hidden = true;
    const actions = document.createElement("div");
    actions.className = "shot-actions";
    actions.hidden = true;
    const take = document.createElement("button");
    take.type = "button";
    take.className = "btn";
    take.textContent = "Сделать снимок";
    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.className = "btn ghost";
    cancel.textContent = "Отмена";
    actions.append(take, cancel);
    layer.append(frame, actions);
    desk.appendChild(layer);
    let start = null;
    let box = null;
    layer.addEventListener("pointerdown", (event) => {
      if (event.target.closest(".shot-actions")) return;
      start = { x: event.clientX, y: event.clientY };
      box = null;
      frame.hidden = false;
      actions.hidden = true;
      const deskBox = desk.getBoundingClientRect();
      function move(ev) {
        const x1 = Math.min(start.x, ev.clientX);
        const y1 = Math.min(start.y, ev.clientY);
        const x2 = Math.max(start.x, ev.clientX);
        const y2 = Math.max(start.y, ev.clientY);
        box = {
          left: x1 - deskBox.left,
          top: y1 - deskBox.top,
          width: x2 - x1,
          height: y2 - y1,
          abs: { left: x1, top: y1, right: x2, bottom: y2, width: x2 - x1, height: y2 - y1 }
        };
        frame.style.left = `${box.left}px`;
        frame.style.top = `${box.top}px`;
        frame.style.width = `${box.width}px`;
        frame.style.height = `${box.height}px`;
      }
      function up() {
        layer.removeEventListener("pointermove", move);
        if (!box || box.width < 16 || box.height < 16) return;
        actions.hidden = false;
        actions.style.left = `${Math.max(8, Math.min(box.left, deskBox.width - 280))}px`;
        actions.style.top = `${Math.min(box.top + box.height + 8, deskBox.height - 52)}px`;
      }
      layer.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up, { once: true });
    });
    cancel.addEventListener("click", (event) => {
      event.stopPropagation();
      layer.remove();
    });
    take.addEventListener("click", (event) => {
      event.stopPropagation();
      if (box) capture(box.abs);
      layer.remove();
    });
  }

  const shot = document.getElementById("shot");
  if (shot) shot.addEventListener("click", armShot);
  const endStage = document.getElementById("endStage");
  if (endStage) endStage.addEventListener("click", () => openDebrief("manual"));

  window.Stage1 = { prepare, begin, richText, paintBrowser, paintLogin, paintAccount, paintJournal, handleChat, onSent, note, shoot: armShot, touch };
  if (state.onboardingDone && scene().started && !tick.timer) tick.timer = window.setInterval(tick, 2000);
}());
