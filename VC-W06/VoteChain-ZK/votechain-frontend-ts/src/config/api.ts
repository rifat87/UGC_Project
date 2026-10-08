export const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "")

export function apiUrl(path: string) {
  if (!apiBaseUrl) {
    throw new Error("VITE_API_BASE_URL is not configured")
  }
  return `${apiBaseUrl}${path.startsWith("/") ? path : `/${path}`}`
}
