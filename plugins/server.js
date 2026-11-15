const os = require('os')
const { bot } = require('../lib/')

// Récupère l'IP publique du serveur (plusieurs fournisseurs, avec timeout).
async function publicIp() {
  const sources = ['https://api.ipify.org', 'https://ifconfig.me/ip', 'https://icanhazip.com']
  for (const url of sources) {
    try {
      const ac = new AbortController()
      const to = setTimeout(() => ac.abort(), 6000)
      const res = await fetch(url, { signal: ac.signal }).finally(() => clearTimeout(to))
      const txt = (await res.text()).trim()
      if (/^\d{1,3}(\.\d{1,3}){3}$/.test(txt)) return txt
    } catch {}
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

bot(
  {
    pattern: 'server ?(.*)',
    desc: 'Infos du serveur / VPS (IP, panneau, système)',
    type: 'misc',
  },
  async (message) => {
    const ip = await publicIp()
    const cpus = os.cpus() || []
    const totalMem = os.totalmem()
    const freeMem = os.freemem()
    const usedMem = totalMem - freeMem
    const load = os.loadavg ? os.loadavg() : [0, 0, 0]

    const port = process.env.PORT || process.env.SERVER_PORT || null
    const panelPass = process.env.PASSWORD || 'KNULL'
    const panelUrl = ip && port ? `http://${ip}:${port}` : port ? `http://<IP>:${port}` : null

    const lines = ['╭──〔 *SERVEUR / VPS* 〕']
    lines.push(`│ 🌐 *IP publique* : ${ip || 'indisponible'}`)
    lines.push(`│ 🖥️ *Hôte* : ${os.hostname()}`)
    lines.push(`│ ⚙️ *Système* : ${os.type()} ${os.release()} (${os.arch()})`)
    lines.push(`│ 🧠 *CPU* : ${cpus.length ? cpus[0].model.trim() : '?'} ×${cpus.length}`)
    lines.push(`│ 📊 *Charge* : ${load.map((x) => x.toFixed(2)).join(' / ')}`)
    lines.push(`│ 💾 *RAM* : ${fmtBytes(usedMem)} / ${fmtBytes(totalMem)}`)
    lines.push(`│ ⏱️ *Uptime serveur* : ${fmtDuration(os.uptime())}`)
    lines.push(`│ 🤖 *Uptime bot* : ${fmtDuration(process.uptime())}`)
    lines.push(`│ 🟢 *Node* : ${process.version}`)
    lines.push('│')
    if (panelUrl) {
      lines.push('├──〔 *PANNEAU* 〕')
      lines.push(`│ 🔗 *Lien* : ${panelUrl}`)
      lines.push(`│ 🔑 *Mot de passe* : ${panelPass}`)
    } else {
      lines.push('├──〔 *PANNEAU* 〕')
      lines.push('│ ⚠️ Panneau inactif (aucune variable PORT définie).')
      lines.push('│ Pour l\'activer : .setvar PORT=3000')
    }
    lines.push('╰────────')

    await message.send(lines.join('\n'))
  }
)
