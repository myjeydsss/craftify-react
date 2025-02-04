require("dotenv").config({ path: ".env.local" });
const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const axios = require("axios");


const app = express();
const PORT = process.env.PORT || 8081;

// Middleware
const allowedOrigins = [
  "http://localhost:5173",
  "https://craftify-react-git-main-myjeydsss-projects.vercel.app",
  "https://craftify-react.vercel.app",
  "https://craftify-react.onrender.com",
];

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

app.use(express.json());

// Supabase client setup
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_API_KEY
);

// Paymongo setup
const Paymongo = require('paymongo');
const paymongo = new Paymongo(process.env.VITE_PAYMONGO_SECRET_KEY);

// Root endpoint
app.get("/", (req, res) => {
  res.send("Supabase API is running...");
});

// Storage settings
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Start the server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});



// ****** REGISTER USER ****** 
app.post("/register", async (req, res) => {
  const { email, password, firstName, lastName, username, role } = req.body;

  // Validate required fields
  if (!email || !password || !firstName || !lastName || !username || !role) {
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    // Create the user in Supabase Auth
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const user = data.user;
    if (!user) {
      return res.status(400).json({ error: "User registration failed." });
    }

    // Determine the table based on the role
    const table = role === "Artist" ? "artist" : "client";

    // Insert additional user details into the appropriate table
    const { error: insertError } = await supabase.from(table).insert({
      user_id: user.id,
      firstname: firstName,
      lastname: lastName,
      email,
      username,
      role,
      bio: "", // Default value for bio
    });

    if (insertError) {
      return res.status(500).json({ error: insertError.message });
    }

    res.status(201).json({ message: "User registered successfully!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// ****** REGISTER USER END... ****** 

// ****** LOGIN USER ****** 
app.post("/login", async (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ error: "Email/username and password are required." });
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: identifier,
      password,
    });

    if (error || !data.user) {
      return res.status(401).json({ error: error?.message || "Invalid credentials." });
    }

    const userId = data.user.id;
    return res.status(200).json({ userId });
  } catch (err) {
    res.status(500).json({ error: "Login failed. Please try again later." });
  }
});
// ****** LOGIN USER END... ****** 



// ****** NAVBAR ENDPOINT ******
// User Role Base Endpoint
app.get("/user-role/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const roles = ["artist", "client", "admin"];
    for (const role of roles) {
      const { data, error } = await supabase
        .from(role)
        .select("role")
        .eq("user_id", userId)
        .single();

      if (data) {
        return res.status(200).json({ role: data.role });
      }
    }
    return res.status(404).json({ error: "User role not found." });
  } catch (err) {
    res.status(500).json({ error: "Server error fetching user role." });
  }
});

// User Cart Count
app.get("/cart/count/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const { count, error } = await supabase
      .from("cart")
      .select("*", { count: "exact" })
      .eq("user_id", userId);

    if (error) return res.status(400).json({ error: error.message });

    res.status(200).json({ count });
  } catch (err) {
    console.error("Error fetching cart count:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Handle user logout
app.post("/logout", async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    res.status(200).json({ message: "Logout successful." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// ****** NAVBAR ENDPOINT END... ******



// ****** ARTIST UPLOAD PROFILE IMAGE ******
// Ensure the uploads directory exists
const UPLOADS_DIR = path.join(__dirname, "uploads/artist-profile");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Serve static files for uploaded images
app.use("/uploads", express.static(UPLOADS_DIR));

// Profile Image Upload Endpoint
app.post("/upload-profile-image/:userId", upload.single("file"), async (req, res) => {
  const { userId } = req.params;

  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded." });
  }

  try {
    const originalFileName = req.file.originalname;
    const storageFilePath = `${Date.now()}-${originalFileName}`;

    console.log("Uploading file:", storageFilePath);

    // Upload file to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("artist-profile")
      .upload(`${userId}/${storageFilePath}`, req.file.buffer, {
        contentType: req.file.mimetype,
        cacheControl: "3600",
      });

    if (uploadError) {
      console.error("Supabase storage upload error:", uploadError);
      return res.status(500).json({ error: "Failed to upload image to Supabase." });
    }

    console.log("File uploaded to Supabase successfully:", `${userId}/${storageFilePath}`);

    // Fetch old profile image
    const { data: artistData, error: fetchError } = await supabase
      .from("artist")
      .select("profile_image")
      .eq("user_id", userId)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("Error fetching artist profile:", fetchError);
      throw fetchError;
    }

    const oldProfileImage = artistData?.profile_image;

    // Delete the old profile image if it exists
    if (oldProfileImage) {
      const { error: deleteError } = await supabase.storage
        .from("artist-profile")
        .remove([`${userId}/${oldProfileImage}`]);

      if (deleteError) {
        console.error("Error deleting old profile image:", deleteError);
      } else {
        console.log("Old profile image deleted successfully.");
      }
    }

    // Update the artist profile in the database with the new file path
    const { error: updateError } = await supabase
      .from("artist")
      .update({ profile_image: storageFilePath })
      .eq("user_id", userId);

    if (updateError) {
      console.error("Error updating artist profile:", updateError);
      throw updateError;
    }

    console.log("Artist profile updated successfully.");
    res.status(200).json({ fileName: storageFilePath });
  } catch (err) {
    console.error("Unexpected error during upload:", err);
    res.status(500).json({ error: "An unexpected error occurred during file upload." });
  }
});
// ****** ARTIST UPLOAD PROFILE IMAGE END... ******

// ****** ARTIST PROFILE ENDPOINT ****** 
// Get Artist Profile
app.get("/artist-profile/:userId", async (req, res) => {
  const { userId } = req.params;
  const CDNURL = "https://seaczeofjlkfcwnofbny.supabase.co/storage/v1/object/public/artist-profile/";

  try {
    const { data: artistData, error: artistError } = await supabase
      .from("artist")
      .select("firstname, lastname, bio, gender, date_of_birth, email, role, address, phone, profile_image, verification_id")
      .eq("user_id", userId)
      .single();

    if (artistError || !artistData) {
      console.error("Error fetching artist profile:", artistError);
      return res.status(404).json({ error: "Artist profile not found." });
    }

    if (artistData.profile_image) {
      artistData.profile_image = `${CDNURL}${userId}/${artistData.profile_image}`;
    }

    // Fetch the verification status if verification_id exists
    if (artistData.verification_id) {
      const { data: verificationData, error: verificationError } = await supabase
        .from("artist_verification")
        .select("status")
        .eq("verification_id", artistData.verification_id)
        .single();

      if (verificationError) {
        console.error("Error fetching verification status:", verificationError);
      } else {
        artistData.status = verificationData?.status || null;
      }
    }

    res.status(200).json(artistData);
  } catch (err) {
    console.error("Error fetching artist profile:", err);
    res.status(500).json({ error: "Failed to fetch artist profile." });
  }
});

// Get Artist Preferences
app.get("/artist-preferences/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const { data, error } = await supabase
      .from("artist_preferences")
      .select(
        "crafting, art_style_specialization, collaboration_type, preferred_medium, location_preference, crafting_techniques, budget_range, project_type, project_type_experience, preferred_project_duration, availability, client_type_preference, project_scale, portfolio_link, preferred_communication"
      )
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      console.warn(`Preferences not found for userId: ${userId}`);
      return res.status(200).json({
        message: "You haven't set up your preferences yet.",
        preferences: null,
      });
    }

    // Return preferences as is (No need for JSON.parse here, as it's already stored as jsonb)
    res.status(200).json(data);
  } catch (err) {
    console.error("Error fetching preferences:", err);
    res.status(500).json({ error: "Failed to fetch preferences." });
  }
});

