const { bot, forwardOrBroadCast, parsedJid, setVar } = require('../lib')

bot(
  {
    pattern: 'vv ?(.*)',
    fromMe: true,
    desc: 'antiViewOnce',
    type: 'whatsapp',
  },
  async (message, match) => {
    const low = (match || '').trim().toLowerCase()
    // Anti-view-once automatique : choisir où vont les « vue unique » captées.
    if (['telegram', 'tg', 'whatsapp', 'wa', 'both', 'off'].includes(low)) {
      await setVar({ ANTI_VIEWONCE: low }, message.id)
      const dest =
        low === 'off'
          ? 'désactivé'
          : low === 'telegram' || low === 'tg'
          ? 'Telegram'
          : low === 'both'
          ? 'WhatsApp + Telegram'
          : 'WhatsApp'
      return await message.send('_Anti-view-once automatique : ' + dest + '_')
    }
    // Manuel : répondre à un média « vue unique » pour le révéler.
    if (
      !message.reply_message.image &&
      !message.reply_message.video &&
      !message.reply_message.audio
    ) {
      return await message.send(
        '*Anti-view-once*\n\n_Automatique :_\n- vv telegram | whatsapp | both | off\n\n_Manuel :_\n- réponds à une image/vidéo/audio « vue unique » avec vv'
      )
    }
    const [jid] = parsedJid(match)
    await forwardOrBroadCast(jid || message.jid, message, { viewOnce: false })
  }
)
