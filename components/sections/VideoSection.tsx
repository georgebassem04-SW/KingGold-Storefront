/**
 * HOMEPAGE BLOCK: VIDEO — an uploaded MP4 or a YouTube/Vimeo embed.
 *
 * Where to edit:
 *   - Video link, title, on/off -> dashboard → Homepage → Video  (sample: mock-data/home.json, block "video")
 *       provider "file"    = direct .mp4 link
 *       provider "youtube" = https://www.youtube.com/embed/<VIDEO_ID>
 */
import type { VideoSection as VideoSectionType } from "@/types";
import { t } from "@/lib/format";
import { SectionTitle } from "@/components/common/SectionTitle";
import type { SectionProps } from "./types";

/** Normal YouTube / Vimeo links -> their embed address (the dashboard already does this; kept here for pasted JSON) */
function embedUrl(provider: string, url: string) {
  if (provider === "youtube") {
    const id = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|live\/)|youtu\.be\/)([\w-]{6,})/)?.[1];
    return id ? `https://www.youtube.com/embed/${id}` : url;
  }
  if (provider === "vimeo") {
    const id = url.match(/^https?:\/\/(?:www\.)?vimeo\.com\/(\d+)/)?.[1];
    return id ? `https://player.vimeo.com/video/${id}` : url;
  }
  return url;
}

export function VideoSection({ section, locale }: SectionProps<VideoSectionType>) {
  const { video, title } = section.data;
  if (!video?.url) return null;
  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      {title && <SectionTitle title={t(title, locale)} />}
      <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
        {video.provider === "file" ? (
          <video src={video.url} poster={video.posterUrl} controls playsInline className="h-full w-full" />
        ) : (
          <iframe src={embedUrl(video.provider, video.url)} className="h-full w-full" allowFullScreen loading="lazy" title={t(title, locale)} />
        )}
      </div>
    </section>
  );
}
