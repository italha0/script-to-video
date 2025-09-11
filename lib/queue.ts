// Using any types due to missing type declarations in ambient for bullmq
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Queue } = require('bullmq');

// Single queue instance used by API routes to enqueue render jobs.
// Worker side will create a Worker on the same queue name.
export const RENDER_QUEUE_NAME = 'video-render-jobs';

let queue: any = null;

export function getRenderQueue() {
  if (!queue) {
    if (!process.env.REDIS_URL) {
      throw new Error('REDIS_URL env var required for queue');
    }
    queue = new Queue(RENDER_QUEUE_NAME, {
      connection: { url: process.env.REDIS_URL },
      defaultJobOptions: {
        removeOnComplete: 1000,
        removeOnFail: 1000,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 }
      }
    });
  }
  return queue;
}
