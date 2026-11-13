/**
 * Telegram bridge — built into the bot (no separate program, no API key).
 *
 * WhatsApp <-> Telegram:
 *   - incoming WhatsApp messages (text + photos/videos/audio/files) are sent to your Telegram chat
 *   - REPLY to a forwarded message in Telegram to answer that person on WhatsApp
 *   - /send <number> <text>  to start a new WhatsApp chat from Telegram
 *
 * Also exposes config.TG (used by the engine) so deleted messages, statuses and
 * update notices can be routed to Telegram too.
 *
 * Variables (set them on WhatsApp with .setvar NAME=value):
 *   TELEGRAM_TOKEN=123456:ABC...     (from @BotFather)
 *   TELEGRAM_CHAT_ID=123456789       (send /id to your bot to get it)
 *   TELEGRAM_FORWARD=private         off | private | all   (what to forward WA->TG; default private)
 *   ANTI_VIEWONCE=telegram           off | whatsapp | telegram | both  (capture "view once" media)
 *   ANTI_DELETE / STATUS_FORWARD_JID can be set to  telegram | both  (handled by the engine)
 */
const lib = require('../lib/')
const { bot, forwardOrBroadCast, parsedJid } = lib
const runtime = require('../lib/config') // live registry: runtime.sessions, runtime[id].sock, runtime[id].env

// ---- config read live (so .setvar activates without a restart) -------------
const firstSession = () => (Array.isArray(runtime.sessions) && runtime.sessions[0]) || '0'
function envVar(key) {
	const id = firstSession()
	const v = runtime[id] && runtime[id].env && runtime[id].env[key]
	if (v && v !== 'null' && v !== 'false') return v
	return process.env[key] || ''
}
const token = () => envVar('TELEGRAM_TOKEN')
const chatId = () => envVar('TELEGRAM_CHAT_ID')
const sock = () => { const id = firstSession(); return runtime[id] && runtime[id].sock }
const selfJid = () => { const s = sock(); return s && s.user && (s.user.jid || s.user.id) }
const numOf = (jid) => String(jid || '').split('@')[0].split(':')[0]

// Destination parsing for a feature value ("telegram" | "whatsapp" | "both" | jid | "off").
function route(value) {
	const v = String(value || '').trim().toLowerCase()
	if (!v || v === 'false' || v === 'null' || v === 'off') return { on: false, tg: false, wa: false }
	const tg = v === 'telegram' || v === 'tg' || v === 'both'
	const wa = !(v === 'telegram' || v === 'tg')
	return { on: true, tg, wa }
}

