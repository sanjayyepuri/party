
import { getLoginFlow, OryPageParams } from "@ory/nextjs/app";
import { Login } from "@ory/elements-react/theme";

import config from "@/ory.config";

export default async function LoginPage(props: OryPageParams) {
  const flow = await getLoginFlow(config, props.searchParams);

  if (!flow) {
    return null;
  }

  return (
    <div className="">
      <Login
        flow={flow}
        config={config}
      />
    </div>
  );
}
