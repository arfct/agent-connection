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
    this.render();
    this.dispatchEvent(new CustomEvent("hostchange", { detail: { host: id }, bubbles: true }));
  }

  connectedCallback() {
    const h = this.getAttribute("host");
    if (h) this.#host = h;
    this.render();
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
    for (const h of HOSTS) {
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
