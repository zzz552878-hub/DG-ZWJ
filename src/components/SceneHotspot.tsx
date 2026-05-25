import { Html } from "@react-three/drei";
import type { ComponentId } from "../types";

interface SceneHotspotProps {
  id: ComponentId;
  label: string;
  position: [number, number, number];
  active: boolean;
  onSelect: (id: ComponentId) => void;
}

export function SceneHotspot({ id, label, position, active, onSelect }: SceneHotspotProps) {
  return (
    <Html position={position} center distanceFactor={8} occlude>
      <button
        className={active ? "hotspot active" : "hotspot"}
        onClick={(event) => {
          event.stopPropagation();
          onSelect(id);
        }}
        title={label}
        type="button"
      >
        <span />
        <strong>{label}</strong>
      </button>
    </Html>
  );
}
