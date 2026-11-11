/**
 * Verificación rápida de CP-013 sin JMeter (no lo reemplaza: la evidencia oficial es el reporte JMeter).
 * Simula N usuarios concurrentes consultando /api/catalog durante D segundos y reporta errores.
 *
 *   node jmeter/catalog-load-smoke.mjs            (50 usuarios, 60 s)
 *   USERS=50 DURATION=20 node jmeter/catalog-load-smoke.mjs
 */
const BASE = process.env.API_URL ?? 'http://localhost:4000/api';
const USERS = Number(process.env.USERS ?? 50);
const DURATION_MS = Number(process.env.DURATION ?? 60) * 1000;
const PATHS = ['/catalog', `/catalog?category=${encodeURIComponent('Cómputo')}`, '/catalog?category=Redes'];

const stats = { ok: 0, errors: 0, latencies: [] };

async function virtualUser(deadline, index) {
  let iteration = index;
  while (Date.now() < deadline) {
    const path = PATHS[iteration % PATHS.length];
    iteration += 1;
    const started = performance.now();
    try {
      const response = await fetch(`${BASE}${path}`);
      await response.arrayBuffer();
      if (response.status === 200) stats.ok += 1;
      else stats.errors += 1;
    } catch {
      stats.errors += 1;
    }
    stats.latencies.push(performance.now() - started);
  }
}

function percentile(values, p) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))] ?? 0;
}

const deadline = Date.now() + DURATION_MS;
await Promise.all(Array.from({ length: USERS }, (_, i) => virtualUser(deadline, i)));

const total = stats.ok + stats.errors;
const avg = stats.latencies.reduce((sum, value) => sum + value, 0) / Math.max(1, stats.latencies.length);
console.log(`Usuarios: ${USERS} | Duración: ${DURATION_MS / 1000}s | Peticiones: ${total}`);
console.log(`Throughput: ${(total / (DURATION_MS / 1000)).toFixed(1)} req/s`);
console.log(`Latencia promedio: ${avg.toFixed(1)} ms | p95: ${percentile(stats.latencies, 95).toFixed(1)} ms`);
console.log(`Errores: ${stats.errors} (${((stats.errors / Math.max(1, total)) * 100).toFixed(2)}%)`);
process.exitCode = stats.errors === 0 ? 0 : 1;
