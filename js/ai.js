/* Клиент YandexGPT. Ключа здесь нет: только адрес прокси из config.js. */
(function () {
  function config() {
    const cfg = window.NORD_AI || {};
    return {
      enabled: !!(cfg.enabled && cfg.proxyUrl),
      proxyUrl: String(cfg.proxyUrl || "")
    };
  }

  function reply(opts) {
    const cfg = config();
    if (!cfg.enabled) return Promise.resolve({ text: "" });
    const messages = (opts.messages || []).slice(-10).map((item) => ({
      from: item.from === "you" ? "you" : String(opts.personaId || ""),
      role: item.role === "assistant" ? "assistant" : "user",
      text: String(item.text || "").slice(0, 500)
    })).filter((item) => item.text);
    if (!messages.length) return Promise.resolve({ text: "" });
    const ctrl = new AbortController();
    const timer = window.setTimeout(() => ctrl.abort(), 20000);
    return fetch(cfg.proxyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        personaId: opts.personaId,
        player: String(opts.player || "").slice(0, 24),
        messages
      }),
      signal: ctrl.signal
    }).then((res) => (res.ok ? res.json() : null)).then((data) => {
      if (data && data.ignore) return { ignore: true };
      const text = data && String(data.text || "").trim();
      if (/^silence$/i.test(text)) return { ignore: true };
      return { text: text || "" };
    }).catch(() => ({ text: "" })).finally(() => window.clearTimeout(timer));
  }

  window.NordAI = { enabled: () => config().enabled, reply };
})();
