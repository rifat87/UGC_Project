let runtimePromise

export async function loadSemaphoreRuntime() {
  if (!runtimePromise) {
    const moduleUrl = new URL('../../../.zk-deps/node_modules/@semaphore-protocol/core/src/index.js', import.meta.url)
    runtimePromise = import(moduleUrl.href).catch((error) => {
      runtimePromise = undefined
      const wrapped = new Error(
        'Semaphore V4 runtime is not installed. Run `npm run setup:zk` from the VoteChain project root before starting the ZK application.',
      )
      wrapped.cause = error
      throw wrapped
    })
  }

  return runtimePromise
}
