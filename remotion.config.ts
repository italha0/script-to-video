import { Config } from '@remotion/cli/config';
// Add this import
import chromium from '@sparticuz/chromium';

Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
Config.setPixelFormat('yuv420p');
Config.setCodec('h264');

// This is the important change
(async () => {
  const executablePath = await chromium.executablePath();
  Config.setBrowserExecutable(executablePath);

  Config.setChromiumDisableWebSecurity(true);
})();