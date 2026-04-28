import React, { Suspense, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";

// Import BOTH models
import { Model as Male } from "./Male";
import { Model as Female } from "./Female";

function Preview({ type }) {
  const Component = type === "male" ? Male : Female;

  return (
    <Suspense fallback={null}>
      <Component
        scale={1.6}
        position={[0, -1.2, 0]}
        isAiming={true}
      />
    </Suspense>
  );
}

export default function ModelSelection({ onSelect }) {
  const [selected, setSelected] = useState(null);

  const isMobile = window.innerWidth < 768;

  return (
    <div style={container}>
      
      {/* ---------- INFO ---------- */}
      <div style={infoBox}>
        <h2 style={infoTitle}>MISSION BRIEF</h2>

        <p style={text}>
          You are trapped inside a <span style={{ color: "red" }}>VOID SECTOR</span>.
          A corrupted dimension filled with hostile entities.
        </p>

        <p style={highlight}>ELIMINATE ALL MONSTERS TO ESCAPE</p>

        <h3 style={subTitle}>CONTROLS</h3>

        <div style={{
          ...controlsGrid,
          flexDirection: isMobile ? "column" : "row"
        }}>
          <div>
            <p><b>Move:</b> WASD / Joystick</p>
            <p><b>Run:</b> Shift</p>
            <p><b>Jump:</b> Space</p>
          </div>

          <div>
            <p><b>Shoot:</b> Click</p>
            <p><b>Summon:</b> M</p>
            <p><b>Objective:</b> Kill All</p>
          </div>
        </div>
      </div>

      {/* ---------- TITLE ---------- */}
      <h1 style={{
        ...title,
        fontSize: isMobile ? "1.5rem" : "2.5rem"
      }}>
        SELECT OPERATIVE
      </h1>

      {/* ---------- CHARACTER GRID ---------- */}
      <div style={{
        ...grid,
        gap: isMobile ? "10px" : "40px"
      }}>
        
        {/* MALE */}
        <div
          style={{
            ...card,
            width: isMobile ? "140px" : "250px",
            height: isMobile ? "190px" : "320px",
            border: selected === "male" ? "2px solid red" : "1px solid #444",
          }}
          onClick={() => setSelected("male")}
        >
          <Canvas
            camera={{ position: [0, 2, isMobile ? 4 : 5], fov: isMobile ? 50 : 40 }}
            style={{ height: isMobile ? "130px" : "250px" }}
          >
            <ambientLight intensity={1} />
            <Environment preset="dawn" />
            <Preview type="male" />
            <OrbitControls enableZoom={false} target={[0, 0.4, 0]} />
          </Canvas>

          <p style={{
            ...label,
            fontSize: isMobile ? "12px" : "14px"
          }}>
            MALE
          </p>
        </div>

        {/* FEMALE */}
        <div
          style={{
            ...card,
            width: isMobile ? "140px" : "250px",
            height: isMobile ? "190px" : "320px",
            border: selected === "female" ? "2px solid red" : "1px solid #444",
          }}
          onClick={() => setSelected("female")}
        >
          <Canvas
            camera={{ position: [0, 2, isMobile ? 4 : 5], fov: isMobile ? 50 : 40 }}
            style={{ height: isMobile ? "130px" : "250px" }}
          >
            <ambientLight intensity={1} />
            <Environment preset="dawn" />
            <Preview type="female" />
            <OrbitControls enableZoom={false} target={[0, 0.2, 0]} />
          </Canvas>

          <p style={{
            ...label,
            fontSize: isMobile ? "12px" : "14px"
          }}>
            FEMALE
          </p>
        </div>
      </div>

      {/* ---------- BUTTON ---------- */}
      <button
        style={{
          ...btn,
          width: isMobile ? "90%" : "auto"
        }}
        disabled={!selected}
        onClick={() => onSelect(selected)}
      >
        CONFIRM SELECTION
      </button>
    </div>
  );
}

// ---------------- STYLES ----------------

const container = {
  width: "100vw",
  height: "100vh",
  background: "#000",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "flex-start",
  color: "white",
  fontFamily: "monospace",
  overflowY: "auto",
  padding: "10px",
};

const infoBox = {
  width: "100%",
  maxWidth: "700px",
  background: "#111",
  border: "1px solid red",
  padding: "12px",
  marginBottom: "10px",
  textAlign: "center",
};

const infoTitle = {
  color: "red",
  marginBottom: "5px",
  fontSize: "14px",
  letterSpacing: "2px",
};

const subTitle = {
  marginTop: "10px",
  color: "#ff4444",
  fontSize: "13px",
};

const text = {
  fontSize: "12px",
  lineHeight: "1.4",
};

const highlight = {
  marginTop: "5px",
  color: "red",
  fontWeight: "bold",
  fontSize: "12px",
};

const controlsGrid = {
  display: "flex",
  justifyContent: "space-around",
  marginTop: "8px",
  fontSize: "11px",
};

const title = {
  marginBottom: "10px",
  letterSpacing: "3px",
  color: "red",
};

const grid = {
  display: "flex",
  justifyContent: "center",
};

const card = {
  background: "#222",
  cursor: "pointer",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
};

const label = {
  textAlign: "center",
  padding: "5px",
};

const btn = {
  marginTop: "15px",
  padding: "10px",
  background: "red",
  border: "none",
  color: "white",
  fontWeight: "bold",
  cursor: "pointer",
};