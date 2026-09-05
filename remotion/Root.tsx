import { Composition } from "remotion";

import { HelpClip, type HelpClipProps } from "./HelpClip";

const defaultProps: HelpClipProps = {
  scenes: [
    {
      toolId: "openlaw",
      toolName: "OpenLaw",
      actionId: "locate-search-field",
      title: "Locate the search field",
      reviewedCoreInstruction:
        "Use the Search field in the left panel of the OpenLaw judgments page.",
      caption: "Start in the Search field on the left.",
      imagePath: "assets/openlaw/openlaw-search-start.png",
      sourceWidth: 2047,
      sourceHeight: 1069,
      highlight: { x: 351, y: 214, width: 329, height: 60 },
      cursor: { x: 648, y: 243 },
    },
  ],
  audioPath: "generated/placeholder.mp3",
  durationInFrames: 270,
};

export const RemotionRoot = () => {
  return (
    <Composition
      id="SharedHelpClip"
      component={HelpClip}
      durationInFrames={270}
      fps={30}
      width={1280}
      height={720}
      defaultProps={defaultProps}
      calculateMetadata={({ props }) => ({
        durationInFrames: props.durationInFrames,
      })}
    />
  );
};
