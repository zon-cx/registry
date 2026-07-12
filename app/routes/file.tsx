import { useLoaderData } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { FileView } from "~/components/registry";
import { getFile, getYjsUrl } from "~/lib/yjs.server";

export async function loader({ params }: LoaderFunctionArgs) {
  const zon = params.zon;
  const file = params["*"];
  if (!zon || !file) throw new Response("Missing file", { status: 400 });
  const record = await getFile(zon, file);
  return { zon, file, content: record.content, yjsUrl: getYjsUrl() };
}

export default function FileRoute() {
  const data = useLoaderData<typeof loader>();
  return <FileView {...data} />;
}
