interface WatchSectionProps {
  className?: string;
  title: string;
  value: any;
}

export function WatchSection({ className, title, value }: WatchSectionProps) {
  const render = () => {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      console.info(value);
      return "[Error]";
    }
  };

  return (
    <div className={className}>
      <p className="text-primary">{title}</p>
      <pre>{render()}</pre>
    </div>
  );
}
