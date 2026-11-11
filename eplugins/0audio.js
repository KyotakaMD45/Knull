// Déobfusqué depuis le build obfuscator.io d'origine : chaînes décodées,
// wrappers anti-debug / auto-défense supprimés. Comportement inchangé.
const { exec } = require('child_process')
const fs = require('fs')
const { bot } = require('../lib')

const applyAudioFilter = (input, filter) =>
	new Promise((resolve, reject) => {
		exec(`ffmpeg -y -i ${input} ${filter} fout.mp3`, (err) => {
			if (err) return reject(new Error('audio Err'))
			resolve(fs.readFileSync('fout.mp3'))
		})
	})

const FILTERS = {
	blown: '-af acrusher=.1:1:64:0:log',
	deep: '-af atempo=4/4,asetrate=44500*2/3',
	earrape: '-af volume=12',
	fast: '-filter:a "atempo=1.63,asetrate=44100"',
	fat: '-filter:a "atempo=1.6,asetrate=22100"',
	nightcore: '-filter:a atempo=1.06,asetrate=44100*1.25',
	robot:
		'-filter_complex "afftfilt=real=\'hypot(re,im)*sin(0)\':imag=\'hypot(re,im)*cos(0)\':win_size=512:overlap=0.75"',
	slow: '-filter:a "atempo=0.7,asetrate=44100"',
	smooth: '-filter:v "minterpolate=\'mi_mode=mci:mc_mode=aobmc:vsbmc=1:fps=120\'"',
	tupai: '-filter:a "atempo=0.5,asetrate=65100"',
}

const AUDIO_OPTIONS = { ptt: false, mimetype: 'audio/mpeg' }

for (const [name, filter] of Object.entries(FILTERS)) {
	bot(
		{ pattern: `${name} ?(.*)`, fromMe: true, desc: 'audio mod', type: 'audio' },
		async (message, match) => {
			if (!message.reply_message || !message.reply_message.audio)
				return await message.send('*Reply to a audio Message*')
			const file = await message.reply_message.downloadAndSaveMediaMessage('nightcore')
			await message.send(await applyAudioFilter(file, filter), AUDIO_OPTIONS, 'audio')
		}
	)
}
