import { expect, test } from 'claude-code/testing'

const ROW = {
  id: 'a1', description: 'review', type: 'code-architect', status: 'running',
  kind: 'local_agent', taskStatus: 'running', label: 'Reviewing auth module',
  startTime: Date.now() - 63_000, cwd: '/tmp', tokenSamples: [], hasRow: true, rowIds: ['a1'],
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
    .toBe('Reviewing auth module \u2800ctx 62%')
})

test('shows a placeholder before the first reading', async ($, on) => {
  expect(await labelFor($, on, { tokenCount: 0, contextWindowSize: 200000 }))
    .toBe('Reviewing auth module \u2800ctx --')
})

const LONG = 'Reviewing the auth module and checking every token refresh path for races'
const CTX = { tokenCount: 76000, contextWindowSize: 200000 }

test('keeps a label that fits the row', async ($, on) => {
  expect(await labelFor($, on, { ...CTX, columns: 120 }))
    .toBe('Reviewing auth module \u2800ctx 62%')
})

test('shortens a long label so ctx stays visible', async ($, on) => {
  // 80 cols - 16 name+gap - 9 suffix - 4 gap - 22 "1m 3s · ↓ 76.0k tokens" = 29
  expect(await labelFor($, on, { ...CTX, columns: 80, label: LONG }))
    .toBe('Reviewing the auth module an… \u2800ctx 62%')
})

test('collapses line breaks in a progress summary', async ($, on) => {
  expect(await labelFor($, on, { ...CTX, columns: 120, label: 'Reading files\n  step 2' }))
    .toBe('Reading files step 2 \u2800ctx 62%')
})

test('leaves room for the token count before the first reading', async ($, on) => {
  // 80 cols - 16 name+gap - 8 suffix - 4 gap - 23 "1m 3s · ↓ 100.0k tokens" = 29
  expect(await labelFor($, on, { tokenCount: 0, contextWindowSize: 1000000, columns: 80, label: LONG }))
    .toBe('Reviewing the auth module an… ⠀ctx --')
})
