// Gera as imagens de prévia (1200x630): cartão com título à esquerda e o tabuleiro do puzzle à direita.
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
const require = createRequire('C:/K3Games/trailer-studio/')
const { chromium } = require('playwright-core')
const EXE = 'C:/Users/kelvi/AppData/Local/ms-playwright/chromium-1247/chrome-win64/chrome.exe'
const BASE = process.argv[2] || 'http://localhost:8099/'
const A = 'C:/K3Games/k3-puzzles/assets'
const b = await chromium.launch({ headless: true, executablePath: EXE })
const p = await b.newPage({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 2 })
const boards = {}
for (const [name, path] of [['lanterna', 'lanterna/'], ['ponto-cruz', 'ponto-cruz/'], ['deslize', 'deslize/']]) {
  await p.goto(`${BASE}${path}?d=2026-10-27`); await p.waitForTimeout(500)
  boards[name] = (await p.locator('.board').screenshot()).toString('base64')
}
const card = await b.newPage({ viewport: { width: 1200, height: 630 } })
const css = readFileSync(`${A}/k3.css`, 'utf8')
const page = (title, sub, imgs) => `<html><head><link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&family=Archivo+Black&display=swap" rel="stylesheet"><style>${css}
body{display:flex;flex-direction:row;align-items:center;justify-content:space-between;padding:0 64px;height:630px;width:1200px;background:radial-gradient(circle at 80% 50%,#2a1608,#07070a 60%)}
.l{max-width:520px}.l .k{font-family:var(--disp);font-size:26px;text-transform:uppercase}.l .k span{color:var(--ember)}
.l h1{text-align:left;font-size:84px;margin:14px 0 10px}.l p{color:var(--muted);font-size:28px}
.l .tag{font-size:18px;margin-top:22px}
.r{display:flex;gap:16px;align-items:center}.r img{border-radius:18px;box-shadow:0 30px 80px rgba(0,0,0,.6)}
</style></head><body><div class="l"><div class="k">K3 <span>Puzzles</span></div><h1>${title}</h1><p>${sub}</p><span class="tag">Grátis · um novo por dia</span></div>
<div class="r">${imgs}</div></body></html>`
const img = (n, h) => `<img src="data:image/png;base64,${boards[n]}" style="height:${h}px">`
const cards = [
  ['lanterna', 'Lanterna', 'Acenda todas as lanternas.', img('lanterna', 470)],
  ['ponto-cruz', 'Ponto-Cruz', 'Borde o desenho escondido.', img('ponto-cruz', 470)],
  ['deslize', 'Deslize', 'Ponha as peças em ordem.', img('deslize', 430)],
  ['puzzles', '3 puzzles do dia', 'Lanterna, Ponto-Cruz e Deslize.', img('lanterna', 250) + img('deslize', 230)]
]
for (const [n, t, s, i] of cards) {
  await card.setContent(page(t, s, i), { waitUntil: 'networkidle' }); await card.evaluate(() => document.fonts.ready)
  await card.screenshot({ path: `${A}/og-${n}.png` }); console.log('og', n)
}
await b.close()
