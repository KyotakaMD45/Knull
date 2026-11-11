// Déobfusqué depuis le build obfuscator.io d'origine : chaînes décodées,
// wrappers anti-debug / auto-défense supprimés. Deux bugs de l'original
// corrigés : "cloud" était enregistré sous ".light", et ".blub" en double.
const { bot, textMaker, getRandom } = require('../lib')

const effectUrls = {
	cat: 'https://en.ephoto360.com/handwritten-text-on-foggy-glass-online-680.html',
	hacker: 'https://en.ephoto360.com/create-anonymous-hacker-avatars-cyan-neon-677.html',
	sign: 'https://en.ephoto360.com/create-multicolored-signature-attachment-arrow-effect-714.html',
	glitter: 'https://en.ephoto360.com/free-glitter-text-effect-maker-online-656.html',
	light: 'https://en.ephoto360.com/light-text-effect-futuristic-technology-style-648.html',
	cloud: 'https://en.ephoto360.com/create-realistic-cloud-text-effect-606.html',
	angel: 'https://en.ephoto360.com/create-colorful-angel-wing-avatars-731.html',
	tattoo: 'https://en.ephoto360.com/arrow-tattoo-effect-with-signature-712.html',
	neon: 'https://en.ephoto360.com/create-multicolored-neon-light-signatures-591.html',
	marvel: 'https://en.ephoto360.com/create-marvel-style-logo-419.html',
	watercolor: 'https://en.ephoto360.com/create-a-watercolor-text-effect-online-655.html',
	bpink: 'https://en.ephoto360.com/create-blackpink-logo-online-free-607.html',
	d3: 'https://en.ephoto360.com/multicolor-3d-paper-cut-style-text-effect-658.html',
	blub: 'https://en.ephoto360.com/create-realistic-vintage-3d-light-bulb-608.html',
	graffiti: 'https://en.ephoto360.com/create-a-graffiti-text-effect-on-the-wall-online-665.html',
	glitch: 'https://en.ephoto360.com/tik-tok-text-effects-online-generator-485.html',
	avenger: 'https://en.ephoto360.com/create-logo-3d-style-avengers-online-427.html',
	sci: 'https://en.ephoto360.com/create-a-awesome-logo-sci-fi-effects-492.html',
}

const texts = {
	text: '*Give me a text*',
	text2: '*Give me text1 ; text2*',
	text3: '*Give me text1 ; text2 ; text3*',
}

