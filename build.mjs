// Builds assets/*.svg (light + dark pairs) for the profile README. Run: node build.mjs
// Copy comes from the portfolio's src/content.ts (hero, projectList). Edit facts there first, then here.
// Needs python3 with fontTools (subsets Instrument Serif to the glyphs used, so SVGs stay small).
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const data = {
  eyebrow: 'Computer Engineering · K.J. Somaiya College of Engineering · 2027',
  name: 'Parth Palav',
  lines: ['I build software.', 'I care about', 'what it solves.'],
  facts: [
    ['Studying', 'B.Tech Computer Engineering, CGPA 9.85'],
    ['Recently', 'IT Project Manager Intern, Tata Motors'],
    ['Building', 'FINAURA, a financial intelligence platform'],
    ['Based in', 'Mumbai, India'],
  ],
  thread: ['Understand the need', 'Build the system', 'Test it properly', 'See it delivered'],
  status: 'Open to full-time roles from December 2026',
  work: [
    {
      slug: 'finaura',
      title: 'FINAURA',
      sub: 'Financial intelligence platform',
      when: 'Final-year project · 2026',
      summary: 'Tracking, explainable analytics, retirement projections and an AI assistant in one product, across a mobile app and a web dashboard.',
      role: 'Primary full-stack developer · three-member team',
      outcome: 'Research paper submitted to RAIT 2027 (under review)',
      tech: ['React Native / Expo', 'React', 'TypeScript', 'Node.js', 'MongoDB', 'Python / Flask', 'Gemini API'],
    },
    {
      slug: 'crowdshield',
      title: 'CrowdShield',
      sub: 'Crowd monitoring and emergency response',
      when: 'La Trobe × Cisco Innovation Sprint · July 2026',
      summary: 'Live-video people detection and crowd-density heatmaps, linked in real time to an admin dashboard, public displays and phones.',
      role: 'Hackathon team project',
      outcome: 'People’s Choice award, shared by the team',
      tech: ['React', 'TypeScript', 'FastAPI', 'Socket.IO', 'YOLOv8', 'ByteTrack'],
    },
    {
      slug: 'orion',
      title: 'ORION',
      sub: 'Traffic intelligence prototype',
      when: 'Datathon 2026',
      summary: 'Route visualisation, route comparison and time-of-day congestion estimates for urban travel and dispatch planning.',
      role: 'Datathon project',
      outcome: 'Prototype with TomTom traffic data and an operational assistant',
      tech: ['React', 'TypeScript', 'Mapbox', 'Node.js', 'Python / Flask'],
    },
  ],
}

// Portfolio palette (src/styles.css), dark side only: the profile stays dark in both GitHub themes.
const t = { bg: '#0b0b0a', ink: '#f3f0e9', stone: '#9a958c', acc: '#e4572e', dot: '#e4572e', rule: '#2a2925' }
const W = 840
const MONO = `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// shortcut: wraps by character count, not measured width. Fine for these fixed strings; re-check if copy changes.
const wrap = (s, max) => s.split(' ').reduce((ls, w) => {
  const last = ls[ls.length - 1]
  if (last && (last + ' ' + w).length <= max) ls[ls.length - 1] = last + ' ' + w
  else ls.push(w)
  return ls
}, [])

// Subset a serif face to exactly the characters an SVG uses; returns a base64 woff.
const tmp = mkdtempSync(join(tmpdir(), 'ppfont-'))
function subset(face, text) {
  const out = join(tmp, `${face}.woff`)
  execFileSync('python3', ['-m', 'fontTools.subset', `fonts/instrument-serif-latin-400-${face}.woff`,
    `--text=${text} `, '--flavor=woff', '--layout-features=*', `--output-file=${out}`])
  return readFileSync(out).toString('base64')
}

function svg(h, body, serifText, italicText) {
  const faces = [['normal', serifText], ['italic', italicText]].filter(([, s]) => s)
    .map(([f, s]) => `@font-face{font-family:IS;font-style:${f};src:url(data:font/woff;base64,${subset(f, s)}) format('woff')}`).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${h}" viewBox="0 0 ${W} ${h}" role="img">
<style>${faces}
.s{font-family:IS,Georgia,serif}.i{font-family:IS,Georgia,serif;font-style:italic}
.m{font-family:${MONO};font-size:11px;letter-spacing:.08em;text-transform:uppercase}
.ink{fill:${t.ink}}.stone{fill:${t.stone}}.acc{fill:${t.acc}}.dot{fill:${t.dot}}
</style>
<rect x=".5" y=".5" width="${W - 1}" height="${h - 1}" rx="14" fill="${t.bg}" stroke="${t.rule}"/>
${body}
</svg>`
}

function card(p, n) {
  const sum = wrap(p.summary, 116)
  const y0 = 168
  const sumSvg = sum.map((l, i) => `<text x="40" y="${y0 + i * 24}" class="s ink" font-size="18">${esc(l)}</text>`).join('\n')
  const ry = y0 + (sum.length - 1) * 24 + 26
  const body = `<text x="40" y="50" class="m stone"><tspan class="acc">${String(n).padStart(2, '0')}</tspan>  ·  ${esc(p.when)}</text>
<text x="${W - 40}" y="50" text-anchor="end" class="m acc">View repo →</text>
<text x="38" y="104" class="s ink" font-size="46">${esc(p.title)}</text>
<text x="40" y="134" class="i acc" font-size="21">${esc(p.sub)}</text>
${sumSvg}
<line x1="40" y1="${ry}" x2="${W - 40}" y2="${ry}" stroke="${t.rule}"/>
<circle cx="44" cy="${ry + 26}" r="4" class="dot"/><text x="58" y="${ry + 30}" class="m ink">${esc(p.outcome)}</text>
<text x="58" y="${ry + 54}" class="m stone">${esc(p.role)}</text>
<text x="58" y="${ry + 78}" class="m stone">${esc(p.tech.join('  ·  '))}</text>`
  return svg(ry + 106, body, p.title + p.summary, p.sub)
}

