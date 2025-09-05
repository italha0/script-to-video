import type React from "react"
import { Composition } from "remotion"
import { ChatVideoScene } from "./ChatVideoScene"

export const ChatVideoComposition: React.FC = () => {
  return (
    <Composition
      id="ChatVideo"
      // Cast to loose type to satisfy TS; actual props come via inputProps at render time
      component={ChatVideoScene as unknown as React.FC<Record<string, unknown>>}
      durationInFrames={600} // 20 seconds at 30fps for longer conversations
      fps={30}
      width={1080}
      height={1920} // 9:16 aspect ratio
      defaultProps={{
        characters: [],
        messages: [],
        showWatermark: true,
      }}
    />
  )
}
