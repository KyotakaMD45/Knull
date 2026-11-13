/**
 * Telegram bridge — built into the bot (no separate program, no API key).
 *
 * Forwards WhatsApp <-> Telegram:
 *   - incoming WhatsApp (private) text messages are sent to your Telegram chat
 *   - REPLY to a forwarded message in Telegram to answer that person on WhatsApp
 *   - /send <number> <text>  to start a new WhatsApp chat from Telegram
 *
 * Enable it with two variables (set them on WhatsApp):
 *   .setvar TELEGRAM_TOKEN=123456:ABC...        (from @BotFather)
 *   .setvar TELEGRAM_CHAT_ID=123456789          (send /id to your bot to get it)
 *
 * The token is stored in the bot's database/config, never on GitHub.
 */
const { bot } = require('../lib/')
const runtime = require('../lib/config') // live registry: runtime.sessions, runtime[id].sock, runtime[id].env

// ---- read config live (so .setvar activates it without a restart) ----------
const firstSession = () => (Array.isArray(runtime.sessions) && runtime.sessions[0]) || '0'
const envVar = (key) => {
	const id = firstSession()
	const v = runtime[id] && runtime[id].env && runtime[id].env[key]
	return (v && v !== 'null' && v !== 'false' ? v : '') || process.env[key] || ''
}
const sock = () => {
	const id = firstSession()
	return runtime[id] && runtime[id].sock
}
const numOf = (jid) => String(jid || '').split('@')[0].split(':')[0]

// ---- Telegram HTTP (global fetch, Node 20+) --------------------------------
async function tgApi(token, method, params) {
	try {
		const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(params),
		})
		return await res.json()
	} catch {
		return { ok: false }
	}
}
const tgSend = (token, chatId, text, extra = {}) => tgApi(token, 'sendMessage', { chat_id: chatId, text, ...extra })

// Maps a forwarded Telegram message id -> the WhatsApp chat it came from.
const routeByTgMessage = new Map()
function remember(tgMessageId, jid) {
	if (!tgMessageId) return
	routeByTgMessage.set(tgMessageId, jid)
	if (routeByTgMessage.size > 2000) routeByTgMessage.delete(routeByTgMessage.keys().next().value)
}

// ---- WhatsApp -> Telegram --------------------------------------------------
bot({ on: 'text', fromMe: false, type: 'telegram' }, async (message) => {
	try {
		const token = envVar('TELEGRAM_TOKEN')
		const chatId = envVar('TELEGRAM_CHAT_ID')
		if (!token || !chatId) return
		if (!message.text || !message.jid) return
		if (message.jid === 'status@broadcast' || message.jid.includes('@newsletter')) return
		if (message.isGroup) return // v1: forward private chats only
		const who = (message.pushName ? message.pushName + ' ' : '') + '(+' + numOf(message.jid) + ')'
		const sent = await tgSend(token, chatId, `📱 ${who}\n${message.text}`)
		if (sent.ok && sent.result) remember(sent.result.message_id, message.jid)
	} catch {}
})

// ---- Telegram -> WhatsApp : long polling -----------------------------------
let connectedAnnounced = false
async function onTelegram(token, chatId, update) {
	const m = update.message
	if (!m || !m.text) return
	const fromChat = String(m.chat.id)

	if (m.text === '/start' || m.text === '/id') {
		await tgApi(token, 'sendMessage', { chat_id: fromChat, text: `Chat id : ${fromChat}\nFais sur WhatsApp : .setvar TELEGRAM_CHAT_ID=${fromChat}` })
		return
	}
	if (!chatId || fromChat !== String(chatId)) return // only the configured chat

	const cmd = m.text.match(/^\/send\s+(\d{6,15})\s+([\s\S]+)/)
	if (cmd) {
		const s = sock()
		try {
			if (!s) throw new Error('bot non connecté')
			await s.sendMessage(cmd[1] + '@s.whatsapp.net', { text: cmd[2] })
			await tgApi(token, 'sendMessage', { chat_id: fromChat, text: '✅ Envoyé', reply_to_message_id: m.message_id })
		} catch (e) {
			await tgApi(token, 'sendMessage', { chat_id: fromChat, text: '⚠️ Échec : ' + e.message, reply_to_message_id: m.message_id })
		}
		return
	}

	const jid = m.reply_to_message && routeByTgMessage.get(m.reply_to_message.message_id)
	if (jid) {
		const s = sock()
		try {
			if (!s) throw new Error('bot non connecté')
			await s.sendMessage(jid, { text: m.text })
		} catch (e) {
			await tgApi(token, 'sendMessage', { chat_id: fromChat, text: '⚠️ Échec : ' + e.message, reply_to_message_id: m.message_id })
		}
		return
	}

	await tgApi(token, 'sendMessage', { chat_id: fromChat, text: 'Réponds au message transféré pour répondre à la personne, ou utilise /send <numéro> <message>.', reply_to_message_id: m.message_id })
}

async function telegramLoop() {
	const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
	let offset
	let lastToken = ''
	while (true) {
		const token = envVar('TELEGRAM_TOKEN')
		const chatId = envVar('TELEGRAM_CHAT_ID')
		if (!token) { connectedAnnounced = false; await sleep(10000); continue }
		// On first use (or token change), skip the backlog and greet.
		if (token !== lastToken) {
			lastToken = token
			offset = undefined
			try {
				const d = await (await fetch(`https://api.telegram.org/bot${token}/getUpdates?offset=-1`)).json()
				if (d.ok && d.result.length) offset = d.result[d.result.length - 1].update_id + 1
			} catch {}
		}
		if (chatId && !connectedAnnounced) {
			const r = await tgSend(token, chatId, '🔌 Pont Telegram connecté.')
			if (r.ok) connectedAnnounced = true
		}
		try {
			const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates?timeout=50${offset !== undefined ? '&offset=' + offset : ''}`)
			const data = await res.json()
			if (data.ok) { for (const u of data.result) { offset = u.update_id + 1; await onTelegram(token, chatId, u) } }
			else { await sleep(15000) } // invalid token / error
		} catch {
			await sleep(3000)
		}
	}
}

telegramLoop()