// Profile Update Endpoint
app.put("/artist-profile", async (req, res) => {
  const { userId, profile, preferences } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "User ID is required." });
  }

  try {
    if (profile && Object.keys(profile).length > 0) {
      const { error: profileError } = await supabase
        .from("artist")
        .update(profile)
        .eq("user_id", userId);

      if (profileError) {
        console.error("Error updating artist profile:", profileError);
        return res.status(500).json({ error: "Failed to update artist profile." });
      }
    }

    if (preferences && Object.keys(preferences).length > 0) {
      const { data: existingPreferences, error: fetchError } = await supabase
        .from("artist_preferences")
        .select("preferences_id")
        .eq("user_id", userId)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        console.error("Error fetching preferences:", fetchError);
        return res.status(500).json({ error: "Failed to fetch preferences." });
      }

      if (existingPreferences) {
        const { error: updateError } = await supabase
          .from("artist_preferences")
          .update(preferences)
          .eq("preferences_id", existingPreferences.preferences_id);

        if (updateError) {
          console.error("Error updating preferences:", updateError);
          return res.status(500).json({ error: "Failed to update preferences." });
        }
      } else {
        const { error: insertError } = await supabase
          .from("artist_preferences")
          .insert({ user_id: userId, ...preferences });

        if (insertError) {
          console.error("Error inserting preferences:", insertError);
          return res.status(500).json({ error: "Failed to insert preferences." });
        }
      }
    }

    res.status(200).json({ message: "Profile and preferences updated successfully." });
  } catch (err) {
    console.error("Unexpected error updating profile/preferences:", err);
    res.status(500).json({ error: "Failed to update profile or preferences." });
  }
});
// ****** ARTIST PROFILE ENDPOINT END... ******

