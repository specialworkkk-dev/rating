import { Bone, CardBones, LoadingLabel } from "@/components/Skeleton";

export default function AdminShopLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-4" aria-busy="true">
      <LoadingLabel />
      <Bone className="h-4 w-20" />
      <Bone className="h-7 w-56" />
      {[0, 1, 2].map((i) => (
        <CardBones key={i} className="space-y-3">
          <Bone className="h-5 w-40" />
          <Bone className="h-3 w-full" />
          <Bone className="h-3 w-3/4" />
          <Bone className="h-9 w-48 rounded-xl" />
        </CardBones>
      ))}
    </div>
  );
}
