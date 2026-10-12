"use client";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html>
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#0a0f1c", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div style={{ maxWidth: 420, textAlign: "center", padding: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Something went wrong</h1>
          <p style={{ fontSize: 14, color: "#94a3b8", marginBottom: 24 }}>
            The application hit an unexpected error. Please try again.
          </p>
          {error.digest && <p style={{ fontSize: 10, color: "#64748b", fontFamily: "monospace", marginBottom: 16 }}>Ref: {error.digest}</p>}
          <button
            onClick={reset}
            style={{ background: "#00b7ff", color: "#fff", border: 0, borderRadius: 8, padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
