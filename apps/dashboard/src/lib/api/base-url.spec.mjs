import assert from 'node:assert/strict'

const moduleUrl = new URL('./base-url.ts', import.meta.url)

async function loadFresh() {
  return import(`${moduleUrl.href}?t=${Date.now()}-${Math.random()}`)
}

function setEnv(values) {
  const previous = {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    API_INTERNAL_URL: process.env.API_INTERNAL_URL,
  }

  for (const [key, value] of Object.entries(values)) {
    if (value == null) delete process.env[key]
    else process.env[key] = value
  }

  return () => {
    for (const [key, value] of Object.entries(previous)) {
      if (value == null) delete process.env[key]
      else process.env[key] = value
    }
  }
}

async function test(name, fn) {
  try {
    await fn()
    console.log(`ok - ${name}`)
  } catch (error) {
    console.error(`not ok - ${name}`)
    throw error
  }
}

await test('browser requests stay same-origin when public API URL is blank', async () => {
  const restore = setEnv({ NEXT_PUBLIC_API_URL: '', API_INTERNAL_URL: null })
  try {
    const { getBrowserApiBaseUrl } = await loadFresh()
    assert.equal(getBrowserApiBaseUrl(), '')
  } finally {
    restore()
  }
})

await test('browser API URL strips trailing slashes', async () => {
  const restore = setEnv({ NEXT_PUBLIC_API_URL: 'https://api.example.com///', API_INTERNAL_URL: null })
  try {
    const { getBrowserApiBaseUrl } = await loadFresh()
    assert.equal(getBrowserApiBaseUrl(), 'https://api.example.com')
  } finally {
    restore()
  }
})

await test('server prefers internal URL and strips trailing slashes', async () => {
  const restore = setEnv({
    NEXT_PUBLIC_API_URL: 'https://public.example.com',
    API_INTERNAL_URL: 'http://127.0.0.1:3001/',
  })
  try {
    const { getServerApiBaseUrl } = await loadFresh()
    assert.equal(getServerApiBaseUrl(), 'http://127.0.0.1:3001')
  } finally {
    restore()
  }
})
