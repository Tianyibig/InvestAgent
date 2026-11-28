/**
 * About InvestAgent markdown content. Inlined to avoid raw-loader dependency
 * (Turbopack cannot resolve raw-loader for .md imports).
 */
import { APP_VERSION } from "@/version";

export const aboutMarkdown = `# [About InvestAgent ${APP_VERSION}](https://github.com/Tianyibig/InvestAgent)

InvestAgent is a single-person industry research and investment analysis platform covering primary and secondary markets.

The agent runtime in this repository comes from the upstream project [deer-flow](https://github.com/bytedance/deer-flow), used under the MIT License. InvestAgent is the product name.

---

## Core features

* **Research skills**: equity notes, IC memos, sector scans, portfolio review, and evidence-chain gates.
* **Sub-agents**: help the main agent with work that is too large for one pass.
* **Sandbox and files**: execute code and edit files in a sandbox.
* **Context**: isolated sub-agent context and summarization.
* **Memory**: profile, priorities, and conversation history stay on this machine.

---

## Repository

Source for this product: [github.com/Tianyibig/InvestAgent](https://github.com/Tianyibig/InvestAgent)

Upstream runtime: [github.com/bytedance/deer-flow](https://github.com/bytedance/deer-flow)

## Support

Questions and bugs: [GitHub issues](https://github.com/Tianyibig/InvestAgent/issues).

---

## License

InvestAgent is open source under the **MIT License**. The copyright notices in LICENSE stay in place, including the upstream copyright.

---

## Acknowledgments

The runtime stands on open-source work, including:

- **[LangChain](https://github.com/langchain-ai/langchain)**
- **[LangGraph](https://github.com/langchain-ai/langgraph)**
- **[Next.js](https://nextjs.org/)**
- **[shadcn/ui](https://ui.shadcn.com/)**

Upstream harness authors include [Daniel Walnut](https://github.com/hetaoBackend/) and [Henry Li](https://github.com/magiccube/).
`;
