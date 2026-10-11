import { fal } from "@fal-ai/client";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  // Verify API configuration
  if (!process.env.FAL_KEY) {
    return res.status(500).json({
      error: "FAL_KEY is not configured"
    });
  }

  // Temporary authentication
  const token = req.headers["x-test-token"];

  if (
    !process.env.FITTED_TEST_TOKEN ||
    token !== process.env.FITTED_TEST_TOKEN
  ) {
    return res.status(401).json({
      error: "Unauthorized"
    });
  }

  // Retrieve generation request ID
  const { requestId } = req.query;

  if (
    typeof requestId !== "string" ||
    !/^[a-zA-Z0-9-]{1,100}$/.test(requestId)
  ) {
    return res.status(400).json({
      error: "Invalid request ID"
    });
  }

  try {
    // Check TRELLIS generation status
    const status = await fal.queue.status(
      "fal-ai/trellis",
      {
        requestId
      }
    );

    // Return progress if still processing
    if (status.status !== "COMPLETED") {
      return res.status(200).json({
        success: true,
        status: status.status,
        requestId
      });
    }

    // Retrieve completed 3D model
    const result = await fal.queue.result(
      "fal-ai/trellis",
      {
        requestId
      }
    );

    const model = result.data?.model_mesh;

    if (!model?.url) {
      return res.status(500).json({
        success: false,
        error: "No 3D model returned"
      });
    }

    return res.status(200).json({
      success: true,
      status: "COMPLETED",
      requestId,
      modelUrl: model.url,
      fileName: model.file_name || null,
      contentType: model.content_type || null
    });

  } catch (error) {
    console.error("TRELLIS status error:", error);

    return res.status(500).json({
      success: false,
      error: "Unable to retrieve generation status"
    });
  }
}