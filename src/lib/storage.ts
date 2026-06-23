import { supabase } from "@/lib/supabase";

// Artefact photos (session diary + benchmarks) live in the public Supabase
// Storage bucket `artefacts` (created by migration 0002). Single-user app, so
// the bucket is public-read with anon write, same trade-off as the DB RLS.

const BUCKET = "artefacts";

function extFor(type: string): string {
  if (type.includes("png")) return "png";
  if (type.includes("webp")) return "webp";
  if (type.includes("heic")) return "heic";
  return "jpg";
}

/**
 * Upload an artefact image and return its public URL.
 * @param prefix folder within the bucket, e.g. "sessions" or "benchmarks".
 */
export async function uploadArtefact(file: File | Blob, prefix: string): Promise<string> {
  const type = (file as File).type || "image/jpeg";
  const path = `${prefix}/${crypto.randomUUID()}.${extFor(type)}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    upsert: false,
    contentType: type,
    cacheControl: "31536000",
  });
  if (error) throw error;

  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
