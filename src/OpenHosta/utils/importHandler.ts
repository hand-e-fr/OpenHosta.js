import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

function isPackageAvailable(pkg: string): boolean {
  try {
    require.resolve(pkg);
    return true;
  } catch {
    return false;
  }
}

export const isPydanticAvailable = isPackageAvailable("pydantic");
export const isTorchAvailable = isPackageAvailable("torch");
