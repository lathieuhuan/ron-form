import "./divider.css";

type DividerProps = {
  style?: React.CSSProperties;
  direction?: "horizontal" | "vertical";
};

export function Divider({ direction = "horizontal", style }: DividerProps) {
  return <div className={`divider-${direction}`} style={style} />;
}
