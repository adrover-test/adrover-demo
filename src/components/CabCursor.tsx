import { useEffect, useRef } from "react";

export function CabCursor() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cab = ref.current;
    if (!cab) return;
    const preference = window.matchMedia(
      "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
    );
    let frame = 0;
    let visible = false;
    let x = 0;
    let y = 0;
    let targetX = 0;
    let targetY = 0;

    function hide() {
      visible = false;
      cab!.hidden = true;
      cancelAnimationFrame(frame);
      frame = 0;
    }

    function animate() {
      x += (targetX - x) * 0.18;
      y += (targetY - y) * 0.18;
      cab!.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      if (Math.abs(targetX - x) + Math.abs(targetY - y) > 0.5) {
        frame = requestAnimationFrame(animate);
      } else {
        frame = 0;
      }
    }

    function move(event: PointerEvent) {
      if (
        !preference.matches ||
        event.pointerType !== "mouse" ||
        (event.target instanceof Element &&
          event.target.closest(
            "input, textarea, select, video, [contenteditable]",
          ))
      ) {
        hide();
        return;
      }
      targetX = Math.max(
        0,
        Math.min(event.clientX + 16, window.innerWidth - 40),
      );
      targetY = Math.max(
        0,
        Math.min(event.clientY + 16, window.innerHeight - 40),
      );
      if (!visible) {
        x = targetX;
        y = targetY;
        visible = true;
        cab!.hidden = false;
      }
      if (!frame) frame = requestAnimationFrame(animate);
    }

    document.addEventListener("pointermove", move);
    document.documentElement.addEventListener("pointerleave", hide);
    document.addEventListener("pointerdown", hide);
    document.addEventListener("keydown", hide);
    window.addEventListener("blur", hide);
    window.addEventListener("scroll", hide, true);
    preference.addEventListener("change", hide);
    return () => {
      hide();
      document.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", hide);
      document.removeEventListener("pointerdown", hide);
      document.removeEventListener("keydown", hide);
      window.removeEventListener("blur", hide);
      window.removeEventListener("scroll", hide, true);
      preference.removeEventListener("change", hide);
    };
  }, []);

  return (
    <div ref={ref} className="cab-cursor" aria-hidden="true" hidden>
      <svg viewBox="0 0 48 40">
        <path
          d="M11 20 16 9h18l6 11 5 4v10H3V24z"
          fill="#ffd21c"
          stroke="#101814"
          strokeWidth="2"
        />
        <path d="m17 19 3-7h11l4 7z" fill="#eaf3e8" />
        <rect x="21" y="3" width="10" height="6" rx="2" fill="#101814" />
        <circle cx="12" cy="33" r="5" fill="#101814" />
        <circle cx="36" cy="33" r="5" fill="#101814" />
        <path d="M6 25h6m26 0h5" stroke="#fff8d3" strokeWidth="3" />
      </svg>
    </div>
  );
}
