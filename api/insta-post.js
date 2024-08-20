const https = require("https");

module.exports = async (req, res) => {
  try {
    const { imgURL, caption } = req.query;
    if (!imgURL || !caption) {
      return res.status(400).json({ error: "imgURL and caption are required" });
    }

    const pageId = "100093679784274"; // Replace with your Facebook Page ID
    const accessToken = process.env.ACCESS_TOKEN;

    // Step 1: Get Instagram Account ID
    const igAccountId = await getInstagramAccountId(pageId, accessToken);
    if (!igAccountId) {
      throw new Error("Failed to retrieve Instagram Account ID.");
    }

    // Step 2: Create Media Object
    const mediaCreationId = await createMediaObject(igAccountId, imgURL, caption, accessToken);
    if (!mediaCreationId) {
      throw new Error("Failed to create media object.");
    }

    // Step 3: Publish Media
    const publishStatus = await publishMedia(igAccountId, mediaCreationId, accessToken);
    if (!publishStatus) {
      throw new Error("Failed to publish the post.");
    }

    res.status(200).json({ message: "Post published successfully!" });
  } catch (error) {
    console.error("Error in Instagram Post API:", error);
    res.status(500).json({ error: "Internal Server Error: " + error.message });
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
        try {
          const jsonResponse = JSON.parse(data);
          const igAccountId = jsonResponse.instagram_business_account?.id;
          resolve(igAccountId);
        } catch (err) {
          console.error("Error parsing Instagram Account ID response:", err);
          reject(err);
        }
      });
    });

    req.on("error", (error) => {
      console.error("Error in getInstagramAccountId request:", error);
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
        try {
          const jsonResponse = JSON.parse(data);
          const mediaCreationId = jsonResponse.id;
          resolve(mediaCreationId);
        } catch (err) {
          console.error("Error parsing createMediaObject response:", err);
          reject(err);
        }
      });
    });

    req.on("error", (error) => {
      console.error("Error in createMediaObject request:", error);
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
        try {
          const jsonResponse = JSON.parse(data);
          resolve(jsonResponse.id ? true : false);
        } catch (err) {
          console.error("Error parsing publishMedia response:", err);
          reject(err);
        }
      });
    });

    req.on("error", (error) => {
      console.error("Error in publishMedia request:", error);
      reject(error);
    });

    req.end();
  });
}