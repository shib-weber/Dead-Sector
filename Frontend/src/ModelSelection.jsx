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
        scale={1.8}
        position={[0, -1.2, 0]}
        isAiming={true} // 👈 Gun-out animation
      />
    </Suspense>
  );
}

export default function ModelSelection({ onSelect }) {
  const [selected, setSelected] = useState(null);

  return (
    <div style={container}>
      <h1 style={title}>SELECT OPERATIVE</h1>

      <div style={grid}>
        {/* MALE */}
        <div
          style={{
            ...card,
            border: selected === "male" ? "2px solid red" : "1px solid #817e7e",
          }}
          onClick={() => setSelected("male")}
        >
          <Canvas camera={{ position: [0, 2, 5], fov: 40 }}>
            <ambientLight intensity={1} />
            <Environment preset="dawn" />
            <Preview type="male" />
            <OrbitControls enableZoom={false} target={[0, 0.4, 0]} />
          </Canvas>
          <p style={label}>MALE</p>
        </div>

        {/* FEMALE */}
        <div
          style={{
            ...card,
            border: selected === "female" ? "2px solid red" : "1px solid #333",
          }}
          onClick={() => setSelected("female")}
        >
          <Canvas camera={{ position: [0, 2, 5], fov: 40 }}>
            <ambientLight intensity={1} />
            <Environment preset="dawn" />
            <Preview type="female" />
            <OrbitControls enableZoom={false} target={[0, 0.2, 0]}  />
          </Canvas>
          <p style={label}>FEMALE</p>
        </div>
      </div>

      <button
        style={btn}
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
  justifyContent: "center",
  color: "white",
  fontFamily: "monospace",
};

const title = {
  fontSize: "2.5rem",
  marginBottom: "30px",
  letterSpacing: "4px",
  color: "red",
};

const grid = {
  display: "flex",
  gap: "40px",
};

const card = {
  width: "250px",
  height: "320px",
  background: "#888383",
  cursor: "pointer",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
};

const label = {
  textAlign: "center",
  padding: "10px",
  borderTop: "1px solid #222",
};

const btn = {
  marginTop: "30px",
  padding: "12px 30px",
  background: "red",
  border: "none",
  color: "white",
  fontWeight: "bold",
  cursor: "pointer",
};