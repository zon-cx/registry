import { renderToStaticMarkup } from "react-dom/server";
import { redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { FileView, ZonView, ZonsView } from "~/components/registry";
import { getFile, getYjsUrl, listFiles, listZons } from "~/lib/yjs.server";

function isHx(request: Request) {
  return request.headers.get("HX-Request") === "true";
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const zon = params.zon;
  const file = params["*"];
  const canonical = zon
    ? `/${encodeURIComponent(zon)}${file ? `/${file.split("/").map(encodeURIComponent).join("/")}` : ""}`
    : "/";

  if (!isHx(request)) return redirect(canonical);

  let markup: string;
  if (!zon) {
    markup = renderToStaticMarkup(<ZonsView zons={await listZons()} />);
  } else if (!file) {
    markup = renderToStaticMarkup(<ZonView zon={zon} files={await listFiles(zon)} />);
  } else {
    const record = await getFile(zon, file);
    markup = renderToStaticMarkup(
      <FileView zon={zon} file={file} content={record.content} yjsUrl={getYjsUrl()} />,
    );
  }

  return new Response(markup, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Vary": "HX-Request",
      "Cache-Control": "no-store",
    },
  });
}