// ****** ARTIST UPLOAD VERIFICATION ******
// Artist Verification Upload Endpoint
app.post(
  "/artist-verification/:userId",
  upload.fields([{ name: "document" }, { name: "valid_id" }]),
  async (req, res) => {
    const { userId } = req.params;
    const files = req.files;

    if (!userId || !files || !files.document || !files.valid_id) {
      return res.status(400).json({ error: "User ID, portfolio, and valid ID are required." });
    }

    try {
      // Upload portfolio to Supabase storage
      const documentFile = files.document[0];
      const documentFileName = `${Date.now()}-${documentFile.originalname}`;
      const documentPath = `portfolio/${userId}/${documentFileName}`;

      const { error: documentUploadError } = await supabase.storage
        .from("artist-verification")
        .upload(documentPath, documentFile.buffer, {
          contentType: documentFile.mimetype,
          cacheControl: "3600",
        });

      if (documentUploadError) {
        console.error("Error uploading portfolio:", documentUploadError);
        return res.status(500).json({ error: "Failed to upload portfolio." });
      }

      // Upload valid ID to Supabase storage
      const validIdFile = files.valid_id[0];
      const validIdFileName = `${Date.now()}-${validIdFile.originalname}`;
      const validIdPath = `valid_id/${userId}/${validIdFileName}`;

      const { error: validIdUploadError } = await supabase.storage
        .from("artist-verification")
        .upload(validIdPath, validIdFile.buffer, {
          contentType: validIdFile.mimetype,
          cacheControl: "3600",
        });

      if (validIdUploadError) {
        console.error("Error uploading valid ID:", validIdUploadError);
        return res.status(500).json({ error: "Failed to upload valid ID." });
      }

      console.log("Files uploaded successfully to distinct folders.");

      // Generate a valid UUID for verification_id
      const verificationId = uuidv4();

      // Insert verification request into the `artist_verification` table
      const { error: verificationError } = await supabase
        .from("artist_verification")
        .insert({
          verification_id: verificationId,
          user_id: userId,
          document_url: documentPath, // Path for the portfolio
          valid_id: validIdPath, // Path for the valid ID
          status: "pending",
          created_at: new Date(),
        });

      if (verificationError) {
        console.error(
          "Error inserting verification request into artist_verification table:",
          verificationError
        );
        return res
          .status(500)
          .json({ error: "Failed to save verification request to the database." });
      }

      console.log("Verification request inserted successfully into artist_verification table.");

      // Update the `artist` table with the new verification ID
      const { error: artistUpdateError } = await supabase
        .from("artist")
        .update({ verification_id: verificationId })
        .eq("user_id", userId);

      if (artistUpdateError) {
        console.error("Error updating artist table with verification ID:", artistUpdateError);
        return res.status(500).json({ error: "Failed to update artist verification ID." });
      }

      console.log("Artist table updated successfully with verification ID.");

      res.status(200).json({
        success: true,
        message: "Verification request submitted successfully.",
      });
    } catch (err) {
      console.error("Unexpected error in verification endpoint:", err);
      res
        .status(500)
        .json({ error: "An unexpected error occurred during verification." });
    }
  }
);
// ****** ARTIST UPLOAD VERIFICATION END... ******

// ****** ARTIST ARTS TABLE ******
// Fetch all arts for a user
app.get("/api/arts/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const { data: arts, error } = await supabase
      .from("arts")
      .select("*")
      .eq("user_id", userId);

    if (error) return res.status(400).json({ error: error.message });

    // Fetch tags for all arts
    const { data: artTags, error: artTagsError } = await supabase
      .from("art_tags")
      .select("art_id, tag_id, tags (name)")
      .in("art_id", arts.map((art) => art.art_id));

    if (artTagsError) return res.status(400).json({ error: artTagsError.message });

    // Add tags to arts
    const artsWithTags = arts.map((art) => ({
      ...art,
      tags: artTags
        .filter((tag) => tag.art_id === art.art_id)
        .map((tag) => tag.tags.name),
    }));

    res.status(200).json(artsWithTags);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch arts." });
  }
});

// Fetch all tags
app.get("/api/tags", async (req, res) => {
  try {
    const { data: tags, error } = await supabase.from("tags").select("*");
    if (error) return res.status(400).json({ error: error.message });

    res.status(200).json(tags);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch tags." });
  }
});

// Delete an art
app.delete("/api/arts/:artId", async (req, res) => {
  const { artId } = req.params;

  try {
    // Begin transaction for atomic deletion
    const supabaseTransaction = supabase;

    // Step 1: Delete all related tags from `art_tags`
    const { error: tagsDeleteError } = await supabaseTransaction
      .from("art_tags")
      .delete()
      .eq("art_id", artId);

    if (tagsDeleteError) {
      console.error("Error deleting related tags:", tagsDeleteError);
      return res.status(400).json({ error: "Failed to delete related tags." });
    }

    // Step 2: Delete the art itself
    const { error: artDeleteError } = await supabaseTransaction
      .from("arts")
      .delete()
      .eq("art_id", artId);

    if (artDeleteError) {
      console.error("Error deleting art:", artDeleteError);
      return res.status(400).json({ error: "Failed to delete the art." });
    }

    // Step 3: Respond to the client with success
    res.status(200).json({ message: "Art deleted successfully." });
  } catch (err) {
    console.error("Unexpected error during deletion:", err);
    res.status(500).json({ error: "An unexpected error occurred while deleting the art." });
  }
});

// ****** UPDATE ART ******
app.put("/api/arts/:artId", async (req, res) => {
  const { artId } = req.params;
  const {
    title,
    description,
    price,
    location,
    art_style,
    medium,
    subject,
    tags,
  } = req.body;

  try {
    // Update the art details in the database
    const { error: updateError } = await supabase
      .from("arts")
      .update({
        title,
        description,
        price: price ? parseFloat(price) : null,
        location,
        art_style,
        medium,
        subject,
      })
      .eq("art_id", artId);

    if (updateError) {
      console.error("Error updating art details:", updateError);
      return res.status(400).json({ error: updateError.message });
    }

    // Safely parse tags and update the art_tags table
    if (tags) {
      let tagList = [];
      try {
        tagList = JSON.parse(tags); // Attempt to parse tags as JSON
        if (!Array.isArray(tagList)) {
          throw new Error("Tags must be an array.");
        }
      } catch (parseError) {
        console.error("Error parsing tags:", parseError);
        return res.status(400).json({ error: "Invalid tags format. Must be a JSON array." });
      }

      // Delete old tags
      const { error: deleteTagsError } = await supabase
        .from("art_tags")
        .delete()
        .eq("art_id", artId);

      if (deleteTagsError) {
        console.error("Error deleting old tags:", deleteTagsError);
        return res.status(400).json({ error: deleteTagsError.message });
      }

      // Insert new tags
      for (const tagId of tagList) {
        const { error: insertTagError } = await supabase
          .from("art_tags")
          .insert({ art_id: artId, tag_id: tagId });

        if (insertTagError) {
          console.error("Error inserting new tags:", insertTagError);
          return res.status(400).json({ error: insertTagError.message });
        }
      }
    }

    console.log("Art updated successfully.");
    res.status(200).json({ message: "Art updated successfully." });
  } catch (err) {
    console.error("Unexpected error:", err);
    res.status(500).json({ error: "An unexpected error occurred while updating the art." });
  }
});

