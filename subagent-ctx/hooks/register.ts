import type { Register } from 'claude-code'

// Appends " · ctx: YY% left" to the built-in subagent row, using that agent's own context.
export const register: Register = on => {
  on('ui.render', { component: 'AgentRow' }, ($, e, next) => {
    const { tokenCount, contextWindowSize, label } = e.props
    const ctx =
      contextWindowSize && tokenCount > 0
        ? `${Math.max(0, Math.round(100 - (tokenCount / contextWindowSize) * 100))}% left`
        : '--'
    return next({ ...e, props: { ...e.props, label: `${label} · ctx: ${ctx}` } })
  })
}
