import { createMachine } from "xstate";

/** Event types allowed by the machine */
type Event =
  | {
      type: "STOP";
    }
  | { type: "TRY_ACQUIRE_LOCK" };

/**
 * Externally provided service functions
 * which allows us to hook our processing pipeline
 * at certain stages of our state machine.
 */
type Services = {
  acquireLock: {
    data: void;
  };
  releaseLock: {
    data: void;
  };
  renewLock: {
    data: void;
  };
  startWork: {
    data: void;
  };
  stopWork: {
    data: void;
  };
};

type ServiceFn = () => Promise<any>;

type CreateMachineArgs = {
  workerId: string;
  acquireLock: ServiceFn;
  renewLock: ServiceFn;
  releaseLock: ServiceFn;
  startWork: ServiceFn;
  stopWork: ServiceFn;
};

/**
 * Creates a state machine responsible for handling
 * the distributed lock around a restricted resource.
 * We can only have at most one worker across our cluster
 * processing/consuming a given resource.
 *
 */
export function createLockMachine({
  workerId,
  acquireLock,
  renewLock,
  releaseLock,
  startWork,
  stopWork,
}: CreateMachineArgs) {
  return createMachine(
    {
      predictableActionArguments: true,
      id: "lock-worker",
      context: {
        workerId,
      },
      schema: {
        services: {} as Services,
        events: {} as Event,
      },
      initial: "idle",
      on: {
        STOP: "cleanup",
      },
      states: {
        idle: {
          on: {
            TRY_ACQUIRE_LOCK: "acquiring_lock",
          },
        },

        cleanup: {
          invoke: {
            src: "stopWork",
            onDone: {
              target: "releasing_lock",
            },
            onError: {
              target: "releasing_lock",
            },
          },
        },

        acquiring_lock: {
          invoke: {
            src: "acquireLock",
            onDone: {
              target: "working",
            },
            onError: {
              target: "waiting_to_acquire_lock",
            },
          },
        },

        working: {
          invoke: {
            src: "startWork",
          },
          after: {
            "5000": {
              target: "renew_lock",
            },
          },
        },

        renew_lock: {
          invoke: {
            src: "renewLock",
            onDone: {
              target: "working",
            },
            onError: {
              target: "pause_work",
            },
          },
        },

        pause_work: {
          invoke: {
            src: "stopWork",
            onDone: {
              target: "waiting_to_acquire_lock",
            },
            onError: {
              target: "waiting_to_acquire_lock",
            },
          },
        },

        releasing_lock: {
          invoke: {
            src: "releaseLock",
            onDone: {
              target: "idle",
            },
            onError: {
              target: "idle",
            },
          },
        },

        waiting_to_acquire_lock: {
          after: {
            "5000": {
              target: "acquiring_lock",
            },
          },
        },
      },
    },
    {
      services: {
        acquireLock: (context, _event) => {
          console.log("Trying to acquire lock", { workerId: context.workerId });
          return acquireLock();
        },
        renewLock: (context, _event) => {
          console.log("Renewing lock", { workerId: context.workerId });
          return renewLock();
        },
        releaseLock: (context, _event) => {
          console.log("Releasing lock", { workerId: context.workerId });
          return releaseLock();
        },
        startWork: (context, _event) => {
          console.log("Lock acquired. Starting work", {
            workerId: context.workerId,
          });
          return startWork();
        },
        stopWork: (context, _event) => {
          console.log("Stop work", { workerId: context.workerId });
          return stopWork();
        },
      },
    }
  );
}
