export async function readJson(req) {
  try {
    return await req.json();
  } catch {
    return {};
  }
}

export function bad(message, status = 400) {
  return Response.json({ error: message }, { status });
}

/** Trim a user-supplied string and cap its length; returns "" for non-strings. */
export function clean(value, max) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
