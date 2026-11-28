import { type Metadata } from "next";

import { InvestWorkbench } from "@/components/workspace/invest/invest-workbench";

export const metadata: Metadata = {
  title: "Invest Workbench",
  description: "Dual-track (PE/VC and secondary equity) research workbench",
};

// Public demo entry. The authenticated copy lives at /workspace/invest and
// requires the Gateway to run with DEER_FLOW_AUTH_DISABLED=1 (or a real session).
export default function InvestPage() {
  return <InvestWorkbench />;
}
