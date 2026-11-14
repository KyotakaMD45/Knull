const { bot, gemini, lang } = require('../lib')

// Garde en mémoire les id des réponses Gemini du bot, pour la « reprise par réplique » :
// répondre à une réponse de Gemini continue la conversation (sans retaper .gemini).
const geminiMsgIds = new Set()
function remember(id) {
  if (!id) return
  geminiMsgIds.add(id)
  if (geminiMsgIds.size > 500) geminiMsgIds.delete(geminiMsgIds.values().next().value)
}

// Met en forme les sources (grounding Google Search).
function fmtSources(sources) {
  if (!sources || !sources.length) return ''
  const uniq = [...new Map(sources.map((s) => [s.uri, s])).values()].slice(0, 5)
  return '\n\n📎 *Sources :*\n' + uniq.map((s, i) => `${i + 1}. ${s.title || s.uri}\n${s.uri}`).join('\n')
}

// Envoie la réponse Gemini (image si générée, sinon texte) + sources, et mémorise l'id.
async function reply(message, res) {
  const srcs = fmtSources(res.sources)
  let sent
  if (res.image && res.image.image) {
    sent = await message.send(res.image.image, { quoted: message.data, caption: (res.data || '') + srcs }, 'image')
  } else {
    sent = await message.send((res.data || '…') + srcs, { quoted: message.data })
  }
  remember(sent && sent.key && sent.key.id)
}

async function run(message, query) {
  let image = null
  if (message.reply_message && message.reply_message.image) {
    image = {
      image: await message.reply_message.downloadMediaMessage(),
      mimetype: message.reply_message.mimetype,
    }
  }
  const res = await gemini(query || 'Décris cette image.', message.id, image)
  await reply(message, res)
}

// Commande : .gemini <question>  (ou répondre à une image)
bot(
  {
    pattern: 'gemini ?(.*)',
    desc: lang.plugins.gemini.desc,
    type: 'ai',
  },
  async (message, match, ctx) => {
    if (!ctx.GEMINI_API_KEY) return await message.send(lang.plugins.gemini.Key)
    if (!match && !(message.reply_message && message.reply_message.image)) {
      return await message.send(lang.plugins.gemini.example)
    }
    await run(message, match)
  }
)

// Reprise par réplique : répondre à une réponse de Gemini la continue automatiquement.
bot({ on: 'text' }, async (message, match, ctx) => {
  try {
    if (!ctx || !ctx.GEMINI_API_KEY) return
    const txt = (message.text || '').trim()
    if (!txt || /^[.!/#]/.test(txt)) return // ignore les commandes
    const rm = message.reply_message
    if (!rm || !rm.key || !rm.key.fromMe) return // doit répondre à un message du bot
    if (!geminiMsgIds.has(rm.id)) return // …et précisément à une réponse Gemini
    await run(message, txt)
  } catch {}
})
