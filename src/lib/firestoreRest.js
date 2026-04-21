const PROJECT_ID = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

function decodeValue(v) {
  if (v == null) return null;
  if ('stringValue'    in v) return v.stringValue;
  if ('integerValue'   in v) return Number(v.integerValue);
  if ('doubleValue'    in v) return v.doubleValue;
  if ('booleanValue'   in v) return v.booleanValue;
  if ('nullValue'      in v) return null;
  if ('timestampValue' in v) return v.timestampValue;
  if ('arrayValue'     in v) return (v.arrayValue.values || []).map(decodeValue);
  if ('mapValue'       in v) return decodeFields(v.mapValue.fields || {});
  return null;
}

function decodeFields(fields) {
  const out = {};
  for (const k in fields) out[k] = decodeValue(fields[k]);
  return out;
}

export function decodeDoc(doc) {
  if (!doc) return null;
  const id = doc.name.split('/').pop();
  return { id, ...decodeFields(doc.fields || {}) };
}

export async function restGetDoc(path, idToken) {
  const res = await fetch(`${BASE}/${path}`, {
    headers: idToken ? { Authorization: `Bearer ${idToken}` } : {},
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Firestore REST ${res.status}: ${await res.text()}`);
  return decodeDoc(await res.json());
}
