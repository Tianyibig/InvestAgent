import type { ProjectDocumentSourceKind } from "@/core/projects/types";
import { getFileName } from "@/core/utils/files";

const OUTPUTS_PREFIX = "/mnt/user-data/outputs/";
const UPLOADS_PREFIX = "/mnt/user-data/uploads/";

/**
 * Map a presented artifact path to the from-thread promote payload.
 * Returns null when the path is not a thread upload/output the shelf can take.
 */
export function threadFileFromArtifactPath(filepath: string): {
  kind: ProjectDocumentSourceKind;
  name: string;
} | null {
  if (filepath.startsWith(OUTPUTS_PREFIX)) {
    return { kind: "output", name: getFileName(filepath) };
  }
  if (filepath.startsWith(UPLOADS_PREFIX)) {
    return { kind: "upload", name: getFileName(filepath) };
  }
  return null;
}
