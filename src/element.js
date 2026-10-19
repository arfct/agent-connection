// <agent-connection>: the settings panel. One tab per host, the setup
// snippets with a copy button each. Shadow DOM, themed by CSS custom
// properties on the host element (see README). Attributes name the
// product; a `product` property takes the whole object instead.
//
//   <agent-connection name="Menagerie" slug="menagerie" origin="https://menagerie.fyi"
//     api="https://menagerie.fyi/api" openapi="https://menagerie.fyi/openapi.yaml"
//     skill="https://menagerie.fyi/skill.md" settings="https://menagerie.fyi/settings"
//     source="https://github.com/arfct/menagerie" marketplace="arfct/menagerie"></agent-connection>
//
// Browser only; import this module from client code, never on a server.

import { HOSTS, setupFor } from "./hosts.js";

const PRODUCT_ATTRS = ["name", "slug", "origin", "mcp", "anonymous-mcp", "api", "openapi", "skill", "settings", "source", "marketplace", "token-name"];

const STYLE = `
:host{display:block;font:inherit;color:inherit}
.more{position:relative}
.tab[aria-haspopup]::after{content:"";display:inline-block;margin-left:6px;vertical-align:2px;border:4px solid transparent;border-top-color:currentColor;border-bottom-width:0}
.menu{position:absolute;z-index:1;top:calc(100% + 4px);left:0;min-width:100%;display:flex;flex-direction:column;padding:4px;border:1px solid var(--agent-connection-line,#d6d3d1);border-radius:var(--agent-connection-field-radius,8px);background:var(--agent-connection-surface,Canvas);box-shadow:0 6px 20px rgba(0,0,0,.12)}
.menu[hidden]{display:none}
.item{appearance:none;border:0;border-radius:var(--agent-connection-field-radius,8px);padding:6px 10px;text-align:left;white-space:nowrap;font:inherit;font-size:13px;line-height:20px;cursor:pointer;background:transparent;color:var(--agent-connection-fg,inherit)}
.item:hover,.item:focus-visible{background:var(--agent-connection-tonal,#e7e5e4);outline:none}
.item[aria-checked="true"]{font-weight:600}
*{box-sizing:border-box}
.tabs{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:16px}
.tab{appearance:none;border:0;border-radius:var(--agent-connection-radius,999px);padding:6px 12px;font:inherit;font-size:13px;line-height:20px;cursor:pointer;background:transparent;color:var(--agent-connection-muted,#78716c)}
.tab:hover{color:var(--agent-connection-fg,inherit)}
.tab[aria-selected="true"]{background:var(--agent-connection-accent,#1f5a3f);color:var(--agent-connection-on-accent,#fff)}
.panel{display:flex;flex-direction:column;gap:12px}
.intro,.note{margin:0;color:var(--agent-connection-muted,#78716c);font-size:14px;line-height:20px}
.note{font-size:12px;line-height:16px}
.row{display:flex;flex-direction:column;gap:4px}
.label{font-size:12px;font-weight:500;letter-spacing:.4px;color:var(--agent-connection-muted,#78716c)}
.label a{color:inherit;text-decoration:underline;text-underline-offset:2px}
.line{display:flex;align-items:center;gap:8px}
input{flex:1;min-width:0;height:40px;padding:0 12px;border-radius:var(--agent-connection-field-radius,8px);border:1px solid var(--agent-connection-line,#d6d3d1);background:transparent;color:inherit;font:13px ui-monospace,Menlo,monospace}
input:focus{outline:2px solid var(--agent-connection-accent,#1f5a3f);outline-offset:-1px}
.copy{appearance:none;flex:none;height:32px;padding:0 12px;border:0;border-radius:var(--agent-connection-radius,999px);font:inherit;font-size:13px;cursor:pointer;background:var(--agent-connection-tonal,#e7e5e4);color:var(--agent-connection-fg,inherit)}
`;

export class AgentConnectionElement extends HTMLElement {
  static get observedAttributes() {
    return [...PRODUCT_ATTRS, "host", "anonymous"];
  }

