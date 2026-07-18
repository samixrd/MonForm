/**
 * Storage client for MonForm — browser-safe.
 *
 * Uploads are proxied through /api/upload (a Next.js server route) so the
 * Node.js-only @irys/upload SDK never touches the browser bundle.
 * Fetches go directly to the public Irys gateway.
 */

/**
 * Upload an encrypted payload to Arweave via Irys (free tier, < 100 KiB).
 * Returns the real Irys transaction ID.
 */
export async function uploadToStorage(data: unknown): Promise<string> {
  const res = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      body?.error ?? `Upload failed with status ${res.status}.`
    );
  }

  const { id } = await res.json();
  if (!id) throw new Error("Irys upload succeeded but returned no transaction ID.");
  return id;
}

/**
 * Retrieve a previously uploaded payload from the public Irys gateway.
 */
export async function fetchFromStorage(id: string): Promise<unknown> {
  const res = await fetch(`https://gateway.irys.xyz/${id}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch from Irys gateway: ${res.statusText}`);
  }
  return res.json();
}

