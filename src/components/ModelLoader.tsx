import type { ReactNode } from "react";
import { Suspense, useEffect, useState } from "react";
import type { ThreeElements } from "@react-three/fiber";
import { GLBModelSlot } from "../utils/loadGLBModel";

interface ModelLoaderProps extends Omit<ThreeElements["group"], "ref"> {
  src: string;
  fallback: ReactNode;
}

export function ModelLoader({ src, fallback, ...groupProps }: ModelLoaderProps) {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch(src, { method: "HEAD", signal: controller.signal })
      .then((response) => {
        const contentType = response.headers.get("content-type") ?? "";
        setAvailable(response.ok && !contentType.includes("text/html"));
      })
      .catch(() => setAvailable(false));
    return () => controller.abort();
  }, [src]);

  const fallbackGroup = <group {...groupProps}>{fallback}</group>;

  if (!available) {
    return fallbackGroup;
  }

  return (
    <Suspense fallback={fallbackGroup}>
      <GLBModelSlot src={src} {...groupProps} />
    </Suspense>
  );
}
