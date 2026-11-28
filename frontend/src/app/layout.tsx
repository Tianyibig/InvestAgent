import "@/styles/globals.css";

import { type Metadata } from "next";

import { ThemeProvider } from "@/components/theme-provider";
import { ArtifactDraftsProvider } from "@/core/artifacts/draft-context";
import { DEFAULT_LOCALE } from "@/core/i18n/locale";

export const metadata: Metadata = {
  title: "InvestAgent",
  description:
    "A single-person industry research and investment analysis platform covering primary and secondary markets.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang={DEFAULT_LOCALE}
      suppressContentEditableWarning
      suppressHydrationWarning
    >
      <body>
        <ThemeProvider attribute="class" enableSystem disableTransitionOnChange>
          <ArtifactDraftsProvider>{children}</ArtifactDraftsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
