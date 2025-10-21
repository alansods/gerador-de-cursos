import { VideoPlayer } from "@/components/video-player";
import { Aula } from "@/types/modulo";

interface VideoSectionProps {
  aula: Aula;
}

export function VideoSection({ aula }: VideoSectionProps) {
  if (!aula.conteudo?.video) {
    return null;
  }

  return (
    <div className="p-6">
      <VideoPlayer src={aula.conteudo.video.url} />
    </div>
  );
}
