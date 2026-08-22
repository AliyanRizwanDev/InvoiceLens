export function minDelay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Keeps loading UI visible long enough to avoid a flash on fast responses. */
export async function waitForMinimum(ms: number, startedAt: number) {
  const elapsed = Date.now() - startedAt;
  if (elapsed < ms) await minDelay(ms - elapsed);
}
