import { Bone, CardBones, LoadingLabel } from "@/components/Skeleton";

/** Shown instantly when opening the Dashboard; the header stays in place. */
export default function DashboardLoading() {
  return (
    <main className="mx-auto max-w-5xl space-y-5 px-4 py-6" aria-busy="true">
      <LoadingLabel />
      <div className="h-56 animate-pulse rounded-3xl bg-stone-800/90 motion-reduce:animate-none sm:h-60" />
      <div className="flex items-center justify-between pt-1">
        <Bone className="h-6 w-28" />
        <Bone className="h-9 w-56 rounded-xl" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <CardBones key={i} className="space-y-3">
            <Bone className="h-4 w-20" />
            <Bone className="h-8 w-16" />
            <Bone className="h-3 w-24" />
          </CardBones>
        ))}
      </div>
      <CardBones className="space-y-4">
        <Bone className="h-5 w-32" />
        <Bone className="h-44 w-full" />
      </CardBones>
      <CardBones className="space-y-3">
        <Bone className="h-5 w-40" />
        {[0, 1, 2, 3, 4].map((i) => (
          <Bone key={i} className="h-3 w-full" />
        ))}
      </CardBones>
    </main>
  );
}
