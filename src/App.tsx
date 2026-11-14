import { useEffect, useRef } from "react";
import { mountApp } from "./app/main.js";

/**
 * Thin shell: the whole AgriVision AI app is written in vanilla JavaScript
 * (see src/app). React only provides the mount point.
 */
export default function App() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    return mountApp(ref.current);
  }, []);

  return <div ref={ref} id="agrivision-app" />;
}
