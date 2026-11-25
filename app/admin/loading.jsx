import { Bone, CardBones, LoadingLabel } from "@/components/Skeleton";

/** Shown instantly inside the admin layout (the header stays). */
export default function AdminLoading() {
  return (
    <div className="space-y-5" aria-busy="true">
      <LoadingLabel />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <CardBones key={i} className="space-y-3">
            <Bone className="h-4 w-24" />
            <Bone className="h-7 w-16" />
          </CardBones>
        ))}
      </div>
      <Bone className="h-10 w-full rounded-xl" />
      {[0, 1, 2, 3, 4].map((i) => (
        <CardBones key={i} className="flex items-center gap-4">
          <div className="flex-1 space-y-2">
            <Bone className="h-5 w-48" />
            <Bone className="h-3 w-64 max-w-full" />
          </div>
          <Bone className="hidden h-8 w-40 sm:block" />
        </CardBones>
      ))}
    </div>
  );
}
