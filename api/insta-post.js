const https = require("https");

module.exports = async (req, res) => {
  const { imgURL, caption } = req.query;
  const instagramAccountId = "62447002037"; // Replace with your Instagram Account ID
  const accessToken = process.env.ACCESS_TOKEN; // Store this in your environment variables

  if (!imgURL || !caption) {
    return res.status(400).json({ error: "imgURL and caption are required" });
  }

  try {
    // Step 1: Create the media object
    const mediaCreationId = await createMediaObject(instagramAccountId, imgURL, caption, accessToken);

    if (!mediaCreationId) {
      return res.status(500).json({ error: "Failed to create media object" });
    }

    // Step 2: Publish the media object
    const publishStatus = await publishMedia(instagramAccountId, mediaCreationId, accessToken);

    if (publishStatus) {
      res.status(200).json({ message: "Post published successfully!" });
    } else {
      res.status(500).json({ error: "Failed to publish the post" });
    }
  } catch (error) {
    console.error("Internal Server Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

function createMediaObject(instagramAccountId, imgURL, caption, accessToken) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "graph.facebook.com",
      path: `/v17.0/${instagramAccountId}/media?image_url=${encodeURIComponent(imgURL)}&caption=${encodeURIComponent(caption)}&access_token=${accessToken}`,
      method: "POST",
    };

    const req = https.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const jsonResponse = JSON.parse(data);
          const mediaCreationId = jsonResponse.id;
          resolve(mediaCreationId);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.end();
  });
}

function publishMedia(instagramAccountId, mediaCreationId, accessToken) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "graph.facebook.com",
      path: `/v17.0/${instagramAccountId}/media_publish?creation_id=${mediaCreationId}&access_token=${accessToken}`,
      method: "POST",
    };

    const req = https.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const jsonResponse = JSON.parse(data);
          resolve(jsonResponse.id ? true : false);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.end();
  });
}