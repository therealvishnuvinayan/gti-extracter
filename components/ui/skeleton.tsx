import { cn } from "@/lib/utils";

type SkeletonProps = React.ComponentProps<"div">;

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "skeleton-shimmer rounded-2xl bg-muted/80",
        className,
      )}
      {...props}
    />
  );
}
