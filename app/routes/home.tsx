import { useLoaderData } from "react-router";
import { ZonsView } from "~/components/registry";
import { listZons } from "~/lib/yjs.server";

export async function loader() {
  return { zons: await listZons() };
}

export default function HomeRoute() {
  const { zons } = useLoaderData<typeof loader>();
  return <ZonsView zons={zons} />;
}
