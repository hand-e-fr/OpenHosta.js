import { Buffer } from "node:buffer";

export type BinaryLike = Buffer | ArrayBuffer | ArrayBufferView;

export function isBinaryLike(value: unknown): value is BinaryLike {
  return (
    (typeof Buffer !== "undefined" && Buffer.isBuffer(value)) ||
    value instanceof ArrayBuffer ||
    ArrayBuffer.isView(value)
  );
}

export function binaryToDataUrl(value: BinaryLike, format = "png"): string {
  const buffer = Buffer.isBuffer(value)
    ? value
    : value instanceof ArrayBuffer
      ? Buffer.from(value)
      : Buffer.from(value.buffer);
  return `data:image/${format};base64,${buffer.toString("base64")}`;
}
