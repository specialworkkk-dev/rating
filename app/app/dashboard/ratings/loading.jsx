import { Bone, CardBones, LoadingLabel } from "@/components/Skeleton";

/** Shown instantly when opening Daily ratings. */
export default function DailyRatingsLoading() {
  return (
    <main className="mx-auto max-w-5xl space-y-5 px-4 py-6" aria-busy="true">
      <LoadingLabel />
      <div className="flex items-end justify-between gap-3">
        <div className="space-y-2">
          <Bone className="h-7 w-40" />
          <Bone className="h-4 w-72 max-w-full" />
        </div>
        <Bone className="h-9 w-52 rounded-xl" />
      </div>
      <CardBones className="space-y-4">
        <Bone className="h-5 w-32" />
        <Bone className="h-48 w-full" />
      </CardBones>
      <CardBones className="space-y-3">
        <Bone className="h-5 w-36" />
        <Bone className="h-9 w-full rounded-xl" />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Bone key={i} className="h-4 w-full" />
        ))}
      </CardBones>
    </main>
  );
}