/// Fetch a single art
app.get("/api/art/:artId", async (req, res) => {
  const { artId } = req.params;

  try {
    // Fetch art details
    const { data: art, error } = await supabase
      .from("arts")
      .select("*")
      .eq("art_id", artId)
      .single();

    if (error || !art) return res.status(404).json({ error: "Art not found." });

    // Fetch tags for the art
    const { data: artTags, error: tagError } = await supabase
      .from("art_tags")
      .select("tag_id, tags (name)")
      .eq("art_id", artId);

    if (tagError) return res.status(400).json({ error: tagError.message });

    // Map tags into an array of tag IDs and names
    const tags = artTags.map((tag) => ({
      id: tag.tag_id,
      name: tag.tags.name,
    }));

    res.status(200).json({ ...art, tags });
  } catch (err) {
    console.error("Error fetching art:", err);
    res.status(500).json({ error: "Failed to fetch art details." });
  }
});
// ****** ARTIST ARTS TABLE END... ******


// ****** ARTIST POST ARTS ******
// Fetch all tags
app.get("/api/tags", async (req, res) => {
  try {
    const { data: tags, error } = await supabase.from("tags").select("*");
    if (error) return res.status(400).json({ error: error.message });

    res.status(200).json(tags);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch tags." });
  }
});

// Upload art (it works already)
app.post("/api/upload-art", upload.single("file"), async (req, res) => {
  const {
    title,
    description,
    price,
    location,
    art_style,
    medium,
    subject,
    userId,
    tags,
  } = req.body;

  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: "No file uploaded." });
  }

  try {
    const originalFileName = file.originalname;
    const storageFilePath = `${userId}/${Date.now()}-${originalFileName}`;

    console.log("Uploading file:", storageFilePath);

    // Upload file to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("artist-arts")
      .upload(storageFilePath, file.buffer, {
        contentType: file.mimetype,
        cacheControl: "3600",
      });

    if (uploadError) {
      console.error("Supabase storage upload error:", uploadError);
      return res.status(500).json({ error: "Failed to upload image to Supabase." });
    }

    console.log("File uploaded to Supabase successfully:", storageFilePath);

    // Generate the public URL for the uploaded file
    const { data: publicUrlData, error: publicUrlError } = supabase.storage
      .from("artist-arts")
      .getPublicUrl(storageFilePath);

    if (publicUrlError) {
      console.error("Error generating public URL:", publicUrlError);
      return res.status(500).json({ error: "Failed to generate public URL for image." });
    }

    const publicURL = publicUrlData.publicUrl;
    console.log("Public URL generated successfully:", publicURL);

    // Fetch the artist_id using the provided userId
    const { data: artistData, error: artistError } = await supabase
      .from("artist")
      .select("artist_id")
      .eq("user_id", userId)
      .single();

    if (artistError || !artistData) {
      console.error("Artist Fetch Error:", artistError);
      return res.status(400).json({ error: "Failed to fetch artist ID." });
    }

    const artistId = artistData.artist_id;

    // Insert the new art into the "arts" table
    const { data: insertedArt, error: insertError } = await supabase
      .from("arts")
      .insert({
        user_id: userId,
        artist_id: artistId, // Store the artist_id
        title,
        description,
        price: parseFloat(price),
        location,
        art_style,
        medium,
        subject,
        image_url: publicURL, // Store the public URL in the "image_url" column
        created_at: new Date(),
      })
      .select();

    if (insertError) {
      console.error("Insert Error:", insertError);
      return res.status(400).json({ error: insertError.message });
    }

    const newArtId = insertedArt[0].art_id;

    // Insert the associated tags into the "art_tags" table
    const tagList = JSON.parse(tags);
    for (const tagId of tagList) {
      const { error: tagInsertError } = await supabase
        .from("art_tags")
        .insert({ art_id: newArtId, tag_id: tagId });

      if (tagInsertError) {
        console.error("Tag Insert Error:", tagInsertError);
        return res.status(400).json({ error: tagInsertError.message });
      }
    }

    console.log("Art uploaded successfully with image URL and artist ID.");
    res.status(201).json({ message: "Art uploaded successfully." });
  } catch (err) {
    console.error("Unexpected Error:", err);
    res.status(500).json({ error: "Failed to upload art." });
  }
});
// ****** ARTIST POST ARTS END... ******

// ****** CLIENT PROFILE ENDPOINTS ******

