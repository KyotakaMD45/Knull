/**
 * Memory watchdog — protects small VPS (e.g. 1 GB RAM) from out-of-memory crashes.
 *
 * Every minute it checks the bot's memory use. If it goes above the limit AND the
 * bot runs under PM2, it exits cleanly so PM2 restarts it with fresh memory
 * (the session lives in the database, so a restart is safe).
 *
 * Variable (optional): MAX_RAM_MB = memory limit in MB.
 *   Default: 60% of the machine's total RAM (min 350 MB).
 */
const os = require('os')
let lib
try { lib = require('../lib/') } catch { lib = { logger: console } }
const log = (lib && lib.logger) || console

const underPm2 = () => process.env.pm_id !== undefined || process.env.PM2_HOME !== undefined
const totalMb = Math.floor(os.totalmem() / 1048576)

function limitMb() {
	const v = Number(process.env.MAX_RAM_MB)
	if (v && v >= 150) return v
	return Math.max(350, Math.floor(totalMb * 0.6))
}

let warned = false
const timer = setInterval(() => {
	try {
		const rss = Math.floor(process.memoryUsage().rss / 1048576)
		const limit = limitMb()
		if (rss >= limit) {
			if (underPm2()) {
				log.warn(`[watchdog] RAM ${rss} MB >= ${limit} MB — redémarrage propre pour éviter un plantage.`)
				setTimeout(() => process.exit(0), 500) // PM2 relance avec de la mémoire fraîche
			} else if (!warned) {
				warned = true
				log.warn(`[watchdog] RAM ${rss} MB >= ${limit} MB (hors PM2 : pas de redémarrage automatique).`)
			}
		} else {
			warned = false
		}
	} catch {}
}, 60000)
if (timer.unref) timer.unref()

log.info(`[watchdog] actif — limite ${limitMb()} MB (RAM totale ${totalMb} MB)`)
