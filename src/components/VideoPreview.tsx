import { useEffect, useRef, useState } from "react";

const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

export function VideoPreview({
  onContinue,
}: {
  onContinue?: (file: File, details: string) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [details, setDetails] = useState("");
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!file) {
      setUrl("");
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  function clearVideo() {
    videoRef.current?.pause();
    setFile(null);
    setUrl("");
    setDetails("");
    setPlaying(false);
    setError("");
  }

  return (
    <section
      className="wrap video-studio section"
      id="video-preview"
      aria-labelledby="video-preview-title"
    >
      <div className="video-studio-copy">
        <h2 id="video-preview-title">Preview your video</h2>
        <p className="muted">
          See your video on a cab screen, without cropping.
        </p>
        <div className="video-upload-box">
          <label htmlFor="campaign-video">Choose your video</label>
          <p id="video-guidance">
            MP4 or WebM · up to 100 MB · browser-supported codecs.
          </p>
          <input
            id="campaign-video"
            type="file"
            accept="video/mp4,video/webm,.mp4,.webm"
            aria-describedby="video-guidance video-privacy video-error"
            aria-invalid={Boolean(error)}
            onChange={(event) => {
              const selected = event.target.files?.[0];
              event.target.value = "";
              if (!selected) return;
              clearVideo();
              if (!["video/mp4", "video/webm"].includes(selected.type)) {
                setError(
                  "Choose an MP4 or WebM video. Other file types cannot be previewed.",
                );
                return;
              }
              if (selected.size === 0 || selected.size > MAX_VIDEO_BYTES) {
                setError("Choose a non-empty video of 100 MB or less.");
                return;
              }
              setFile(selected);
            }}
          />
          <p id="video-privacy" className="fine">
            Local preview only; not uploaded or attached to your enquiry.
            Leaving or refreshing clears it.
          </p>
          <p id="video-error" className="error" role="alert" hidden={!error}>
            {error}
          </p>
          {file && (
            <div className="video-file-details">
              <strong>{file.name}</strong>
              <span>{(file.size / 1024 / 1024).toFixed(1)} MB</span>
              <button className="text-link" type="button" onClick={clearVideo}>
                Remove video
              </button>
            </div>
          )}
        </div>
        {file && details && !error && onContinue && (
          <div className="video-next-step">
            <button
              className="button"
              type="button"
              onClick={() => onContinue(file, details)}
              aria-describedby="video-next-guidance"
            >
              Move forward with ad
            </button>
            <p id="video-next-guidance" className="fine">
              Continue to advertiser registration. Your video stays in this
              browser tab and will appear in the registration preview.
            </p>
          </div>
        )}
      </div>
      <div className="video-preview-panel">
        <div className="video-preview-heading">
          <strong>Cab screen preview</strong>
          <span>Concept placement</span>
        </div>
        <div className="video-cab-frame">
          <img
            src="assets/hyderabad-cab-hero.jpg"
            alt="Cab interior with a passenger-facing screen"
            width="504"
            height="683"
          />
          <div className="video-screen">
            {url ? (
              <video
                key={url}
                ref={videoRef}
                src={url}
                controls
                playsInline
                muted
                preload="metadata"
                aria-label="Your video on the cab screen"
                onLoadedMetadata={(event) => {
                  const video = event.currentTarget;
                  if (video.videoWidth === 0 || video.videoHeight === 0) {
                    setError(
                      "This file does not contain a supported video. Try exporting it as MP4 (H.264) or WebM.",
                    );
                    return;
                  }
                  const duration = Number.isFinite(video.duration)
                    ? `${Math.ceil(video.duration)} seconds`
                    : "duration unavailable";
                  setDetails(
                    `${video.videoWidth} × ${video.videoHeight} · ${duration}`,
                  );
                }}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onEnded={() => setPlaying(false)}
                onError={() => {
                  setPlaying(false);
                  setDetails("");
                  setError(
                    "This video could not be played. Try another file or export as MP4 (H.264) or WebM.",
                  );
                }}
              />
            ) : (
              <div className="video-screen-empty">
                <span>adrover.</span>
                <strong>
                  Your story
                  <br />
                  goes here.
                </strong>
                <small>Choose a video to preview</small>
              </div>
            )}
          </div>
        </div>
        <div className="video-playback-bar">
          <p role="status">
            {error
              ? "Preview unavailable. Choose another video."
              : details || "Your video will appear on this screen."}
          </p>
          <button
            type="button"
            className="button yellow small"
            disabled={!details || Boolean(error)}
            onClick={async () => {
              const video = videoRef.current;
              if (!video) return;
              if (!video.paused) {
                video.pause();
                return;
              }
              try {
                await video.play();
              } catch {
                setError(
                  "Playback could not start. Try the video controls or choose a different video.",
                );
              }
            }}
          >
            {playing ? "Pause preview" : "Play preview"}
          </button>
        </div>
        <p className="fine">
          Starts muted. Controls include sound and full screen. Mockup only;
          fleet compatibility needs confirmation.
        </p>
      </div>
    </section>
  );
}
