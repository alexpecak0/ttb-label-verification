export type Sleep = (milliseconds: number) => Promise<void>;

const sleep: Sleep = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

function isRateLimitError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    error.status === 429
  );
}

export async function retryOnRateLimit<T>(
  operation: () => Promise<T>,
  wait: Sleep = sleep,
): Promise<T> {
  const delays = [250, 500];

  for (let attempt = 0; attempt <= delays.length; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      if (!isRateLimitError(error) || attempt === delays.length) {
        throw error;
      }
      await wait(delays[attempt]);
    }
  }

  throw new Error("The label extraction service did not complete.");
}