// Get Client Profile
app.get("/client-profile/:userId", async (req, res) => {
  const { userId } = req.params;
  const CDNURL = "https://seaczeofjlkfcwnofbny.supabase.co/storage/v1/object/public/client-profile/";

  try {
    const { data: clientData, error } = await supabase
      .from("client")
      .select("firstname, lastname, bio, gender, date_of_birth, email, role, address, phone, profile_image")
      .eq("user_id", userId)
      .single();

    if (error || !clientData) {
      return res.status(404).json({ error: "Client profile not found." });
    }

    // If profile_image exists, prepend CDN URL
    if (clientData.profile_image) {
      clientData.profile_image = `${CDNURL}${userId}/${clientData.profile_image}`;
    }

    res.status(200).json(clientData);
  } catch (err) {
    console.error("Error fetching client profile:", err);
    res.status(500).json({ error: "Failed to fetch client profile." });
  }
});

// Get Client Preferences
app.get("/client-preferences/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const { data, error } = await supabase
      .from("client_preferences")
      .select(
        "preferred_art_style, project_requirements, budget_range, location_requirement, timeline, artist_experience_level, communication_preferences, project_type"
      )
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      console.warn(`Preferences not found for userId: ${userId}`);
      return res.status(200).json({
        message: "You haven't set up your preferences yet.",
        preferences: null,
      });
    }

    res.status(200).json(data);
  } catch (err) {
    console.error("Error fetching client preferences:", err);
    res.status(500).json({ error: "Failed to fetch preferences." });
  }
});

// ****** CLIENT PROFULE ENDPOINT END... *******



// ****** ADMIN USER TABLE ******
// Fetch Artists
app.get("/admin/artists", async (req, res) => {
  try {
    const { data: artistData, error: artistError } = await supabase
      .from("artist")
      .select("user_id, firstname, lastname, username, email, address, role");

    if (artistError) throw artistError;

    const { data: verifiedUsers, error: verificationError } = await supabase
      .from("artist_verification")
      .select("user_id, status")
      .eq("status", "approved");

    if (verificationError) throw verificationError;

    const artists = artistData.map((artist) => ({
      id: artist.user_id,
      name: `${artist.firstname} ${artist.lastname}`,
      username: artist.username,
      email: artist.email,
      address: artist.address,
      role: artist.role,
      isVerified: verifiedUsers.some((verified) => verified.user_id === artist.user_id),
    }));

    res.status(200).json(artists);
  } catch (error) {
    console.error("Error fetching artists:", error);
    res.status(500).json({ error: "Failed to fetch artists." });
  }
});

// Fetch Clients
app.get("/admin/clients", async (req, res) => {
  try {
    const { data: clientData, error } = await supabase
      .from("client")
      .select("user_id, firstname, lastname, username, email, address, role");

    if (error) throw error;

    const clients = clientData.map((client) => ({
      id: client.user_id,
      name: `${client.firstname} ${client.lastname}`,
      username: client.username,
      email: client.email,
      address: client.address,
      role: client.role,
    }));

    res.status(200).json(clients);
  } catch (error) {
    console.error("Error fetching clients:", error);
    res.status(500).json({ error: "Failed to fetch clients." });
  }
});
// ****** ADMIN USER TABLE END... ******


// ****** ADMIN TAG TABLE ******
// Get all tags
app.get("/tags", async (req, res) => {
  try {
    const { data, error } = await supabase.from("tags").select("*");
    if (error) throw error;
    res.status(200).json(data);
  } catch (err) {
    console.error("Error fetching tags:", err);
    res.status(500).json({ error: "Failed to fetch tags" });
  }
});

// Add a new tag
app.post("/tags", async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Tag name is required" });
  }

  try {
    // Check if the tag already exists
    const { data: existingTags } = await supabase
      .from("tags")
      .select("*")
      .eq("name", name);

    if (existingTags.length > 0) {
      return res.status(409).json({ error: "Tag already exists" });
    }

    // Insert the new tag
    const { data, error } = await supabase.from("tags").insert({ name }).single();
    if (error) throw error;

    res.status(201).json(data);
  } catch (err) {
    console.error("Error adding tag:", err);
    res.status(500).json({ error: "Failed to add tag" });
  }
});

// Update a tag
app.put("/tags/:id", async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Tag name is required" });
  }

  try {
    const { data, error } = await supabase
      .from("tags")
      .update({ name })
      .eq("id", id);
    if (error) throw error;
    res.status(200).json(data);
  } catch (err) {
    console.error("Error updating tag:", err);
    res.status(500).json({ error: "Failed to update tag" });
  }
});

// Delete a tag
app.delete("/tags/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase.from("tags").delete().eq("id", id);
    if (error) throw error;
    res.status(200).json(data);
  } catch (err) {
    console.error("Error deleting tag:", err);
    res.status(500).json({ error: "Failed to delete tag" });
  }
});
// ****** ADMIN TAG TABLE END... ******



// ****** ADMIN ARTS TABLE ******

// Fetch all arts for admin with tags
app.get("/api/arts", async (req, res) => {
  try {
    const { data: arts, error } = await supabase
      .from("arts")
      .select(`
        art_id,
        artist:artist(artist_id, firstname, lastname),
        title,
        description,
        price,
        location,
        image_url,
        art_style,
        medium,
        subject,
        created_at,
        updated_at
      `);

    if (error) {
      console.error("Error fetching arts:", error);
      return res.status(400).json({ error: error.message });
    }

    const { data: artTags, error: tagsError } = await supabase
      .from("art_tags")
      .select("art_id, tags (name)");

    if (tagsError) {
      console.error("Error fetching tags:", tagsError);
      return res.status(400).json({ error: tagsError.message });
    }

    // Combine arts with their tags
    const artsWithTags = arts.map((art) => ({
      ...art,
      tags: artTags
        .filter((tag) => tag.art_id === art.art_id)
        .map((tag) => tag.tags.name),
    }));

    res.status(200).json(artsWithTags);
  } catch (err) {
    console.error("Unexpected error fetching arts:", err);
    res.status(500).json({ error: "Failed to fetch arts." });
  }
});

