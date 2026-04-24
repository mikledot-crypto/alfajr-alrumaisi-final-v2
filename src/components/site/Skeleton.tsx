export function PostCardSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <div className="skeleton aspect-[16/10] w-full" />
      <div className="skeleton h-3 w-20" />
      <div className="skeleton h-5 w-3/4" />
      <div className="skeleton h-3 w-full" />
      <div className="skeleton h-3 w-2/3" />
    </div>
  );
}

export function FeaturedSkeleton() {
  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="skeleton aspect-[4/3] w-full" />
      <div className="flex flex-col justify-center gap-3">
        <div className="skeleton h-3 w-24" />
        <div className="skeleton h-9 w-full" />
        <div className="skeleton h-9 w-2/3" />
        <div className="skeleton mt-3 h-3 w-full" />
        <div className="skeleton h-3 w-full" />
      </div>
    </div>
  );
}

export function ArticleRowSkeleton() {
  return (
    <div className="grid gap-6 border-b border-border/60 pb-12 md:grid-cols-[1fr_2fr]">
      <div className="skeleton aspect-[4/3] w-full" />
      <div className="flex flex-col gap-3">
        <div className="skeleton h-3 w-20" />
        <div className="skeleton h-7 w-full" />
        <div className="skeleton h-7 w-2/3" />
        <div className="skeleton mt-2 h-3 w-full" />
        <div className="skeleton h-3 w-full" />
      </div>
    </div>
  );
}
