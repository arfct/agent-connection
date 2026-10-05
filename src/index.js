// Server-safe entry: the host table and the guide. The web component is
// in ./element.js so this module never touches the DOM.

export { escapeHtml, guideHtml, guideMarkdown } from "./guide.js";
export {
  CHATGPT_CONNECTORS_URL,
  claudeConnectorLink,
  cursorInstallLink,
  endpoints,
  HOSTS,
  hostById,
  hostForClientName,
  setupFor,
  vscodeInstallLink,
} from "./hosts.js";
