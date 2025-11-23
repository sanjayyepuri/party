
import { getLoginFlow, OryPageParams } from "@ory/nextjs/app";
import CustomLogin from "@/components/CustomLogin";

import config from "@/ory.config";

export default async function LoginPage(props: OryPageParams) {
  const flow = await getLoginFlow(config, props.searchParams);

  if (!flow) {
    return null;
  }

  return (
    <div className="">
      <CustomLogin flow={flow} config={config} />
    </div>
  );
}
