import type { Register } from 'claude-code'

// The spacing Claude Code puts between the agent name and its description.
const GAP = '  '
// The same 2 columns inside our text: Claude Code squeezes any run of whitespace
// in the description to one space (non-breaking ones too), so the second column
// is the braille blank (U+2800): one column wide, drawn empty, not whitespace.
const TEXT_GAP = ' \u2800'
// The space Claude Code always keeps free before the time column; it cuts the
// description short of it, so ctx has to end at least this far from the time.
const STATS_GAP = 4

// The row's time column refreshes between our redraws (about every 5 s), so size
// it for the widest it can get before the next one, or it would push ctx off.
const REDRAW_MS = 5000

// Claude Code's own formats, as drawn in the row: "11s", "1m 3s", "↓ 17.7k tokens".
const fmtTime = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000))
  if (s < 60) return `${s}s`
  if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`
}
const fmtTokens = (n: number) => (n < 1000 ? `${n}` : `${(n / 1000).toFixed(1)}k`)

// Width of the right-aligned "1m 3s · ↓ 17.7k tokens" group.
const statsWidth = (startTime: number, tokenCount: number) => {
  const now = Date.now()
  const time = Math.max(fmtTime(now - startTime).length, fmtTime(now + REDRAW_MS - startTime).length)
  // We read tokenCount every 5 s and it is 0 before our first reading, while the row
  // may already show more: size for 12% growth, or for "100.0k" with no reading yet.
  const tokens = fmtTokens(tokenCount > 0 ? Math.round(tokenCount * 1.12) : 100_000)
  return time + ' · ↓ '.length + `${tokens} tokens`.length
}

// Adds "  ctx YY%" after the built-in row's description, using that agent's
// own context, and trims the description so ctx always ends STATS_GAP before the time.
export const register: Register = on => {
  on('ui.render', { component: 'AgentRow' }, async ($, e, next) => {
    const { tokenCount, contextWindowSize, columns, name, type, parentId, startTime } = e.props
    const ctx =
      contextWindowSize && tokenCount > 0
        ? `${Math.max(0, Math.round(100 - (tokenCount / contextWindowSize) * 100))}%`
        : '--'
    const suffix = `${TEXT_GAP}ctx ${ctx}`
    let label = e.props.label.replace(/\s+/g, ' ').trim()

    if (columns) {
      // A nested row's connector takes two columns per level.
      const agents = parentId ? await $.agent.list() : []
      let depth = 0
      for (let p = parentId; p; p = agents.find(a => a.id === p)?.parentId) depth++

      const nameCols = (name ?? type).length + GAP.length
      const room =
        columns - depth * 2 - nameCols - suffix.length - STATS_GAP - statsWidth(startTime, tokenCount)
      const chars = [...label]
      if (chars.length > room) label = room > 1 ? chars.slice(0, room - 1).join('').trimEnd() + '…' : ''
    }

    return next({ ...e, props: { ...e.props, label: label + suffix } })
  })
}
