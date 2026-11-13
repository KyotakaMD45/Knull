const { bot, setVar, lang, parsedJid } = require('../lib/')


function parseReadValue(match) {
  const input = match.trim().toLowerCase()
  if (input === 'on' || input === 'true') return 'true'
  if (input === 'off' || input === 'false') return 'false'
  const [includePart, ...ignoreParts] = input.split(/\bignore\b/)
  const hasIgnore = ignoreParts.length > 0
  const excludeJids = hasIgnore ? parsedJid(ignoreParts.join(' ')) : []
  if (hasIgnore && !excludeJids.length) return null
  const include = []
  for (const token of includePart.split(/[\s,]+/).filter(Boolean)) {
    if (token === 'p' || token === 'g') {
      include.push(token)
    } else {
      const jid = parsedJid(token)[0]
      if (!jid) return null
      include.push(jid)
    }
  }
  if (!include.length && !hasIgnore) return null
  const exclude = hasIgnore ? `ignore ${excludeJids.join(',')}` : ''
  return [include.join(','), exclude].filter(Boolean).join(' ')
}

async function handleSetting(message, setting, match) {
  if (match === 'on' || match === 'off') {
    await setVar(
      {
        [setting]: match === 'on' ? 'true' : match === 'off' ? 'false' : match,
      },
      message.id
    )
  }
}

bot(
  {
    pattern: 'status ?(.*)',
    desc: lang.plugins.status.desc,
    type: 'whatsapp',
  },
  async (message, match) => {
    if (!match) {
      return await message.send(lang.plugins.status.usage)
    }
    const m = match.trim()
    const low = m.toLowerCase()
    // Emoji de réaction aux statuts (STATUS_VIEW_EMOJI)
    if (low === 'emoji off' || low === 'noemoji') {
      await setVar({ STATUS_VIEW_EMOJI: 'false' }, message.id)
      return await message.send('_Emoji de statut désactivé._')
    }
    const em = m.match(/^emoji\s+(.+)/i)
    if (em) {
      await setVar({ STATUS_VIEW_EMOJI: em[1].trim() }, message.id)
      return await message.send('_Emoji de statut : ' + em[1].trim() + '_')
    }
    // Où envoyer les statuts vus (STATUS_FORWARD_JID)
    if (['telegram', 'tg', 'whatsapp', 'wa', 'both'].includes(low)) {
      await setVar({ STATUS_FORWARD_JID: low }, message.id)
      const dest = (low === 'telegram' || low === 'tg') ? 'Telegram' : low === 'both' ? 'WhatsApp + Telegram' : 'WhatsApp'
      return await message.send('_Statuts vus → ' + dest + '_')
    }
    // Comportement existant : vue des statuts on/off
    await handleSetting(message, 'AUTO_STATUS_VIEW', match)
    await message.send(lang.plugins.common.update)
  }
)

bot(
  {
    pattern: 'call ?(.*)',
    desc: lang.plugins.call.desc,
    type: 'whatsapp',
  },
  async (message, match) => {
    if (!match) {
      return await message.send(lang.plugins.call.usage)
    }
    await handleSetting(message, 'REJECT_CALL', match)
    await message.send(lang.plugins.common.update)
  }
)

bot(
  {
    pattern: 'read ?(.*)',
    desc: lang.plugins.read.desc,
    type: 'whatsapp',
  },
  async (message, match) => {
    if (!match) {
      return await message.send(lang.plugins.read.usage)
    }
    const value = parseReadValue(match)
    if (value === null) {
      return await message.send(lang.plugins.read.usage)
    }
    await setVar({ SEND_READ: value }, message.id)
    await message.send(lang.plugins.common.update)
  }
)

bot(
  {
    pattern: 'online ?(.*)',
    desc: lang.plugins.online.desc,
    type: 'whatsapp',
  },
  async (message, match) => {
    if (!match) {
      return await message.send(lang.plugins.online.usage)
    }
    await handleSetting(message, 'ALWAYS_ONLINE', match)
    await message.send(lang.plugins.common.update)
  }
)
