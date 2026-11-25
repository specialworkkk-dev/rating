import { Bone, CardBones, LoadingLabel } from "@/components/Skeleton";

export default function ServicesLoading() {
  return (
    <div className="space-y-5" aria-busy="true">
      <LoadingLabel />
      <Bone className="h-7 w-32" />
      {[0, 1].map((i) => (
        <CardBones key={i} className="space-y-4">
          <div className="flex items-center gap-3">
            <Bone className="size-10 rounded-xl" />
            <Bone className="h-5 w-40" />
          </div>
          <Bone className="h-7 w-64 max-w-full" />
          <Bone className="h-3 w-full rounded-full" />
          <div className="grid gap-3 sm:grid-cols-3">
            {[0, 1, 2].map((j) => (
              <Bone key={j} className="h-16" />
            ))}
          </div>
        </CardBones>
      ))}
    </div>
  );
}
