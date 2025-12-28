
import { GoogleGenAI } from "@google/genai";
import { AspectRatio, Resolution } from "../types";

export const generateVideo = async (
  prompt: string,
  config: {
    aspectRatio: AspectRatio;
    resolution: Resolution;
    startImage?: string; // base64
    endImage?: string;   // base64
  },
  onProgress: (status: string) => void
) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const videoConfig: any = {
      numberOfVideos: 1,
      resolution: config.resolution,
      aspectRatio: config.aspectRatio,
    };

    if (config.endImage) {
      videoConfig.lastFrame = {
        imageBytes: config.endImage.split(',')[1] || config.endImage,
        mimeType: 'image/png',
      };
    }

    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      image: config.startImage ? {
        imageBytes: config.startImage.split(',')[1] || config.startImage,
        mimeType: 'image/png',
      } : undefined,
      config: videoConfig,
    });

    onProgress("Operation started. Polling for results...");

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 8000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    if (operation.error) {
      throw new Error(operation.error.message || "Operation failed");
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
      throw new Error("No video URI returned from operation");
    }

    // Append API key as required for the download link
    const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const videoBlob = await videoResponse.blob();
    return URL.createObjectURL(videoBlob);
  } catch (error: any) {
    if (error.message?.includes("Requested entity was not found")) {
      throw new Error("API_KEY_ERROR");
    }
    throw error;
  }
};

export const extendVideo = async (
  prompt: string,
  previousVideoUri: string,
  aspectRatio: AspectRatio,
  onProgress: (status: string) => void
) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-generate-preview',
      prompt: prompt,
      video: { uri: previousVideoUri },
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: aspectRatio,
      }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 8000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const videoBlob = await response.blob();
    return URL.createObjectURL(videoBlob);
  } catch (error: any) {
    if (error.message?.includes("Requested entity was not found")) {
      throw new Error("API_KEY_ERROR");
    }
    throw error;
  }
};
