import { fal } from "@fal-ai/client";

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  // Check fal.ai API key
  if (!process.env.FAL_KEY) {
    return res.status(500).json({
      error: "FAL_KEY is not configured"
    });
  }

  // Temporary authentication for testing
  const token = req.headers["x-test-token"];

  if (
    !process.env.FITTED_TEST_TOKEN ||
    token !== process.env.FITTED_TEST_TOKEN
  ) {
    return res.status(401).json({
      error: "Unauthorized"
    });
  }

  // Get product image URL
  const { imageUrl } = req.body || {};

  if (
    typeof imageUrl !== "string" ||
    !imageUrl.startsWith("https://")
  ) {
    return res.status(400).json({
      error: "A public HTTPS image URL is required"
    });
  }

  try {
    console.log("Starting TRELLIS generation...");

    // Send image to hosted TRELLIS
    const result = await fal.queue.submit(
      "fal-ai/trellis",
      {
        input: {
          image_url: imageUrl
        }
      }
    );

    console.log(
      "TRELLIS request ID:",
      result.request_id
    );

    return res.status(200).json({
      success: true,
      requestId: result.request_id,
      message: "3D generation started"
    });

  } catch (error) {
    console.error("TRELLIS error:", error);

    return res.status(500).json({
      success: false,
      error: "Unable to start 3D generation"
    });
  }
}