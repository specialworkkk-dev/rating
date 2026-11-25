import { Bone, CardBones, LoadingLabel } from "@/components/Skeleton";

/** Shown instantly when opening Feedback. */
export default function FeedbackLoading() {
  return (
    <main className="mx-auto max-w-5xl space-y-5 px-4 py-6" aria-busy="true">
      <LoadingLabel />
      <div className="space-y-2">
        <Bone className="h-7 w-48" />
        <Bone className="h-4 w-72 max-w-full" />
      </div>
      <CardBones className="space-y-4">
        <div className="flex items-center gap-3">
          <Bone className="h-5 w-16" />
          <Bone className="h-5 w-14 rounded-full" />
        </div>
        <Bone className="h-10 w-full rounded-xl" />
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex gap-3 border-t border-stone-100 pt-4">
            <Bone className="size-10 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Bone className="h-4 w-40" />
              <Bone className="h-3 w-full" />
              <Bone className="h-3 w-2/3" />
            </div>
          </div>
        ))}
      </CardBones>
    </main>
  );
}
