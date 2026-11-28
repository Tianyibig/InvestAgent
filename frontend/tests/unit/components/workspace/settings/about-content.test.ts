import { afterEach, expect, test, rs } from "@rstest/core";

const original = process.env.NEXT_PUBLIC_APP_VERSION;

afterEach(() => {
  rs.resetModules();
  if (original === undefined) {
    delete process.env.NEXT_PUBLIC_APP_VERSION;
  } else {
    process.env.NEXT_PUBLIC_APP_VERSION = original;
  }
});

test("aboutMarkdown heading interpolates the app version", async () => {
  process.env.NEXT_PUBLIC_APP_VERSION = "9.9.9-test";
  const { aboutMarkdown } =
    await import("@/components/workspace/settings/about-content");
  // The heading link text carries the version stamp.
  expect(aboutMarkdown).toContain("[About InvestAgent 9.9.9-test]");
  expect(aboutMarkdown).toContain(
    "[Daniel Walnut](https://github.com/hetaoBackend/)",
  );
  expect(aboutMarkdown).not.toContain("deerflow.tech");
});

test("aboutMarkdown heading reflects the package version when env is unset", async () => {
  delete process.env.NEXT_PUBLIC_APP_VERSION;
  const { APP_VERSION } = await import("@/version");
  const { aboutMarkdown } =
    await import("@/components/workspace/settings/about-content");
  // The heading carries the resolved version, not an empty or undefined stamp.
  expect(aboutMarkdown).toContain(`[About InvestAgent ${APP_VERSION}]`);
  expect(aboutMarkdown).not.toContain("About InvestAgent ]");
  expect(aboutMarkdown).not.toContain("About InvestAgent undefined");
});
