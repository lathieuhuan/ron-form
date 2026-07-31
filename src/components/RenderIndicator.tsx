import clsx from "clsx";
import { ComponentProps, useEffect, useRef } from "react";

export function RenderIndicator(props: Omit<ComponentProps<"div">, "style">) {
  const elRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  if (elRef.current) {
    const counter = renderCounter(elRef.current);

    counter.value++;

    clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      counter.value = 0;
    }, 1000);
  }

  useEffect(() => {
    return () => {
      clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div
      {...props}
      ref={elRef}
      className={clsx(
        props.className,
        "relative " +
          "after:absolute after:top-0 after:left-full after:content-[attr(data-render-count)] " +
          "after:bg-black after:text-red-400 after:font-medium after:px-1 after:rounded-xs " +
          "after:ml-1 after:tabular-nums",
      )}
    />
  );
}

const renderCounter = (el: HTMLDivElement) => {
  const currentCount = (el: HTMLDivElement) => {
    const count = Number(el.dataset.renderCount || "0");

    if (isNaN(count)) {
      throw new Error(`Invalid render count ${count}`);
    }

    return count;
  };

  return {
    get value() {
      try {
        return currentCount(el);
      } catch (error) {
        console.error(error);
        return 0;
      }
    },
    set value(count: number) {
      let color: string;

      if (count === 0) {
        color = "transparent";
      } else if (count === 1) {
        // green
        color = `color-mix(in oklab, oklch(72.3% 0.219 149.579) 70%, transparent)`;
      } else {
        // red
        color = `color-mix(in oklab, oklch(63.7% 0.237 25.331) ${Math.min(count * 25, 100)}%, transparent)`;
      }

      el.dataset.renderCount = count ? `${count}` : "";
      el.style.setProperty("box-shadow", `0 0 0 3px ${color}`);
    },
  };
};
