// Teste dos puzzles: joga cada um até vencer, em 3 datas, no PC e no celular. Tira prints.
// Uso: node tools/test.mjs [baseURL]   (servidor local na raiz do repo)
import { createRequire } from 'node:module'
import { mkdirSync } from 'node:fs'
const require = createRequire('C:/K3Games/trailer-studio/')
const { chromium } = require('playwright-core')
const EXE = 'C:/Users/kelvi/AppData/Local/ms-playwright/chromium-1247/chrome-win64/chrome.exe'
const BASE = process.argv[2] || 'http://localhost:8099/'
const OUT = 'C:/K3Games/k3-puzzles/tools/shots'; mkdirSync(OUT, { recursive: true })
const browser = await chromium.launch({ headless: true, executablePath: EXE })
let fails = 0
const ok = (c, m) => { if (!c) { fails++; console.log('  FALHOU:', m) } }

// 8-puzzle: BFS pela solução mais curta
function solveSlide(start) {
  const goal = '123456780', key = a => a.join('')
  const q = [[start, []]], seen = new Set([key(start)])
  while (q.length) {
    const [s, path] = q.shift(); if (key(s) === goal) return path
    const z = s.indexOf(0), x = z % 3, y = (z / 3) | 0
    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx > 2 || ny > 2) continue
      const j = ny * 3 + nx, t = s.slice(); [t[z], t[j]] = [t[j], t[z]]; const k = key(t); if (!seen.has(k)) { seen.add(k); q.push([t, [...path, s[j]]]) } }
  }
  return null
}

for (const [dev, vp, touch] of [['pc', { width: 1280, height: 800 }, false], ['cel', { width: 375, height: 700 }, true]]) {
  for (const d of ['2026-10-27', '2026-11-15', '2027-03-01']) {
    const ctx = await browser.newContext({ viewport: vp, hasTouch: touch, isMobile: touch })
    const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message))
    const click = async sel => touch ? page.tap(sel) : page.click(sel)
    console.log(`== ${dev} ${d}`)
    // hub
    await page.goto(`${BASE}?d=${d}`); await page.waitForTimeout(400)
    ok(await page.locator('.card').count() === 3, 'hub com 3 cards')
    if (d === '2026-10-27') await page.screenshot({ path: `${OUT}/${dev}-hub.png`, fullPage: true })
    // lanterna
    await page.goto(`${BASE}lanterna/?d=${d}`); await page.waitForTimeout(300)
    const pr = await page.evaluate(() => window.__k3test.presses)
    const cells = page.locator('.cell')
    ok(await page.locator('.cell.on').count() < 25, 'lanterna começa incompleta')
    for (const i of pr) await (touch ? cells.nth(i).tap() : cells.nth(i).click())
    await page.waitForTimeout(300)
    ok(await page.locator('#win.on').count() === 1, `lanterna venceu com ${pr.length} toques`)
    if (d === '2026-10-27') await page.screenshot({ path: `${OUT}/${dev}-lanterna.png`, fullPage: true })
    // ponto-cruz
    await page.goto(`${BASE}ponto-cruz/?d=${d}`); await page.waitForTimeout(300)
    const sol = await page.evaluate(() => window.__k3test.sol)
    const sq = page.locator('.sq')
    for (let y = 0; y < 6; y++) for (let x = 0; x < 6; x++) if (sol[y][x]) await (touch ? sq.nth(y * 6 + x).tap() : sq.nth(y * 6 + x).click())
    await page.waitForTimeout(300)
    ok(await page.locator('#win.on').count() === 1, 'ponto-cruz venceu')
    if (d === '2026-10-27') await page.screenshot({ path: `${OUT}/${dev}-ponto-cruz.png`, fullPage: true })
    // deslize
    await page.goto(`${BASE}deslize/?d=${d}`); await page.waitForTimeout(300)
    const st = await page.evaluate(() => { const box = document.getElementById('slide').getBoundingClientRect(); const a = new Array(9).fill(0); document.querySelectorAll('.tile').forEach(t => { const r = t.getBoundingClientRect(); const x = Math.round((r.left - box.left) / (box.width / 3)), y = Math.round((r.top - box.top) / (box.height / 3)); a[y * 3 + x] = +t.textContent }); return a })
    const path = solveSlide(st)
    ok(!!path, 'deslize tem solução')
    for (const v of path || []) await (touch ? page.locator('.tile', { hasText: String(v) }).tap() : page.locator('.tile', { hasText: String(v) }).click())
    await page.waitForTimeout(400)
    ok(await page.locator('#win.on').count() === 1, `deslize venceu em ${path && path.length} jogadas`)
    if (d === '2026-10-27') await page.screenshot({ path: `${OUT}/${dev}-deslize.png`, fullPage: true })
    ok(!errs.length, 'sem erros de JS: ' + errs.join(' | '))
    await ctx.close()
  }
}
await browser.close()
console.log(fails ? `${fails} falha(s)` : 'TUDO OK')
