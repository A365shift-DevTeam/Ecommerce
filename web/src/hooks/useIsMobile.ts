import { useEffect, useState } from "react";

/** Width at or below which JS-driven layouts (the canvas hero) use their mobile form. */
export const MOBILE_MAX = 1024;
const query = `(max-width: ${MOBILE_MAX}px)`;

export function useIsMobile() {
  const [mobile, setMobile] = useState(() => typeof window !== "undefined" && window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMobile(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return mobile;
}
