import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import vm from 'node:vm'

const root = new URL('../src/main/resources/static/', import.meta.url)
const code = readFileSync(new URL('password-reset.js', root), 'utf8')
const html = readFileSync(new URL('reset-password.html', root), 'utf8')

// A minimal DOM fixture keeps these behavior checks dependency-free.
function fixture({ token = 'A'.repeat(43), reply = { ok: true, status: 200, data: { success: true } } } = {}) {
  const ids = ['new-password-form', 'reset-fields', 'new-password', 'confirm-password', 'save-password', 'reset-result', 'reset-next', 'show-passwords']
  const elements = Object.fromEntries(ids.map(id => [id, {
    value: '', disabled: id === 'reset-fields', hidden: ['reset-result', 'reset-next'].includes(id),
    textContent: '', className: '', type: 'password', listeners: {},
    addEventListener(event, handler) { this.listeners[event] = handler },
    focus() { this.focused = true }
  }]))
  const stored = new Map([['token', 'old-jwt'], ['userName', 'Old name'], ['other-app-key', 'keep']])
  const requests = []
  let cleanedUrl
  const context = {
    URLSearchParams, TextEncoder, TypeError,
    document: { title: 'Reset', getElementById: id => elements[id] },
    window: {
      location: { hash: token ? '#token=' + token : '', pathname: '/reset-password.html' },
      history: { replaceState: (_, __, url) => { cleanedUrl = url } },
      localStorage: { removeItem: key => stored.delete(key) }
    },
    fetch: async (url, options) => {
      requests.push({ url, options })
      return { ok: reply.ok, status: reply.status, json: async () => reply.data }
    }
  }
  vm.runInNewContext(code, context)
  return {
    elements, requests, stored, cleanedUrl,
    submit: async (password = 'NewPassword1@', confirm = password) => {
      elements['new-password'].value = password
      elements['confirm-password'].value = confirm
      await elements['new-password-form'].listeners.submit({ preventDefault() {} })
    }
  }
}

test('markup has safe resources, no third-party scripts, and a POST-only fallback', () => {
  assert.match(html, /name="referrer" content="no-referrer"/)
  assert.match(html, /method="post" action="\/api\/auth\/reset-password"/)
  assert.match(html, /<fieldset id="reset-fields" disabled>/)
  assert.doesNotMatch(html, /(?:src|href)="https?:\/\//)
  assert.match(html, /id="confirm-password"/)
})

test('missing or malformed link never enables the form or sends a request', async () => {
  for (const token of ['', 'bad-token', '<script>']) {
    const f = fixture({ token })
    assert.equal(f.elements['new-password-form'].hidden, true)
    assert.equal(f.elements['reset-fields'].disabled, true)
    await f.submit()
    assert.equal(f.requests.length, 0)
  }
})

test('opening a valid link only removes its fragment; it does not consume the token', () => {
  const f = fixture()
  assert.equal(f.cleanedUrl, '/reset-password.html')
  assert.equal(f.elements['reset-fields'].disabled, false)
  assert.equal(f.requests.length, 0)
})

test('mismatched and weak passwords stay client-side', async () => {
  const f = fixture()
  await f.submit('NewPassword1@', 'DifferentPassword2@')
  assert.equal(f.requests.length, 0)
  assert.match(f.elements['reset-result'].textContent, /do not match/)
  await f.submit('weak')
  assert.equal(f.requests.length, 0)
  await f.submit('Aa1@' + 'é'.repeat(35))
  assert.equal(f.requests.length, 0)
})

test('successful reset uses same-origin JSON, not a token in a URL or an old JWT', async () => {
  const f = fixture()
  await f.submit()
  assert.equal(f.requests.length, 1)
  const { url, options } = f.requests[0]
  assert.equal(url, '/api/auth/reset-password')
  assert.equal(options.method, 'POST')
  assert.equal(options.credentials, 'omit')
  assert.equal(options.cache, 'no-store')
  assert.equal(options.headers.Authorization, undefined)
  assert.equal(JSON.parse(options.body).token, 'A'.repeat(43))
  assert.equal(JSON.parse(options.body).newPassword, 'NewPassword1@')
  assert.equal(f.elements['new-password'].value, '')
  assert.equal(f.elements['new-password-form'].hidden, true)
  assert.equal(f.elements['reset-next'].hidden, false)
  assert.equal(f.stored.has('token'), false)
  assert.equal(f.stored.get('other-app-key'), 'keep')
})

test('expired tokens and rate limits are errors, not fake success', async () => {
  for (const status of [400, 429, 503]) {
    const f = fixture({ reply: { ok: false, status, data: { error: 'Request a new link.' } } })
    await f.submit()
    assert.equal(f.elements['reset-next'].hidden, true)
    assert.equal(f.elements['reset-fields'].disabled, false)
    assert.equal(f.elements['reset-result'].className, 'notice error')
    assert.equal(f.stored.has('token'), true)
  }
})

test('the existing forgot-password form no longer treats 404 as successful email delivery', () => {
  const login = readFileSync(new URL('login.html', root), 'utf8')
  assert.doesNotMatch(login, /response\.status\s*===\s*404\s*\|\|\s*response\.ok/)
  assert.match(login, /response\.status\s*===\s*202/)
  assert.match(login, /\/api\/auth\/forgot-password/)
})


test('an unrelated HTTP 200 page cannot masquerade as a completed password reset', async () => {
  const f = fixture({ reply: { ok: true, status: 200, data: {} } })
  await f.submit()
  assert.equal(f.elements['reset-next'].hidden, true)
  assert.equal(f.elements['reset-result'].className, 'notice error')
  assert.equal(f.stored.has('token'), true)
})
