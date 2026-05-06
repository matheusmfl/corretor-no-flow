import assert from 'node:assert/strict'

const moduleUrl = new URL('./quote-flow-guards.ts', import.meta.url)

async function loadFresh() {
  return import(`${moduleUrl.href}?t=${Date.now()}-${Math.random()}`)
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

await test('does not redirect while loading', async () => {
  const { shouldProcessingAutoRedirect } = await loadFresh()
  assert.equal(
    shouldProcessingAutoRedirect({
      isLoading: true,
      isFetching: false,
      allDone: true,
      hasFailures: false,
    }),
    false,
  )
})

await test('does not redirect while fetching (stale cache refetch)', async () => {
  const { shouldProcessingAutoRedirect } = await loadFresh()
  assert.equal(
    shouldProcessingAutoRedirect({
      isLoading: false,
      isFetching: true,
      allDone: true,
      hasFailures: false,
    }),
    false,
  )
})

await test('does not redirect when failures exist', async () => {
  const { shouldProcessingAutoRedirect } = await loadFresh()
  assert.equal(
    shouldProcessingAutoRedirect({
      isLoading: false,
      isFetching: false,
      allDone: true,
      hasFailures: true,
    }),
    false,
  )
})

await test('does not redirect when not all done', async () => {
  const { shouldProcessingAutoRedirect } = await loadFresh()
  assert.equal(
    shouldProcessingAutoRedirect({
      isLoading: false,
      isFetching: false,
      allDone: false,
      hasFailures: false,
    }),
    false,
  )
})

await test('redirects when settled, all done, no failures', async () => {
  const { shouldProcessingAutoRedirect } = await loadFresh()
  assert.equal(
    shouldProcessingAutoRedirect({
      isLoading: false,
      isFetching: false,
      allDone: true,
      hasFailures: false,
    }),
    true,
  )
})
