import { mesAnio, nombreTipo } from "@/lib/refugios";

export default function ShelterBadges({ kind, verifiedAt }: { kind?: string | null; verifiedAt?: string | null }) {
  return (
    <>
      <span className="tag">{nombreTipo(kind)}</span>
      {verifiedAt && (
        <span className="tag ok" title="El equipo de Huellitas HMO comprobó la identidad y el trabajo de rescate de esta persona u organización.">
          Verificado · {mesAnio(verifiedAt)}
        </span>
      )}
    </>
  );
}
