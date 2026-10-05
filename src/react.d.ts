// Import this module's types from a React project so `<agent-connection>`
// is a known JSX element: `import "@arfct/agent-connection/react";`
import type { AgentConnectionElement } from "./element.js";

type Attrs = React.DetailedHTMLProps<React.HTMLAttributes<AgentConnectionElement>, AgentConnectionElement> & {
  name?: string;
  slug?: string;
  origin?: string;
  mcp?: string;
  "no-mcp"?: boolean | "";
  "anonymous-mcp"?: string;
  api?: string;
  openapi?: string;
  skill?: string;
  settings?: string;
  source?: string;
  marketplace?: string;
  "token-name"?: string;
  host?: string;
  anonymous?: boolean | "";
};

declare global {
  namespace React {
    namespace JSX {
      interface IntrinsicElements {
        "agent-connection": Attrs;
      }
    }
  }
}
