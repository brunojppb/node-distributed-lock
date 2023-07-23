import { Redis } from "ioredis";

const redis = new Redis({
  host: process.env.REDIS_HOST!,
  port: parseInt(process.env.REDIS_PORT!),
});

/**
 *
 * @param lockKey which serves as a namespace for the lock in Redis
 * @param lockValue value to identify which node holds the lock
 * @param expireAfterInSeconds time to expire after acquiring the lock, which leads to releasing the lock automatically in case of crashes
 * @returns whether the lock has been acquired
 */
export async function acquireLock(
  lockKey: string,
  lockValue: string,
  expireAfterInSeconds: number
): Promise<boolean> {
  // NX: set if Not eXists. Returns 'OK' on successful cases, null otherwise
  // EX: set with expiration time. The key will be removed after the elapsed time (given in seconds)
  // See: https://redis.io/commands/set/#patterns
  const result = await redis.call(
    "set",
    lockKey,
    lockValue,
    "NX",
    "EX",
    expireAfterInSeconds
  );

  return result === "OK";
}

export async function renewLock(
  lockKey: string,
  lockValue: string,
  expireAfterInSeconds: number
): Promise<boolean> {
  const result = await redis.get(lockKey);

  // Lock is available, we can attempt to acquire it again.
  if (result === null) {
    return acquireLock(lockKey, lockValue, expireAfterInSeconds);
  } else if (result === lockValue) {
    // Lock is still held by this worker
    // we can safely renew it by extending its expiry time
    await redis.expire(lockKey, expireAfterInSeconds);
    return true;
  } else {
    throw new Error(
      "Lock held by another node. Can neither renew or acquire it"
    );
  }
}

export async function maybeReleaseLock(lockKey: string, lockValue: string) {
  const result = await redis.get(lockKey);
  if (result === lockValue) {
    await redis.del(lockKey);
  }
  // lock may exist, but it's held by another worker node.
  // This node should do nothing with it in this case.
}
