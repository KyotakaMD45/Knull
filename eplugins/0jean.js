const { KNULL_API } = require('../config')
 const { bot, getJson } = require('../lib')

bot(
	{
		pattern: 'jean ?(.*)',
		fromMe: true,
		desc: 'simple google search',
		type: 'search',
	},
	async (message, match) => {
		if (!match)
			return await message.send('*Example : jean 12 dollar in inr*')
		const { result } = await getJson(
			`${KNULL_API}/jean?text=${encodeURIComponent(match)}`
		)
		if (!result) return await message.send('_Not found_')
		return await message.send('```' + result + '```')
	}
)