// ---- Telegram HTTP (global fetch / FormData / Blob, Node 20+) ---------------
async function tgApi(method, params) {
	const t = token()
	if (!t) return { ok: false }
	try {
		const res = await fetch(`https://api.telegram.org/bot${t}/${method}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(params),
		})
		return await res.json()
	} catch { return { ok: false } }
}
const tgSend = (text, extra = {}) => { const c = chatId(); return c ? tgApi('sendMessage', { chat_id: c, text, ...extra }) : Promise.resolve({ ok: false }) }

async function tgSendMedia(buffer, { kind, mimetype, fileName, caption } = {}) {
	const t = token(); const c = chatId()
	if (!t || !c || !buffer) return { ok: false }
	let method = 'sendDocument', field = 'document'
	if (kind === 'image') { method = 'sendPhoto'; field = 'photo' }
	else if (kind === 'video') { method = 'sendVideo'; field = 'video' }
	else if (kind === 'audio') { method = 'sendAudio'; field = 'audio' }
	try {
		const form = new FormData()
		form.set('chat_id', String(c))
		if (caption) form.set('caption', caption.slice(0, 1024))
		form.set(field, new Blob([buffer], { type: mimetype || 'application/octet-stream' }), fileName || ('file' + (kind === 'image' ? '.jpg' : kind === 'video' ? '.mp4' : '')))
		const res = await fetch(`https://api.telegram.org/bot${t}/${method}`, { method: 'POST', body: form })
		return await res.json()
	} catch { return { ok: false } }
}

// ---- media helpers ---------------------------------------------------------
let downloadMediaMessage
async function downloadNode(node) {
	try {
		downloadMediaMessage ||= (await require('../lib/baileys').loadBaileys()).downloadMediaMessage
		return await downloadMediaMessage(node, 'buffer')
	} catch { return null }
}
function kindOfType(type) {
	const t = String(type || '')
	if (/image|sticker/i.test(t)) return 'image'
	if (/video|ptv/i.test(t)) return 'video'
	if (/audio|ptt/i.test(t)) return 'audio'
	if (/document/i.test(t)) return 'document'
	return null
}
function innerContent(message) {
	// message.message is { key, message }
	const m = message && message.message && message.message.message
	if (!m) return null
	return m.viewOnceMessageV2?.message || m.viewOnceMessage?.message || m.viewOnceMessageV2Extension?.message || m.ephemeralMessage?.message || m
}
function isViewOnce(message) {
	try {
		const m = message && message.message && message.message.message
		if (!m) return false
		if (m.viewOnceMessage || m.viewOnceMessageV2 || m.viewOnceMessageV2Extension) return true
		for (const k of ['imageMessage', 'videoMessage', 'audioMessage']) if (m[k] && m[k].viewOnce) return true
		const e = m.ephemeralMessage?.message
		if (e) for (const k of ['imageMessage', 'videoMessage', 'audioMessage']) if (e[k] && e[k].viewOnce) return true
	} catch {}
	return false
}
function mediaMeta(message) {
	const c = innerContent(message) || {}
	const key = Object.keys(c).find((k) => /imageMessage|videoMessage|audioMessage|documentMessage|stickerMessage|ptvMessage/.test(k))
	const obj = key ? c[key] : null
	const kind = kindOfType(message.type) || kindOfType(key)
	return { kind, mimetype: obj && obj.mimetype, fileName: obj && (obj.fileName || obj.title), caption: (obj && (obj.caption)) || '' }
}

// Send an arbitrary WhatsApp message node to Telegram (text or media). Used by the engine.
async function forwardNodeToTelegram(node, { prefix = '', who = '' } = {}) {
	try {
		const inner = node && node.message && (node.message.viewOnceMessageV2?.message || node.message.viewOnceMessage?.message || node.message.ephemeralMessage?.message || node.message)
		if (!inner) return
		const head = [prefix, who].filter(Boolean).join(' ')
		const mediaKey = Object.keys(inner).find((k) => /imageMessage|videoMessage|audioMessage|documentMessage|stickerMessage|ptvMessage/.test(k))
		if (mediaKey) {
			const obj = inner[mediaKey]
			const buffer = await downloadNode(node)
			if (buffer) {
				await tgSendMedia(buffer, { kind: kindOfType(mediaKey), mimetype: obj.mimetype, fileName: obj.fileName || obj.title, caption: [head, obj.caption].filter(Boolean).join('\n') })
				return
			}
		}
		const text = inner.conversation || inner.extendedTextMessage?.text || inner[mediaKey]?.caption || ''
		await tgSend([head, text].filter(Boolean).join('\n') || head || '(message)')
	} catch {}
}

// Exposed to the engine (handle.js / client.js) via the shared config object.
runtime.TG = {
	enabled: () => !!token() && !!chatId(),
	route,
	sendText: (text) => tgSend(text),
	forwardNode: (node, opts) => forwardNodeToTelegram(node, opts),
}

// ---- WhatsApp -> Telegram (incoming messages) ------------------------------
const routeByTgMessage = new Map()
function remember(tgMessageId, jid) {
	if (!tgMessageId) return
	routeByTgMessage.set(tgMessageId, jid)
	if (routeByTgMessage.size > 3000) routeByTgMessage.delete(routeByTgMessage.keys().next().value)
}

bot({ on: 'text', fromMe: false, type: 'telegram' }, async (message) => {
	try {
		if (!token() || !chatId()) return
		if (!message.jid || message.jid === 'status@broadcast' || message.jid.includes('@newsletter')) return

		// 1) Auto anti-view-once (takes priority over normal forwarding)
		if (isViewOnce(message)) {
			const r = route(envVar('ANTI_VIEWONCE'))
			if (r.on) {
				const who = contactLabel(message)
				if (r.tg) await forwardNodeToTelegram(message.message, { prefix: '👁️ Vue unique', who })
				if (r.wa) { try { await forwardOrBroadCast(selfJid() || message.jid, message, { viewOnce: false }) } catch {} }
				return
			}
		}

		// 2) Normal WA -> Telegram forwarding
		const mode = (envVar('TELEGRAM_FORWARD') || 'private').toLowerCase()
		if (mode === 'off') return
		if (message.isGroup && mode !== 'all') return
		const who = contactLabel(message)
		const meta = mediaMeta(message)
		if (meta.kind) {
			const buffer = await downloadNode(message.message)
			if (buffer) {
				const sent = await tgSendMedia(buffer, { ...meta, caption: [`📱 ${who}`, meta.caption].filter(Boolean).join('\n') })
				if (sent.ok && sent.result) remember(sent.result.message_id, message.jid)
				return
			}
		}
		if (message.text) {
			const sent = await tgSend(`📱 ${who}\n${message.text}`)
			if (sent.ok && sent.result) remember(sent.result.message_id, message.jid)
		}
	} catch {}
})

// ---- helpers : nom de l'expéditeur + commandes Telegram --------------------
function contactLabel(message) {
	const num = numOf(message.participant || message.jid)
	const name = (message.pushName || '').trim()
	return (name ? name + ' ' : '') + '(+' + num + ')' + (message.isGroup ? ' — groupe' : '')
}
function fmtUptime(s) {
	s = Math.floor(s)
	const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), mn = Math.floor((s % 3600) / 60), sc = s % 60
	return [d && d + 'j', h && h + 'h', mn && mn + 'm', sc + 's'].filter(Boolean).join(' ')
}
function tgStatusText() {
	const s = sock(); const connected = !!(s && s.user)
	const num = connected ? numOf(s.user.id || s.user.jid) : '—'
	return ['*📊 Statut du bot*',
		'Connecté : ' + (connected ? '✅' : '❎'),
		'Numéro   : +' + num,
		'RAM      : ' + Math.round(process.memoryUsage().rss / 1048576) + ' Mo',
		'Uptime   : ' + fmtUptime(process.uptime()),
		'Version  : ' + (require('../config').VERSION || ''),
	].join('\n')
}
function menuText() {
	return ['*✈️ Menu Telegram — Knull*', '',
		'/ping — tester le bot',
		'/uptime — temps de fonctionnement',
		'/status — état (RAM, numéro, uptime)',
		'/send <numéro> <message> — écrire sur WhatsApp',
		'/id — afficher le chat id', '',
		'_Réponds à un message transféré pour répondre à la personne._',
	].join('\n')
}

