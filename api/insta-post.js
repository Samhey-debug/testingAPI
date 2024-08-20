const https = require("https");

module.exports = async (req, res) => {
  const { imgURL, caption } = req.query;
  const pageId = "100093679784274"; // Replace with your Facebook Page ID
  const accessToken = process.env.ACCESS_TOKEN; // Store this in your environment variables

  if (!imgURL || !caption) {
    return res.status(400).json({ error: "imgURL and caption are required" });
  }

  try {
    // Step 1: Get Instagram Account ID
    const igAccountId = await getInstagramAccountId(pageId, accessToken);

    if (!igAccountId) {
      return res.status(500).json({ error: "Unable to retrieve Instagram Account ID" });
    }

    // Step 2: Create the media object
    const mediaCreationId = await createMediaObject(igAccountId, imgURL, caption, accessToken);

    if (!mediaCreationId) {
      return res.status(500).json({ error: "Failed to create media object" });
    }

    // Step 3: Publish the media object
    const publishStatus = await publishMedia(igAccountId, mediaCreationId, accessToken);

    if (publishStatus) {
      res.status(200).json({ message: "Post published successfully!" });
    } else {
      res.status(500).json({ error: "Failed to publish the post" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

function getInstagramAccountId(pageId, accessToken) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "graph.facebook.com",
      path: `/v17.0/${pageId}?fields=instagram_business_account&access_token=${accessToken}`,
      method: "GET",
    };

    const req = https.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        const jsonResponse = JSON.parse(data);
        const igAccountId = jsonResponse.instagram_business_account?.id;
        resolve(igAccountId);
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.end();
  });
}

function createMediaObject(igAccountId, imgURL, caption, accessToken) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "graph.facebook.com",
      path: `/v17.0/${igAccountId}/media?image_url=${encodeURIComponent(
        imgURL
      )}&caption=${encodeURIComponent(caption)}&access_token=${accessToken}`,
      method: "POST",
    };

    const req = https.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        const jsonResponse = JSON.parse(data);
        const mediaCreationId = jsonResponse.id;
        resolve(mediaCreationId);
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.end();
  });
}

function publishMedia(igAccountId, mediaCreationId, accessToken) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "graph.facebook.com",
      path: `/v17.0/${igAccountId}/media_publish?creation_id=${mediaCreationId}&access_token=${accessToken}`,
      method: "POST",
    };

    const req = https.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        const jsonResponse = JSON.parse(data);
        resolve(jsonResponse.id ? true : false);
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.end();
  });
}