import PwaRegister from "@/components/PwaRegister";
import { appMetadata, appViewport } from "@/lib/appMeta";

export const metadata = appMetadata;
export const viewport = appViewport;

export default function OwnerLayout({ children }) {
  return (
    <>
      <PwaRegister />
      {children}
    </>
  );
}
