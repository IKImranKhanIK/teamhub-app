interface Props {
  size?: "default" | "small";
}

export default function LoadingSpinner({ size = "default" }: Props) {
  const cls = size === "small"
    ? "w-5 h-5 border-2"
    : "w-10 h-10 border-[3px]";

  return (
    <div
      className={`${cls} rounded-full animate-spin`}
      // Inline style: Tailwind cannot generate border-top/right-color for arbitrary hex values at build time.
      style={{ borderColor: "transparent", borderTopColor: "#f5c518", borderRightColor: "#f5c518" }}
      role="status"
      aria-label="Loading"
    />
  );
}
