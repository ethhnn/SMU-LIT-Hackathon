import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type HelpClipScene = {
  toolId: string;
  toolName: string;
  actionId: string;
  title: string;
  reviewedCoreInstruction: string;
  caption: string;
  imagePath: string;
  sourceWidth: number;
  sourceHeight: number;
  highlight: { x: number; y: number; width: number; height: number };
  cursor: { x: number; y: number };
};

export type HelpClipProps = {
  scenes: readonly HelpClipScene[];
  audioPath: string;
  durationInFrames: number;
};

export const HelpClip = ({ scenes, audioPath, durationInFrames }: HelpClipProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const framesPerScene = Math.ceil(durationInFrames / scenes.length);
  const sceneIndex = Math.min(Math.floor(frame / framesPerScene), scenes.length - 1);
  const scene = scenes[sceneIndex];
  const sceneFrame = frame - sceneIndex * framesPerScene;
  const enter = spring({
    frame: sceneFrame,
    fps,
    config: { damping: 18, stiffness: 130, mass: 0.8 },
  });
  const cursorProgress = spring({
    frame: Math.max(0, sceneFrame - 20),
    fps,
    config: { damping: 14, stiffness: 90, mass: 0.7 },
  });
  const captionOpacity = interpolate(sceneFrame, [20, 38], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const spotlightOpacity = 0.6 + Math.sin(sceneFrame / 7) * 0.18;
  const left = (scene.highlight.x / scene.sourceWidth) * 100;
  const top = (scene.highlight.y / scene.sourceHeight) * 100;
  const width = (scene.highlight.width / scene.sourceWidth) * 100;
  const height = (scene.highlight.height / scene.sourceHeight) * 100;
  const cursorLeft = (scene.cursor.x / scene.sourceWidth) * 100;
  const cursorTop = (scene.cursor.y / scene.sourceHeight) * 100;

  return (
    <AbsoluteFill
      style={{
        background:
          "linear-gradient(135deg, #081c31 0%, #12334e 55%, #0b2035 100%)",
        color: "#f4f8fb",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <Audio src={staticFile(audioPath)} />
      <div
        style={{
          position: "absolute",
          top: 26,
          left: 48,
          right: 48,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          opacity: enter,
        }}
      >
        <div style={{ fontSize: 22, fontWeight: 700 }}>Training demonstration</div>
        <div
          style={{
            border: "1px solid rgba(255,255,255,0.35)",
            borderRadius: 999,
            padding: "8px 14px",
            fontSize: 17,
          }}
        >
          {scene.toolName}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          top: 76,
          left: 48,
          right: 48,
          bottom: 106,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${0.96 + enter * 0.04})`,
        }}
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: `${scene.sourceWidth} / ${scene.sourceHeight}`,
            overflow: "hidden",
            borderRadius: 16,
            boxShadow: "0 22px 50px rgba(0,0,0,0.35)",
            background: "#fff",
          }}
        >
          <Img
            src={staticFile(scene.imagePath)}
            style={{ width: "100%", height: "100%", display: "block" }}
          />
          <div
            style={{
              position: "absolute",
              left: `${left}%`,
              top: `${top}%`,
              width: `${width}%`,
              height: `${height}%`,
              border: "4px solid #ffb80f",
              borderRadius: 10,
              boxSizing: "border-box",
              boxShadow: `0 0 0 999px rgba(2, 17, 31, ${spotlightOpacity})`,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: `${cursorLeft * cursorProgress}%`,
              top: `${cursorTop * cursorProgress}%`,
              width: 26,
              height: 26,
              borderRadius: "50%",
              background: "#ffb80f",
              border: "4px solid #0a243d",
              boxShadow: "0 3px 10px rgba(0,0,0,0.35)",
              transform: "translate(-50%, -50%)",
            }}
          />
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 48,
          right: 48,
          bottom: 24,
          display: "flex",
          gap: 16,
          alignItems: "center",
          opacity: captionOpacity,
        }}
      >
        <div
          style={{
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: "#ffb80f",
            flex: "0 0 auto",
          }}
        />
        <div style={{ fontSize: 23, fontWeight: 600 }}>
          {scene.title}: {scene.caption}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 54,
          right: 54,
          top: 94,
          textAlign: "center",
          fontSize: 22,
          fontWeight: 700,
          textShadow: "0 2px 8px rgba(0,0,0,0.45)",
        }}
      >
        {scene.reviewedCoreInstruction}
      </div>
    </AbsoluteFill>
  );
};
