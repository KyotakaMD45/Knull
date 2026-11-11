const { bot } = require('../lib')
const { BOT_NAME, OWNER_NAME } = require('../config')

bot(
  {
    pattern: 'bonjour ?(.*)',
    desc: 'Répond avec un bonjour.',
    type: 'Knull',
  },
  async (message) => await message.send(`Bonjour 👋 Je suis ${BOT_NAME}.`)
)

bot(
  {
    pattern: 'echo ?(.*)',
    desc: 'Répète le texte fourni.',
    type: 'Knull',
  },
  async (message, match) => {
    if (!match.trim()) return await message.send('Usage : .echo ton texte')
    return await message.send(match.trim())
  }
)

bot(
  {
    pattern: 'heure ?(.*)',
    desc: 'Affiche la date et l’heure actuelles.',
    type: 'Knull',
  },
  async (message) => {
    const now = new Date()
    return await message.send(
      `📅 ${now.toLocaleDateString('fr-FR')}\n🕒 ${now.toLocaleTimeString('fr-FR')}`
    )
  }
)

bot(
  {
    pattern: 'botinfo ?(.*)',
    desc: 'Affiche les informations de Knull.',
    type: 'Knull',
  },
  async (message) => {
    const ownerLine = OWNER_NAME ? `\n👤 Responsable : ${OWNER_NAME}` : ''
    return await message.send(`🤖 ${BOT_NAME}\nBot WhatsApp avec commandes et plugins.${ownerLine}`)
  }
)
