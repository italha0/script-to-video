const { Queue } = require('bullmq');

const RENDER_QUEUE_NAME = 'video-render-jobs';

let queue = null;

function getRenderQueue() {
  if (!queue) {
    if (!process.env.REDIS_URL) {
      throw new Error('REDIS_URL env var required for queue');
    }
    queue = new Queue(RENDER_QUEUE_NAME, {
      connection: {
        url: process.env.REDIS_URL,
      },
      defaultJobOptions: {
        removeOnComplete: 1000,
        removeOnFail: 1000,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      },
    });
  }
  return queue;
}

module.exports = { getRenderQueue, RENDER_QUEUE_NAME };