  /** @type {import("./index.js").Product | null} */
  #product = null;
  #host = "claude";
  #copied = "";
  #menuOpen = false;
  // a click anywhere outside the More menu closes it
  #onOutside = (/** @type {Event} */ e) => {
    if (this.#menuOpen && !e.composedPath().some((n) => n instanceof Element && n.classList?.contains("more"))) {
      this.#setMenu(false);
    }
  };

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  /** The product object, in place of attributes. */
  get product() {
    if (this.#product) return this.#product;
    const attr = (n) => this.getAttribute(n) ?? undefined;
    const origin = attr("origin") ?? (typeof location !== "undefined" ? location.origin : "");
    return {
      name: attr("name") ?? "This product",
      slug: attr("slug") ?? (attr("name") ?? "product").toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      origin,
      mcp: this.hasAttribute("no-mcp") ? null : attr("mcp"),
      anonymousMcp: attr("anonymous-mcp"),
      api: attr("api"),
      openapi: attr("openapi"),
      skill: attr("skill"),
      settings: attr("settings"),
      source: attr("source"),
      marketplace: attr("marketplace"),
      tokenName: attr("token-name"),
    };
  }

  set product(p) {
    this.#product = p;
    this.render();
  }

  /** The selected host id. */
  get host() {
    return this.#host;
  }

  set host(id) {
    this.#host = id;
    this.#menuOpen = false;
    this.render();
    this.dispatchEvent(new CustomEvent("hostchange", { detail: { host: id }, bubbles: true }));
  }

  connectedCallback() {
    const h = this.getAttribute("host");
    if (h) this.#host = h;
    document.addEventListener("click", this.#onOutside, true);
    this.render();
  }

  disconnectedCallback() {
    document.removeEventListener("click", this.#onOutside, true);
  }

  /** @param {boolean} open */
  #setMenu(open) {
    this.#menuOpen = open;
    const root = this.shadowRoot;
    root?.querySelector(".menu")?.toggleAttribute("hidden", !open);
    root?.querySelector(".tab[aria-haspopup]")?.setAttribute("aria-expanded", String(open));
    if (open) /** @type {HTMLElement | null | undefined} */ (root?.querySelector(".item[aria-checked=true], .item"))?.focus();
  }

  attributeChangedCallback(name, _old, value) {
    if (name === "host" && value) this.#host = value;
    if (this.isConnected) this.render();
  }

  render() {
    const root = this.shadowRoot;
    if (!root) return;
    const p = this.product;
    const anonymous = this.hasAttribute("anonymous");
    const setup = setupFor(p, /** @type {any} */ (this.#host), { anonymous });
    root.replaceChildren();
    const style = document.createElement("style");
    style.textContent = STYLE;
    root.append(style);

    const tabs = document.createElement("div");
    tabs.className = "tabs";
    tabs.setAttribute("role", "tablist");
    tabs.setAttribute("aria-label", "Agent host");
    for (const h of HOSTS.filter((x) => !x.more)) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "tab";
      b.setAttribute("role", "tab");
      b.setAttribute("aria-selected", String(h.id === this.#host));
      b.textContent = h.label;
      b.addEventListener("click", () => {
        this.host = h.id;
      });
      tabs.append(b);
    }
    tabs.append(this.#moreMenu(HOSTS.filter((x) => x.more)));
    root.append(tabs);

    const panel = document.createElement("div");
    panel.className = "panel";
    panel.setAttribute("role", "tabpanel");
    const intro = document.createElement("p");
    intro.className = "intro";
    intro.textContent = setup.intro;
    panel.append(intro);
    for (const s of setup.snippets) panel.append(this.#row(s));
    if (setup.note) {
      const note = document.createElement("p");
      note.className = "note";
      note.textContent = setup.note;
      panel.append(note);
    }
    root.append(panel);
  }

  /**
   * The More tab: a menu of the hosts that don't get a tab of their own.
   * It reads as selected while one of them is the open host.
   * @param {import("./index.js").Host[]} hosts
   */
  #moreMenu(hosts) {
    const wrap = document.createElement("div");
    wrap.className = "more";
    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "tab";
    trigger.setAttribute("role", "tab");
    trigger.setAttribute("aria-haspopup", "menu");
    trigger.setAttribute("aria-expanded", String(this.#menuOpen));
    trigger.setAttribute("aria-selected", String(hosts.some((h) => h.id === this.#host)));
    trigger.textContent = "More";
    trigger.addEventListener("click", () => this.#setMenu(!this.#menuOpen));
    const menu = document.createElement("div");
    menu.className = "menu";
    menu.setAttribute("role", "menu");
    menu.toggleAttribute("hidden", !this.#menuOpen);
    menu.addEventListener("keydown", (e) => {
      const items = /** @type {HTMLElement[]} */ ([...menu.querySelectorAll(".item")]);
      const at = items.indexOf(/** @type {HTMLElement} */ (this.shadowRoot?.activeElement));
      if (e.key === "Escape") {
        this.#setMenu(false);
        trigger.focus();
      } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        items[(at + (e.key === "ArrowDown" ? 1 : items.length - 1)) % items.length]?.focus();
      }
    });
    for (const h of hosts) {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "item";
      item.setAttribute("role", "menuitemradio");
      item.setAttribute("aria-checked", String(h.id === this.#host));
      item.textContent = h.label;
      item.addEventListener("click", () => {
        this.host = h.id;
      });
      menu.append(item);
    }
    wrap.append(trigger, menu);
    return wrap;
  }

  /** @param {import("./index.js").Snippet} s */
  #row(s) {
    const row = document.createElement("div");
    row.className = "row";
    const label = document.createElement("span");
    label.className = "label";
    if (s.href) {
      const a = document.createElement("a");
      a.href = s.href;
      a.textContent = s.label;
      if (/^https?:/.test(s.href)) {
        a.target = "_blank";
        a.rel = "noreferrer";
      }
      label.append(a);
    } else label.textContent = s.label;
    const line = document.createElement("div");
    line.className = "line";
    const input = document.createElement("input");
    input.readOnly = true;
    input.value = s.text;
    input.setAttribute("aria-label", s.label);
    input.addEventListener("focus", () => input.select());
    const copy = document.createElement("button");
    copy.type = "button";
    copy.className = "copy";
    copy.textContent = this.#copied === s.text ? "Copied" : "Copy";
    copy.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(s.text);
        this.#copied = s.text;
        copy.textContent = "Copied";
        setTimeout(() => {
          if (this.#copied === s.text) this.#copied = "";
          copy.textContent = "Copy";
        }, 1500);
      } catch {
        input.focus();
      }
      this.dispatchEvent(new CustomEvent("copy", { detail: { label: s.label, text: s.text }, bubbles: true }));
    });
    line.append(input, copy);
    row.append(label, line);
    return row;
  }
}

if (typeof customElements !== "undefined" && !customElements.get("agent-connection")) {
  customElements.define("agent-connection", AgentConnectionElement);
}
