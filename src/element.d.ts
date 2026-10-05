import type { HostId, Product } from "./index.js";

/** The `<agent-connection>` panel. Importing this module defines the element. */
export class AgentConnectionElement extends HTMLElement {
  product: Product;
  host: HostId | string;
  render(): void;
}

declare global {
  interface HTMLElementTagNameMap {
    "agent-connection": AgentConnectionElement;
  }
}
