import { expect, test } from 'claude-code/testing'

const ROW = {
  id: 'a1', description: 'review', type: 'code-architect', status: 'running',
  kind: 'local_agent', taskStatus: 'running', label: 'Reviewing auth module',
  startTime: 0, cwd: '/tmp', tokenSamples: [], hasRow: true, rowIds: ['a1'],
  isHidden: false,
} as const

async function labelFor($: any, on: any, extra: object) {
  let seen = ''
  on('ui.render', { component: 'AgentRow' }, (_: any, e: any, next: any) => { seen = e.props.label; return next(e) })
  const ui = await $.ui.mount({
    plugin: 'subagent-ctx', surface: 'terminal', component: 'AgentRow',
    requestId: 'a1', props: { ...ROW, ...extra },
  })
  await ui.unmount()
  return seen
}

test('appends the agent\'s own context remaining', async ($, on) => {
  expect(await labelFor($, on, { tokenCount: 76000, contextWindowSize: 200000 }))
    .toBe('Reviewing auth module · ctx: 62% left')
})

test('shows a placeholder before the first reading', async ($, on) => {
  expect(await labelFor($, on, { tokenCount: 0, contextWindowSize: 200000 }))
    .toBe('Reviewing auth module · ctx: --')
})
