// // queues/a2uQueue.ts
// import { Queue, Worker, QueueScheduler, Job } from 'bullmq';
// import IORedis from 'ioredis';

// const connection = new IORedis(); // configure host/port/password as needed

// // Scheduler handles stalled jobs, retries, etc.
// new QueueScheduler('a2u-payments', { connection });

// // This is the queue you will add jobs to:
// export const a2uQueue = new Queue('a2u-payments', {
//   connection,
//   defaultJobOptions: {
//     removeOnComplete: true,
//     removeOnFail: false,
//     attempts: 3,             // retry up to 3 times
//     backoff: { type: 'exponential', delay: 5000 },
//   },
// });
