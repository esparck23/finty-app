import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Tests estáticos sobre el código fuente de sw.ts.
 *
 * El Service Worker (sw.ts) se compila a public/sw.js vía @serwist/next
 * en tiempo de build y se ejecuta en un contexto de Service Worker real
 * (no en jsdom/Node). Por tanto, los tests funcionales del SW se hacen
 * mejor inspeccionando el código fuente y validando que la
 * configuración declarada coincide con el contrato del bloque 5.1:
 *
 *   - Solo GET sobre /api/categories y /api/transactions
 *   - Estrategia NetworkFirst con cacheName "api-cache-v1"
 *   - Ninguna otra ruta /api/* debe ser interceptada
 */

const SW_SOURCE_PATH = path.join(__dirname, 'sw.ts');
const SW_SOURCE = fs.readFileSync(SW_SOURCE_PATH, 'utf8');

/**
 * Extrae el array `runtimeCaching` del fuente del SW evaluando
 * únicamente el subconjunto JSON-compatible de la expresión literal
 * del matcher. Como el matcher es una función flecha, parseamos su
 * cuerpo y comprobamos las condiciones que contiene.
 */
function matcherBodyContains(needle: string): boolean {
  // Localiza el bloque del matcher dentro de runtimeCaching.
  const matcherMatch = SW_SOURCE.match(
    /matcher:\s*\(\{\s*url,\s*request\s*\}\)\s*=>\s*\{([\s\S]*?)\}/,
  );
  if (!matcherMatch) return false;
  return matcherMatch[1].includes(needle);
}

describe('Service Worker base (Serwist) — bloque 5.1', () => {
  it('el archivo sw.ts existe y se compila desde src/app', () => {
    expect(fs.existsSync(SW_SOURCE_PATH)).toBe(true);
  });

  describe('rutas cacheadas (runtimeCaching)', () => {
    it('intercepts /api/categories', () => {
      expect(matcherBodyContains('"/api/categories"')).toBe(true);
    });

    it('intercepts /api/transactions', () => {
      expect(matcherBodyContains('"/api/transactions"')).toBe(true);
    });

    it('only caches GET requests (ignora POST/PUT/DELETE)', () => {
      expect(matcherBodyContains('request.method === "GET"')).toBe(true);
    });

    it('NO intercepta ninguna otra ruta /api/* del proyecto', () => {
      // Rutas que existen en la app y NO deben estar en el matcher.
      // Las enumeramos explícitamente para detectar regresiones.
      const forbiddenApiPaths = [
        '/api/auth',
        '/api/login',
        '/api/logout',
        '/api/register',
        '/api/users',
        '/api/admin',
        '/api/upload',
        '/api/seed',
        '/api/health',
        '/api/migrate',
      ];

      for (const p of forbiddenApiPaths) {
        expect(matcherBodyContains(`"${p}"`)).toBe(false);
      }
    });
  });

  describe('estrategia y cache', () => {
    it('usa la estrategia NetworkFirst de serwist', () => {
      // Importa NetworkFirst y se pasa como `handler`.
      expect(SW_SOURCE).toMatch(
        /import\s*\{[^}]*\bNetworkFirst\b[^}]*\}\s*from\s*["']serwist["']/,
      );
      expect(SW_SOURCE).toMatch(/handler:\s*new\s+NetworkFirst\s*\(/);
    });

    it('usa el cacheName api-cache-v1', () => {
      expect(SW_SOURCE).toMatch(/cacheName:\s*["']api-cache-v1["']/);
    });
  });

  describe('registro en layout (vía sw-register.tsx)', () => {
    const REG_PATH = path.join(__dirname, 'sw-register.tsx');
    const REG_SOURCE = fs.readFileSync(REG_PATH, 'utf8');

    it('sw-register.tsx es un Client Component (usa "use client")', () => {
      // El SW solo puede registrarse en el navegador, así que el
      // módulo que lo registra debe ejecutarse únicamente en cliente.
      expect(REG_SOURCE.startsWith('"use client"')).toBe(true);
    });

    it('solo registra el SW cuando window y navigator.serviceWorker existen', () => {
      expect(REG_SOURCE).toMatch(/typeof\s+window\s*!==\s*["']undefined["']/);
      expect(REG_SOURCE).toMatch(/["']serviceWorker["']\s+in\s+navigator/);
    });

    it('apunta a /sw.js (el artefacto compilado por @serwist/next)', () => {
      // La llamada está dividida en varias líneas; permitimos saltos
      // de línea con [\s\S]*? en el cuerpo del .register().
      expect(REG_SOURCE).toMatch(
        /navigator\.serviceWorker[\s\S]*?\.register\(\s*["']\/sw\.js["']/,
      );
    });
  });
});
