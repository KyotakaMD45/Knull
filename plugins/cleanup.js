/**
 * Disk cleanup — keeps a small VPS from filling up.
 *
 * Every 6 hours it:
 *   - deletes scratch files in the bot's temp/ folder older than 2 hours
 *   - clears PM2 log files (pm2 flush), which grow without limit
 *
 * It only touches the bot's own temp/ folder and PM2 logs. It never deletes
 * databases, plugins, media assets or anything else.
 */
const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')
let lib
try { lib = require('../lib/') } catch { lib = { logger: console } }
const log = (lib && lib.logger) || console

const TEMP_DIR = path.join(__dirname, '..', 'temp')
const MAX_AGE_MS = 2 * 60 * 60 * 1000 // 2 hours

function cleanTemp() {
	let removed = 0
	try {
		if (!fs.existsSync(TEMP_DIR)) return 0
		const now = Date.now()
		for (const name of fs.readdirSync(TEMP_DIR)) {
			if (name.startsWith('.')) continue // keep .gitkeep etc.
			const full = path.join(TEMP_DIR, name)
			try {
				const st = fs.statSync(full)
				if (st.isFile() && now - st.mtimeMs > MAX_AGE_MS) { fs.unlinkSync(full); removed++ }
			} catch {}
		}
	} catch {}
	return removed
}

function flushPm2Logs() {
	exec('pm2 flush', { timeout: 20000, windowsHide: true }, () => {})
}

function run() {
	const n = cleanTemp()
	flushPm2Logs()
	if (n) log.info(`[cleanup] ${n} fichier(s) temporaire(s) supprimé(s)`)
}

// First run shortly after start, then every 6 hours.
setTimeout(run, 60000)
const timer = setInterval(run, 6 * 60 * 60 * 1000)
if (timer.unref) timer.unref()

log.info('[cleanup] actif — nettoyage du dossier temp/ et des journaux PM2 toutes les 6 h')
