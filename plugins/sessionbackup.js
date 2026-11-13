/**
 * Automatic session backup — disaster recovery for a VPS that might die.
 *
 * It sends the bot's database (database.db, which holds your WhatsApp session)
 * to your OWN WhatsApp chat, so you always have a recent copy off the server.
 * If the VPS is lost, you restore without rescanning.
 *
 *   .savesession         -> send a backup now
 *   auto                 -> every 12 h (change with SESSION_BACKUP_H)
 *   SESSION_BACKUP=off   -> disable the automatic backup
 *
 * Restore (manual, rare): stop the bot, put the downloaded file back in the bot
 * folder as `database.db`, then start the bot. It reconnects with no QR scan.
 */
const fs = require('fs')
const path = require('path')
const { bot } = require('../lib/')
const runtime = require('../lib/config')

const DB_PATH = path.join(__dirname, '..', 'database.db')
const MAX_BYTES = 90 * 1024 * 1024 // WhatsApp document safety cap

const firstSession = () => (Array.isArray(runtime.sessions) && runtime.sessions[0]) || '0'
const sock = () => { const id = firstSession(); return runtime[id] && runtime[id].sock }
function envVar(key) {
	const id = firstSession()
	const v = runtime[id] && runtime[id].env && runtime[id].env[key]
	return (v && v !== 'null' && v !== 'false') ? v : (process.env[key] || '')
}
let logger; try { logger = require('../lib/').logger } catch { logger = console }

async function sendBackup(toJid) {
	const s = sock()
	if (!s) throw new Error('bot non connecté')
	if (!fs.existsSync(DB_PATH)) throw new Error('database.db introuvable (base non-SQLite ?)')
	const st = fs.statSync(DB_PATH)
	if (st.size > MAX_BYTES) throw new Error('base trop volumineuse (' + Math.round(st.size / 1048576) + ' Mo)')
	const buffer = fs.readFileSync(DB_PATH)
	const self = toJid || (s.user && (s.user.id || s.user.jid))
	if (!self) throw new Error('numéro du bot inconnu')
	const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ')
	await s.sendMessage(self, {
		document: buffer,
		mimetype: 'application/x-sqlite3',
		fileName: 'knull-session.db',
		caption: '🔐 *Sauvegarde de session Knull* — ' + stamp +
			'\nGarde ce fichier. Pour restaurer : arrête le bot, remets-le dans le dossier du bot sous le nom `database.db`, puis relance. Pas besoin de rescanner.',
	})
}

bot({ pattern: 'savesession$', fromMe: true, desc: 'Sauvegarde la session maintenant', type: 'whatsapp' }, async (message) => {
	try {
		await sendBackup(message.jid)
		await message.send('✅ Sauvegarde de session envoyée.')
	} catch (e) {
		await message.send('⚠️ ' + e.message)
	}
})

// Automatic backup every SESSION_BACKUP_H hours (default 12), unless SESSION_BACKUP=off.
function schedule() {
	const hours = Math.max(1, Number(envVar('SESSION_BACKUP_H')) || 12)
	const timer = setInterval(() => {
		if ((envVar('SESSION_BACKUP') || 'on').toLowerCase() === 'off') return
		sendBackup().catch((e) => { try { logger.warn('[sessionbackup] ' + e.message) } catch {} })
	}, hours * 60 * 60 * 1000)
	if (timer.unref) timer.unref()
}
setTimeout(schedule, 60000)
try { logger.info('[sessionbackup] actif — sauvegarde auto de la session toutes les 12 h (.savesession pour la lancer)') } catch {}
