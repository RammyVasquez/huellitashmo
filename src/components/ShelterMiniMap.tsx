"use client";
import dynamic from "next/dynamic";

const ShelterMap = dynamic(() => import("./ShelterMap"), {
  ssr: false,
  loading: () => <div className="map-box" aria-hidden="true" />,
});

export default function ShelterMiniMap({ id, name, lat, lng }: { id: string; name: string; lat: number; lng: number }) {
  return <ShelterMap shelters={[{ id, name, lat, lng }]} user={null} selectedId={id} onSelect={() => {}} />;
}
