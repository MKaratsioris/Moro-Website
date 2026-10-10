import { getStore } from '@netlify/blobs';
import { createHash, randomInt } from 'node:crypto';
import { readFile } from 'node:fs/promises';

export default async function handler(request) {
  const reply = (data, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
  if (request.method !== 'POST') return reply({ error: 'Method not allowed' }, 405);
  try {
    const { key, increment } = await request.json();
    if (typeof increment !== 'boolean' || typeof key !== 'string') return reply({ error: 'Invalid request' }, 400);
    // Only counters for published performance videos can be created.
    const manifestText = await readFile(process.cwd() + '/media-manifest.js', 'utf8');
    const manifest = JSON.parse(manifestText.slice(manifestText.indexOf('{')).replace(/;\s*$/, ''));
    if (key !== 'visitors' && !manifest.performances.some(item => key === 'video:' + item.src)) return reply({ error: 'Unknown counter' }, 400);
    const store = getStore({ name: 'audience-counters', consistency: 'strong' });
    const id = createHash('sha256').update(key).digest('hex');
    // Conditional writes preserve increments even when requests arrive together.
    for (let attempt = 0; attempt < 20; attempt++) {
      const current = await store.getWithMetadata(id, { type: 'json' });
      const seed = key === 'visitors' ? randomInt(3696, 9637) : randomInt(369, 964);
      const count = (current?.data.count ?? seed) + (increment ? 1 : 0);
      if (current && !increment) return reply({ count });
      const result = await store.setJSON(id, { count }, current ? { onlyIfMatch: current.etag } : { onlyIfNew: true });
      if (result.modified) return reply({ count });
    }
    return reply({ error: 'Counter busy; retry later' }, 503);
  } catch {
    return reply({ error: 'Counter unavailable' }, 503);
  }
}
