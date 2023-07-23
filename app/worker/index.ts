import { ulid } from "ulid";
import { interpret } from "xstate";
import { acquireLock, maybeReleaseLock, renewLock } from "~/services/lock";
import { createLockMachine } from "./machine";

// The worker ID is paramount for coordinating which
// server/container is holding the lock.
const workerId = ulid();

const lockKey = "lock.resource-worker";

const lockExpiryInSeconds = 10;

/**
 * Simulate some background job
 */
async function consumeResource() {
  console.log("Doing some heavy work...", { workerId });
  await new Promise((res) => setTimeout(res, 2000));
  return 1;
}

async function stopConsumingResource() {
  console.log("Stopping work...");
  await new Promise((res) => setTimeout(res, 1000));
  return 1;
}

async function acquireWorkerLock() {
  const didAcquireLock = await acquireLock(
    lockKey,
    workerId,
    lockExpiryInSeconds
  );
  if (didAcquireLock) {
    return true;
  }
  throw new Error("Lock not available");
}

async function renewWorkerLock() {
  const didRenewLock = await renewLock(lockKey, workerId, lockExpiryInSeconds);
  if (didRenewLock) {
    return true;
  }
  throw new Error("Lock not available for renewal");
}

function releaseWorkerLock() {
  return maybeReleaseLock(lockKey, workerId);
}

const service = interpret(
  createLockMachine({
    workerId,
    acquireLock: acquireWorkerLock,
    releaseLock: releaseWorkerLock,
    renewLock: renewWorkerLock,
    startWork: consumeResource,
    stopWork: stopConsumingResource,
  })
);

export function startLockWorker() {
  service.start();
  service.send("TRY_ACQUIRE_LOCK");
}

/**
 * Stop the lock worker in a coordinated fashion.
 * Once the worker stops, if it holds the lock, it should have been
 * cleaned-up, giving the chance to another worker to pick it up.
 *
 * @param onStop Callback to notify when the worker fully stops
 */
export function stopLockWorker(onStop: () => void) {
  // When our state  machine gets back to the 'idle' state,
  // it means that it completely stopped and had a reset,
  // getting ready to start again.
  // but at this point, our server wants to shutdown,
  // so it should be safe to continue.
  service.onTransition((state) => {
    if (state.value === "idle") {
      onStop();
    }
  });

  // The stop event will trigger the state machine
  // transition to safely stop the resources consuption and lock release,
  // resetting our state machine to the initial state.
  service.send("STOP");
}
