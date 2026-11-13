const { bot, setVar, getVars, delVar, sortObject, lang } = require('../lib')

bot(
  {
    pattern: 'getvar ?(.*)',
    desc: lang.plugins.getvar.desc,
    type: 'vars',
  },
  async (message, match) => {
    if (!match) return await message.send(lang.plugins.getvar.usage)
    const vars = await getVars(message.id)
    match = match.toUpperCase()
    if (vars[match]) return await message.send(`${match} = ${vars[match]}`)
    return await message.send(lang.plugins.getvar.not_found.format(match))
  }
)

bot(
  {
    pattern: 'delvar ?(.*)',
    desc: lang.plugins.delvar.desc,
    type: 'vars',
  },
  async (message, match) => {
    if (!match) return await message.send(lang.plugins.delvar.usage)
    const vars = await getVars(message.id)
    const arg = match.trim().toLowerCase()

    // delvar all -> supprime toutes les variables définies
    if (arg === 'all' || arg === 'tout') {
      const all = Object.keys(vars)
      if (!all.length) return await message.send(lang.plugins.delvar.not_found.format('—'))
      for (const k of all) await delVar(k, message.id)
      return await message.send(lang.plugins.delvar.deleted.format(all.join(', ')))
    }

    // delvar X Y Z  ou  delvar X,Y,Z  -> supprime plusieurs variables
    const keys = match.toUpperCase().split(/[\s,]+/).filter(Boolean)
    const deleted = []
    const notFound = []
    for (const k of keys) {
      if (vars[k]) {
        await delVar(k, message.id)
        deleted.push(k)
      } else {
        notFound.push(k)
      }
    }
    const out = []
    if (deleted.length) out.push(lang.plugins.delvar.deleted.format(deleted.join(', ')))
    if (notFound.length) out.push(lang.plugins.delvar.not_found.format(notFound.join(', ')))
    await message.send(out.join('\n') || lang.plugins.delvar.usage)
  }
)

bot(
  {
    pattern: 'setvar ?(.*)',
    desc: lang.plugins.setvar.desc,
    type: 'vars',
  },
  async (message, match) => {
    const [key, ...values] = match.split('=')
    if (!match || values.length === 0) return await message.send(lang.plugins.setvar.usage)
    const value = values.join('=').trim()
    const keyValue = key.trim().toUpperCase()
    await setVar({ [keyValue]: value }, message.id)
    await message.send(lang.plugins.setvar.success.format(keyValue, value))
  }
)

bot(
  {
    pattern: 'allvar ?(.*)',
    desc: lang.plugins.allvar.desc,
    type: 'vars',
  },
  async (message, match) => {
    const vars = await getVars(message.id)
    const sortedVars = sortObject(vars)
    const allVars = Object.entries(sortedVars)
      .map(([key, value]) => `${key} = ${value}`)
      .join('\n\n')

    await message.send(allVars)
  }
)
