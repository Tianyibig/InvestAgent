import { describe, expect, it } from "@rstest/core";

import { threadFileFromArtifactPath } from "@/core/artifacts/promote-path";

describe("threadFileFromArtifactPath", () => {
  it("maps outputs paths", () => {
    expect(
      threadFileFromArtifactPath(
        "/mnt/user-data/outputs/600519-equity-note.md",
      ),
    ).toEqual({ kind: "output", name: "600519-equity-note.md" });
  });

  it("maps uploads paths", () => {
    expect(
      threadFileFromArtifactPath("/mnt/user-data/uploads/raw-filing.pdf"),
    ).toEqual({ kind: "upload", name: "raw-filing.pdf" });
  });

  it("rejects unrelated paths", () => {
    expect(threadFileFromArtifactPath("/mnt/skills/public/x.md")).toBeNull();
  });
});
