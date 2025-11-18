
import { Login } from "@ory/elements-react/theme";
import { getLoginFlow, OryPageParams } from "@ory/nextjs/app";

import config from "@/ory.config";

// import { useOryFlow } from "@ory/elements-react";

// function CustomCardHeader() {
//   const { flowType } = useOryFlow();
//   return <div>My Custom {flowType} Card header</div>;
// }


export default async function LoginPage(props: OryPageParams) {
  const flow = await getLoginFlow(config, props.searchParams);

  if (!flow) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Login
        flow={flow}
        config={config}
        components={{
          Card: {
          },
        }}
      />
    </div>
  );
}