// ****** ADMIN ARTS TABLE END.... ******


// ****** BROWSE ARTIST ****** CURRENTLY WORKING (no view profile)
// API to fetch all artists
app.get("/artists", async (req, res) => {
  const CDNURL = "https://seaczeofjlkfcwnofbny.supabase.co/storage/v1/object/public/artist-profile/";

  try {
    const { data: artistsData, error: artistsError } = await supabase
      .from("artist")
      .select(`
        user_id,
        firstname,
        lastname,
        bio,
        gender,
        date_of_birth,
        email,
        role,
        address,
        phone,
        profile_image,
        verification_id
      `);

    if (artistsError) {
      console.error("Error fetching artists:", artistsError);
      return res.status(500).json({ error: "Failed to fetch artists." });
    }

    // Format artist data and fetch verification statuses
    const formattedArtists = await Promise.all(
      artistsData.map(async (artist) => {
        if (artist.profile_image) {
          artist.profile_image = `${CDNURL}${artist.user_id}/${artist.profile_image}`;
        }

        if (artist.verification_id) {
          const { data: verificationData, error: verificationError } = await supabase
            .from("artist_verification")
            .select("status")
            .eq("verification_id", artist.verification_id)
            .single();

          if (verificationError) {
            console.error(
              `Error fetching verification status for user ${artist.user_id}:`,
              verificationError
            );
            artist.status = null;
          } else {
            artist.status = verificationData?.status || null;
          }
        } else {
          artist.status = null;
        }

        return artist;
      })
    );

    res.status(200).json(formattedArtists);
  } catch (err) {
    console.error("Unexpected error fetching artists:", err);
    res.status(500).json({ error: "Unexpected server error." });
  }
});

// GET VIEW ARTIST PROFILE 
app.get("/view-artist-preferences/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const { data, error } = await supabase
      .from("artist_preferences")
      .select(
        "crafting, art_style_specialization, collaboration_type, preferred_medium, location_preference, crafting_techniques, budget_range, project_type, project_type_experience, preferred_project_duration, availability, client_type_preference, project_scale, portfolio_link, preferred_communication"
      )
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      console.warn(`Preferences not found for userId: ${userId}`);
      return res.status(200).json({
        message: "User haven't set up preferences yet.",
        preferences: null,
      });
    }

    // Return preferences as is (No need for JSON.parse here, as it's already stored as jsonb)
    res.status(200).json(data);
  } catch (err) {
    console.error("Error fetching preferences:", err);
    res.status(500).json({ error: "Failed to fetch preferences." });
  }
});
// GET VIEW ARTIST PROFILE END...

// ****** BROWSE ARTIST END... ****** CURRENTLY WORKING


// ****** BROWSE ARTS ****** CURRENTLY WORKING

// Fetch all arts
app.get('/arts', async (req, res) => {
  try {
    const { data: arts, error } = await supabase
      .from('arts')
      .select(`
        art_id,
        title,
        description,
        price,
        image_url,
        artist (
          firstname,
          lastname
        ),
        art_tags (
          tags (id, name)
        )
      `);

    if (error) {
      console.error('Error fetching arts:', error);
      return res.status(500).json({ error: 'Failed to fetch arts.' });
    }

    // Format the arts data to extract tag names
    const formattedArts = arts.map((art) => ({
      ...art,
      tags: art.art_tags.map((tagRelation) => ({
        id: tagRelation.tags.id,
        name: tagRelation.tags.name,
      })),
    }));

    res.status(200).json(formattedArts);
  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({ error: 'Unexpected server error.' });
  }
});

// WISHLIST FUNCTION

// Fetch Wishlist for the Logged-in User
app.get('/wishlist/:userId', async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required.' });
  }

  try {
    const { data, error } = await supabase
      .from('wishlist')
      .select('art_id')
      .eq('user_id', userId); // Fetch only the wishlist for the logged-in user

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch wishlist.' });
    }

    res.status(200).json(data.map((item) => item.art_id));
  } catch (err) {
    res.status(500).json({ error: 'Unexpected server error.' });
  }
});

// Add to Wishlist
app.post('/wishlist', async (req, res) => {
  const { userId, artId, action } = req.body;

  // Validate request payload
  if (!userId || !artId || !action) {
    return res.status(400).json({ error: 'User ID, Art ID, and action are required.' });
  }

  try {
    if (action === 'add') {
      // Insert both user_id and art_id into the table
      const { error } = await supabase
        .from('wishlist')
        .insert([{ user_id: userId, art_id: artId }]);

      if (error) {
        console.error("Error adding to wishlist:", error);
        return res.status(500).json({ error: 'Failed to add to wishlist.' });
      }

      return res.status(200).json({ message: 'Added to wishlist.' });
    } else if (action === 'remove') {
      // Remove based on user_id and art_id
      const { error } = await supabase
        .from('wishlist')
        .delete()
        .eq('user_id', userId)
        .eq('art_id', artId);

      if (error) {
        console.error("Error removing from wishlist:", error);
        return res.status(500).json({ error: 'Failed to remove from wishlist.' });
      }

      return res.status(200).json({ message: 'Removed from wishlist.' });
    }
  } catch (err) {
    console.error("Unexpected server error:", err);
    return res.status(500).json({ error: 'Unexpected server error.' });
  }
});

