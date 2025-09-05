import { Config } from "@remotion/cli/config"

Config.setVideoImageFormat("jpeg")
Config.setOverwriteOutput(true)
// Avoid white frames on Windows by using software ANGLE
Config.setChromiumOpenGlRenderer("swangle")
