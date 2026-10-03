import type { MenuData } from "../types";
export type LiveMenu = MenuData & { revision: number };
export async function adminRequest<T>(
  path: string,
  method = "GET",
  data?: unknown,
): Promise<T> {
  const response = await fetch(path, {
    method,
    cache: "no-store",
    headers: data === undefined ? {} : { "Content-Type": "application/json" },
    body: data === undefined ? undefined : JSON.stringify(data),
  });
  if (!response.headers.get("content-type")?.includes("application/json"))
    throw new Error(
      "The owner service is unavailable. Please reconnect and try again.",
    );
  const result = await response.json();
  if (!response.ok)
    throw new Error(
      result.error || "Changes could not be saved. Please try again.",
    );
  return result as T;
}
export async function uploadPhoto(file: File): Promise<string> {
  if (
    !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
    file.size > 5 * 1024 * 1024
  )
    throw new Error("Choose a JPG, PNG or WebP photo up to 5 MB.");
  const response = await fetch("/api/admin/photos", {
    method: "POST",
    headers: { "Content-Type": file.type },
    body: file,
  });
  const result = await response.json();
  if (!response.ok)
    throw new Error(result.error || "Photo upload failed. Please try again.");
  return result.url;
}