// DELETE endpoint to clear the entire wishlist for a user
app.delete('/wishlist/:userId/all', async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ error: "User ID is required." });
  }

  try {
    // Delete all wishlist entries for the user
    const { error } = await supabase
      .from("wishlist")
      .delete()
      .eq("user_id", userId);

    if (error) {
      console.error("Error clearing wishlist:", error);
      return res.status(500).json({ error: "Failed to clear wishlist." });
    }

    res.json({ message: "Wishlist cleared successfully." });
  } catch (err) {
    console.error("Unexpected error clearing wishlist:", err);
    res.status(500).json({ error: "Server error while clearing wishlist." });
  }
});
// WISHLIST FUNCTION END

// ARTDETAIL FUNCTION - FINAL CLEAN VERSION
app.get('/art/:artId', async (req, res) => {
  const { artId } = req.params;
  const CDN_URL = "https://seaczeofjlkfcwnofbny.supabase.co/storage/v1/object/public/artist-profile/";

  try {
    // Fetch art details with artist and tags relations
    const { data, error } = await supabase
      .from('arts')
      .select(
        `
        art_id, 
        title, 
        description, 
        price, 
        image_url, 
        subject,
        quantity,
        medium, 
        created_at,
        art_style,
        artist:artist_id (
          user_id,
          firstname, 
          lastname, 
          address,
          email,
          bio, 
          phone,
          profile_image
        ),
        art_tags (
          tags (
            id, 
            name
          )
        )
        `
      )
      .eq('art_id', artId)
      .single(); // Expecting a single result

    if (error || !data) {
      return res.status(404).json({ error: 'Art not found.' });
    }

    // Construct the full URL for the artist's profile image if available
    if (data.artist?.profile_image) {
      data.artist.profile_image = `${CDN_URL}${data.artist.user_id}/${data.artist.profile_image}`;
    }

    // Transform the nested tags structure
    const artDetails = {
      ...data,
      tags: data.art_tags ? data.art_tags.map((tagRelation) => tagRelation.tags) : [],
    };

    res.status(200).json(artDetails);
  } catch (err) {
    console.error("Error fetching art details:", err);
    res.status(500).json({ error: 'Failed to fetch art details.' });
  }
});
// ART DETAIL END...

// ****** BROWSE ARTS END... ****** (to be polish)


// ****** NAVBAR CART FUNCTION ****** CURRENTLY WORKING

