import { type Metadata } from "next";

import { InvestWorkbench } from "@/components/workspace/invest/invest-workbench";

export const metadata: Metadata = {
  title: "Invest Workbench",
  description: "Dual-track (PE/VC and secondary equity) research workbench",
};

export default function InvestPage() {
  return <InvestWorkbench />;
}
