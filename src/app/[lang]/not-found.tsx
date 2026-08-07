export default function NotFound() {
  return (
    <main
      style={{
        minHeight: "60vh",
        display: "grid",
        placeItems: "center",
        padding: "24px",
        textAlign: "center"
      }}
    >
      <div>
        <p style={{ margin: 0, fontSize: "14px", opacity: 0.72 }}>
          404 — This page could not be found.
        </p>
      </div>
    </main>
  );
}