// Fetch cart items for a user
app.get("/cart/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const { data, error } = await supabase
      .from("cart")
      .select("*, arts (title, image_url, price)")
      .eq("user_id", userId);

    if (error) return res.status(400).json({ error: error.message });

    res.status(200).json(data);
  } catch (err) {
    console.error("Error fetching cart items:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Add item to cart
app.post("/cart", async (req, res) => {
  const { userId, artId, quantity } = req.body;

  try {
    const { data, error } = await supabase
      .from("cart")
      .insert([{ user_id: userId, art_id: artId, quantity }]);

    if (error) return res.status(400).json({ error: error.message });

    res.status(201).json({ message: "Item added to cart", data });
  } catch (err) {
    console.error("Error adding item to cart:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Remove item from cart
app.delete("/cart/:userId/:artId", async (req, res) => {
  const { userId, artId } = req.params;

  try {
    const { error } = await supabase
      .from("cart")
      .delete()
      .eq("user_id", userId)
      .eq("art_id", artId);

    if (error) return res.status(400).json({ error: error.message });

    res.status(200).json({ message: "Item removed from cart" });
  } catch (err) {
    console.error("Error removing item from cart:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ****** NAVBAR CART FUNCTION END... ****** CURRENTLY WORKING

// ****** Client Side ******** CURRENTLY WORKING
// Get Client Profile
app.get("/client-profile/:userId", async (req, res) => {
  const { userId } = req.params;
  const CDNURL = "https://seaczeofjlkfcwnofbny.supabase.co/storage/v1/object/public/client-profile/";

  try {
    const { data: clientData, error: clientError } = await supabase
      .from("client")
      .select("firstname, lastname, bio, gender, date_of_birth, email, role, address, phone, profile_image")
      .eq("user_id", userId)
      .single();

    if (clientError || !clientData) {
      console.error("Error fetching client profile:", clientError);
      return res.status(404).json({ error: "Client profile not found." });
    }

    if (clientData.profile_image) {
      clientData.profile_image = `${CDNURL}${userId}/${clientData.profile_image}`;
    }

    res.status(200).json(clientData);
  } catch (err) {
    console.error("Error fetching client profile:", err);
    res.status(500).json({ error: "Failed to fetch client profile." });
  }
});

// Get Client Preferences
app.get("/client-preferences/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const { data, error } = await supabase
      .from("client_preferences")
      .select(
        "preferred_art_style, project_requirements, budget_range, location_requirement, timeline, artist_experience_level, communication_preferences, project_type"
      )
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      console.warn(`Preferences not found for userId: ${userId}`);
      return res.status(200).json({
        message: "You haven't set up your preferences yet.",
        preferences: null,
      });
    }

    // Return preferences as is (No need for JSON.parse here, as it's already stored as jsonb)
    res.status(200).json(data);
  } catch (err) {
    console.error("Error fetching preferences:", err);
    res.status(500).json({ error: "Failed to fetch preferences." });
  }
});

// Profile Update Endpoint
app.put("/client-profile", async (req, res) => {
  const { userId, profile, preferences } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "User ID is required." });
  }

  try {
    if (profile && Object.keys(profile).length > 0) {
      const { error: profileError } = await supabase
        .from("client")
        .update(profile)
        .eq("user_id", userId);

      if (profileError) {
        console.error("Error updating client profile:", profileError);
        return res.status(500).json({ error: "Failed to update client profile." });
      }
    }

    if (preferences && Object.keys(preferences).length > 0) {
      const { data: existingPreferences, error: fetchError } = await supabase
        .from("client_preferences")
        .select("preferences_id")
        .eq("user_id", userId)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        console.error("Error fetching preferences:", fetchError);
        return res.status(500).json({ error: "Failed to fetch preferences." });
      }

      if (existingPreferences) {
        const { error: updateError } = await supabase
          .from("client_preferences")
          .update(preferences)
          .eq("preferences_id", existingPreferences.preferences_id);

        if (updateError) {
          console.error("Error updating preferences:", updateError);
          return res.status(500).json({ error: "Failed to update preferences." });
        }
      } else {
        const { error: insertError } = await supabase
          .from("client_preferences")
          .insert({ user_id: userId, ...preferences });

        if (insertError) {
          console.error("Error inserting preferences:", insertError);
          return res.status(500).json({ error: "Failed to insert preferences." });
        }
      }
    }

    res.status(200).json({ message: "Profile and preferences updated successfully." });
  } catch (err) {
    console.error("Unexpected error updating profile/preferences:", err);
    res.status(500).json({ error: "Failed to update profile or preferences." });
  }
});


// ****** PAYMENT ORDER (PHOEBE START HERE) ****** CURRENTLY WORKING

// Fetch user details for pre-filling shipping info
app.get("/user/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    // Check if user exists in the "artist" table
    let { data: artistData, error: artistError } = await supabase
      .from("artist")
      .select("firstname, lastname, phone, address")
      .eq("user_id", userId)
      .maybeSingle();

    if (artistError) {
      console.error("Supabase artist query error:", artistError.message);
    }

    if (artistData) {
      return res.status(200).json(artistData);
    }

    // If not found in "artist", check in the "client" table
    let { data: clientData, error: clientError } = await supabase
      .from("client")
      .select("firstname, lastname, phone, address")
      .eq("user_id", userId)
      .maybeSingle();

    if (clientError) {
      console.error("Supabase client query error:", clientError.message);
    }

    if (clientData) {
      return res.status(200).json(clientData);
    }

    // If user is not found in either table
    return res.status(404).json({ error: "User not found." });
  } catch (err) {
    console.error("Error fetching user details:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Paymongo payment intent
app.post('/create-payment-intent', async (req, res) => {
    const { amount, currency } = req.body;

    try {
        const response = await axios.post(
            `${process.env.VITE_PAYMONGO_URL}/payment_intents`,
            {
                data: {
                    attributes: {
                        amount,
                        payment_method_allowed: ["qrph",
                            "card",
                            "dob",
                            "paymaya",
                            "billease",
                            "gcash",
                            "grab_pay"],
                        payment_method_options: {
                            card: {
                                request_three_d_secure: 'any'
                            }
                        },
                        currency
                    }
                }
            },
            {
                headers: {
                    Authorization: `Basic ${Buffer.from(process.env.VITE_PAYMONGO_SECRET_KEY).toString('base64')}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        res.status(200).json(response.data.data.attributes.client_key);
    } catch (error) {
        if (error.response) {
            console.error('Error creating payment intent:', error.response.data);
            res.status(500).json({ error: 'Failed to create payment intent' });
        } else {
            console.error('Error creating payment intent:', error.message);
            res.status(500).json({ error: 'Failed to create payment intent' });
        }
    }
});

//Paymongo checkout session 
app.post('/create-checkout-session', async (req, res) => {
    const { amount, currency, description, email, name } = req.body;

    try {
        const response = await axios.post(
            'https://api.paymongo.com/v1/checkout_sessions',
            {
                data: {
                    attributes: {
                        billing: {
                            email,
                            name,
                        },
                        line_items: [
                            {
                                amount,
                                currency,
                                description,
                                name,
                                quantity: 1,
                            },
                        ],
                        payment_method_types: ['card', 'gcash'],
                        success_url: 'http://localhost:5173/success', // Update with your success URL
                        cancel_url: 'http://localhost:5173/checkout' // Update with your cancel URL
                    }
                }
            },
            {
                headers: {
                    Authorization: `Basic ${Buffer.from(process.env.VITE_PAYMONGO_SECRET_KEY + ':').toString('base64')}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        res.status(200).json(response.data.data.attributes.checkout_url);
    } catch (error) {
        if (error.response) {
            console.error('Error creating checkout session:', error.response.data);
            res.status(500).json({ error: 'Failed to create checkout session' });
        } else {
            console.error('Error creating checkout session:', error.message);
            res.status(500).json({ error: 'Failed to create checkout session' });
        }
    }
});

// ****** PAYMENT ORDER (PHOEBE START HERE) END... ****** CURRENTLY WORKING

