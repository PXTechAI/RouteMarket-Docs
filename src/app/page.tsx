import type { Route } from "next";
import Link from "next/link";

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "32px",
        background: "#020617",
        color: "#e2e8f0"
      }}
    >
      <div style={{ maxWidth: "640px", textAlign: "center" }}>
        <p style={{ margin: "0 0 12px", fontSize: "12px", letterSpacing: "0.18em", opacity: 0.72 }}>
          ROUTELAB DOCS
        </p>
        <h1 style={{ margin: "0 0 16px", fontSize: "40px", lineHeight: 1.1 }}>Documentation Portal</h1>
        <p style={{ margin: "0 0 24px", fontSize: "16px", lineHeight: 1.6, opacity: 0.86 }}>
          Open the published API and product documentation.
        </p>
        <Link
          href={"/docs" as Route}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            minWidth: "180px",
            height: "44px",
            borderRadius: "999px",
            background: "#f8fafc",
            color: "#0f172a",
            fontWeight: 600,
            textDecoration: "none"
          }}
        >
          Open Docs
        </Link>
      </div>
    </main>
  );
}