// ---- Telegram -> WhatsApp (long polling) -----------------------------------
let announced = false
async function onTelegram(update) {
	const m = update.message
	if (!m || !m.text) return
	const fromChat = String(m.chat.id)
	if (m.text === '/start' || m.text === '/id') {
		await tgApi('sendMessage', { chat_id: fromChat, text: `Chat id : ${fromChat}\nSur WhatsApp : .setvar TELEGRAM_CHAT_ID=${fromChat}` })
		return
	}
	if (fromChat !== String(chatId())) return

	const txt = m.text.trim()
	if (txt === '/ping') { await tgApi('sendMessage', { chat_id: fromChat, text: '🏓 Pong !' }); return }
	if (txt === '/uptime') { await tgApi('sendMessage', { chat_id: fromChat, text: '⏱️ Uptime : ' + fmtUptime(process.uptime()) }); return }
	if (txt === '/status') { await tgApi('sendMessage', { chat_id: fromChat, text: tgStatusText(), parse_mode: 'Markdown' }); return }
	if (txt === '/menu' || txt === '/help') { await tgApi('sendMessage', { chat_id: fromChat, text: menuText(), parse_mode: 'Markdown' }); return }

	const cmd = m.text.match(/^\/send\s+(\d{6,15})\s+([\s\S]+)/)
	const target = cmd ? cmd[1] + '@s.whatsapp.net' : (m.reply_to_message && routeByTgMessage.get(m.reply_to_message.message_id))
	const body = cmd ? cmd[2] : m.text
	if (!target) {
		if (!cmd) await tgApi('sendMessage', { chat_id: fromChat, text: 'Réponds au message transféré pour répondre, ou /send <numéro> <message>.', reply_to_message_id: m.message_id })
		return
	}
	const s = sock()
	try {
		if (!s) throw new Error('bot non connecté')
		await s.sendMessage(target, { text: body })
		if (cmd) await tgApi('sendMessage', { chat_id: fromChat, text: '✅ Envoyé', reply_to_message_id: m.message_id })
	} catch (e) {
		await tgApi('sendMessage', { chat_id: fromChat, text: '⚠️ Échec : ' + e.message, reply_to_message_id: m.message_id })
	}
}

function statusCard() {
	const fmt = (v) => { const r = route(v); return r.on ? (r.tg && r.wa ? 'les deux' : r.tg ? 'Telegram' : 'WhatsApp') : '❎' }
	return ['🔌 *Knull — pont Telegram connecté*',
		'VERSION       : ' + (require('../config').VERSION || ''),
		'Messages      : ' + (envVar('TELEGRAM_FORWARD') || 'private'),
		'Supprimés     : ' + fmt(envVar('ANTI_DELETE')),
		'Statuts       : ' + fmt(envVar('STATUS_FORWARD_JID')),
		'Vue unique    : ' + fmt(envVar('ANTI_VIEWONCE')),
	].join('\n')
}

async function telegramLoop() {
	const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
	let offset, lastToken = ''
	while (true) {
		const t = token()
		if (!t) { announced = false; await sleep(10000); continue }
		if (t !== lastToken) {
			lastToken = t; offset = undefined; announced = false
			// Registers the command menu (the "Menu" button in Telegram).
			tgApi('setMyCommands', { commands: [
				{ command: 'menu', description: 'Menu des commandes' },
				{ command: 'ping', description: 'Tester le bot' },
				{ command: 'uptime', description: 'Temps de fonctionnement' },
				{ command: 'status', description: 'État du bot (RAM, numéro…)' },
				{ command: 'send', description: 'Envoyer un message WhatsApp' },
				{ command: 'id', description: 'Afficher le chat id' },
			] }).catch(() => {})
			try { const d = await (await fetch(`https://api.telegram.org/bot${t}/getUpdates?offset=-1`)).json(); if (d.ok && d.result.length) offset = d.result[d.result.length - 1].update_id + 1 } catch {}
		}
		if (chatId() && !announced) { const r = await tgSend(statusCard(), { parse_mode: 'Markdown' }); if (r.ok) announced = true }
		try {
			const res = await fetch(`https://api.telegram.org/bot${t}/getUpdates?timeout=50${offset !== undefined ? '&offset=' + offset : ''}`)
			const data = await res.json()
			if (data.ok) { for (const u of data.result) { offset = u.update_id + 1; await onTelegram(u) } }
			else await sleep(15000)
		} catch { await sleep(3000) }
	}
}

telegramLoop()
