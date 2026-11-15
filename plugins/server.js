const os = require('os')
const fs = require('fs')
const { bot } = require('../lib/')

// Appel HTTP court avec timeout (renvoie texte ou null).
async function fetchText(url, ms = 6000) {
  try {
    const ac = new AbortController()
    const to = setTimeout(() => ac.abort(), ms)
    const res = await fetch(url, { signal: ac.signal }).finally(() => clearTimeout(to))
    return (await res.text()).trim()
  } catch {
    return null
  }
}
async function fetchJson(url, ms = 6000) {
  const t = await fetchText(url, ms)
  if (!t) return null
  try {
    return JSON.parse(t)
  } catch {
    return null
  }
}

// IP publique (plusieurs fournisseurs, avec repli).
async function publicIp() {
  for (const url of ['https://api.ipify.org', 'https://ifconfig.me/ip', 'https://icanhazip.com']) {
    const txt = await fetchText(url)
    if (txt && /^\d{1,3}(\.\d{1,3}){3}$/.test(txt)) return txt
  }
  return null
}

function fmtBytes(n) {
  if (!n || n < 0) return '0 o'
  const u = ['o', 'Ko', 'Mo', 'Go', 'To']
  let i = 0
  while (n >= 1024 && i < u.length - 1) {
    n /= 1024
    i++
  }
  return n.toFixed(i >= 2 ? 1 : 0) + ' ' + u[i]
}

function fmtDuration(sec) {
  sec = Math.floor(sec)
  const d = Math.floor(sec / 86400)
  const h = Math.floor((sec % 86400) / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const parts = []
  if (d) parts.push(d + 'j')
  if (h) parts.push(h + 'h')
  if (m || !parts.length) parts.push(m + 'min')
  return parts.join(' ')
}

// Petite barre de progression textuelle (ex. RAM).
function bar(ratio, size = 10) {
  ratio = Math.max(0, Math.min(1, ratio || 0))
  const full = Math.round(ratio * size)
  return '█'.repeat(full) + '░'.repeat(size - full) + ' ' + Math.round(ratio * 100) + '%'
}

// Détecte la plateforme d'hébergement depuis les variables d'environnement.
function detectHost() {
  const e = process.env
  if (e.RENDER || e.RENDER_EXTERNAL_URL) return 'Render'
  if (e.KOYEB || e.KOYEB_APP_NAME) return 'Koyeb'
  if (e.DYNO || e.HEROKU_APP_NAME) return 'Heroku'
  if (e.RAILWAY_ENVIRONMENT || e.RAILWAY_PROJECT_ID) return 'Railway'
  if (e.REPL_ID || e.REPLIT_DB_URL) return 'Replit'
  if (e.FLY_APP_NAME) return 'Fly.io'
  if (e.PLATFORM) return e.PLATFORM
  return 'VPS / dédié'
}

// Espace disque (Node 18.15+), silencieux si indisponible.
async function diskInfo() {
  try {
    const st = await fs.promises.statfs(process.cwd())
    const total = st.blocks * st.bsize
    const free = st.bavail * st.bsize
    return { total, free, used: total - free }
  } catch {
    return null
  }
}

bot(
  {
    pattern: 'server ?(.*)',
    desc: 'Infos détaillées du serveur / VPS (IP, localisation, ressources, panneau)',
    type: 'misc',
  },
  async (message) => {
    const t0 = Date.now()
    const ip = await publicIp()
    const ping = Date.now() - t0
    // Géolocalisation de l'IP (pays, ville, opérateur) — meilleur effort.
    const geo = ip ? await fetchJson('http://ip-api.com/json/' + ip + '?fields=status,country,city,isp,org') : null
    const disk = await diskInfo()

    const cpus = os.cpus() || []
    const totalMem = os.totalmem()
    const usedMem = totalMem - os.freemem()
    const rss = process.memoryUsage().rss
    const load = os.loadavg ? os.loadavg() : [0, 0, 0]

    const port = process.env.PORT || process.env.SERVER_PORT || null
    const panelPass = process.env.PASSWORD || 'KNULL'
    const ipLink = ip ? 'http://' + ip : null
    const panelUrl = ip && port ? 'http://' + ip + ':' + port : null

    const L = []
    L.push('╭━━━〔 🖥️ *KNULL · SERVEUR* 〕')
    L.push('│')
    // Réseau
    L.push('│ 🌐 *IP publique*')
    L.push('│    ' + (ipLink || 'indisponible'))
    if (geo && geo.status === 'success') {
      const loc = [geo.city, geo.country].filter(Boolean).join(', ')
      L.push('│ 📍 *Localisation* : ' + (loc || '?'))
      if (geo.isp || geo.org) L.push('│ 🏢 *Opérateur* : ' + (geo.isp || geo.org))
    }
    L.push('│ ☁️ *Hébergeur* : ' + detectHost())
    L.push('│')
    // Système
    L.push('│ 🧩 *OS* : ' + os.type() + ' ' + os.release() + ' (' + os.arch() + ')')
    L.push('│ 🧠 *CPU* : ' + (cpus.length ? cpus[0].model.trim() : '?') + ' ×' + cpus.length)
    L.push('│ 📊 *Charge* : ' + load.map((x) => x.toFixed(2)).join(' · '))
    L.push('│')
    // Ressources
    L.push('│ 💾 *RAM* : ' + fmtBytes(usedMem) + ' / ' + fmtBytes(totalMem))
    L.push('│    ' + bar(usedMem / totalMem))
    L.push('│ 📦 *Bot (RSS)* : ' + fmtBytes(rss))
    if (disk) {
      L.push('│ 🗄️ *Disque* : ' + fmtBytes(disk.used) + ' / ' + fmtBytes(disk.total) + ' (' + fmtBytes(disk.free) + ' libre)')
    }
    L.push('│')
    // Temps
    L.push('│ ⏱️ *Uptime serveur* : ' + fmtDuration(os.uptime()))
    L.push('│ 🤖 *Uptime bot* : ' + fmtDuration(process.uptime()))
    L.push('│ 🟢 *Node* : ' + process.version + '  ·  ⚡ ' + ping + ' ms')
    L.push('│')
    // Panneau
    if (panelUrl) {
      L.push('│ 🔗 *Panneau* : ' + panelUrl)
      L.push('│ 🔑 *Mot de passe* : ' + panelPass)
    } else {
      L.push('│ ⚠️ *Panneau* inactif — active-le : .setvar PORT=3000')
    }
    L.push('╰━━━━━━━━━━━━━')

    await message.send(L.join('\n'))
  }
)
