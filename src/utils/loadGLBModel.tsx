import { Clone, useGLTF } from "@react-three/drei";
import type { ThreeElements } from "@react-three/fiber";

type ModelGroupProps = Omit<ThreeElements["group"], "ref">;

interface GLBModelSlotProps extends ModelGroupProps {
  src?: string;
  visibleWhenMissing?: boolean;
}

export function GLBModelSlot({ src, visibleWhenMissing = false, ...props }: GLBModelSlotProps) {
  if (!src) {
    return visibleWhenMissing ? <group {...props} /> : null;
  }

  return <LoadedGLB src={src} {...props} />;
}

function LoadedGLB({ src, ...props }: { src: string } & ModelGroupProps) {
  const gltf = useGLTF(src);
  return <Clone object={gltf.scene} {...props} />;
}

export function preloadGLBModel(src: string) {
  useGLTF.preload(src);
}
