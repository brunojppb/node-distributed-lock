# Distributed Lock in NodeJS

This is a project demonstrating how you can implement distributed lock in NodeJS using:

- [Redis](https://github.com/redis/redis) as a distributed store
- [xstate](https://github.com/statelyai/xstate) to manage state machines on the server-side

This project implements the high-level implementation described on the Redis manual [here](https://redis.io/docs/manual/patterns/distributed-locks/).

## Development

Install all dependencies with:

```shell
npm install
```

Run the dev server:

```sh
npm run dev
```
