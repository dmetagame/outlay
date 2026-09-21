import { HeadContent, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";
import { Providers } from "../providers";
import stylesHref from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Outlay — paid settlement for scheduled USDG" },
      {
        name: "description",
        content: "Fund a canonical USDG payout room. When it is due, anyone can settle and earn the bounty.",
      },
    ],
    links: [
      { rel: "stylesheet", href: stylesHref },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
    ],
  }),
  component: RootDocument,
});

function RootDocument() {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <Providers>
          <Outlet />
        </Providers>
        <Scripts />
      </body>
    </html>
  );
}
