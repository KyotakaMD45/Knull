/**
 * Telegram bridge — built into the bot (no separate program, no API key).
 *
 * Read-only on Telegram. Ordinary WhatsApp messages are NOT forwarded.
 * Only what you route to Telegram arrives: deleted messages, statuses, view-once.
 * Telegram commands: /ping /alive /status /sessions /restart /menu /id.
 *
 * Exposes config.TG (used by the engine) so deleted messages, statuses and
 * update notices can be routed to Telegram.
 *
 * Variables (set on WhatsApp):
 *   TELEGRAM_TOKEN=123456:ABC...     (from @BotFather)
 *   TELEGRAM_CHAT_ID=123456789       (send /id to your bot to get it)
 *   .delete telegram | .status telegram | .vv telegram   (choose the destination)
 */
const fs = require('fs')
const path = require('path')
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

// Envoie une photo locale (ex. media/welcome.jpg) avec légende éventuelle.
async function tgSendPhotoFile(filePath, caption, parse_mode) {
	const t = token(); const c = chatId()
	if (!t || !c) return { ok: false }
	try {
		const buf = fs.readFileSync(filePath)
		const form = new FormData()
		form.set('chat_id', String(c))
		if (caption) form.set('caption', caption.slice(0, 1024))
		if (parse_mode) form.set('parse_mode', parse_mode)
		form.set('photo', new Blob([buf], { type: 'image/jpeg' }), 'welcome.jpg')
		const res = await fetch(`https://api.telegram.org/bot${t}/sendPhoto`, { method: 'POST', body: form })
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

// Horodatage court et lisible (fuseau du bot si défini).
function stamp() {
	try {
		return new Date().toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: process.env.TZ || process.env.TIMEZONE || undefined })
	} catch { return '' }
}
// En-tête structuré : « prefix » / « 👤 expéditeur » / « 🕐 date ».
function buildHead(prefix, who) {
	const lines = []
	if (prefix) lines.push(prefix)
	if (who) lines.push(who)
	const t = stamp()
	if (t) lines.push('🕐 ' + t)
	return lines.join('\n')
}
// Send an arbitrary WhatsApp message node to Telegram (text or media). Used by the engine.
async function forwardNodeToTelegram(node, { prefix = '', who = '' } = {}) {
	try {
		const inner = node && node.message && (node.message.viewOnceMessageV2?.message || node.message.viewOnceMessage?.message || node.message.ephemeralMessage?.message || node.message)
		if (!inner) return
		if (!who && node) who = nodeWho(node)
		const head = buildHead(prefix, who)
		const mediaKey = Object.keys(inner).find((k) => /imageMessage|videoMessage|audioMessage|documentMessage|stickerMessage|ptvMessage/.test(k))
		if (mediaKey) {
			const obj = inner[mediaKey]
			const buffer = await downloadNode(node)
			if (buffer) {
				// En-tête + légende éventuelle, séparés par une ligne vide.
				await tgSendMedia(buffer, { kind: kindOfType(mediaKey), mimetype: obj.mimetype, fileName: obj.fileName || obj.title, caption: [head, obj.caption].filter(Boolean).join('\n\n') })
				return
			}
		}
		const text = inner.conversation || inner.extendedTextMessage?.text || inner[mediaKey]?.caption || ''
		await tgSend([head, text].filter(Boolean).join('\n\n') || head || '(message)')
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
bot({ on: 'text', fromMe: false, type: 'telegram' }, async (message) => {
	try {
		if (!token() || !chatId()) return
		if (!message.jid || message.jid === 'status@broadcast' || message.jid.includes('@newsletter')) return

		// 1) Auto anti-view-once (takes priority over normal forwarding)
		if (isViewOnce(message)) {
			const r = route(envVar('ANTI_VIEWONCE'))
			if (r.on) {
				const who = contactLabel(message)
				const meta = mediaMeta(message)
				const buffer = await downloadNode(message.message)
				if (r.tg) {
					if (buffer && meta.kind) await tgSendMedia(buffer, { ...meta, caption: ['👁️ Vue unique de ' + who, meta.caption].filter(Boolean).join('\n') })
					else await forwardNodeToTelegram(message.message, { prefix: '👁️ Vue unique', who })
				}
				if (r.wa) {
					const s = sock(); const self = selfJid()
					try {
						if (s && self && buffer && meta.kind) {
							const field = meta.kind === 'image' ? 'image' : meta.kind === 'video' ? 'video' : meta.kind === 'audio' ? 'audio' : 'document'
							const content = { [field]: buffer, caption: '👁️ Vue unique de ' + who }
							if (meta.mimetype) content.mimetype = meta.mimetype
							await s.sendMessage(self, content)
						} else {
							await forwardOrBroadCast(self || message.jid, message, { viewOnce: false })
						}
					} catch {}
				}
				return
			}
		}

		// Les messages ORDINAIRES ne sont PLUS recopiés vers Telegram.
		// Seuls les supprimés / statuts / vue unique dirigés vers Telegram y arrivent.
	} catch {}
})

// ---- helpers : nom de l'expéditeur + commandes Telegram --------------------
// Nom lisible : « 👤 Nom (+number) » (+ « — groupe » en groupe).
function prettyWho(name, num, isGroup) {
	name = (name || '').trim()
	const label = '👤 ' + (name ? name + ' ' : '') + (num ? '(+' + num + ')' : '')
	return isGroup ? label + ' — groupe' : label
}
function contactLabel(message) {
	const num = numOf(message.participant || message.jid)
	return prettyWho(message.pushName, num, message.isGroup)
}
// Depuis un nœud brut WhatsApp ({ key, message, pushName }).
function nodeWho(node) {
	try {
		const key = (node && node.key) || {}
		const isGroup = String(key.remoteJid || '').endsWith('@g.us')
		const num = numOf(key.participant || key.remoteJid || '')
		const name = node.pushName || node.verifiedBizName || ''
		return prettyWho(name, num, isGroup)
	} catch { return '' }
}
function fmtUptime(s) {
	s = Math.floor(s)
	const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), mn = Math.floor((s % 3600) / 60), sc = s % 60
	return [d && d + 'j', h && h + 'h', mn && mn + 'm', sc + 's'].filter(Boolean).join(' ')
}
const onoff = (v) => (v === 'true' || v === true) ? '✅' : '❎'
function destLabel(v) {
	const r = route(v)
	return r.on ? (r.tg && r.wa ? '✅ WhatsApp + Telegram' : r.tg ? '✅ Telegram' : '✅ WhatsApp') : '❎'
}
function tgStatusText() {
	const id = firstSession()
	const env = (runtime[id] && runtime[id].env) || {}
	const s = sock(); const connected = !!(s && s.user)
	const num = connected ? numOf(s.user.id || s.user.jid) : '—'
	const asv = env.AUTO_STATUS_VIEW
	const emoji = env.STATUS_VIEW_EMOJI
	return ['*📊 Statut de Knull*', '',
		'🔌 Connecté        : ' + (connected ? '✅' : '❎'),
		'📱 Numéro          : +' + num,
		'🧠 RAM             : ' + Math.round(process.memoryUsage().rss / 1048576) + ' Mo',
		'⏱️ Uptime          : ' + fmtUptime(process.uptime()),
		'🧩 Version         : ' + (require('../config').VERSION || ''),
		'',
		'📖 Auto-lecture    : ' + onoff(env.SEND_READ),
		'👀 Vue des statuts : ' + (asv && asv !== 'false' && asv !== 'null' ? '✅' : '❎'),
		'😀 Emoji statut    : ' + (emoji && emoji !== 'false' && emoji !== 'null' ? emoji : '❎'),
		'🚫 Rejet appels    : ' + onoff(env.REJECT_CALL),
		'🔋 Toujours en ligne : ' + onoff(env.ALWAYS_ONLINE),
		'🔄 Auto-update     : ' + (env.AUTO_UPDATE && env.AUTO_UPDATE !== 'false' ? '✅' : '❎'),
		'',
		'🗑️ Supprimés → ' + destLabel(env.ANTI_DELETE),
		'📡 Statuts   → ' + destLabel(env.STATUS_FORWARD_JID),
		'👁️ Vue unique → ' + destLabel(env.ANTI_VIEWONCE),
	].join('\n')
}
function menuText() {
	return ['*✈️ Menu Telegram — Knull*', '',
		'/ping — tester le bot',
		'/alive — le bot est en ligne (version, uptime…)',
		'/status — état (RAM, numéro, uptime)',
		'/sessions — liste des sessions WhatsApp',
		'/panel — lien + mot de passe du panneau web',
		'/ask <question> — poser une question à Gemini (IA)',
		'/restart — redémarrer le bot',
		'/id — afficher le chat id',
		'',
		'_🤖 Astuce : réponds à une réponse de Gemini pour continuer la conversation._',
		'_Pont en lecture seule : seuls les éléments que tu diriges vers Telegram (supprimés, statuts, vue unique) arrivent ici._',
	].join('\n')
}

// Lien direct vers le panneau web (URL détectée + port + mot de passe), format HTML.
async function panelText() {
	const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
	const port = process.env.PORT || 3000
	const pass = process.env.PASSWORD || 'KNULL'
	let url = '', where = ''
	if (process.env.RENDER_EXTERNAL_URL) { url = process.env.RENDER_EXTERNAL_URL; where = 'Render' }
	else if (process.env.KOYEB_PUBLIC_DOMAIN) { url = 'https://' + process.env.KOYEB_PUBLIC_DOMAIN; where = 'Koyeb' }
	else {
		let ip = ''
		try { ip = (await (await fetch('https://api.ipify.org')).text()).trim() } catch {}
		if (/^\d+\.\d+\.\d+\.\d+$/.test(ip)) { url = `http://${ip}:${port}`; where = 'VPS' }
	}
	const lines = ['🖥️ <b>Panneau web Knull</b>', '━━━━━━━━━━━━━━']
	if (url) lines.push('🔗 <a href="' + esc(url) + '">' + esc(url) + '</a>')
	else lines.push('🔗 http://<b>&lt;IP-de-ton-serveur&gt;</b>:' + port, '   <i>IP publique introuvable — mets celle de ton serveur.</i>')
	lines.push('🔑 Mot de passe : <code>' + esc(pass) + '</code>')
	lines.push('🔌 Port : <code>' + port + '</code>')
	if (where) lines.push('☁️ Détecté : ' + where)
	lines.push('', '📋 <b>En 3 étapes</b>', '1️⃣ Ouvre le lien ci-dessus', '2️⃣ Entre le mot de passe', '3️⃣ Gère tes variables (comme <code>.setvar</code>)')
	lines.push('', '🔒 <i>Change le mot de passe :</i> <code>.setvar PASSWORD=…</code>')
	return lines.join('\n')
}
function sessionsText() {
	const ids = Array.isArray(runtime.sessions) ? runtime.sessions : []
	if (!ids.length) return 'Aucune session active.'
	const lines = ids.map((id) => {
		const r = runtime[id] || {}
		const s = r.sock
		const connected = !!(s && s.user)
		return '• Session ' + id + ' : ' + (connected ? '✅ +' + numOf(s.user.id || s.user.jid) : '❎ déconnectée')
	})
	return ['*📱 Sessions WhatsApp*', '', ...lines].join('\n')
}
function aliveCard() {
	const id = firstSession()
	const pc = (runtime[id] && runtime[id].pluginsCount) || {}
	const s = sock(); const num = (s && s.user) ? numOf(s.user.id || s.user.jid) : '—'
	return ['*🤖 Knull est en ligne*', '',
		'Version : ' + (require('../config').VERSION || ''),
		'Uptime  : ' + fmtUptime(process.uptime()),
		'RAM     : ' + Math.round(process.memoryUsage().rss / 1048576) + ' Mo',
		'Plugins : ' + (pc.i || 0) + ' + ' + (pc.e || 0) + ' e-plugins',
		'Numéro  : +' + num,
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
	if (txt === '/ping') { const lat = m.date ? Math.max(0, Math.round(Date.now() / 1000 - m.date)) : null; await tgApi('sendMessage', { chat_id: fromChat, text: '🏓 Pong !' + (lat !== null ? ' _(' + lat + 's)_' : ''), parse_mode: 'Markdown' }); return }
	if (txt === '/alive') { await tgApi('sendMessage', { chat_id: fromChat, text: aliveCard(), parse_mode: 'Markdown' }); return }
	if (txt === '/status') { await tgApi('sendMessage', { chat_id: fromChat, text: tgStatusText(), parse_mode: 'Markdown' }); return }
	if (txt === '/menu' || txt === '/help') { await tgApi('sendMessage', { chat_id: fromChat, text: menuText(), parse_mode: 'Markdown' }); return }
	if (txt === '/sessions') { await tgApi('sendMessage', { chat_id: fromChat, text: sessionsText(), parse_mode: 'Markdown' }); return }
	if (txt === '/panel' || txt === '/web') { await tgApi('sendMessage', { chat_id: fromChat, text: await panelText(), parse_mode: 'HTML', disable_web_page_preview: true }); return }
	if (txt === '/restart') {
		if (process.env.pm_id === undefined) { await tgApi('sendMessage', { chat_id: fromChat, text: "⚠️ Redémarrage indisponible (le bot n'est pas sous PM2)." }); return }
		await tgApi('sendMessage', { chat_id: fromChat, text: '♻️ Redémarrage du bot…' })
		setTimeout(() => process.exit(0), 800)
		return
	}

	// Gemini : /gemini <q>, /ask <q>, ou simplement répondre à un message du bot.
	const gm = txt.match(/^\/(?:gemini|ask)\b\s*([\s\S]*)/i)
	const isReplyToBot = m.reply_to_message && m.reply_to_message.from && m.reply_to_message.from.is_bot && !txt.startsWith('/')
	if (gm || isReplyToBot) {
		const q = (gm ? gm[1] : txt).trim()
		if (!q) { await tgApi('sendMessage', { chat_id: fromChat, text: '💬 Pose ta question : /ask <question>' }); return }
		if (!envVar('GEMINI_API_KEY')) { await tgApi('sendMessage', { chat_id: fromChat, text: '⚠️ GEMINI_API_KEY non défini.\nSur WhatsApp : .setvar GEMINI_API_KEY=ta_cle' }); return }
		await tgApi('sendChatAction', { chat_id: fromChat, action: 'typing' })
		try {
			const res = await lib.gemini(q, firstSession())
			const srcs = tgSources(res.sources)
			if (res.image && res.image.image) {
				await tgSendMedia(res.image.image, { kind: 'image', mimetype: res.image.mimetype, caption: ((res.data || '') + srcs).slice(0, 1024) })
			} else {
				await tgApi('sendMessage', { chat_id: fromChat, text: (res.data || '…') + srcs, reply_to_message_id: m.message_id, disable_web_page_preview: true })
			}
		} catch (e) { await tgApi('sendMessage', { chat_id: fromChat, text: '⚠️ Gemini : ' + (e && e.message || 'erreur') }) }
		return
	}

	// Commande inconnue : petit rappel (lecture seule, pas d'envoi WhatsApp depuis Telegram).
	if (txt.startsWith('/')) { await tgApi('sendMessage', { chat_id: fromChat, text: 'Commande inconnue. Tape /menu pour la liste.' }); return }
}

// Sources Gemini (grounding), format texte simple pour Telegram.
function tgSources(sources) {
	if (!sources || !sources.length) return ''
	const uniq = [...new Map(sources.map((s) => [s.uri, s])).values()].slice(0, 5)
	return '\n\n📎 Sources :\n' + uniq.map((s, i) => `${i + 1}. ${s.title || s.uri}\n${s.uri}`).join('\n')
}

function statusCard() {
	const fmt = (v) => { const r = route(v); return r.on ? (r.tg && r.wa ? 'les deux' : r.tg ? 'Telegram' : 'WhatsApp') : '❎' }
	const s = sock(); const num = (s && s.user) ? numOf(s.user.id || s.user.jid) : '—'
	return ['🔌 *Knull — pont Telegram connecté*', '',
		'📱 Numéro     : +' + num,
		'🧩 Version    : ' + (require('../config').VERSION || ''),
		'',
		'🗑️ Supprimés  : ' + fmt(envVar('ANTI_DELETE')),
		'📡 Statuts    : ' + fmt(envVar('STATUS_FORWARD_JID')),
		'👁️ Vue unique : ' + fmt(envVar('ANTI_VIEWONCE')),
		'',
		'_Tape /menu pour les commandes._',
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
				{ command: 'help', description: 'Aide (identique au menu)' },
				{ command: 'ping', description: 'Tester le bot (latence)' },
				{ command: 'alive', description: 'Le bot est en ligne' },
				{ command: 'status', description: 'État du bot (RAM, numéro…)' },
				{ command: 'sessions', description: 'Liste des sessions WhatsApp' },
				{ command: 'panel', description: 'Lien + mot de passe du panneau web' },
				{ command: 'ask', description: 'Poser une question à Gemini (IA)' },
				{ command: 'restart', description: 'Redémarrer le bot' },
				{ command: 'id', description: 'Afficher le chat id' },
			] }).catch(() => {})
			try { const d = await (await fetch(`https://api.telegram.org/bot${t}/getUpdates?offset=-1`)).json(); if (d.ok && d.result.length) offset = d.result[d.result.length - 1].update_id + 1 } catch {}
		}
		if (chatId() && !announced) {
			const img = path.join(__dirname, '..', 'media', 'welcome.jpg')
			const r = fs.existsSync(img)
				? await tgSendPhotoFile(img, statusCard(), 'Markdown')
				: await tgSend(statusCard(), { parse_mode: 'Markdown' })
			if (r && r.ok) announced = true
		}
		try {
			const res = await fetch(`https://api.telegram.org/bot${t}/getUpdates?timeout=50${offset !== undefined ? '&offset=' + offset : ''}`)
			const data = await res.json()
			if (data.ok) { for (const u of data.result) { offset = u.update_id + 1; try { await onTelegram(u) } catch {} } }
			else await sleep(15000)
		} catch { await sleep(3000) }
	}
}

telegramLoop()
