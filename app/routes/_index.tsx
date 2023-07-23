import type { V2_MetaFunction } from "@remix-run/node";

export const meta: V2_MetaFunction = () => {
  return [
    { title: "Districuted Lock in Node.js" },
    {
      name: "description",
      content:
        "How to implement distributed locking in NodeJS using Redis and Xstate",
    },
  ];
};

function IconChip() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="w-6 h-6"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h9v9h-9v-9z"
      />
    </svg>
  );
}

export default function Index() {
  return (
    <div className="py-4 px-4">
      <div className="flex justify-center flex-col items-center">
        <div className="rounded-xl border bg-card text-card-foreground shadow w-96">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">
              Distributed lock in NodeJS
            </h3>
            <IconChip />
          </div>
          <div className="p-6 pt-0">
            <div className="text-m font-bold">
              Not much to see here. Have a look at your server logs...
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
