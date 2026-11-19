import type { EvaluationMetrics, Health, ScanListItem, ScanResult, XrayType } from "./types";

const baseUrl = import.meta.env.VITE_API_URL ?? "";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, init);
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = await response.json() as { detail?: string };
      message = body.detail ?? message;
    } catch { /* Response may not contain JSON. */ }
    throw new Error(message);
  }
  return response.status === 204 ? undefined as T : response.json() as Promise<T>;
}

export const api = {
  health: () => request<Health>("/api/health"),
  scans: () => request<ScanListItem[]>("/api/scans"),
  scan: (id: string) => request<ScanResult>(`/api/scans/${encodeURIComponent(id)}`),
  metrics: () => request<EvaluationMetrics>("/api/metrics"),
  analyze: (file: File, type: XrayType, onProgress?: (progress: number) => void) =>
    new Promise<ScanResult>((resolve, reject) => {
      const data = new FormData();
      data.append("file", file);
      data.append("xray_type", type);
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${baseUrl}/api/analyze`);
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) onProgress?.(Math.round(event.loaded / event.total * 18));
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          onProgress?.(100);
          resolve(JSON.parse(xhr.responseText) as ScanResult);
        } else {
          try { reject(new Error(JSON.parse(xhr.responseText).detail ?? "Unable to analyze image.")); }
          catch { reject(new Error("Unable to analyze image.")); }
        }
      };
      xhr.onerror = () => reject(new Error("Could not reach the analysis server."));
      xhr.send(data);
    }),
  deleteScan: (id: string) => request<void>(`/api/scans/${encodeURIComponent(id)}`, { method: "DELETE" }),
  image: (id: string, variant: "original" | "annotated" | "preprocessed" | "before") =>
    `${baseUrl}/api/scans/${encodeURIComponent(id)}/image?variant=${variant}`,
  report: (id: string) => `${baseUrl}/api/scans/${encodeURIComponent(id)}/report.pdf`,
};
