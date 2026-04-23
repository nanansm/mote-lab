import { getQueue, setQueue } from "./storage";

export interface QueueItem {
  id: string;
  endpoint: string;
  payload: unknown;
  addedAt: number;
  attempts: number;
}

export async function enqueue(endpoint: string, payload: unknown): Promise<void> {
  const queue = (await getQueue()) as QueueItem[];
  queue.push({
    id: crypto.randomUUID(),
    endpoint,
    payload,
    addedAt: Date.now(),
    attempts: 0,
  });
  // Cap offline queue at 50 items — drop oldest
  const trimmed = queue.length > 50 ? queue.slice(queue.length - 50) : queue;
  await setQueue(trimmed);
}

export async function dequeue(): Promise<QueueItem | null> {
  const queue = (await getQueue()) as QueueItem[];
  if (queue.length === 0) return null;
  const [item, ...rest] = queue;
  await setQueue(rest);
  return item;
}

export async function requeueWithBackoff(item: QueueItem): Promise<void> {
  if (item.attempts >= 3) return; // discard after 3 attempts
  const queue = (await getQueue()) as QueueItem[];
  queue.push({ ...item, attempts: item.attempts + 1 });
  await setQueue(queue);
}

export async function queueLength(): Promise<number> {
  const queue = await getQueue();
  return queue.length;
}
