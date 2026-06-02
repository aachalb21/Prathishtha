import React from "react";
import Link from "next/link";

const ComicNotFound = () => {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "#f7f7f7",
      fontFamily: "'Comic Sans MS', 'Comic Sans', cursive"
    }}>
      <div style={{
        background: "#fff",
        border: "8px solid #222",
        borderRadius: "24px",
        boxShadow: "8px 8px 0 #222",
        padding: "48px 32px",
        maxWidth: "420px",
        textAlign: "center",
        position: "relative"
      }}>
        <h1 style={{
          fontSize: "4rem",
          color: "#ff4081",
          margin: 0,
          textShadow: "2px 2px 0 #222, 4px 4px 0 #ffeb3b"
        }}>
          404!
        </h1>
        <p style={{
          fontSize: "1.5rem",
          color: "#222",
          margin: "24px 0 0 0",
          fontWeight: "bold",
          textShadow: "1px 1px 0 #ffeb3b"
        }}>
          Oops! This page is lost in the multiverse.
        </p>
        <div style={{
          marginTop: "32px",
          fontSize: "1.1rem",
          color: "#555",
          fontStyle: "italic"
        }}>
          <span style={{
            display: "inline-block",
            background: "#ffeb3b",
            border: "2px solid #222",
            borderRadius: "12px",
            padding: "8px 16px",
            boxShadow: "2px 2px 0 #222"
          }}>
            &ldquo;Looks like you took a wrong turn, hero!&rdquo;
          </span>
        </div>
        <Link href="/" style={{
          display: "inline-block",
          marginTop: "36px",
          padding: "12px 32px",
          background: "#ff4081",
          color: "#fff",
          border: "3px solid #222",
          borderRadius: "16px",
          fontWeight: "bold",
          fontSize: "1.2rem",
          textDecoration: "none",
          boxShadow: "4px 4px 0 #222",
          transition: "background 0.2s, color 0.2s"
        }}>
          Go Home
        </Link>
        <div style={{
          position: "absolute",
          top: "-32px",
          right: "-32px",
          fontSize: "2.5rem",
          color: "#ffeb3b",
          textShadow: "2px 2px 0 #222"
        }}>
          💥
        </div>
        <div style={{
          position: "absolute",
          bottom: "-32px",
          left: "-32px",
          fontSize: "2.5rem",
          color: "#ff4081",
          textShadow: "2px 2px 0 #222"
        }}>
          🦸‍♂️
        </div>
      </div>
    </div>
  );
};

export default ComicNotFound;
