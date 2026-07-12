import { useLoaderData } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { ZonView } from "~/components/registry";
import { listFiles } from "~/lib/yjs.server";

export async function loader({ params }: LoaderFunctionArgs) {
  const zon = params.zon;
  if (!zon) throw new Response("Missing zon", { status: 400 });
  return { zon, files: await listFiles(zon) };
}

export default function ZonRoute() {
  const data = useLoaderData<typeof loader>();
  return <ZonView {...data} />;
}