// Identifiants de style tirés au hasard pour les effets qui en proposent plusieurs.
const effectButtons = {
	cat: [
		'2d6f1ad1-39df-4175-9faa-9348b6ba1551',
		'86e55647-2fc7-4b20-ae13-7dfc740af209',
		'22cdd4a3-f144-4f8d-b46f-093b0c1ec0d2',
		'fb6983d2-3bc1-46b5-bb61-00cff1bffbf7',
		'33be5625-d82c-4bd5-97ed-57324fd90a70',
		'50eb6949-e5a5-4feb-95ce-8ca749159ee7',
	],
	hacker: [
		'984dd03e-220d-4335-a6ba-7ac56b092240',
		'71074346-5cb3-4b7d-9b8b-a84e4f142ba4',
		'88bacc38-e755-450a-bbc1-f5671d77c8a7',
	],
	sign: [
		'e0723d60-fc0d-421f-bf8f-a9b9b61e4be6',
		'2edeed59-62c0-42c8-9b70-006c7f53fc11',
		'c0863fd4-826b-4f4d-8445-feeb383e3c3d',
		'497b4762-cdab-43d8-a486-06bee46ba0ea',
		'a81e2201-f908-460e-9851-29a616a7ace0',
		'66cd8660-e2fe-4650-996c-b2e135233576',
	],
	glitter: [
		'1ad3c6ed-ba1e-4582-95cf-b5e2d7d1a125',
		'9a0f8a8a-d4b0-42bf-945f-06e75a2ac6a4',
		'83d9bd14-0ebe-470b-a2c7-bdda4f37ef17',
		'bf5c590b-27c0-4f12-986c-f2758674d97b',
		'450adc52-33aa-4519-b921-9c814ae0f275',
		'155f67da-bf57-42e4-a3a8-5f1825b65b7e',
	],
	light: [
		'05acf523-6deb-4b9d-bb28-abc4354d0858',
		'843a4fc2-059c-4283-87e4-c851c013073b',
		'd951e4be-450e-4658-9e73-0f7c82c63ee3',
		'a5b374f3-2f29-4da4-ae15-32dec01198e2',
	],
	cloud: [
		'a7e1abaa-08d9-4428-9758-8b11c9031238',
		'cc01bb82-23e0-4489-a27d-e044cfdcb2c7',
		'bf6d85dd-bf47-4154-9138-8c32e19419f7',
		'2eb14d3d-c392-4e13-ad22-6162ef43f25d',
	],
	angel: [
		'fed58002-b0fe-4193-885e-5cb7b5214305',
		'19c58774-962d-4a12-8b75-769b2e188ad1',
		'6ac134d1-f593-499d-8641-e7ce45af680e',
		'20fb811f-d9c2-42c9-a1fa-1fcee791c22c',
		'c82cbc01-e167-47bb-8714-02b073c3738d',
		'23fa67cb-b95e-49b3-8abe-ec9e3ae13456',
		'4d1e64fd-6601-4fd1-acfd-dbdad36c401a',
		'3a5ea326-65d6-43f1-abc8-b576e7c8cfa4',
		'18c4658a-e1b1-46ba-9d23-1fa051e67105',
		'a5cbd215-ac33-46e2-97e5-5bd6e1c800b3',
		'8be96a94-82d9-4f75-bb2c-63311944e8a0',
		'41021a6d-2d02-4759-b8bc-6b941bda4dbc',
		'0b5a4d0b-f896-4def-bfb8-e2177fca2360',
		'a60760ea-f266-4064-bde0-8d02f174254d',
		'c542dab0-ea54-44a5-9976-c6af66f71d9c',
		'7cdb6c7b-1c37-41c6-b50d-500c6111833d',
		'868cf218-c4c9-432a-b737-8d43ecdc580c',
		'df2d7c1e-7319-4157-a02c-0c7f71f41cc3',
	],
	tattoo: [
		'4d1dfa3e-be48-4568-bc26-df31de589673',
		'0a0b8874-001e-402e-82bf-4f48cbce22f4',
		'2cb87186-d73e-43fe-b07a-4c01c448cdd1',
		'cee64633-8a3b-4208-9dd6-1a15d6c2b10d',
	],
	neon: [
		'188eb364-5a04-446e-a779-0e2f427b7bc3',
		'a35d8b0d-bb89-4718-8723-71c5a9e9de4a',
		'3938db27-c48c-4d96-ab60-f1bd1e312abf',
		'6bf8fced-bb7f-4373-ad07-5e95fd30e10e',
		'aa66248c-328c-447f-8862-ef49e1a73bc0',
		'7647ec5b-f47c-4dab-91b6-db3afef6c980',
	],
	marvel: ['s2swb17rd', 'nsz1alvq1'],
}

/**
 * Enregistre une commande d'effet texte ephoto360.
 * minParts : 1 = texte non vide ; 2 ou 3 = "texte1 ; texte2 [; texte3]".
 * random : passe un style aléatoire tiré de effectButtons[key].
 */
const effect = (pattern, desc, key, minParts, random) =>
	bot({ pattern: `${pattern} ?(.*)`, fromMe: true, desc, type: 'textmaker' }, async (message, match) => {
		const invalid = minParts === 1 ? !match : match.split(';').length < minParts
		if (invalid)
			return await message.send(minParts === 3 ? texts.text3 : minParts === 2 ? texts.text2 : texts.text)
		const args = random ? [getRandom(effectButtons[key])] : []
		const { url } = await textMaker(effectUrls[key], match, ...args)
		if (url) return await message.sendFromUrl(url)
	})

effect('cat', 'Cat text effect', 'cat', 1, true)
effect('hacker', 'Hacker text effect', 'hacker', 1, true)
effect('sign', 'text effect', 'sign', 1, true)
effect('glitter', 'text effect', 'glitter', 1, true)
effect('light', 'text effect', 'light', 1, true)
effect('cloud', 'text effect', 'cloud', 1, true)
effect('angel', 'text effect', 'angel', 1, true)
effect('tattoo', 'text effect', 'tattoo', 1, true)
effect('neon', 'text effect', 'neon', 1, true)
effect('marvel', 'text effect', 'marvel', 2, true)
effect('watercolor', 'Cat text effect', 'watercolor', 1, false)
effect('bpink', 'Cat text effect', 'bpink', 1, false)
effect('3d', 'Cat text effect', 'd3', 1, false)
effect('blub', 'text effect', 'blub', 2, false)
effect('graffiti', 'text effect', 'graffiti', 2, false)
effect('glitch', 'text effect', 'glitch', 2, false)
effect('avenger', 'text effect', 'avenger', 2, false)
effect('sci', 'text effect', 'sci', 3, false)