const strip = (inner) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="48" viewBox="0 0 ${W} 48" role="img">
<style>.m{font-family:${MONO};font-size:11px;letter-spacing:.08em;text-transform:uppercase}</style>
<rect x=".5" y=".5" width="${W - 1}" height="47" rx="12" fill="${t.bg}" stroke="${t.rule}"/>
${inner}
</svg>`

function label(text) {
  return strip(`<circle cx="44" cy="24" r="4" fill="${t.dot}"/><text x="58" y="28" class="m" fill="${t.stone}">${esc(text)}</text>
<line x1="${58 + text.length * 7.6 + 16}" y1="24" x2="${W - 40}" y2="24" stroke="${t.rule}"/>`)
}

function status() {
  return strip(`<circle cx="44" cy="24" r="4" fill="${t.dot}"><animate attributeName="opacity" values="1;.25;1" dur="2.4s" repeatCount="indefinite"/></circle>
<text x="58" y="28" class="m" fill="${t.ink}">${esc(data.status)}</text>
<text x="${W - 40}" y="28" text-anchor="end" class="m" fill="${t.stone}">www.parthpalav.xyz</text>`)
}

// Hero: a terminal session. Commands type out, answers appear whole, then a blinking cursor.
// Covers slide off each command in character steps; works with any renderer that runs CSS animations in SVG.
function terminal() {
  const fs = 14, cw = fs * 0.6, lh = 26, x0 = 32, prompt = 'parth@mumbai ~ $ '
  const jb = readFileSync('fonts/jetbrains-mono-latin-wght-normal.woff2').toString('base64')
  const pad = (k) => k.toLowerCase().padEnd(10)
  const steps = [
    { cmd: 'whoami', out: [[[data.name, 'ink'], [`  ${data.eyebrow}`, 'stone']]] },
    { cmd: 'cat now.txt', out: data.facts.map(([k, v]) => [[pad(k), 'stone'], [v, 'ink']]) },
    { cmd: 'echo $MOTTO', out: [[[`${data.lines[0]} ${data.lines[1]} `, 'ink'], [data.lines[2], 'acc']]] },
    { cmd: '' },
  ]
  let y = 80, tm = 600, css = '', body = ''
  const at = (ms) => `animation:show 0s ${ms}ms both`
  steps.forEach(({ cmd, out = [] }, i) => {
    const xc = x0 + prompt.length * cw, n = cmd.length, dur = n * 70
    body += `<text x="${x0}" y="${y}" class="c acc" xml:space="preserve" style="${at(tm)}">${esc(prompt)}<tspan class="ink">${esc(cmd)}</tspan></text>\n`
    if (!cmd) { // final prompt: blinking cursor
      body += `<rect x="${xc}" y="${y - fs + 1}" width="${cw}" height="${fs + 3}" class="dot" style="animation:show 0s ${tm}ms both, blink 1.1s steps(1) ${tm}ms infinite"/>\n`
      return
    }
    css += `@keyframes mv${i}{to{transform:translateX(${n * cw}px)}}\n`
    body += `<rect x="${xc}" y="${y - fs - 2}" width="${n * cw + 2}" height="${lh - 2}" fill="${t.bg}" style="animation:mv${i} ${dur}ms steps(${n}) ${tm}ms both"/>\n`
    body += `<rect x="${xc}" y="${y - fs + 1}" width="${cw}" height="${fs + 3}" class="dot" style="animation:show 0s ${tm}ms both, hide 0s ${tm + dur + 250}ms forwards, mv${i} ${dur}ms steps(${n}) ${tm}ms both"/>\n`
    tm += dur + 300
    y += lh
    out.forEach((row) => {
      body += `<text x="${x0}" y="${y}" class="c" xml:space="preserve" style="${at(tm)}">${row.map(([s, c]) => `<tspan class="${c}">${esc(s)}</tspan>`).join('')}</text>\n`
      y += lh
    })
    tm += 500
    y += 10
  })
  const h = y + 14
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${h}" viewBox="0 0 ${W} ${h}" role="img">
<style>@font-face{font-family:JB;src:url(data:font/woff2;base64,${jb}) format('woff2')}
.c{font-family:JB,${MONO};font-size:${fs}px}.t{font-family:JB,${MONO};font-size:12px}
.ink{fill:${t.ink}}.stone{fill:${t.stone}}.acc{fill:${t.acc}}.dot{fill:${t.dot}}
@keyframes show{from{opacity:0}to{opacity:1}}@keyframes hide{to{opacity:0}}@keyframes blink{50%{opacity:0}}
${css}</style>
<rect x=".5" y=".5" width="${W - 1}" height="${h - 1}" rx="14" fill="${t.bg}" stroke="${t.rule}"/>
<line x1="0" y1="40" x2="${W}" y2="40" stroke="${t.rule}"/>
<circle cx="24" cy="20" r="5.5" fill="${t.rule}"/><circle cx="44" cy="20" r="5.5" fill="${t.rule}"/><circle cx="64" cy="20" r="5.5" class="dot"/>
<text x="${W / 2}" y="24" text-anchor="middle" class="t stone">parthpalav — zsh</text>
${body}</svg>`
}

const out = (name, s) => writeFileSync(`assets/${name}.svg`, s)
out('hero', terminal())
out('label-work', label('Selected work'))
data.work.forEach((p, i) => out(`work-${p.slug}`, card(p, i + 1)))
out('status', status())
console.log('built assets/')
