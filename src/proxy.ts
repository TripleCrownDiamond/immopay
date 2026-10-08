import type {NextRequest} from "next/server";
import {auth} from "./lib/auth/server";

export default function proxy(request: NextRequest) {
  const loginUrl = request.nextUrl.pathname.startsWith("/espace-locataire")
    ? "/espace-locataire/connexion"
    : "/login";
  return auth.middleware({loginUrl})(request);
}

export const config = {
  matcher: [
    "/dashboard/:path*", "/properties/:path*", "/tenants/:path*",
    "/dues/:path*", "/payments/:path*", "/receipts/:path*",
    "/reports/:path*", "/settings/:path*", "/messages/:path*",
    "/quick-add/:path*", "/units/:path*", "/leases/:path*",
    "/onboarding/:path*", "/espace-locataire", "/espace-locataire/((?!connexion).*)",
  ],
};
