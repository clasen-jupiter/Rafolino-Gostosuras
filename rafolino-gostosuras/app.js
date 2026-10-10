/* Rafolino Gostosuras — custos, receitas e fornadas.
   Tudo fica salvo no próprio aparelho (localStorage). Sem servidor, sem login. */
(function () {
  "use strict";

  // ---------- dados iniciais ----------
  const SEED = {
    config: { gasPct: 0.10, margemAlvo: 0.55 },
    ingredientes: [
      { id: "mor", nome: "Morango congelado (Egloo)", un: "g", preco: 17.70, qtd: 1000, min: 85 },
      { id: "acu", nome: "Açúcar refinado", un: "g", preco: 5, qtd: 1000, min: 0 },
      { id: "mas", nome: "Açúcar mascavo", un: "g", preco: 12, qtd: 1000, min: 0 },
      { id: "con", nome: "Açúcar de confeiteiro", un: "g", preco: 8, qtd: 500, min: 0 },
      { id: "far", nome: "Farinha de trigo", un: "g", preco: 6, qtd: 1000, min: 0 },
      { id: "man", nome: "Manteiga sem sal", un: "g", preco: 14, qtd: 200, min: 0 },
      { id: "ovo", nome: "Ovos", un: "un", preco: 12, qtd: 12, min: 0 },
      { id: "lei", nome: "Leite integral", un: "ml", preco: 5.5, qtd: 1000, min: 0 },
      { id: "cho", nome: "Chocolate branco forneável", un: "g", preco: 70, qtd: 1000, min: 0 },
      { id: "lim", nome: "Limão", un: "un", preco: 0.8, qtd: 1, min: 0 },
      { id: "fer", nome: "Fermento químico", un: "g", preco: 5, qtd: 100, min: 0 },
      { id: "bic", nome: "Bicarbonato de sódio", un: "g", preco: 4, qtd: 80, min: 0 },
      { id: "bau", nome: "Essência de baunilha", un: "ml", preco: 6, qtd: 30, min: 0 },
      { id: "sal", nome: "Sal", un: "g", preco: 3, qtd: 1000, min: 0 },
      { id: "pot", nome: "Pote de vidro 220 ml", un: "un", preco: 3.5, qtd: 1, min: 0 },
      { id: "rot", nome: "Rótulo", un: "un", preco: 0.4, qtd: 1, min: 0 },
      { id: "cxc", nome: "Forminha + caixinha de cupcake", un: "un", preco: 1.3, qtd: 1, min: 0 },
      { id: "saq", nome: "Saquinho de cookie", un: "un", preco: 0.4, qtd: 1, min: 0 }
    ],
    produtos: [
      { id: "geleia", nome: "Geleia de morango", venda: "pote 200 g", rend: 4.2, preco: 20,
        itens: [{ ing: "mor", q: 1000 }, { ing: "acu", q: 400 }, { ing: "lim", q: 2 }],
        emb: [{ ing: "pot", q: 1 }, { ing: "rot", q: 1 }] },
      { id: "cupcake", nome: "Cupcake de morango", venda: "unidade", rend: 12, preco: 10,
        itens: [{ ing: "far", q: 125 }, { ing: "acu", q: 165 }, { ing: "man", q: 275 }, { ing: "ovo", q: 2 }, { ing: "lei", q: 30 },
                { ing: "fer", q: 6 }, { ing: "bau", q: 5 }, { ing: "sal", q: 1 }, { ing: "mor", q: 330 }, { ing: "con", q: 300 }],
        emb: [{ ing: "cxc", q: 1 }] },
      { id: "cookie", nome: "Cookie chocolate branco + morango", venda: "unidade ~90 g", rend: 12, preco: 9,
        itens: [{ ing: "man", q: 200 }, { ing: "acu", q: 100 }, { ing: "mas", q: 100 }, { ing: "ovo", q: 2 }, { ing: "far", q: 310 },
                { ing: "bic", q: 3 }, { ing: "sal", q: 2 }, { ing: "bau", q: 5 }, { ing: "cho", q: 200 }, { ing: "mor", q: 250 }],
        emb: [{ ing: "saq", q: 1 }] }
    ],
    fornadas: [
      { id: "f1", prod: "geleia", n: 3.5 },
      { id: "f2", prod: "cupcake", n: 3 },
      { id: "f3", prod: "cookie", n: 2 }
    ]
  };

  const STORE_KEY = "rafolino-gostosuras-v1";
  const TAB_KEY = "rafolino-gostosuras-aba";
  const TITLES = { fornadas: "Fornadas", receitas: "Receitas", ingredientes: "Ingredientes", compras: "Compras" };

  let S;
  let tab = "fornadas";
  let selProd = null;
  let pendingDelete = null;
  let busca = "";
  let undoSnap = null, undoTimer = null, saveTimer = null;

  const $ = (s) => document.querySelector(s);
  const uid = (p) => p + Math.random().toString(36).slice(2, 8);
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  // ---------- números em pt-BR ----------
  const ok = (n) => (isFinite(n) ? n : 0);
  const brl = (n) => ok(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const num = (n, d = 0) => ok(n).toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d });
  const pct = (n) => ok(n).toLocaleString("pt-BR", { style: "percent", maximumFractionDigits: 1 });
  const toIn = (n) => (n === 0 || n ? String(+(+n).toFixed(4)).replace(".", ",") : "");
  const parse = (v) => {
    const s = String(v).trim().replace(/\s/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".");
    const n = parseFloat(s);
    return isFinite(n) ? n : 0;
  };

  // ---------- cálculos ----------
  const ingById = (id) => S.ingredientes.find((i) => i.id === id);
  const prodById = (id) => S.produtos.find((p) => p.id === id);
  const unitCost = (ing) => (ing && ing.qtd > 0 ? ing.preco / ing.qtd : 0);

  function calcProd(p) {
    const lote = p.itens.reduce((a, it) => a + it.q * unitCost(ingById(it.ing)), 0);
    const gas = lote * S.config.gasPct;
    const emb = p.emb.reduce((a, it) => a + it.q * unitCost(ingById(it.ing)), 0);
    const porUn = p.rend > 0 ? (lote + gas) / p.rend + emb : 0;
    const sug = S.config.margemAlvo < 1 ? porUn / (1 - S.config.margemAlvo) : 0;
    const margem = p.preco > 0 ? (p.preco - porUn) / p.preco : 0;
    return { lote, gas, emb, porUn, sug, margem };
  }
  function calcFornada(f) {
    const p = prodById(f.prod);
    if (!p) return null;
    const c = calcProd(p);
    const un = Math.floor(f.n * p.rend + 1e-9);
    const custo = f.n * (c.lote + c.gas) + un * c.emb;
    const fat = un * p.preco;
    return { p, c, un, custo, fat, lucro: fat - custo, margem: fat > 0 ? (fat - custo) / fat : 0 };
  }
  function calcCompras() {
    const need = {};
    for (const f of S.fornadas) {
      const p = prodById(f.prod);
      if (!p) continue;
      const un = Math.floor(f.n * p.rend + 1e-9);
      for (const it of p.itens) need[it.ing] = (need[it.ing] || 0) + it.q * f.n;
      for (const it of p.emb) need[it.ing] = (need[it.ing] || 0) + it.q * un;
    }
    return S.ingredientes.filter((i) => need[i.id] > 0).map((i) => {
      const q = need[i.id];
      const pacotes = i.qtd > 0 ? Math.ceil(q / i.qtd - 1e-9) : 0;
      return { i, q, pacotes, compra: pacotes * i.preco, usado: q * unitCost(i), sobra: pacotes * i.qtd - q };
    });
  }

  // ---------- salvar no aparelho ----------
  const valid = (d) => d && d.config && Array.isArray(d.ingredientes) && Array.isArray(d.produtos) && Array.isArray(d.fornadas);
  function load() {
    try { const d = JSON.parse(localStorage.getItem(STORE_KEY)); if (valid(d)) return d; } catch (e) {}
    return clone(SEED);
  }
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch (e) {} }, 300);
  }
  function rememberTab() { try { localStorage.setItem(TAB_KEY, tab); } catch (e) {} }

  // ---------- desfazer ----------
  function snapshot(msg) {
    undoSnap = clone(S);
    clearTimeout(undoTimer);
    $("#toastHost").innerHTML = `<div class="toast" role="status"><span>${esc(msg)}</span><button id="undoBtn" type="button">Desfazer</button></div>`;
    undoTimer = setTimeout(() => { $("#toastHost").innerHTML = ""; undoSnap = null; }, 6000);
  }

  // ---------- render ----------
  function render() {
    const a = document.activeElement;
    let keep = null;
    if (a && a.id && a.tagName === "INPUT") keep = { id: a.id, v: a.value, s: a.selectionStart, e: a.selectionEnd };

    document.querySelectorAll(".tab").forEach((b) => {
      if (b.dataset.tab === tab) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current");
    });
    $("#screenTitle").textContent = TITLES[tab];
    const views = { fornadas: vFornadas, receitas: vReceitas, ingredientes: vIngredientes, compras: vCompras };
    $("#app").innerHTML = views[tab]();

    if (keep) {
      const el = document.getElementById(keep.id);
      if (el) { el.value = keep.v; el.focus({ preventScroll: true }); try { el.setSelectionRange(keep.s, keep.e); } catch (e) {} }
    }
  }

  const prodOptions = (sel) => S.produtos.map((p) => `<option value="${p.id}" ${p.id === sel ? "selected" : ""}>${esc(p.nome)}</option>`).join("");
  const ingOptions = (sel) => [...S.ingredientes].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
    .map((i) => `<option value="${i.id}" ${i.id === sel ? "selected" : ""}>${esc(i.nome)}</option>`).join("");
  const margemPill = (m) => `<span class="pill ${m >= 0.5 ? "good" : m >= 0.3 ? "warn" : "bad"}">margem ${pct(m)}</span>`;

  function confirmBox(text, kind, id, yes = "Remover") {
    return `<div class="confirm"><span>${esc(text)}</span>
      <button class="btn danger" type="button" data-act="del-yes" data-kind="${kind}" data-id="${id}">${esc(yes)}</button>
      <button class="btn ghost" type="button" data-act="cancel">Cancelar</button></div>`;
  }
  const xBtn = (kind, id, label) => `<button class="icon-btn" type="button" aria-label="${esc(label)}" data-act="del" data-kind="${kind}" data-id="${id}">×</button>`;

  // ----- Fornadas -----
  function vFornadas() {
    const rows = S.fornadas.map((f) => ({ f, r: calcFornada(f) })).filter((x) => x.r);
    const T = rows.reduce((a, { r }) => ({ un: a.un + r.un, custo: a.custo + r.custo, fat: a.fat + r.fat }), { un: 0, custo: 0, fat: 0 });
    const lucro = T.fat - T.custo;
    const mg = T.fat > 0 ? lucro / T.fat : 0;
    const tints = ["tint-pink", "tint-yellow", "tint-mint"];

    const cards = rows.map(({ f, r }, idx) => `
      <section class="card ${tints[idx % 3]}">
        <div class="ing-head">
          <select id="fp-${f.id}" data-act="fornada-prod" data-id="${f.id}" aria-label="Produto">${prodOptions(f.prod)}</select>
          ${xBtn("fornada", f.id, "Remover fornada")}
        </div>
        ${pendingDelete === "fornada:" + f.id ? confirmBox("Tirar esta fornada do plano?", "fornada", f.id) : ""}
        <div class="spread">
          <div class="stepper">
            <button type="button" data-act="fornada-step" data-id="${f.id}" data-d="-0.5" aria-label="Menos meia fornada">−</button>
            <input id="fn-${f.id}" inputmode="decimal" value="${toIn(f.n)}" data-act="fornada-n" data-id="${f.id}" aria-label="Número de fornadas">
            <button type="button" data-act="fornada-step" data-id="${f.id}" data-d="0.5" aria-label="Mais meia fornada">+</button>
          </div>
          <div style="text-align:right"><div class="hero-num" style="font-size:28px">${num(r.un)}</div><span class="muted">${esc(r.p.venda)}</span></div>
        </div>
        <div class="pills">
          <span class="pill">custo ${brl(r.custo)}</span>
          <span class="pill">vende ${brl(r.fat)}</span>
          ${margemPill(r.margem)}
        </div>
      </section>`).join("");

    return `
      <div class="split">
      <aside class="split-side">
      <section class="card tint-mint side-summary">
        <span class="label">Lucro bruto do plano</span>
        <div class="hero-num">${brl(lucro)}</div>
        <div class="stats">
          <div class="stat"><span class="label">Vende</span><b>${brl(T.fat)}</b></div>
          <div class="stat"><span class="label">Custa</span><b>${brl(T.custo)}</b></div>
          <div class="stat"><span class="label">Margem</span><b>${pct(mg)}</b></div>
        </div>
        <span class="muted">${num(T.un)} itens no total</span>
      </section>
      <div class="side-premissas">
      <h2>Premissas</h2>
      <section class="card">
        <div class="grid2">
          <label class="field"><span class="label">Gás e perdas (%)</span>
            <input id="cfg-gas" class="num" inputmode="decimal" value="${toIn(S.config.gasPct * 100)}" data-act="cfg" data-k="gasPct"></label>
          <label class="field"><span class="label">Margem desejada (%)</span>
            <input id="cfg-mg" class="num" inputmode="decimal" value="${toIn(S.config.margemAlvo * 100)}" data-act="cfg" data-k="margemAlvo"></label>
        </div>
        <span class="muted" style="font-size:14px">O custo não inclui mão de obra, frete nem taxa de aplicativo. Os dados ficam salvos só neste aparelho.</span>
        ${pendingDelete === "reset:all" ? confirmBox("Voltar tudo para os valores iniciais?", "reset", "all", "Restaurar")
          : `<button class="btn ghost" type="button" data-act="del" data-kind="reset" data-id="all">Restaurar valores iniciais</button>`}
      </section>
      </div>
      </aside>
      <div class="split-main">
        <div class="cards-grid">
          ${cards || `<section class="card"><p class="empty">Nenhuma fornada no plano ainda.</p></section>`}
        </div>
        <button class="btn primary block" type="button" data-act="fornada-add" ${S.produtos.length ? "" : "disabled"}>+ Adicionar fornada</button>
        ${S.produtos.length ? "" : `<p class="empty">Cadastre uma receita primeiro.</p>`}
      </div>
      </div>`;
  }

  // ----- Receitas -----
  function itemList(p, list) {
    if (!p[list].length) return `<p class="empty" style="padding:8px">Nada aqui ainda.</p>`;
    return `<div class="items">${p[list].map((it, idx) => {
      const ing = ingById(it.ing);
      return `<div class="item">
        <select id="ri-${p.id}-${list}-${idx}" data-act="item-ing" data-list="${list}" data-idx="${idx}" aria-label="Ingrediente">${ingOptions(it.ing)}</select>
        <div class="item-meta"><span>custa</span><b>${brl(it.q * unitCost(ing))}</b></div>
        <div class="item-qty"><input id="rq-${p.id}-${list}-${idx}" class="num" inputmode="decimal" value="${toIn(it.q)}" data-act="item-q" data-list="${list}" data-idx="${idx}" aria-label="Quantidade"><span>${ing ? esc(ing.un) : ""}</span></div>
        <button class="icon-btn" type="button" aria-label="Tirar da receita" data-act="item-del" data-list="${list}" data-idx="${idx}">×</button>
      </div>`;
    }).join("")}</div>`;
  }

  function vReceitas() {
    if (selProd && !prodById(selProd)) selProd = S.produtos[0]?.id || null;
    if (!selProd && S.produtos.length) selProd = S.produtos[0].id;
    const p = selProd ? prodById(selProd) : null;
    const chips = S.produtos.map((x) => `<button class="chip" type="button" aria-pressed="${x.id === selProd}" data-act="sel-prod" data-id="${x.id}">${esc(x.nome || "Sem nome")}</button>`).join("");

    let body = `<section class="card"><p class="empty">Nenhuma receita ainda. Toque em “+ Nova”.</p></section>`;
    if (p) {
      const c = calcProd(p);
      body = `
        <div class="rec-col">
        <section class="card">
          <label class="field"><span class="label">Nome do produto</span>
            <input id="p-nome-${p.id}" value="${esc(p.nome)}" data-act="prod" data-k="nome" style="font-weight:800"></label>
          <div class="grid3">
            <label class="field"><span class="label">Rende</span>
              <input id="p-rend-${p.id}" class="num" inputmode="decimal" value="${toIn(p.rend)}" data-act="prod" data-k="rend" data-num="1"></label>
            <label class="field" style="grid-column: span 2"><span class="label">Unidade de venda</span>
              <input id="p-venda-${p.id}" value="${esc(p.venda)}" data-act="prod" data-k="venda" placeholder="ex.: pote 200 g"></label>
          </div>
          <label class="field"><span class="label">Preço de venda (R$)</span>
            <input id="p-preco-${p.id}" class="num" inputmode="decimal" value="${toIn(p.preco)}" data-act="prod" data-k="preco" data-num="1"></label>
        </section>

        <section class="card">
          <div class="spread"><h3>Ingredientes da fornada</h3><span class="muted">${brl(c.lote)}</span></div>
          ${itemList(p, "itens")}
          <button class="btn" type="button" data-act="item-add" data-list="itens" ${S.ingredientes.length ? "" : "disabled"}>+ Ingrediente</button>
        </section>
        </div>

        <div class="rec-col">
        <section class="card">
          <div class="spread"><h3>Embalagem por unidade</h3><span class="muted">${brl(c.emb)}</span></div>
          ${itemList(p, "emb")}
          <button class="btn" type="button" data-act="item-add" data-list="emb" ${S.ingredientes.length ? "" : "disabled"}>+ Embalagem</button>
        </section>

        <section class="card tint-yellow">
          <div class="sum">
            <div class="hi"><span class="label">Custo por unidade</span><b>${brl(c.porUn)}</b></div>
            <div class="ok"><span class="label">Margem atual</span><b>${pct(c.margem)}</b></div>
            <div><span class="label">Preço sugerido</span><b>${brl(c.sug)}</b><span class="muted" style="font-size:13px">p/ ${pct(S.config.margemAlvo)} de margem</span></div>
            <div><span class="label">Custo da fornada</span><b>${brl(c.lote + c.gas)}</b><span class="muted" style="font-size:13px">com gás e perdas</span></div>
          </div>
        </section>

        <div class="row">
          <button class="btn" type="button" data-act="prod-dup">Duplicar</button>
          <button class="btn danger" type="button" data-act="del" data-kind="prod" data-id="${p.id}">Apagar receita</button>
        </div>
        ${pendingDelete === "prod:" + p.id ? confirmBox("Apagar esta receita e as fornadas dela?", "prod", p.id, "Apagar") : ""}
        </div>`;
    }
    return `
      <div class="rec">
        <div class="chips" role="group" aria-label="Receitas">${chips}<button class="chip add" type="button" data-act="prod-add">+ Nova</button></div>
        <div class="rec-body">${body}</div>
      </div>`;
  }

  // ----- Ingredientes -----
  function vIngredientes() {
    const usedIn = (id) => S.produtos.filter((p) => p.itens.some((i) => i.ing === id) || p.emb.some((i) => i.ing === id)).length;
    const q = busca.trim().toLowerCase();
    const list = S.ingredientes.filter((i) => !q || i.nome.toLowerCase().includes(q));
    const perUnit = (i) => i.un === "un" ? `${brl(unitCost(i))} /un` : `${brl(unitCost(i) * 1000)} ${i.un === "g" ? "/kg" : "/L"}`;

    return `
      <p class="lead">Preço da embalagem e quanto vem nela. O resto o app calcula.</p>
      <div class="toolbar">
        <input id="busca" type="search" placeholder="Buscar ingrediente" value="${esc(busca)}" data-act="busca" aria-label="Buscar ingrediente">
        <button class="btn primary desk-only" type="button" data-act="ing-add">+ Adicionar ingrediente</button>
      </div>
      <div class="cards-grid wide">
      ${list.map((i) => `
        <section class="card">
          <div class="ing-head">
            <input id="i-nome-${i.id}" value="${esc(i.nome)}" data-act="ing" data-id="${i.id}" data-k="nome" aria-label="Nome" style="font-weight:800">
            ${xBtn("ing", i.id, "Remover ingrediente")}
          </div>
          ${pendingDelete === "ing:" + i.id ? confirmBox(usedIn(i.id) ? "Remover? Ele sai das receitas também." : "Remover este ingrediente?", "ing", i.id) : ""}
          <div class="grid3">
            <label class="field"><span class="label">Preço R$</span>
              <input id="i-preco-${i.id}" class="num" inputmode="decimal" value="${toIn(i.preco)}" data-act="ing" data-id="${i.id}" data-k="preco" data-num="1"></label>
            <label class="field"><span class="label">Vem</span>
              <input id="i-qtd-${i.id}" class="num" inputmode="decimal" value="${toIn(i.qtd)}" data-act="ing" data-id="${i.id}" data-k="qtd" data-num="1"></label>
            <label class="field"><span class="label">Unidade</span>
              <select id="i-un-${i.id}" data-act="ing-un" data-id="${i.id}">${["g", "ml", "un"].map((u) => `<option ${u === i.un ? "selected" : ""}>${u}</option>`).join("")}</select></label>
          </div>
          <div class="grid2" style="align-items:end">
            <label class="field"><span class="label">Pedido mínimo R$</span>
              <input id="i-min-${i.id}" class="num" inputmode="decimal" value="${i.min ? toIn(i.min) : ""}" placeholder="opcional" data-act="ing" data-id="${i.id}" data-k="min" data-num="1"></label>
            <div style="text-align:right"><b>${perUnit(i)}</b><br><span class="muted" style="font-size:13px">${usedIn(i.id) ? "em " + usedIn(i.id) + (usedIn(i.id) > 1 ? " receitas" : " receita") : "não usado"}</span></div>
          </div>
        </section>`).join("") || `<p class="empty">Nada encontrado.</p>`}
      </div>
      <button class="btn primary block mobile-only" type="button" data-act="ing-add">+ Adicionar ingrediente</button>`;
  }

  // ----- Compras -----
  function vCompras() {
    const L = calcCompras();
    const tot = L.reduce((a, x) => ({ compra: a.compra + x.compra, usado: a.usado + x.usado }), { compra: 0, usado: 0 });
    return `
      <div class="split">
      <aside class="split-side">
      <section class="card tint-yellow side-summary">
        <span class="label">Gasto no mercado</span>
        <div class="hero-num">${brl(tot.compra)}</div>
        <div class="stats" style="grid-template-columns: repeat(2, minmax(0,1fr))">
          <div class="stat"><span class="label">Usado no plano</span><b>${brl(tot.usado)}</b></div>
          <div class="stat"><span class="label">Fica de estoque</span><b>${brl(tot.compra - tot.usado)}</b></div>
        </div>
      </section>
      <p class="lead side-note">Arredondado para embalagens inteiras, a partir do plano de fornadas.</p>
      </aside>
      <div class="split-main"><div class="cards-grid">
      ${L.map((x) => {
        let aviso = "";
        if (x.i.min > 0) aviso = x.compra + 1e-9 >= x.i.min
          ? `<span class="pill good">bate o mínimo de ${brl(x.i.min)}</span>`
          : `<span class="pill bad">faltam ${brl(x.i.min - x.compra)} p/ o mínimo</span>`;
        return `<section class="card">
          <div class="buy">
            <h3>${esc(x.i.nome)}</h3><span class="qty">${brl(x.compra)}</span>
            <span class="muted">Comprar <b style="color:var(--ink)">${num(x.pacotes)} × ${num(x.i.qtd)} ${esc(x.i.un)}</b></span>
            <span class="muted" style="text-align:right">usa ${num(x.q, x.q % 1 ? 1 : 0)} ${esc(x.i.un)}</span>
          </div>
          ${aviso || x.sobra > 0.0001 ? `<div class="pills">${aviso}${x.sobra > 0.0001 ? `<span class="pill">sobra ${num(x.sobra, x.sobra % 1 ? 1 : 0)} ${esc(x.i.un)}</span>` : ""}</div>` : ""}
        </section>`;
      }).join("") || `<section class="card"><p class="empty">O plano de fornadas está vazio.</p></section>`}
      </div></div>
      </div>`;
  }

  // ---------- eventos ----------
  function changed() { save(); render(); }

  document.addEventListener("input", (e) => {
    const t = e.target, act = t.dataset.act;
    if (!act) return;
    const p = selProd ? prodById(selProd) : null;
    if (act === "busca") { busca = t.value; render(); return; }
    if (act === "fornada-n") { const f = S.fornadas.find((x) => x.id === t.dataset.id); if (f) f.n = Math.max(0, parse(t.value)); }
    else if (act === "cfg") S.config[t.dataset.k] = Math.min(Math.max(parse(t.value) / 100, 0), 0.99);
    else if (act === "prod" && p) p[t.dataset.k] = t.dataset.num ? Math.max(0, parse(t.value)) : t.value;
    else if (act === "item-q" && p) p[t.dataset.list][+t.dataset.idx].q = Math.max(0, parse(t.value));
    else if (act === "ing") { const i = ingById(t.dataset.id); if (i) i[t.dataset.k] = t.dataset.num ? Math.max(0, parse(t.value)) : t.value; }
    else return;
    changed();
  });

  document.addEventListener("change", (e) => {
    const t = e.target, act = t.dataset.act;
    if (!act) return;
    const p = selProd ? prodById(selProd) : null;
    if (act === "fornada-prod") { const f = S.fornadas.find((x) => x.id === t.dataset.id); if (f) f.prod = t.value; }
    else if (act === "item-ing" && p) p[t.dataset.list][+t.dataset.idx].ing = t.value;
    else if (act === "ing-un") { const i = ingById(t.dataset.id); if (i) i.un = t.value; }
    else return;
    changed();
  });

  document.addEventListener("click", (e) => {
    const t = e.target.closest("button");
    if (!t) return;
    if (t.id === "undoBtn") {
      if (undoSnap) { S = undoSnap; undoSnap = null; $("#toastHost").innerHTML = ""; changed(); }
      return;
    }
    if (t.dataset.tab) {
      tab = t.dataset.tab; pendingDelete = null; rememberTab(); render(); window.scrollTo({ top: 0 });
      return;
    }
    const act = t.dataset.act;
    if (!act) return;
    const p = selProd ? prodById(selProd) : null;

    switch (act) {
      case "fornada-step": {
        const f = S.fornadas.find((x) => x.id === t.dataset.id);
        if (f) f.n = Math.max(0, Math.round((f.n + parseFloat(t.dataset.d)) * 2) / 2);
        return changed();
      }
      case "fornada-add":
        S.fornadas.push({ id: uid("f"), prod: S.produtos[0].id, n: 1 });
        return changed();
      case "ing-add": {
        const id = uid("i");
        S.ingredientes.push({ id, nome: "Novo ingrediente", un: "g", preco: 0, qtd: 1000, min: 0 });
        busca = "";
        changed();
        const el = document.getElementById("i-nome-" + id);
        if (el) { el.scrollIntoView({ block: "center" }); el.focus(); el.select(); }
        return;
      }
      case "prod-add": {
        const id = uid("p");
        S.produtos.push({ id, nome: "Nova receita", venda: "unidade", rend: 12, preco: 0, itens: [], emb: [] });
        selProd = id;
        changed();
        const el = document.getElementById("p-nome-" + id);
        if (el) { el.focus(); el.select(); }
        return;
      }
      case "prod-dup":
        if (p) { const n = clone(p); n.id = uid("p"); n.nome = p.nome + " (cópia)"; S.produtos.push(n); selProd = n.id; }
        return changed();
      case "sel-prod":
        selProd = t.dataset.id; pendingDelete = null; render(); window.scrollTo({ top: 0 });
        return;
      case "item-add":
        if (p) {
          const used = new Set(p[t.dataset.list].map((i) => i.ing));
          const first = S.ingredientes.find((i) => !used.has(i.id)) || S.ingredientes[0];
          p[t.dataset.list].push({ ing: first.id, q: t.dataset.list === "emb" ? 1 : 100 });
        }
        return changed();
      case "item-del":
        if (p) p[t.dataset.list].splice(+t.dataset.idx, 1);
        return changed();
      case "del":
        pendingDelete = t.dataset.kind + ":" + t.dataset.id; render();
        return;
      case "cancel":
        pendingDelete = null; render();
        return;
      case "del-yes": {
        const id = t.dataset.id, k = t.dataset.kind;
        if (k === "fornada") { snapshot("Fornada removida"); S.fornadas = S.fornadas.filter((f) => f.id !== id); }
        if (k === "prod") {
          snapshot(`“${prodById(id)?.nome || "Receita"}” apagada`);
          S.produtos = S.produtos.filter((x) => x.id !== id);
          S.fornadas = S.fornadas.filter((f) => f.prod !== id);
          selProd = S.produtos[0]?.id || null;
        }
        if (k === "ing") {
          snapshot(`“${ingById(id)?.nome || "Ingrediente"}” removido`);
          S.ingredientes = S.ingredientes.filter((i) => i.id !== id);
          S.produtos.forEach((x) => { x.itens = x.itens.filter((i) => i.ing !== id); x.emb = x.emb.filter((i) => i.ing !== id); });
        }
        if (k === "reset") { snapshot("Valores iniciais restaurados"); S = clone(SEED); selProd = S.produtos[0].id; }
        pendingDelete = null;
        return changed();
      }
    }
  });

  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && pendingDelete) { pendingDelete = null; render(); } });

  // ---------- início ----------
  S = load();
  try { const t = localStorage.getItem(TAB_KEY); if (TITLES[t]) tab = t; } catch (e) {}
  selProd = S.produtos[0]?.id || null;
  render();
})();
