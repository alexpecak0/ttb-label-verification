export const BATCH_CONCURRENCY = 5;

export type BatchProgress = "queued" | "running" | "done" | "failed";

export interface BatchItem<T> {
  id: string;
  file: File;
  progress: BatchProgress;
  result?: T;
  error?: string;
}

export function createBatchItems<T>(files: File[]): BatchItem<T>[] {
  return files.map((file, index) => ({
    id: `${file.name}-${index}`,
    file,
    progress: "queued",
  }));
}

export async function runBatch<T>(
  files: File[],
  verify: (file: File) => Promise<T>,
  onItemUpdate: (item: BatchItem<T>) => void,
  concurrency = BATCH_CONCURRENCY,
): Promise<BatchItem<T>[]> {
  const items = createBatchItems<T>(files);
  let nextIndex = 0;
  const workerCount = Math.min(Math.max(1, concurrency), items.length);

  async function worker() {
    while (nextIndex < items.length) {
      const itemIndex = nextIndex;
      nextIndex += 1;
      const runningItem = { ...items[itemIndex], progress: "running" as const };
      items[itemIndex] = runningItem;
      onItemUpdate(runningItem);

      try {
        const result = await verify(runningItem.file);
        const completedItem = { ...runningItem, progress: "done" as const, result };
        items[itemIndex] = completedItem;
        onItemUpdate(completedItem);
      } catch (caughtError) {
        const error =
          caughtError instanceof Error
            ? caughtError.message
            : "We could not verify this label. Please try again.";
        const failedItem = { ...runningItem, progress: "failed" as const, error };
        items[itemIndex] = failedItem;
        onItemUpdate(failedItem);
      }
    }
  }

  await Promise.all(Array.from({ length: workerCount }, worker));
  return items;
}
