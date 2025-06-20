require("dotenv").config({ path: ".env.local" });
const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const axios = require("axios");
const { galeShapleyArtist } = require("./utils/galeShapleyArtist");
const { galeShapleyClient } = require("./utils/galeShapleyClient");

const app = express();
const PORT = process.env.PORT || 8081;

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://craftify-react-git-main-myjeydsss-projects.vercel.app",
  "https://craftify-react.vercel.app",
  "https://craftify-react.onrender.com",
  "https://icraftify.com",
];

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
  })
);

app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_API_KEY
);

const Paymongo = require("paymongo");
const paymongo = new Paymongo(process.env.VITE_PAYMONGO_SECRET_KEY);

// === Helper: PayMongo Headers ===
const getPayMongoHeaders = () => ({
  Authorization: `Basic ${Buffer.from(
    process.env.VITE_PAYMONGO_SECRET_KEY + ":"
  ).toString("base64")}`,
  "Content-Type": "application/json",
});

app.get("/", (req, res) => {
  res.send("Supabase API is running...");
});

const storage = multer.memoryStorage();
const upload = multer({ storage });

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

// ****** REGISTER USER ******
app.post("/register", async (req, res) => {
  const { email, password, firstName, lastName, username, role } = req.body;

  if (!email || !password || !firstName || !lastName || !username || !role) {
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      console.error("Supabase Auth Error:", error.message);
      return res.status(400).json({ error: error.message });
    }

    const user = data.user;
    if (!user) {
      return res.status(400).json({ error: "User  registration failed." });
    }

    const table = role === "Artist" ? "artist" : "client";

    const { error: insertError } = await supabase.from(table).insert({
      user_id: user.id,
      firstname: firstName,
      lastname: lastName,
      email,
      username,
      role,
      bio: "",
    });

    if (insertError) {
      console.error("Database Insert Error:", insertError.message);
      return res.status(500).json({ error: insertError.message });
    }

    res.status(201).json({ message: "User  registered successfully!" });
  } catch (err) {
    console.error("Unexpected Error:", err.message);
    res
      .status(500)
      .json({ error: "An unexpected error occurred. Please try again." });
  }
});

// Check if email is already registered
app.get("/check-email", async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: "Email is required." });
  }

  try {
    const { data, error } = await supabase
      .from("users")
      .select("email")
      .eq("email", email);

    if (error) {
      return res.status(500).json({ error: "Error checking email." });
    }

    const emailExists = data.length > 0;
    res.status(200).json({ exists: emailExists });
  } catch (err) {
    console.error("Unexpected error:", err);
    res.status(500).json({ error: "An unexpected error occurred." });
  }
});
// ****** REGISTER USER END... ******

// ****** LOGIN USER ******
app.post("/login", async (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: identifier,
      password,
    });

    if (error || !data.user) {
      return res
        .status(401)
        .json({ error: error?.message || "Invalid credentials." });
    }

    const userId = data.user.id;
    return res.status(200).json({ userId });
  } catch (err) {
    res.status(500).json({ error: "Login failed. Please try again later." });
  }
});
// ****** LOGIN USER END... ******

// ****** PASSWORD RESET ******
app.post("/password-reset", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required." });
  }

  // Dynamically choose the redirect URL based on the environment
  const redirectUrl =
    process.env.NODE_ENV === "production"
      ? "https://icraftify.com/update-password"
      : process.env.NODE_ENV === "vercel-production"
      ? "https://craftify-react.vercel.app/update-password"
      : "http://localhost:5173/update-password";

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) {
      console.error("Password Reset Error:", error.message);
      return res.status(400).json({ error: error.message });
    }

    res
      .status(200)
      .json({ message: "Password reset email sent successfully." });
  } catch (err) {
    console.error("Unexpected Error:", err.message);
    res
      .status(500)
      .json({ error: "An unexpected error occurred. Please try again." });
  }
});
// ****** PASSWORD RESET END... ******

// ****** UPDATE PASSWORD ******
app.post("/update-password", async (req, res) => {
  const { newPassword, token } = req.body; // Ensure you are receiving the token

  if (!newPassword) {
    return res.status(400).json({ error: "New password is required." });
  }

  try {
    // Validate the token here if necessary
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      console.error("Update Password Error:", error.message);
      return res.status(400).json({ error: error.message });
    }

    res.status(200).json({ message: "Password updated successfully." });
  } catch (err) {
    console.error("Unexpected Error:", err.message);
    res
      .status(500)
      .json({ error: "An unexpected error occurred. Please try again." });
  }
});
// ****** UPDATE PASSWORD END... ******

// ****** NAVBAR ENDPOINT ******
app.get("/user-role/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const roleTables = [
      { table: "artist", label: "Artist" },
      { table: "client", label: "Client" },
      { table: "admin", label: "Admin" },
    ];

    for (const { table, label } of roleTables) {
      const { data, error } = await supabase
        .from(table)
        .select("user_id")
        .eq("user_id", userId)
        .maybeSingle(); // ✅ safer than `.single()`

      if (error) {
        console.error(`Error checking role in ${table}:`, error);
        continue;
      }

      if (data) {
        return res.status(200).json({ role: label });
      }
    }

    return res.status(404).json({ error: "User role not found." });
  } catch (err) {
    console.error("Unexpected error in /user-role:", err);
    res.status(500).json({ error: "Server error." });
  }
});

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
const UPLOADS_DIR = path.join(__dirname, "uploads/artist-profile");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Serve static files for uploaded images
app.use("/uploads", express.static(UPLOADS_DIR));

app.post(
  "/upload-profile-image/:userId",
  upload.single("file"),
  async (req, res) => {
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
        return res
          .status(500)
          .json({ error: "Failed to upload image to Supabase." });
      }

      console.log(
        "File uploaded to Supabase successfully:",
        `${userId}/${storageFilePath}`
      );

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
      res
        .status(500)
        .json({ error: "An unexpected error occurred during file upload." });
    }
  }
);
// ****** ARTIST UPLOAD PROFILE IMAGE END... ******

// ****** CLIENT UPLOAD PROFILE IMAGE ******
const CLIENT_UPLOADS_DIR = path.join(__dirname, "uploads/client-profile");
if (!fs.existsSync(CLIENT_UPLOADS_DIR)) {
  fs.mkdirSync(CLIENT_UPLOADS_DIR, { recursive: true });
}

app.use("/uploads/client-profile", express.static(CLIENT_UPLOADS_DIR));

app.post(
  "/upload-client-profile-image/:userId",
  upload.single("file"),
  async (req, res) => {
    const { userId } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded." });
    }

    try {
      const originalFileName = req.file.originalname;
      const storageFilePath = `${Date.now()}-${originalFileName}`;

      console.log("Uploading file:", storageFilePath);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("client-profile")
        .upload(`${userId}/${storageFilePath}`, req.file.buffer, {
          contentType: req.file.mimetype,
          cacheControl: "3600",
        });

      if (uploadError) {
        console.error("Supabase storage upload error:", uploadError);
        return res
          .status(500)
          .json({ error: "Failed to upload image to Supabase." });
      }

      console.log(
        "File uploaded to Supabase successfully:",
        `${userId}/${storageFilePath}`
      );

      const { data: clientData, error: fetchError } = await supabase
        .from("client")
        .select("profile_image")
        .eq("user_id", userId)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        console.error("Error fetching client profile:", fetchError);
        throw fetchError;
      }

      const oldProfileImage = clientData?.profile_image;

      if (oldProfileImage) {
        const { error: deleteError } = await supabase.storage
          .from("client-profile")
          .remove([`${userId}/${oldProfileImage}`]);

        if (deleteError) {
          console.error("Error deleting old profile image:", deleteError);
        } else {
          console.log("Old profile image deleted successfully.");
        }
      }

      const { error: updateError } = await supabase
        .from("client")
        .update({ profile_image: storageFilePath })
        .eq("user_id", userId);

      if (updateError) {
        console.error("Error updating client profile:", updateError);
        throw updateError;
      }

      console.log("Client profile updated successfully.");
      res.status(200).json({ fileName: storageFilePath });
    } catch (err) {
      console.error("Unexpected error during upload:", err);
      res
        .status(500)
        .json({ error: "An unexpected error occurred during file upload." });
    }
  }
);
// ****** CLIENT UPLOAD PROFILE IMAGE END... ******

// ****** ARTIST PROFILE ENDPOINT ******
// Get Artist Profile
app.get("/artist-profile/:userId", async (req, res) => {
  const { userId } = req.params;
  const CDNURL =
    "https://seaczeofjlkfcwnofbny.supabase.co/storage/v1/object/public/artist-profile/";

  try {
    const { data: artistData, error: artistError } = await supabase
      .from("artist")
      .select(
        "user_id, firstname, lastname, bio, gender, date_of_birth, email, role, address, phone, profile_image, verification_id"
      )
      .eq("user_id", userId)
      .single();

    if (artistError || !artistData) {
      console.error("Error fetching artist profile:", artistError);
      return res.status(404).json({ error: "Artist profile not found." });
    }

    if (artistData.verification_id) {
      const { data: verificationData, error: verificationError } =
        await supabase
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

    if (artistData.profile_image) {
      artistData.profile_image = `${CDNURL}${userId}/${artistData.profile_image}`;
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
      return res.status(200).json({ preferences: null });
    }

    res.status(200).json(data);
  } catch (err) {
    console.error("Error fetching preferences:", err);
    res.status(500).json({ error: "Failed to fetch preferences." });
  }
});

// Endpoint to create default preferences for an artist
app.post("/artist-preferences/create-default", async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "User ID is required." });
  }

  try {
    // Check if preferences already exist
    const { data: existingPreferences, error: fetchError } = await supabase
      .from("artist_preferences")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (existingPreferences) {
      return res.status(200).json({ message: "Preferences already exist." });
    }

    // Create default preferences
    const defaultPreferences = {
      user_id: userId,
      crafting: "",
      art_style_specialization: [],
      collaboration_type: "",
      preferred_medium: [],
      location_preference: "",
      crafting_techniques: [],
      budget_range: "",
      project_type: "",
      project_type_experience: "",
      preferred_project_duration: "",
      availability: "",
      client_type_preference: "",
      project_scale: "",
      portfolio_link: "",
      preferred_communication: [],
    };

    const { error: insertError } = await supabase
      .from("artist_preferences")
      .insert(defaultPreferences);

    if (insertError) {
      console.error("Error creating default preferences:", insertError);
      return res
        .status(500)
        .json({ error: "Failed to create default preferences." });
    }

    res
      .status(201)
      .json({ message: "Default preferences created successfully." });
  } catch (err) {
    console.error("Unexpected error:", err);
    res.status(500).json({ error: "An unexpected error occurred." });
  }
});

app.put("/artist-profile", async (req, res) => {
  const { userId, profile, preferences } = req.body;

  // Validate userId
  if (!userId) {
    return res.status(400).json({ error: "User  ID is required." });
  }

  try {
    // Fetch existing artist profile
    const { data: existingProfile, error: fetchProfileError } = await supabase
      .from("artist")
      .select(
        "firstname, lastname, bio, gender, date_of_birth, email, role, address, phone, profile_image"
      )
      .eq("user_id", userId)
      .single();

    if (fetchProfileError || !existingProfile) {
      console.error("Error fetching existing profile:", fetchProfileError);
      return res.status(404).json({ error: "Artist profile not found." });
    }

    // Determine the updated profile image
    const updatedProfileImage =
      profile.profile_image && !profile.profile_image.includes("http")
        ? profile.profile_image
        : existingProfile.profile_image;

    // Prepare updated profile data
    const updatedProfile = {
      firstname: profile.firstname || existingProfile.firstname,
      lastname: profile.lastname || existingProfile.lastname,
      bio: profile.bio || existingProfile.bio,
      gender: profile.gender || existingProfile.gender,
      date_of_birth: profile.date_of_birth || existingProfile.date_of_birth,
      email: profile.email || existingProfile.email,
      role: profile.role || existingProfile.role,
      address: profile.address || existingProfile.address,
      phone: profile.phone || existingProfile.phone,
      profile_image: updatedProfileImage,
    };

    // Update artist profile in the database
    const { error: profileUpdateError } = await supabase
      .from("artist")
      .update(updatedProfile)
      .eq("user_id", userId);

    if (profileUpdateError) {
      console.error("Error updating artist profile:", profileUpdateError);
      return res
        .status(500)
        .json({ error: "Failed to update artist profile." });
    }

    // Handle preferences if provided
    if (preferences && Object.keys(preferences).length > 0) {
      const { data: existingPreferences, error: fetchPreferencesError } =
        await supabase
          .from("artist_preferences")
          .select("*")
          .eq("user_id", userId)
          .single();

      if (fetchPreferencesError && fetchPreferencesError.code !== "PGRST116") {
        console.error(
          "Error fetching existing preferences:",
          fetchPreferencesError
        );
        return res
          .status(500)
          .json({ error: "Failed to fetch existing preferences." });
      }

      const updatedPreferences = {
        ...(existingPreferences || {}),
        ...preferences,
      };

      // Update or insert preferences
      if (existingPreferences) {
        const { error: updateError } = await supabase
          .from("artist_preferences")
          .update(updatedPreferences)
          .eq("user_id", userId);

        if (updateError) {
          console.error("Error updating preferences:", updateError);
          return res
            .status(500)
            .json({ error: "Failed to update preferences." });
        }
      } else {
        const { error: insertError } = await supabase
          .from("artist_preferences")
          .insert({ user_id: userId, ...updatedPreferences });

        if (insertError) {
          console.error("Error inserting preferences:", insertError);
          return res
            .status(500)
            .json({ error: "Failed to insert preferences." });
        }
      }
    }

    // Successful response
    res
      .status(200)
      .json({ message: "Profile and preferences updated successfully." });
  } catch (err) {
    console.error("Unexpected error updating profile/preferences:", err);
    res.status(500).json({ error: "An unexpected error occurred." });
  }
});
// ****** ARTIST UPLOAD VERIFICATION END... ******

// ****** ADMIN USER ENDPOINT ******
// Get Admin Profile
app.get("/admin-profile/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const { data: adminData, error: adminError } = await supabase
      .from("admin")
      .select("firstname, lastname, username, email, role")
      .eq("user_id", userId)
      .single();

    if (adminError || !adminData) {
      console.error("Error fetching admin profile:", adminError);
      return res.status(404).json({ error: "Admin profile not found." });
    }

    res.status(200).json(adminData);
  } catch (err) {
    console.error("Error fetching admin profile:", err);
    res.status(500).json({ error: "Failed to fetch admin profile." });
  }
});

// EDIT ADMIN PROFILE
// Update Admin Profile
app.put("/admin-profile", async (req, res) => {
  const { userId, profile } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "User  ID is required." });
  }

  try {
    const { data: existingProfile, error: fetchProfileError } = await supabase
      .from("admin")
      .select("firstname, lastname, username, email, role")
      .eq("user_id", userId)
      .single();

    if (fetchProfileError || !existingProfile) {
      console.error("Error fetching existing profile:", fetchProfileError);
      return res
        .status(500)
        .json({ error: "Failed to fetch existing profile." });
    }

    const updatedProfile = {
      firstname: profile.firstname || existingProfile.firstname,
      lastname: profile.lastname || existingProfile.lastname,
      username: profile.username || existingProfile.username,
      email: profile.email || existingProfile.email,
      role: profile.role || existingProfile.role,
    };

    // Update the profile in the database
    const { error: profileError } = await supabase
      .from("admin")
      .update(updatedProfile)
      .eq("user_id", userId);

    if (profileError) {
      console.error("Error updating admin profile:", profileError);
      return res.status(500).json({ error: "Failed to update admin profile." });
    }

    res.status(200).json({ message: "Admin profile updated successfully." });
  } catch (err) {
    console.error("Unexpected error updating profile:", err);
    res.status(500).json({ error: "An unexpected error occurred." });
  }
});

// ****** ADMIN USER ENDPOINT END... ******

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
      .in(
        "art_id",
        arts.map((art) => art.art_id)
      );

    if (artTagsError)
      return res.status(400).json({ error: artTagsError.message });

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
    const supabaseTransaction = supabase;

    const { error: tagsDeleteError } = await supabaseTransaction
      .from("art_tags")
      .delete()
      .eq("art_id", artId);

    if (tagsDeleteError) {
      console.error("Error deleting related tags:", tagsDeleteError);
      return res.status(400).json({ error: "Failed to delete related tags." });
    }

    const { error: artDeleteError } = await supabaseTransaction
      .from("arts")
      .delete()
      .eq("art_id", artId);

    if (artDeleteError) {
      console.error("Error deleting art:", artDeleteError);
      return res.status(400).json({ error: "Failed to delete the art." });
    }

    res.status(200).json({ message: "Art deleted successfully." });
  } catch (err) {
    console.error("Unexpected error during deletion:", err);
    res
      .status(500)
      .json({ error: "An unexpected error occurred while deleting the art." });
  }
});

// ****** UPDATE ART ******
app.put("/api/arts/:artId", async (req, res) => {
  const { artId } = req.params;
  const {
    title,
    description,
    price,
    quantity,
    location,
    art_style,
    medium,
    subject,
    tags,
  } = req.body;

  try {
    const { error: updateError } = await supabase
      .from("arts")
      .update({
        title,
        description,
        price: price ? parseFloat(price) : null,
        quantity: quantity ? parseFloat(quantity) : null,
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

    if (tags) {
      let tagList = [];
      try {
        tagList = JSON.parse(tags);
        if (!Array.isArray(tagList)) {
          throw new Error("Tags must be an array.");
        }
      } catch (parseError) {
        console.error("Error parsing tags:", parseError);
        return res
          .status(400)
          .json({ error: "Invalid tags format. Must be a JSON array." });
      }

      const { error: deleteTagsError } = await supabase
        .from("art_tags")
        .delete()
        .eq("art_id", artId);

      if (deleteTagsError) {
        console.error("Error deleting old tags:", deleteTagsError);
        return res.status(400).json({ error: deleteTagsError.message });
      }

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
    res
      .status(500)
      .json({ error: "An unexpected error occurred while updating the art." });
  }
});

app.get("/api/art/:artId", async (req, res) => {
  const { artId } = req.params;

  try {
    const { data: art, error } = await supabase
      .from("arts")
      .select("*")
      .eq("art_id", artId)
      .single();

    if (error || !art) return res.status(404).json({ error: "Art not found." });

    const { data: artTags, error: tagError } = await supabase
      .from("art_tags")
      .select("tag_id, tags (name)")
      .eq("art_id", artId);

    if (tagError) return res.status(400).json({ error: tagError.message });

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

app.post("/api/upload-art", upload.single("file"), async (req, res) => {
  const {
    title,
    description,
    price,
    quantity,
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

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("artist-arts")
      .upload(storageFilePath, file.buffer, {
        contentType: file.mimetype,
        cacheControl: "3600",
      });

    if (uploadError) {
      console.error("Supabase storage upload error:", uploadError);
      return res
        .status(500)
        .json({ error: "Failed to upload image to Supabase." });
    }

    console.log("File uploaded to Supabase successfully:", storageFilePath);

    const { data: publicUrlData, error: publicUrlError } = supabase.storage
      .from("artist-arts")
      .getPublicUrl(storageFilePath);

    if (publicUrlError) {
      console.error("Error generating public URL:", publicUrlError);
      return res
        .status(500)
        .json({ error: "Failed to generate public URL for image." });
    }

    const publicURL = publicUrlData.publicUrl;
    console.log("Public URL generated successfully:", publicURL);

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

    const { data: insertedArt, error: insertError } = await supabase
      .from("arts")
      .insert({
        user_id: userId,
        artist_id: artistId,
        title,
        description,
        price: parseFloat(price),
        quantity,
        location,
        art_style,
        medium,
        subject,
        image_url: publicURL,
        created_at: new Date(),
      })
      .select();

    if (insertError) {
      console.error("Insert Error:", insertError);
      return res.status(400).json({ error: insertError.message });
    }

    const newArtId = insertedArt[0].art_id;

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
  const CDNURL =
    "https://seaczeofjlkfcwnofbny.supabase.co/storage/v1/object/public/client-profile/";

  try {
    const { data: clientData, error: clientError } = await supabase
      .from("client")
      .select(
        "user_id, firstname, lastname, bio, gender, date_of_birth, email, role, address, phone, profile_image, verification_id"
      )
      .eq("user_id", userId)
      .single();

    if (clientError || !clientData) {
      console.error("Error fetching client profile:", clientError);
      return res.status(404).json({ error: "Client profile not found." });
    }

    // Include verification status if verification_id exists
    if (clientData.verification_id) {
      const { data: verificationData, error: verificationError } =
        await supabase
          .from("client_verification")
          .select("status")
          .eq("verification_id", clientData.verification_id)
          .single();

      if (verificationError) {
        console.error("Error fetching verification status:", verificationError);
      } else {
        clientData.status = verificationData?.status || null;
      }
    }

    // Attach CDN profile image URL
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
        "preferred_art_style, budget_range, location_requirement, timeline, artist_experience_level, communication_preferences, project_type"
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

// ****** EDIT CLIENT PROFILE ******
app.put("/client-profile", async (req, res) => {
  const { userId, profile, preferences } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "User ID is required." });
  }

  try {
    const { data: existingProfile, error: fetchProfileError } = await supabase
      .from("client")
      .select(
        "firstname, lastname, bio, gender, date_of_birth, email, role, address, phone, profile_image"
      )
      .eq("user_id", userId)
      .single();

    if (fetchProfileError || !existingProfile) {
      console.error("Error fetching existing profile:", fetchProfileError);
      return res
        .status(500)
        .json({ error: "Failed to fetch existing profile." });
    }

    let updatedProfileImage = existingProfile.profile_image;
    if (profile.profile_image) {
      updatedProfileImage = profile.profile_image.includes("http")
        ? existingProfile.profile_image
        : profile.profile_image;
    }

    const updatedProfile = {
      firstname: profile.firstname ?? existingProfile.firstname,
      lastname: profile.lastname ?? existingProfile.lastname,
      bio: profile.bio ?? existingProfile.bio,
      gender: profile.gender ?? existingProfile.gender,
      date_of_birth: profile.date_of_birth ?? existingProfile.date_of_birth,
      email: profile.email ?? existingProfile.email,
      role: profile.role ?? existingProfile.role,
      address: profile.address ?? existingProfile.address,
      phone: profile.phone ?? existingProfile.phone,
      profile_image: updatedProfileImage,
    };

    // Update the profile in the database
    const { error: profileError } = await supabase
      .from("client")
      .update(updatedProfile)
      .eq("user_id", userId);

    if (profileError) {
      console.error("Error updating client profile:", profileError);
      return res
        .status(500)
        .json({ error: "Failed to update client profile." });
    }

    if (preferences && Object.keys(preferences).length > 0) {
      const { data: existingPreferences, error: fetchPreferencesError } =
        await supabase
          .from("client_preferences")
          .select("*")
          .eq("user_id", userId)
          .single();

      if (fetchPreferencesError && fetchPreferencesError.code !== "PGRST116") {
        console.error(
          "Error fetching existing preferences:",
          fetchPreferencesError
        );
        return res
          .status(500)
          .json({ error: "Failed to fetch existing preferences." });
      }

      const updatedPreferences = {
        ...(existingPreferences || {}),
        ...preferences,
      };

      if (existingPreferences) {
        const { error: updateError } = await supabase
          .from("client_preferences")
          .update(updatedPreferences)
          .eq("user_id", userId);

        if (updateError) {
          console.error("Error updating preferences:", updateError);
          return res
            .status(500)
            .json({ error: "Failed to update preferences." });
        }
      } else {
        const { error: insertError } = await supabase
          .from("client_preferences")
          .insert({ user_id: userId, ...updatedPreferences });

        if (insertError) {
          console.error("Error inserting preferences:", insertError);
          return res
            .status(500)
            .json({ error: "Failed to insert preferences." });
        }
      }
    }

    res
      .status(200)
      .json({ message: "Profile and preferences updated successfully." });
  } catch (err) {
    console.error("Unexpected error updating profile/preferences:", err);
    res.status(500).json({ error: "An unexpected error occurred." });
  }
});
// ****** UPDATE CLIENT PROFILE END... ******

// create default client preferences
app.post("/client-preferences/create-default", async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "User ID is required." });
  }

  try {
    const { data: existingPreferences, error: fetchError } = await supabase
      .from("client_preferences")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (existingPreferences) {
      return res.status(200).json({ message: "Preferences already exist." });
    }

    const defaultPreferences = {
      user_id: userId,
      preferred_art_style: [],
      budget_range: "",
      location_requirement: "",
      timeline: "",
      artist_experience_level: "",
      communication_preferences: [],
      project_type: [],
    };

    const { error: insertError } = await supabase
      .from("client_preferences")
      .insert(defaultPreferences);

    if (insertError) {
      console.error("Error creating default preferences:", insertError);
      return res
        .status(500)
        .json({ error: "Failed to create default preferences." });
    }

    res
      .status(201)
      .json({ message: "Default preferences created successfully." });
  } catch (err) {
    console.error("Unexpected error:", err);
    res.status(500).json({ error: "An unexpected error occurred." });
  }
});
// ****** CLIENT PROFILE ENDPOINT END... *******

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
      isVerified: verifiedUsers.some(
        (verified) => verified.user_id === artist.user_id
      ),
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
    const { data: existingTags } = await supabase
      .from("tags")
      .select("*")
      .eq("name", name);

    if (existingTags.length > 0) {
      return res.status(409).json({ error: "Tag already exists" });
    }

    const { data, error } = await supabase
      .from("tags")
      .insert({ name })
      .single();
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
    const { data: arts, error } = await supabase.from("arts").select(`
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

// ****** BROWSE ARTIST ******
// API to fetch all artists
app.get("/artists", async (req, res) => {
  const CDNURL =
    "https://seaczeofjlkfcwnofbny.supabase.co/storage/v1/object/public/artist-profile/";

  try {
    const { data: artistsData, error: artistsError } = await supabase.from(
      "artist"
    ).select(`
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

    const formattedArtists = await Promise.all(
      artistsData.map(async (artist) => {
        if (artist.profile_image) {
          artist.profile_image = `${CDNURL}${artist.user_id}/${artist.profile_image}`;
        }

        if (artist.verification_id) {
          const { data: verificationData, error: verificationError } =
            await supabase
              .from("artist_verification")
              .select("status, created_at") // INCLUDE created_at
              .eq("verification_id", artist.verification_id)
              .single();

          if (verificationError) {
            console.error(
              `Error fetching verification status for user ${artist.user_id}:`,
              verificationError
            );
            artist.status = null;
            artist.created_at = null;
          } else {
            artist.status = verificationData?.status || null;
            artist.created_at = verificationData?.created_at || null;
          }
        } else {
          artist.status = null;
          artist.created_at = null;
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

    res.status(200).json(data);
  } catch (err) {
    console.error("Error fetching preferences:", err);
    res.status(500).json({ error: "Failed to fetch preferences." });
  }
});
// GET VIEW ARTIST PROFILE END...

// ****** BROWSE ARTIST END... ****** CURRENTLY WORKING

// ****** BROWSE CLIENT ****** CURRENTLY WORKING
// API to fetch all clients
app.get("/clients", async (req, res) => {
  const CDNURL =
    "https://seaczeofjlkfcwnofbny.supabase.co/storage/v1/object/public/client-profile/";

  try {
    const { data: clientsData, error: clientsError } = await supabase.from(
      "client"
    ).select(`
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

    if (clientsError) {
      console.error("Error fetching clients:", clientsError);
      return res.status(500).json({ error: "Failed to fetch clients." });
    }

    const formattedClients = await Promise.all(
      clientsData.map(async (client) => {
        if (client.profile_image) {
          client.profile_image = `${CDNURL}${client.user_id}/${client.profile_image}`;
        }

        if (client.verification_id) {
          const { data: verificationData, error: verificationError } =
            await supabase
              .from("client_verification")
              .select("status, created_at")
              .eq("verification_id", client.verification_id)
              .single();

          if (verificationError) {
            console.error(
              `Error fetching verification for client ${client.user_id}:`,
              verificationError
            );
            client.status = null;
            client.created_at = null;
          } else {
            client.status = verificationData?.status || null;
            client.created_at = verificationData?.created_at || null;
          }
        } else {
          client.status = null;
          client.created_at = null;
        }

        return client;
      })
    );

    res.status(200).json(formattedClients);
  } catch (err) {
    console.error("Unexpected error fetching clients:", err);
    res.status(500).json({ error: "Unexpected server error." });
  }
});
// ****** BROWSE CLIENT END ******

// ****** BROWSE ARTS ******
// Fetch all arts
app.get("/arts", async (req, res) => {
  try {
    const { data: arts, error } = await supabase.from("arts").select(`
        art_id,
        title,
        description,
        price,
        quantity,
        art_style,
        medium,
        subject,
        created_at,
        image_url,
        artist (
          firstname,
          lastname,
          user_id
        ),
        art_tags (
          tags (id, name)
        )
      `);

    if (error) {
      console.error("Error fetching arts:", error);
      return res.status(500).json({ error: "Failed to fetch arts." });
    }

    const formattedArts = arts.map((art) => ({
      ...art,
      tags: art.art_tags.map((tagRelation) => ({
        id: tagRelation.tags.id,
        name: tagRelation.tags.name,
      })),
    }));

    res.status(200).json(formattedArts);
  } catch (err) {
    console.error("Unexpected error:", err);
    res.status(500).json({ error: "Unexpected server error." });
  }
});

// WISHLIST FUNCTION

// Fetch Wishlist for the Logged-in User
app.get("/wishlist/:userId", async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ error: "User ID is required." });
  }

  try {
    const { data, error } = await supabase
      .from("wishlist")
      .select("art_id")
      .eq("user_id", userId);

    if (error) {
      return res.status(500).json({ error: "Failed to fetch wishlist." });
    }

    res.status(200).json(data.map((item) => item.art_id));
  } catch (err) {
    res.status(500).json({ error: "Unexpected server error." });
  }
});

// Add to Wishlist
app.post("/wishlist", async (req, res) => {
  const { userId, artId, action } = req.body;

  if (!userId || !artId || !action) {
    return res
      .status(400)
      .json({ error: "User ID, Art ID, and action are required." });
  }

  try {
    if (action === "add") {
      const { error } = await supabase
        .from("wishlist")
        .insert([{ user_id: userId, art_id: artId }]);

      if (error) {
        console.error("Error adding to wishlist:", error);
        return res.status(500).json({ error: "Failed to add to wishlist." });
      }

      return res.status(200).json({ message: "Added to wishlist." });
    } else if (action === "remove") {
      const { error } = await supabase
        .from("wishlist")
        .delete()
        .eq("user_id", userId)
        .eq("art_id", artId);

      if (error) {
        console.error("Error removing from wishlist:", error);
        return res
          .status(500)
          .json({ error: "Failed to remove from wishlist." });
      }

      return res.status(200).json({ message: "Removed from wishlist." });
    }
  } catch (err) {
    console.error("Unexpected server error:", err);
    return res.status(500).json({ error: "Unexpected server error." });
  }
});

// DELETE endpoint to clear the entire wishlist for a user
app.delete("/wishlist/:userId/all", async (req, res) => {
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

// ARTs DETAIL FUNCTION - FINAL CLEAN VERSION
app.get("/art/:artId", async (req, res) => {
  const { artId } = req.params;
  const CDN_URL =
    "https://seaczeofjlkfcwnofbny.supabase.co/storage/v1/object/public/artist-profile/";

  try {
    const { data, error } = await supabase
      .from("arts")
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
      .eq("art_id", artId)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: "Art not found." });
    }

    if (data.artist?.profile_image) {
      data.artist.profile_image = `${CDN_URL}${data.artist.user_id}/${data.artist.profile_image}`;
    }

    const artDetails = {
      ...data,
      tags: data.art_tags
        ? data.art_tags.map((tagRelation) => tagRelation.tags)
        : [],
    };

    res.status(200).json(artDetails);
  } catch (err) {
    console.error("Error fetching art details:", err);
    res.status(500).json({ error: "Failed to fetch art details." });
  }
});
// ART DETAIL END...
// ****** BROWSE ARTS END... ****** (to be polish)

// ****** NAVBAR CART FUNCTION ****** CURRENTLY WORKING
// Fetch cart items for a user
app.get("/cart/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    debugger; // Add debugger here
    const { data, error } = await supabase
      .from("cart")
      .select(
        `
        *,
        arts (
          title,
          image_url,
          price,
          user_id,
          artist_id,
          artist:artist_id (
            username,
            firstname,
            lastname,
            address,
            phone
          )
        )
      `
      )
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
// ****** NAVBAR CART FUNCTION END... ******

// ****** PAYMENT ORDER (PHOEBE START HERE) ******
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

    // If not found in "artist", check in the "client" table
    let { data: adminData, error: adminError } = await supabase
      .from("admin")
      .select("firstname, lastname, role")
      .eq("user_id", userId)
      .maybeSingle();

    if (adminError) {
      console.error("Supabase client query error:", adminError.message);
    }

    if (adminData) {
      return res.status(200).json(adminData);
    }

    // If user is not found in either table
    return res.status(404).json({ error: "User not found." });
  } catch (err) {
    console.error("Error fetching user details:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Paymongo payment intent
app.post("/create-payment-intent", async (req, res) => {
  const { amount, currency } = req.body;

  try {
    const response = await axios.post(
      `${process.env.VITE_PAYMONGO_URL}/payment_intents`,
      {
        data: {
          attributes: {
            amount,
            payment_method_allowed: [
              "qrph",
              "card",
              "dob",
              "paymaya",
              "billease",
              "gcash",
              "grab_pay",
            ],
            payment_method_options: {
              card: {
                request_three_d_secure: "any",
              },
            },
            currency,
          },
        },
      },
      {
        headers: {
          Authorization: `Basic ${Buffer.from(
            process.env.VITE_PAYMONGO_SECRET_KEY
          ).toString("base64")}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.status(200).json(response.data.data.attributes.client_key);
  } catch (error) {
    if (error.response) {
      console.error("Error creating payment intent:", error.response.data);
      res.status(500).json({ error: "Failed to create payment intent" });
    } else {
      console.error("Error creating payment intent:", error.message);
      res.status(500).json({ error: "Failed to create payment intent" });
    }
  }
});

// Paymongo checkout session
app.post("/create-checkout-session", async (req, res) => {
  const { amount, currency, description, email, name } = req.body;

  try {
    const baseUrl =
      req.headers.origin || process.env.FRONTEND_URL || "https://icraftify.com";

    const response = await axios.post(
      `${process.env.VITE_PAYMONGO_URL}/checkout_sessions`,
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
            payment_method_types: ["card", "gcash"],
            success_url: `${baseUrl}/payment-art-success`,
            cancel_url: `${baseUrl}/payment-art-cancel`,
          },
        },
      },
      {
        headers: {
          Authorization: `Basic ${Buffer.from(
            process.env.VITE_PAYMONGO_SECRET_KEY + ":"
          ).toString("base64")}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.status(200).json(response.data.data.attributes.checkout_url);
  } catch (error) {
    if (error.response) {
      console.error("Error creating checkout session:", error.response.data);
      res.status(500).json({ error: "Failed to create checkout session" });
    } else {
      console.error("Error creating checkout session:", error.message);
      res.status(500).json({ error: "Failed to create checkout session" });
    }
  }
});

//Put the order in the database table orders
app.post("/order", async (req, res) => {
  const {
    user_id,
    status,
    user_email,
    user_name,
    payment_intent_id,
    checkout_url,
    items, // Expecting an array of items
  } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "No items provided for the order." });
  }

  try {
    console.log("Order payload:", {
      user_id: user_id,
      status: "pending",
      user_email: user_email,
      user_name: user_name,
      payment_intent_id: payment_intent_id,
      checkout_url: checkout_url,
      items: items, // Ensure this matches the server's expected format
    });
    // Map the items to create an array of order objects
    const orders = items.map((item) => ({
      user_id,
      status,
      user_email,
      user_name,
      amount: item.amount, // Amount specific to the item
      description: item.description,
      payment_intent_id,
      checkout_url,
      artist_id: item.artist_id,
      art_id: item.art_id,
    }));

    // Insert all orders into the database
    const { data, error } = await supabase.from("orders").insert(orders);

    if (error) {
      console.error("Error inserting orders:", error.message);
      return res.status(500).json({ error: "Failed to place orders." });
    }

    res
      .status(201)
      .json({ message: "Orders placed successfully.", orders: data });
  } catch (error) {
    console.error("Error processing orders:", error);
    res.status(500).json({ error: "Failed to process orders." });
  }
});

app.put("/order/:orderId", async (req, res) => {
  const { orderId } = req.params; // Get the order ID from the request parameters
  const { status } = req.body; // Get the new status from the request body

  if (!status) {
    return res.status(400).json({ error: "Status is required." });
  }
  console.log("Updating order with ID:", orderId);
  try {
    // Update the order status in the database
    const { data, error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", orderId)
      .select();

    if (error) {
      console.error("Error updating order status:", error.message);
      return res.status(500).json({ error: "Failed to update order status." });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ error: "Order not found." });
    }

    res
      .status(200)
      .json({ message: "Order status updated successfully.", order: data[0] });
  } catch (err) {
    console.error("Unexpected error updating order status:", err);
    res.status(500).json({ error: "Failed to update order status." });
  }
});
// ****** PAYMENT ORDER (PHOEBE START HERE) END... ******

// ***** BROWSE ARTIST MATCHING ALGORITHM ******

// ***** Utility Mapping for Davao Regions *****
const DavaoRegionCityMap = {
  "Davao del Sur": [
    "Bansalan",
    "Davao City",
    "Digos City",
    "Don Marcelino",
    "Hagonoy",
    "Jose Abad Santos",
    "Kiblawan",
    "Magsaysay",
    "Malalag",
    "Malita",
    "Matanao",
    "Padada",
    "Santa Cruz",
    "Santa Maria",
    "Sarangani",
    "Sulop",
  ],
  "Davao del Norte": [
    "Asuncion",
    "Braulio E. Dujali",
    "Carmen",
    "Island Garden City of Samal",
    "Kapalong",
    "New Corella",
    "Panabo City",
    "San Isidro",
    "Santo Tomas",
    "Tagum City",
    "Talaingod",
  ],
  "Davao de Oro": [
    "Compostela",
    "Laak (San Vicente)",
    "Mabini (Dona Alicia)",
    "Maco",
    "Maragusan (San Mariano)",
    "Mawab",
    "Monkayo",
    "Montivesta",
    "Nabunturan",
    "New Bataan",
    "Pantukan",
  ],
  "Davao Occidental": ["Don Marcelino", "Malita", "Santa Maria", "Sarangani"],
  "Davao Oriental": [
    "Baganga",
    "Banaybanay",
    "Boston",
    "Caraga",
    "Cateel",
    "Governor Generoso",
    "Lupon",
    "Manay",
    "Mati",
    "San Isidro",
    "Tarragona",
  ],
};

// ***** Utility Functions *****
function ensureArray(data) {
  if (Array.isArray(data)) return data;
  try {
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getRegion(location) {
  if (typeof location !== "string") return "";
  const parts = location.split(",").map((p) => p.trim());
  return parts[parts.length - 1] || "";
}

function getCity(location) {
  if (typeof location !== "string") return "";
  const parts = location.split(",").map((p) => p.trim());
  return parts.length >= 2 ? parts[parts.length - 2] : "";
}

function doesCityMatchRegion(city, region) {
  return (
    DavaoRegionCityMap[region] &&
    DavaoRegionCityMap[region].includes(city.trim())
  );
}

function normalizeArtStyle(style) {
  const styleMap = {
    "Geometric Art": "Geometric Patterns",
    "Pattern-Based Design": "Pattern-Based Art",
    "Craft & Handmade Art": "Handmade Crafts",
    Sculpture: "3D Art",
    Statues: "3D Art",
    "Digital Art & Illustrations": "Digital Art & Illustrations",
    "Beginner / Exploring Styles": "Beginner / Exploring Styles",
    "Open to All Styles": "Open to All Styles",
    "Furniture Making": "Handmade Crafts",
    Woodworking: "Handmade Crafts",
    "DIY Projects": "Handmade Crafts",
    Others: "Open to All Styles",
    Minimalist: "Modern Art",
    "Modern Art": "Modern Art",
  };
  return styleMap[style] || style;
}

// ***** Calculate Score with Enhanced Location Matching *****
function calculateScore(clientPrefs, artistPrefs, collaborativeBoost = 0) {
  let score = 0;

  try {
    const clientStyles = ensureArray(clientPrefs.preferred_art_style).map(
      normalizeArtStyle
    );
    const artistStyles = ensureArray(artistPrefs.art_style_specialization).map(
      normalizeArtStyle
    );

    const matchedStyles = clientStyles.filter((style) =>
      artistStyles.includes(style)
    );
    const styleScore = Math.min(matchedStyles.length, 3) * 10;
    score += styleScore;

    const clientRegion = getRegion(clientPrefs.address || "");
    const artistRegion = getRegion(artistPrefs.address || "");
    const clientCity = getCity(clientPrefs.address || "");
    const artistCity = getCity(artistPrefs.address || "");

    if (
      clientCity &&
      clientRegion &&
      artistCity &&
      artistRegion &&
      clientCity === artistCity &&
      clientRegion === artistRegion &&
      doesCityMatchRegion(clientCity, clientRegion) &&
      doesCityMatchRegion(artistCity, artistRegion)
    ) {
      score += 10;
    }

    if (clientPrefs.budget_range === artistPrefs.budget_range) {
      score += 10;
    }

    if (clientPrefs.timeline === artistPrefs.preferred_project_duration) {
      score += 5;
    }

    if (
      Array.isArray(clientPrefs.communication_preferences) &&
      clientPrefs.communication_preferences.includes(
        artistPrefs.preferred_communication
      )
    ) {
      score += 5;
    }

    if (
      Array.isArray(clientPrefs.project_type) &&
      clientPrefs.project_type.includes(artistPrefs.project_type)
    ) {
      score += 10;
    }

    if (clientPrefs.collaboration_type === artistPrefs.collaboration_type) {
      score += 5;
    }

    if (artistPrefs.client_type_preference === clientPrefs.client_type) {
      score += 5;
    }

    if (artistPrefs.project_scale === clientPrefs.project_scale) {
      score += 5;
    }

    score += Math.min(collaborativeBoost, 15);
  } catch (err) {
    console.warn("Error calculating score:", err);
  }

  return Math.round(score);
}

// Get Collaborative Filtering Scores based on user activity
async function getCollaborativeFilteringScores(userId) {
  const collaborativeScores = {};

  try {
    // Fetch user interactions: likes, comments, and visits
    const [likes, comments, visits] = await Promise.all([
      supabase.from("community_likes").select("post_id").eq("user_id", userId),
      supabase
        .from("community_comments")
        .select("post_id")
        .eq("user_id", userId),
      supabase
        .from("profile_visits")
        .select("visited_id")
        .eq("visitor_id", userId),
    ]);

    // Collect post ids from likes and comments to find common artists
    const postIds = [
      ...new Set([
        ...likes.data.map((item) => item.post_id),
        ...comments.data.map((item) => item.post_id),
      ]),
    ];

    // If no posts were interacted with, return empty scores
    if (postIds.length === 0) return {};

    // Find all artists who liked or commented on the same posts
    const { data: likedArtists } = await supabase
      .from("community_likes")
      .select("user_id")
      .in("post_id", postIds)
      .neq("user_id", userId);

    const { data: commentedArtists } = await supabase
      .from("community_comments")
      .select("user_id")
      .in("post_id", postIds)
      .neq("user_id", userId);

    // Merge artists who interacted with the same posts
    const allRecommendedArtists = [
      ...likedArtists,
      ...commentedArtists,
      ...visits.data.map((item) => ({ user_id: item.visited_id })),
    ];

    // Calculate scores for these artists based on the frequency of interactions
    allRecommendedArtists.forEach((artist) => {
      const artistId = artist.user_id;
      collaborativeScores[artistId] = (collaborativeScores[artistId] || 0) + 1;
    });

    console.log("Collaborative Filtering Scores:", collaborativeScores);
    return collaborativeScores;
  } catch (err) {
    console.error("Error in collaborative filtering:", err);
    return {};
  }
}

// Combine Collaborative Filtering Scores with Gale-Shapley Matching Algorithm
app.get("/match-artists/:userId", async (req, res) => {
  const { userId } = req.params;
  const ARTIST_CDN_URL =
    "https://seaczeofjlkfcwnofbny.supabase.co/storage/v1/object/public/artist-profile/";
  const CLIENT_CDN_URL =
    "https://seaczeofjlkfcwnofbny.supabase.co/storage/v1/object/public/client-profile/";

  try {
    // 1. Fetch the logged-in client and their preferences
    const { data: client } = await supabase
      .from("client")
      .select("*")
      .eq("user_id", userId)
      .single();
    const { data: clientPrefs } = await supabase
      .from("client_preferences")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (!client || !clientPrefs) {
      return res
        .status(404)
        .json({ error: "Client or preferences not found." });
    }

    const processedClient = {
      ...client,
      preferences: clientPrefs || {},
      profile_image: client.profile_image
        ? `${CLIENT_CDN_URL}${client.user_id}/${client.profile_image}`
        : null,
    };

    // 2. Fetch all artists and their preferences
    const { data: artists } = await supabase.from("artist").select("*");
    const { data: artistPrefsData } = await supabase
      .from("artist_preferences")
      .select("*");

    const artistPrefsMap = artistPrefsData.reduce((acc, pref) => {
      acc[pref.user_id] = pref;
      return acc;
    }, {});

    const processedArtists = artists
      .filter(
        (artist) =>
          artistPrefsMap[artist.user_id] &&
          Object.keys(artistPrefsMap[artist.user_id]).length > 0
      )
      .map((artist) => ({
        ...artist,
        preferences: artistPrefsMap[artist.user_id],
        profile_image: artist.profile_image
          ? `${ARTIST_CDN_URL}${artist.user_id}/${artist.profile_image}`
          : null,
      }));

    // 3. Fetch all clients to include in the preference matching (not just the logged-in user)
    const { data: clients } = await supabase.from("client").select("*");
    const { data: clientPrefsData } = await supabase
      .from("client_preferences")
      .select("*");

    const clientPrefsMap = clientPrefsData.reduce((acc, pref) => {
      acc[pref.user_id] = pref;
      return acc;
    }, {});

    const processedClients = clients
      .filter(
        (client) =>
          clientPrefsMap[client.user_id] &&
          Object.keys(clientPrefsMap[client.user_id]).length > 0
      )
      .map((client) => ({
        ...client,
        preferences: clientPrefsMap[client.user_id],
        profile_image: client.profile_image
          ? `${CLIENT_CDN_URL}${client.user_id}/${client.profile_image}`
          : null,
      }));

    // 4. Generate scores for each client-artist pair (Preference-based scores)
    const scores = {};
    processedArtists.forEach((artist) => {
      processedClients.forEach((client) => {
        const score = calculateScore(client.preferences, artist.preferences);
        if (!scores[client.user_id]) scores[client.user_id] = {};
        scores[client.user_id][artist.user_id] = score;
      });
    });

    // 5. Apply Gale-Shapley algorithm to find stable matches
    const matches = galeShapleyArtist(
      processedClients,
      processedArtists,
      scores
    );

    // 6. Get Collaborative Filtering scores for artists
    const collaborativeScores = await getCollaborativeFilteringScores(userId);

    // 7. Combine the preference-based and collaborative scores
    const maxRawBoost = Math.max(...Object.values(collaborativeScores), 1);

    const artistRankings = processedArtists.map((artist) => {
      const rawBoost = collaborativeScores[artist.user_id] || 0;
      const collaborativeBoost = Math.min((rawBoost / maxRawBoost) * 15, 15);

      // Recalculate clientStyles and artistStyles
      const clientStyles = ensureArray(
        processedClient.preferences.preferred_art_style
      ).map(normalizeArtStyle);

      const artistStyles = ensureArray(
        artist.preferences.art_style_specialization
      ).map(normalizeArtStyle);

      const combinedScore = calculateScore(
        processedClient.preferences,
        artist.preferences,
        collaborativeBoost
      );

      return {
        artistId: artist.user_id,
        score: combinedScore,
        artist,
        matchBreakdown: {
          matchedStyles: clientStyles.filter((style) =>
            artistStyles.includes(style)
          ),
          location: (() => {
            const clientRegion = getRegion(processedClient.address || "");
            const clientCity = getCity(processedClient.address || "");
            const artistRegion = getRegion(artist.address || "");
            const artistCity = getCity(artist.address || "");
            return (
              clientCity &&
              artistCity &&
              clientRegion &&
              artistRegion &&
              clientRegion === artistRegion &&
              clientCity === artistCity &&
              doesCityMatchRegion(clientCity, clientRegion) &&
              doesCityMatchRegion(artistCity, artistRegion)
            );
          })(),
          budget:
            processedClient.preferences.budget_range ===
            artist.preferences.budget_range,
          timeline:
            processedClient.preferences.timeline ===
            artist.preferences.preferred_project_duration,
          communication: Array.isArray(
            processedClient.preferences.communication_preferences
          )
            ? processedClient.preferences.communication_preferences.includes(
                artist.preferences.preferred_communication
              )
            : false,
          projectType: Array.isArray(processedClient.preferences.project_type)
            ? processedClient.preferences.project_type.includes(
                artist.preferences.project_type
              )
            : false,
          collaboration:
            processedClient.preferences.collaboration_type ===
            artist.preferences.collaboration_type,
          clientType:
            artist.preferences.client_type_preference ===
            processedClient.preferences.client_type,
          projectScale:
            artist.preferences.project_scale ===
            processedClient.preferences.project_scale,
          collaborativeBoost: collaborativeBoost,
        },
      };
    });

    artistRankings.sort((a, b) => b.score - a.score);

    // Log ranked clients list
    console.log("\n********** Ranked Artist List **********");
    artistRankings.forEach((ranked, index) => {
      console.log(
        `Rank ${index + 1}: ${ranked.artist.firstname} ${
          ranked.artist.lastname
        }, Combined Match Score: ${ranked.score}%`
      );
    });

    // 8. Format the response with all ranked artists including their combined scores
    const rankedMatches = artistRankings.map((ranked) => ({
      artist: {
        id: ranked.artist.user_id,
        name: `${ranked.artist.firstname} ${ranked.artist.lastname}`,
        role: ranked.artist.role,
        address: ranked.artist.address,
        profile_image: ranked.artist.profile_image,
        score: ranked.score,
        matchBreakdown: ranked.matchBreakdown,
      },
      client: {
        id: processedClient.user_id,
        name: `${processedClient.firstname} ${processedClient.lastname}`,
        role: processedClient.role,
        address: processedClient.address,
        profile_image: processedClient.profile_image,
      },
    }));

    // Filter matches to only include the logged-in user's final match
    const finalMatch = rankedMatches.find(
      (match) => match.client.id === processedClient.user_id
    );

    return res
      .status(200)
      .json({ matches: rankedMatches, stableMatches: matches, finalMatch });
  } catch (error) {
    console.error("Error in matching algorithm:", error);
    return res.status(500).json({ error: "Matching failed." });
  }
});
// ***** BROWSE ARTIST MATCHING ALGORITHM END... ******

// ***** BROWSE CLIENT MATCHING ALGORITHM ******
// Ensure the data is an array and provide a fallback for undefined or null values
function ensureArray1(data) {
  if (Array.isArray(data)) {
    return data;
  }
  if (data === undefined || data === null) {
    return []; // Return empty array if data is undefined or null
  }
  try {
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn("Error parsing data as array:", e);
    return [];
  }
}

function getRegion1(location1) {
  if (typeof location1 !== "string") return "";
  const parts = location1.split(",").map((p) => p.trim());
  return parts[parts.length - 1] || "";
}

function getCity1(location1) {
  if (typeof location1 !== "string") return "";
  const parts = location1.split(",").map((p) => p.trim());
  return parts.length >= 2 ? parts[parts.length - 2] : "";
}

function doesCityMatchRegion1(city1, region1) {
  return (
    DavaoRegionCityMap[region1] &&
    DavaoRegionCityMap[region1].includes(city1.trim())
  );
}

// Utility function to normalize and map similar art styles
function normalizeArtStyle1(style1) {
  const styleMap1 = {
    "Geometric Art": "Geometric Patterns",
    "Pattern-Based Design": "Pattern-Based Art",
    "Craft & Handmade Art": "Handmade Crafts",
    Sculpture: "3D Art",
    Statues: "3D Art",
    "Digital Art & Illustrations": "Digital Art & Illustrations",
    "Beginner / Exploring Styles": "Beginner / Exploring Styles",
    "Open to All Styles": "Open to All Styles",
    "Furniture Making": "Handmade Crafts",
    Woodworking: "Handmade Crafts",
    "DIY Projects": "Handmade Crafts",
    Others: "Open to All Styles",
    Minimalist: "Modern Art",
    "Modern Art": "Modern Art",
  };
  return styleMap1[style1] || style1;
}

// ***** Calculate Score based on Preferences ******
function calculateScore1(artistPrefs1, clientPrefs1, collaborativeBoost1 = 0) {
  let score1 = 0;

  try {
    console.log("Calculating score for client:");
    console.log("Client Preferences:", JSON.stringify(clientPrefs1));
    console.log("Artist Preferences:", JSON.stringify(artistPrefs1));

    const clientStyles1 = ensureArray1(clientPrefs1.preferred_art_style).map(
      normalizeArtStyle1
    );
    const artistStyles1 = ensureArray1(
      artistPrefs1.art_style_specialization
    ).map(normalizeArtStyle1);

    const matchedStyles1 = artistStyles1.filter((style1) =>
      clientStyles1.includes(style1)
    );

    const styleScore1 = Math.min(matchedStyles1.length, 3) * 10; // Max 30
    score1 += styleScore1;
    console.log(
      `Art Style Match Score: ${styleScore1} (for ${matchedStyles1.length} matched styles)`
    );

    const clientRegion1 = getRegion1(clientPrefs1.address || "");
    const artistRegion1 = getRegion1(artistPrefs1.address || "");
    const clientCity1 = getCity1(clientPrefs1.address || "");
    const artistCity1 = getCity1(artistPrefs1.address || "");

    if (
      clientCity1 &&
      clientRegion1 &&
      artistCity1 &&
      artistRegion1 &&
      clientCity1 === artistCity1 &&
      clientRegion1 === artistRegion1 &&
      doesCityMatchRegion1(clientCity1, clientRegion1) &&
      doesCityMatchRegion1(artistCity1, artistRegion1)
    ) {
      score1 += 10;
    }

    if (artistPrefs1.budget_range === clientPrefs1.budget_range) {
      score1 += 10;
      console.log("Budget Match Score: 10");
    }

    if (artistPrefs1.timeline === clientPrefs1.preferred_project_duration) {
      score1 += 5;
      console.log("Project Duration Match Score: 5");
    }

    if (
      Array.isArray(artistPrefs1.communication_preferences) &&
      artistPrefs1.communication_preferences.includes(
        clientPrefs1.preferred_communication
      )
    ) {
      score1 += 5;
      console.log("Communication Preference Match Score: 5");
    }

    if (
      Array.isArray(artistPrefs1.project_type) &&
      artistPrefs1.project_type.includes(clientPrefs1.project_type)
    ) {
      score1 += 10;
      console.log("Project Type Match Score: 10");
    }

    if (artistPrefs1.collaboration_type === clientPrefs1.collaboration_type) {
      score1 += 5;
      console.log("Collaboration Type Match Score: 5");
    }

    if (artistPrefs1.client_type === clientPrefs1.client_type_preference) {
      score1 += 5;
      console.log("Client Type Preference Match Score: 5");
    }

    if (artistPrefs1.project_scale === clientPrefs1.project_scale) {
      score1 += 5;
      console.log("Project Scale Match Score: 5");
    }

    score1 += Math.min(collaborativeBoost1, 15);
    console.log(
      `Collaborative Boost Score: ${Math.min(collaborativeBoost1, 15)}`
    );
    console.log(`Total Calculated Score for Artist: ${score1}`);
  } catch (err) {
    console.warn("Error calculating score:", err);
  }

  return Math.round(score1); // Total out of 100
}

// Get Collaborative Filtering Scores based on user activity
async function getCollaborativeFilteringScores1(userId) {
  const collaborativeScores1 = {};

  try {
    // Fetch user interactions: likes, comments, and visits
    const [likes, comments, visits] = await Promise.all([
      supabase.from("community_likes").select("post_id").eq("user_id", userId),
      supabase
        .from("community_comments")
        .select("post_id")
        .eq("user_id", userId),
      supabase
        .from("profile_visits")
        .select("visited_id")
        .eq("visitor_id", userId),
    ]);

    // Collect post ids from likes and comments to find common clients
    const postIds = [
      ...new Set([
        ...likes.data.map((item) => item.post_id),
        ...comments.data.map((item) => item.post_id),
      ]),
    ];

    // If no posts were interacted with, return empty scores
    if (postIds.length === 0) return {};

    // Find all clients who liked or commented on the same posts
    const { data: likedClients } = await supabase
      .from("community_likes")
      .select("user_id")
      .in("post_id", postIds)
      .neq("user_id", userId);

    const { data: commentedClients } = await supabase
      .from("community_comments")
      .select("user_id")
      .in("post_id", postIds)
      .neq("user_id", userId);

    // Merge clients who interacted with the same posts
    const allRecommendedClients = [
      ...likedClients,
      ...commentedClients,
      ...visits.data.map((item) => ({ user_id: item.visited_id })),
    ];

    // Calculate scores for these client based on the frequency of interactions
    allRecommendedClients.forEach((client) => {
      const clientId = client.user_id;
      collaborativeScores1[clientId] =
        (collaborativeScores1[clientId] || 0) + 1;
    });

    console.log("Collaborative Filtering Scores:", collaborativeScores1);
    return collaborativeScores1;
  } catch (err) {
    console.error("Error in collaborative filtering:", err);
    return {};
  }
}

app.get("/match-clients/:userId", async (req, res) => {
  const { userId } = req.params;

  const ARTIST_CDN_URL =
    "https://seaczeofjlkfcwnofbny.supabase.co/storage/v1/object/public/artist-profile/";
  const CLIENT_CDN_URL =
    "https://seaczeofjlkfcwnofbny.supabase.co/storage/v1/object/public/client-profile/";

  try {
    // 1. Fetch the logged-in artist and their preferences
    const { data: artist } = await supabase
      .from("artist")
      .select("*")
      .eq("user_id", userId)
      .single();

    const { data: artistPrefs1 } = await supabase
      .from("artist_preferences")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (!artist || !artistPrefs1) {
      return res
        .status(404)
        .json({ error: "Artist or preferences not found." });
    }

    const processedArtist1 = {
      ...artist,
      preferences: artistPrefs1 || {},
      profile_image: artist.profile_image
        ? `${ARTIST_CDN_URL}${artist.user_id}/${artist.profile_image}`
        : null,
    };

    // 2. Fetch all clients and their preferences
    const { data: clients } = await supabase.from("client").select("*");
    const { data: clientPrefsData1 } = await supabase
      .from("client_preferences")
      .select("*");

    const clientPrefsMap1 = clientPrefsData1.reduce((acc, pref) => {
      acc[pref.user_id] = pref;
      return acc;
    }, {});

    const processedClients1 = clients
      .filter(
        (client) =>
          clientPrefsMap1[client.user_id] &&
          Object.keys(clientPrefsMap1[client.user_id]).length > 0
      )
      .map((client) => ({
        ...client,
        preferences: clientPrefsMap1[client.user_id],
        profile_image: client.profile_image
          ? `${CLIENT_CDN_URL}${client.user_id}/${client.profile_image}`
          : null,
      }));

    // 3. Fetch all clients to include in the preference matching (not just the logged-in user)
    const { data: artists } = await supabase.from("artist").select("*");
    const { data: artistPrefsData1 } = await supabase
      .from("artist_preferences")
      .select("*");

    const artistPrefsMap1 = artistPrefsData1.reduce((acc, pref) => {
      acc[pref.user_id] = pref;
      return acc;
    }, {});

    const processedArtists1 = artists
      .filter(
        (artist) =>
          artistPrefsMap1[artist.user_id] &&
          Object.keys(artistPrefsMap1[artist.user_id]).length > 0
      )
      .map((artist) => ({
        ...artist,
        preferences: artistPrefsMap1[artist.user_id],
        profile_image: artist.profile_image
          ? `${ARTIST_CDN_URL}${artist.user_id}/${artist.profile_image}`
          : null,
      }));

    // 4. Generate scores for each client-artist pair
    const scores1 = {};
    processedClients1.forEach((client) => {
      processedArtists1.forEach((artist) => {
        const score1 = calculateScore1(artist.preferences, client.preferences);
        if (!scores1[artist.user_id]) scores1[artist.user_id] = {};
        scores1[artist.user_id][client.user_id] = score1;
      });
    });

    // 5. Apply Gale-Shapley algorithm to find stable matches
    const matches1 = galeShapleyClient(
      processedArtists1,
      processedClients1,
      scores1
    );

    // 6. Get Collaborative Filtering scores for artists
    const collaborativeScores1 = await getCollaborativeFilteringScores1(userId);

    // 7. Combine the preference-based and collaborative scores
    const maxRawBoost = Math.max(...Object.values(collaborativeScores1), 1);

    const clientRankings1 = processedClients1.map((client) => {
      const rawBoost = collaborativeScores1[client.user_id] || 0;
      const collaborativeBoost1 = Math.min((rawBoost / maxRawBoost) * 15, 15);

      const clientStyles1 = ensureArray1(
        client.preferences.preferred_art_style
      ).map(normalizeArtStyle1);
      const artistStyles1 = ensureArray1(
        processedArtist1.preferences.art_style_specialization
      ).map(normalizeArtStyle1);

      const preferenceScore1 = calculateScore1(
        processedArtist1.preferences,
        client.preferences,
        collaborativeBoost1
      );

      return {
        client,
        score1: preferenceScore1,
        matchBreakdown1: {
          matchedStyles1: artistStyles1.filter((style) =>
            clientStyles1.includes(style)
          ),
          location1: (() => {
            const clientRegion = getRegion1(client.address || "");
            const clientCity = getCity1(client.address || "");
            const artistRegion = getRegion1(processedArtist1.address || "");
            const artistCity = getCity1(processedArtist1.address || "");

            return (
              clientCity &&
              clientRegion &&
              artistCity &&
              artistRegion &&
              clientCity === artistCity &&
              clientRegion === artistRegion &&
              doesCityMatchRegion1(clientCity, clientRegion) &&
              doesCityMatchRegion1(artistCity, artistRegion)
            );
          })(),
          budget1:
            processedArtist1.preferences.budget_range ===
            client.preferences.budget_range,
          timeline1:
            processedArtist1.preferences.timeline ===
            client.preferences.preferred_project_duration,
          communication1: Array.isArray(
            processedArtist1.preferences.communication_preferences
          )
            ? processedArtist1.preferences.communication_preferences.includes(
                client.preferences.preferred_communication
              )
            : false,
          projectType1: Array.isArray(processedArtist1.preferences.project_type)
            ? processedArtist1.preferences.project_type.includes(
                client.preferences.project_type
              )
            : false,
          collaboration1:
            processedArtist1.preferences.collaboration_type ===
            client.preferences.collaboration_type,
          clientType1:
            processedArtist1.preferences.client_type ===
            client.preferences.client_type_preference,
          projectScale1:
            processedArtist1.preferences.project_scale ===
            client.preferences.project_scale,
          collaborativeBoost1: Math.round(collaborativeBoost1),
        },
      };
    });

    clientRankings1.sort((a, b) => b.score1 - a.score1);

    // Log ranked clients list
    console.log("\n********** Ranked Client List **********");
    clientRankings1.forEach((ranked, index) => {
      console.log(
        `Rank ${index + 1}: ${ranked.client.firstname} ${
          ranked.client.lastname
        }, ` + `Combined Match Score: ${ranked.score1}%`
      );
    });

    // 8. Format the response with all ranked clients including their scores
    const rankedMatches1 = clientRankings1.map((ranked) => ({
      client: {
        id: ranked.client.user_id,
        name: `${ranked.client.firstname} ${ranked.client.lastname}`,
        role: ranked.client.role,
        address: ranked.client.address,
        profile_image: ranked.client.profile_image,
        score1: ranked.score1,
        matchBreakdown1: ranked.matchBreakdown1,
      },
      artist: {
        id: processedArtist1.user_id,
        name: `${processedArtist1.firstname} ${processedArtist1.lastname}`,
        role: processedArtist1.role,
        address: processedArtist1.address,
        profile_image: processedArtist1.profile_image,
      },
    }));

    // Filter matches to only include the logged-in user's final match
    const finalMatch1 = rankedMatches1.find(
      (match1) => match1.artist.id === processedArtist1.user_id
    );

    return res.status(200).json({
      matches1: rankedMatches1,
      stableMatches1: matches1,
      finalMatch1,
    });
  } catch (error) {
    console.error("Error in matching algorithm:", error);
    return res.status(500).json({ error: "Matching failed." });
  }
});

// ***** BROWSE CLIENT MATCHING ALGORITHM END... ******

// ****** SEND PROPOSAL ENDPOINT ******
// Proposal Endpoint
app.post("/send-proposal", async (req, res) => {
  const {
    sender_id,
    recipient_id,
    project_name,
    project_description,
    budget,
    due_date,
    status,
  } = req.body;

  if (
    !sender_id ||
    !recipient_id ||
    !project_name ||
    !project_description ||
    !budget ||
    !due_date
  ) {
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    let senderName;
    let { data: senderData, error: senderError } = await supabase
      .from("artist")
      .select("firstname, lastname")
      .eq("user_id", sender_id)
      .single();

    if (senderError || !senderData) {
      ({ data: senderData, error: senderError } = await supabase
        .from("client")
        .select("firstname, lastname")
        .eq("user_id", sender_id)
        .single());
    }

    if (senderError || !senderData) {
      console.error("Error fetching sender's name:", senderError);
      return res.status(500).json({ error: "Failed to fetch sender's name." });
    }

    if (senderData.firstname && senderData.lastname) {
      senderName = `${senderData.firstname} ${senderData.lastname}`;
    } else {
      senderName = senderData.name;
    }

    const { data, error } = await supabase.from("proposals").insert([
      {
        sender_id,
        recipient_id,
        project_name,
        project_description,
        budget,
        due_date,
        status,
      },
    ]);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const notificationMessage = `You have received a new proposal from ${senderName}.`;
    const { error: notificationError } = await supabase
      .from("notifications")
      .insert([
        {
          user_id: recipient_id,
          type: "Proposal",
          message: notificationMessage,
          is_read: false,
          created_at: new Date().toISOString(),
        },
      ]);

    if (notificationError) {
      console.error("Error creating notification:", notificationError);
      return res.status(500).json({ error: "Failed to create notification." });
    }

    const { data: proposalsData, error: proposalsError } = await supabase
      .from("proposals")
      .select("*")
      .eq("recipient_id", recipient_id);

    if (proposalsError) {
      console.error("Error fetching proposals:", proposalsError);
      return res.status(500).json({ error: "Failed to fetch proposals." });
    }

    const proposalsWithProfiles = await Promise.all(
      proposalsData.map(async (proposal) => {
        const profile = await fetchProfileDetails(proposal.sender_id);
        return { ...proposal, senderProfile: profile };
      })
    );

    res.status(201).json({
      message: "Proposal sent successfully!",
      data: proposalsWithProfiles,
    });
  } catch (err) {
    console.error("Internal server error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});
// ****** SEND PROPOSAL ENDPOINT END... ******

// ****** COMMUNITY ENDPOINT ******
const ARTIST_CDNURL =
  "https://seaczeofjlkfcwnofbny.supabase.co/storage/v1/object/public/artist-profile/";
const CLIENT_CDNURL =
  "https://seaczeofjlkfcwnofbny.supabase.co/storage/v1/object/public/client-profile/";
const POST_CDNURL =
  "https://seaczeofjlkfcwnofbny.supabase.co/storage/v1/object/public/community_post_photos/";

// **GET Community Posts with User Details & Comments**
app.get("/community-posts", async (req, res) => {
  const { page = 1, limit = 5, category, hasMedia, order = "desc" } = req.query;
  const offset = (page - 1) * limit;

  try {
    // Main query for fetching posts
    let query = supabase
      .from("community_posts")
      .select(
        `
        id, content, images, category, created_at, user_id,
        community_comments (id, content, user_id, created_at),
        community_likes (user_id)
      `
      )
      .order("created_at", { ascending: order === "asc" }); // Order based on frontend filter

    if (category) query = query.eq("category", category);
    if (hasMedia === "true") query = query.neq("images", "[]");
    if (hasMedia === "false") query = query.eq("images", "[]");

    const { data: postsData, error: postsError } = await query.range(
      offset,
      offset + limit - 1
    );

    if (postsError) {
      console.error("Error fetching posts:", postsError);
      return res.status(500).json({ error: "Failed to fetch posts" });
    }

    // Count query (same filters)
    let countQuery = supabase
      .from("community_posts")
      .select("id", { count: "exact", head: true });

    if (category) countQuery = countQuery.eq("category", category);
    if (hasMedia === "true") countQuery = countQuery.neq("images", "[]");
    if (hasMedia === "false") countQuery = countQuery.eq("images", "[]");

    const { count: totalCount, error: countError } = await countQuery;
    if (countError) {
      console.error("Error counting posts:", countError);
      return res.status(500).json({ error: "Failed to count posts" });
    }

    // Gather user IDs
    const userIds = [
      ...new Set(
        postsData.flatMap((post) => [
          post.user_id,
          ...post.community_comments.map((comment) => comment.user_id),
        ])
      ),
    ];

    // Fetch user details
    const { data: artistData } = await supabase
      .from("artist")
      .select("user_id, firstname, lastname, profile_image")
      .in("user_id", userIds);

    const { data: clientData } = await supabase
      .from("client")
      .select("user_id, firstname, lastname, profile_image")
      .in("user_id", userIds);

    const { data: adminData } = await supabase
      .from("admin")
      .select("user_id, firstname, lastname")
      .in("user_id", userIds);

    const userMap = [
      ...(artistData || []),
      ...(clientData || []),
      ...(adminData || []),
    ].reduce((acc, user) => {
      const isArtist = artistData?.some(
        (artist) => artist.user_id === user.user_id
      );
      acc[user.user_id] = {
        firstname: user.firstname,
        lastname: user.lastname,
        profile_image: user.profile_image
          ? `${isArtist ? ARTIST_CDNURL : CLIENT_CDNURL}${user.user_id}/${
              user.profile_image
            }`
          : null,
      };
      return acc;
    }, {});

    // Format posts
    const postsWithDetails = postsData.map((post) => ({
      ...post,
      images: post.images
        ? Array.isArray(post.images)
          ? post.images
          : JSON.parse(post.images)
        : [],
      likes: post.community_likes
        ? post.community_likes.map((like) => like.user_id)
        : [],
      user: userMap[post.user_id] || {
        firstname: "Unknown",
        lastname: "User",
        profile_image: null,
      },
      comments: post.community_comments
        ? post.community_comments.map((comment) => ({
            ...comment,
            user: userMap[comment.user_id] || {
              firstname: "Unknown",
              lastname: "User",
              profile_image: null,
            },
          }))
        : [],
    }));

    res.status(200).json({ posts: postsWithDetails, total: totalCount });
  } catch (err) {
    console.error("Error fetching posts:", err);
    res.status(500).json({ error: "Failed to fetch community posts" });
  }
});

// **POST Community Post with Image Uploads**
app.post("/community-posts", upload.array("images"), async (req, res) => {
  try {
    const { user_id, content, category } = req.body;
    if (!user_id)
      return res.status(400).json({ error: "User  ID is required" });

    let imageUrls = [];

    if (req.files.length > 0) {
      for (const file of req.files) {
        const fileName = `${Date.now()}-${file.originalname.replace(
          /\s+/g,
          "-"
        )}`;
        const filePath = `${user_id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("community_post_photos")
          .upload(filePath, file.buffer, {
            contentType: file.mimetype,
            cacheControl: "3600",
          });

        if (uploadError) {
          console.error("Image Upload Error:", uploadError);
          return res.status(500).json({ error: "Failed to upload image" });
        }

        imageUrls.push(`${POST_CDNURL}${filePath}`);
      }
    }

    const { data: newPost, error: insertError } = await supabase
      .from("community_posts")
      .insert({
        user_id,
        content,
        images: imageUrls,
        category, // Add this line
      })
      .select("id, content, images, created_at, user_id")
      .single();

    if (insertError) {
      console.error("Post Creation Error:", insertError);
      return res.status(500).json({ error: "Failed to create post" });
    }

    let userData = null;

    const { data: artistData, error: artistError } = await supabase
      .from("artist")
      .select("firstname, lastname, profile_image")
      .eq("user_id", user_id)
      .single();

    if (artistData) {
      userData = artistData;
    } else {
      const { data: clientData, error: clientError } = await supabase
        .from("client")
        .select("firstname, lastname, profile_image")
        .eq("user_id", user_id)
        .single();

      if (clientData) {
        userData = clientData;
      } else {
        const { data: adminData, error: adminError } = await supabase
          .from("admin")
          .select("firstname, lastname")
          .eq("user_id", user_id)
          .single();

        if (adminData) {
          userData = adminData;
          userData.profile_image = null;
        }
      }
    }

    if (!userData) {
      return res
        .status(404)
        .json({ error: "User  not found in artist, client, or admin table" });
    }

    const isArtist = !!artistData;
    userData.profile_image = userData.profile_image
      ? `${isArtist ? ARTIST_CDNURL : CLIENT_CDNURL}${user_id}/${
          userData.profile_image
        }`
      : null;

    res.status(201).json({
      message: "Post created successfully",
      post: {
        ...newPost,
        user: userData,
        likes: [],
        comments: [],
      },
    });
  } catch (err) {
    console.error("Error creating post:", err);
    res.status(500).json({ error: "Failed to create post" });
  }
});

// **LIKE a Post**
app.post("/community-posts/like", async (req, res) => {
  const { post_id, user_id } = req.body;

  try {
    //  Check if the user already liked the post
    const { data: existingLikes, error: fetchError } = await supabase
      .from("community_likes")
      .select("id")
      .eq("post_id", post_id)
      .eq("user_id", user_id);

    if (fetchError) {
      console.error("Error checking like status:", fetchError);
      return res.status(500).json({ error: "Error checking like status" });
    }

    //  If the user already liked the post, unlike it
    if (existingLikes.length > 0) {
      const { error: deleteError } = await supabase
        .from("community_likes")
        .delete()
        .eq("id", existingLikes[0].id);

      if (deleteError) {
        console.error("Error removing like:", deleteError);
        return res.status(500).json({ error: "Error removing like" });
      }
    } else {
      //  If not liked, add a new like
      const { error: insertError } = await supabase
        .from("community_likes")
        .insert({ post_id, user_id });

      if (insertError) {
        console.error("Error adding like:", insertError);
        return res.status(500).json({ error: "Error adding like" });
      }

      //   Fetch the post owner
      const { data: postData, error: postFetchError } = await supabase
        .from("community_posts")
        .select("user_id")
        .eq("id", post_id)
        .single();

      if (postFetchError || !postData) {
        console.error("Error fetching post owner:", postFetchError);
        return res.status(500).json({ error: "Error fetching post owner" });
      }

      const postOwnerId = postData.user_id;

      //  Check if the liker is the post owner
      if (postOwnerId !== user_id) {
        // Fetch the liker’s name from both tables
        let likerData = null;

        // Check in the client table
        const { data: clientData } = await supabase
          .from("client")
          .select("firstname, lastname")
          .eq("user_id", user_id)
          .single();

        if (clientData) {
          likerData = clientData;
        } else {
          // If not found in client, check in the artist table
          const { data: artistData } = await supabase
            .from("artist")
            .select("firstname, lastname")
            .eq("user_id", user_id)
            .single();
          if (artistData) {
            likerData = artistData;
          }
        }

        if (!likerData) {
          console.error("Liker not found in client or artist table");
          return res.status(404).json({ error: "Liker not found" });
        }

        //  Create a notification for the post owner
        const notificationMessage = `${likerData.firstname} ${likerData.lastname} likes your post.`;
        const { error: notificationError } = await supabase
          .from("notifications")
          .insert([
            {
              user_id: postOwnerId,
              type: "Post Liked",
              message: notificationMessage,
              is_read: false,
              created_at: new Date().toISOString(),
            },
          ]);

        if (notificationError) {
          console.error("Error creating notification:", notificationError);
          return res
            .status(500)
            .json({ error: "Failed to create notification." });
        }
      }
    }

    //   Fetch updated likes
    const { data: updatedLikes, error: fetchUpdatedLikesError } = await supabase
      .from("community_likes")
      .select("user_id")
      .eq("post_id", post_id);

    if (fetchUpdatedLikesError) {
      console.error("Error fetching updated likes:", fetchUpdatedLikesError);
      return res.status(500).json({ error: "Error fetching updated likes" });
    }

    res.status(200).json({ likes: updatedLikes.map((like) => like.user_id) });
  } catch (err) {
    console.error("Unexpected error while handling like:", err);
    res.status(500).json({ error: "Unexpected error" });
  }
});
// **POST a Comment on a Post**
app.post("/community-comments", async (req, res) => {
  const { post_id, user_id, content } = req.body;

  if (!content.trim()) {
    return res.status(400).json({ error: "Comment cannot be empty" });
  }

  try {
    //  Insert the new comment
    const { data: newComment, error: insertError } = await supabase
      .from("community_comments")
      .insert({ post_id, user_id, content })
      .select("id, content, user_id, created_at")
      .single();

    if (insertError) {
      console.error("Error adding comment:", insertError);
      return res.status(500).json({ error: "Failed to add comment" });
    }

    //  Fetch the post owner
    const { data: postData, error: postFetchError } = await supabase
      .from("community_posts")
      .select("user_id")
      .eq("id", post_id)
      .single();

    if (postFetchError || !postData) {
      console.error("Error fetching post owner:", postFetchError);
      return res.status(500).json({ error: "Error fetching post owner" });
    }

    const postOwnerId = postData.user_id;

    //   Check if the commenter is the post owner
    if (postOwnerId !== user_id) {
      let commenterData = null;

      const { data: clientData } = await supabase
        .from("client")
        .select("firstname, lastname")
        .eq("user_id", user_id)
        .single();

      if (clientData) {
        commenterData = clientData;
      } else {
        const { data: artistData } = await supabase
          .from("artist")
          .select("firstname, lastname")
          .eq("user_id", user_id)
          .single();
        if (artistData) {
          commenterData = artistData;
        }
      }

      if (!commenterData) {
        console.error("Commenter not found in client or artist table");
        return res.status(404).json({ error: "Commenter not found" });
      }

      //  Create a notification for the post owner
      const notificationMessage = `${commenterData.firstname} ${commenterData.lastname} commented on your post.`;
      const { error: notificationError } = await supabase
        .from("notifications")
        .insert([
          {
            user_id: postOwnerId,
            type: "Post Commented",
            message: notificationMessage,
            is_read: false,
            created_at: new Date().toISOString(),
          },
        ]);

      if (notificationError) {
        console.error("Error creating notification:", notificationError);
        return res
          .status(500)
          .json({ error: "Failed to create notification." });
      }
    }

    //   Return the new comment
    res.status(201).json({ comment: newComment });
  } catch (err) {
    console.error("Unexpected error while adding comment:", err);
    res.status(500).json({ error: "Unexpected error" });
  }
});

// **PATCH Community Post (Edit Post)**
app.patch("/community-posts/:id", async (req, res) => {
  const { id } = req.params;
  const { content, category } = req.body;

  // Validation
  if (!content?.trim() || !category) {
    return res
      .status(400)
      .json({ error: "Content and category cannot be empty." });
  }

  try {
    const { data, error } = await supabase
      .from("community_posts")
      .update({ content, category }) // Include category in the update
      .eq("id", id)
      .select("id, content, category, images, created_at, user_id")
      .single();

    if (error) {
      console.error("Error updating post:", error);
      return res.status(500).json({ error: "Failed to update post" });
    }

    res.status(200).json({ post: data });
  } catch (err) {
    console.error("Unexpected error while editing post:", err);
    res.status(500).json({ error: "Unexpected error" });
  }
});

// **DELETE Community Post with Image Deletion (without deleting the folder)**
app.delete("/community-posts/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const { data: postData, error: fetchError } = await supabase
      .from("community_posts")
      .select("images")
      .eq("id", id)
      .single();

    if (fetchError) {
      console.error("Error fetching post data:", fetchError);
      return res.status(500).json({ error: "Failed to fetch post data" });
    }

    const imagesToDelete = postData.images ? postData.images : [];

    for (const image of imagesToDelete) {
      const imagePath = image.replace(`${POST_CDNURL}`, "");
      const { error: deleteImageError } = await supabase.storage
        .from("community_post_photos")
        .remove([imagePath]);

      if (deleteImageError) {
        console.error(`Error deleting image ${imagePath}:`, deleteImageError);
      }
    }

    const { error: deletePostError } = await supabase
      .from("community_posts")
      .delete()
      .eq("id", id);

    if (deletePostError) {
      console.error("Error deleting post:", deletePostError);
      return res.status(500).json({ error: "Failed to delete post" });
    }

    res.status(204).send();
  } catch (err) {
    console.error("Unexpected error while deleting post:", err);
    res.status(500).json({ error: "Unexpected error" });
  }
});
// ****** COMMUNITY ENDPOINT END ******

// ****** PROJECT MANAGEMENT ENDPOINT ******
const CDNURL_ARTIST =
  "https://seaczeofjlkfcwnofbny.supabase.co/storage/v1/object/public/artist-profile/";
const CDNURL_CLIENT =
  "https://seaczeofjlkfcwnofbny.supabase.co/storage/v1/object/public/client-profile/";

// Endpoint to fetch projects for a specific artist
app.get("/api/artist-projects/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const { data: projectsData, error } = await supabase
      .from("projects")
      .select("*")
      .eq("artist_id", userId);

    if (error) {
      throw error;
    }

    res.json(projectsData || []);
  } catch (err) {
    console.error("Unexpected error fetching projects:", err);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

// Endpoint to fetch projects for a specific artist
app.get("/api/client-projects/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const { data: projectsData, error } = await supabase
      .from("projects")
      .select("*")
      .eq("client_id", userId);

    if (error) {
      throw error;
    }

    res.json(projectsData || []);
  } catch (err) {
    console.error("Unexpected error fetching projects:", err);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

// Endpoint to fetch proposals for a specific user
app.get("/api/proposals/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const { data: proposalsData, error } = await supabase
      .from("proposals")
      .select("*")
      .eq("recipient_id", userId)
      .eq("status", "Pending");

    if (error) {
      throw error;
    }

    const proposalsWithProfiles = await Promise.all(
      proposalsData.map(async (proposal) => {
        const profile = await fetchProfileDetails(proposal.sender_id);
        return { ...proposal, senderProfile: profile };
      })
    );

    res.json(proposalsWithProfiles || []);
  } catch (err) {
    console.error("Unexpected error fetching proposals:", err);
    res.status(500).json({ error: "Failed to fetch proposals" });
  }
});

const fetchProfileDetails = async (userId) => {
  try {
    const { data: artistProfile } = await supabase
      .from("artist")
      .select("user_id, firstname, lastname, address, profile_image")
      .eq("user_id", userId)
      .single();

    if (artistProfile) {
      return {
        ...artistProfile,
        profileType: "artist",
        profile_image: artistProfile.profile_image
          ? `${CDNURL_ARTIST}${artistProfile.user_id}/${artistProfile.profile_image}`
          : null,
      };
    }

    const { data: clientProfile } = await supabase
      .from("client")
      .select("user_id, firstname, lastname, address, profile_image")
      .eq("user_id", userId)
      .single();

    if (clientProfile) {
      return {
        ...clientProfile,
        profileType: "client",
        profile_image: clientProfile.profile_image
          ? `${CDNURL_CLIENT}${clientProfile.user_id}/${clientProfile.profile_image}`
          : null,
      };
    }

    return null;
  } catch (err) {
    console.error("Error fetching profile details:", err);
    return null;
  }
};

// Endpoint to accept a proposal and create a project (artist to client)
app.post("/artist/proposals/accept", async (req, res) => {
  const { proposal } = req.body;

  try {
    // Insert into the `projects` table and get the new project ID
    const { data: newProject, error: projectError } = await supabase
      .from("projects")
      .insert([
        {
          proposal_id: proposal.proposal_id,
          project_name: proposal.project_name,
          description: proposal.project_description,
          client_id: proposal.sender_id,
          artist_id: proposal.recipient_id,
          due_date: proposal.due_date,
          status: "To Do", // Default value
          priority: "Normal", // Default value
          created_at: new Date(),
          updated_at: new Date(),
        },
      ])
      .select("*")
      .single();

    if (projectError) {
      throw new Error(`Error creating project: ${projectError.message}`);
    }

    //  Update the `proposals` table with the `project_id` and `updated_at`
    const { error: proposalError } = await supabase
      .from("proposals")
      .update({
        status: "Accepted",
        project_id: newProject.project_id,
        updated_at: new Date(),
      })
      .eq("proposal_id", proposal.proposal_id);

    if (proposalError) {
      throw new Error(`Error updating proposal: ${proposalError.message}`);
    }

    //  Create a notification for the recipient
    const notificationMessage = `Your proposal for "${proposal.project_name}" has been accepted and a project has been created.`;
    const { error: notificationError } = await supabase
      .from("notifications")
      .insert([
        {
          user_id: proposal.sender_id,
          type: "Proposal Accepted",
          message: notificationMessage,
          is_read: false,
          created_at: new Date().toISOString(),
        },
      ]);

    if (notificationError) {
      console.error("Error creating notification:", notificationError);
      return res.status(500).json({ error: "Failed to create notification." });
    }

    res.status(200).json({ newProject });
  } catch (err) {
    console.error("Error accepting proposal:", err);
    res.status(500).json({ error: "Failed to accept proposal." });
  }
});

// Endpoint to accept a proposal and create a project (client to artist)
app.post("/client/proposals/accept", async (req, res) => {
  const { proposal } = req.body;

  try {
    // Insert into the `projects` table and get the new project ID
    const { data: newProject, error: projectError } = await supabase
      .from("projects")
      .insert([
        {
          proposal_id: proposal.proposal_id,
          project_name: proposal.project_name,
          description: proposal.project_description,
          client_id: proposal.recipient_id,
          artist_id: proposal.sender_id,
          due_date: proposal.due_date,
          status: "To Do", // Default value
          priority: "Normal", // Default value
          created_at: new Date(),
          updated_at: new Date(),
        },
      ])
      .select("*")
      .single();

    if (projectError) {
      throw new Error(`Error creating project: ${projectError.message}`);
    }

    // Update the `proposals` table with the `project_id` and `updated_at`
    const { error: proposalError } = await supabase
      .from("proposals")
      .update({
        status: "Accepted",
        project_id: newProject.project_id,
        updated_at: new Date(),
      })
      .eq("proposal_id", proposal.proposal_id);

    if (proposalError) {
      throw new Error(`Error updating proposal: ${proposalError.message}`);
    }

    // Create a notification for the recipient
    const notificationMessage = `Your proposal for "${proposal.project_name}" has been accepted and a project has been created.`;
    const { error: notificationError } = await supabase
      .from("notifications")
      .insert([
        {
          user_id: proposal.sender_id,
          type: "Proposal Accepted",
          message: notificationMessage,
          is_read: false,
          created_at: new Date().toISOString(),
        },
      ]);

    if (notificationError) {
      console.error("Error creating notification:", notificationError);
      return res.status(500).json({ error: "Failed to create notification." });
    }

    res.status(200).json({ newProject });
  } catch (err) {
    console.error("Error accepting proposal:", err);
    res.status(500).json({ error: "Failed to accept proposal." });
  }
});

// Endpoint to reject a proposal
app.post("/api/proposals/reject", async (req, res) => {
  const { proposalId } = req.body;

  try {
    // Fetch the proposal to get the recipient's ID and project name
    const { data: proposalData, error: fetchError } = await supabase
      .from("proposals")
      .select("sender_id, project_name")
      .eq("proposal_id", proposalId)
      .single();

    if (fetchError || !proposalData) {
      console.error("Error fetching proposal:", fetchError);
      return res.status(404).json({ error: "Proposal not found." });
    }

    //  Update the proposal status to "Rejected"
    const { error } = await supabase
      .from("proposals")
      .update({ status: "Rejected" })
      .eq("proposal_id", proposalId);

    if (error) {
      throw new Error(`Error rejecting proposal: ${error.message}`);
    }

    // Create a notification for the recipient
    const notificationMessage = `Your proposal for "${proposalData.project_name}" has been rejected.`;
    const { error: notificationError } = await supabase
      .from("notifications")
      .insert([
        {
          user_id: proposalData.sender_id,
          type: "Proposal Rejected",
          message: notificationMessage,
          is_read: false,
          created_at: new Date().toISOString(),
        },
      ]);

    if (notificationError) {
      console.error("Error creating notification:", notificationError);
      return res.status(500).json({ error: "Failed to create notification." });
    }

    res.status(200).json({ message: "Proposal rejected." });
  } catch (err) {
    console.error("Error rejecting proposal:", err);
    res.status(500).json({ error: "Failed to reject proposal." });
  }
});

// Endpoint to update project status
app.post("/api/projects/update-status", async (req, res) => {
  const { project_id, status } = req.body;

  try {
    // Fetch the project details
    const { data: projectData, error: fetchError } = await supabase
      .from("projects")
      .select("client_id, artist_id, project_name")
      .eq("project_id", project_id)
      .single();

    if (fetchError || !projectData) {
      console.error("Error fetching project:", fetchError);
      return res.status(404).json({ error: "Project not found." });
    }

    // Update the project status
    const { error: updateError } = await supabase
      .from("projects")
      .update({ status, updated_at: new Date() })
      .eq("project_id", project_id);

    if (updateError) {
      throw new Error(`Error updating project status: ${updateError.message}`);
    }

    // -------- MILESTONE INSERTION LOGIC --------
    if (status === "In Progress") {
      // Check if milestones exist for the project
      const { data: existingMilestones, error: milestoneFetchError } =
        await supabase
          .from("milestones")
          .select("milestone_id")
          .eq("project_id", project_id);

      if (milestoneFetchError) {
        console.error("Error checking milestones:", milestoneFetchError);
        return res.status(500).json({ error: "Failed to check milestones." });
      }

      // If no milestones exist, insert the default ones
      if (!existingMilestones || existingMilestones.length === 0) {
        const defaultMilestones = [
          {
            milestone_name: "Concept Approved",
            description: "Initial concept approved by the client",
            status: "Not Started",
          },
          {
            milestone_name: "Sketch Completed",
            description: "Sketch phase completed",
            status: "Not Started",
          },
          {
            milestone_name: "Artwork In Progress",
            description: "Main artwork development ongoing",
            status: "Not Started",
          },
          {
            milestone_name: "Adding Details",
            description: "Final detailing and adjustments",
            status: "Not Started",
          },
          {
            milestone_name: "Final Review",
            description: "Project under final review",
            status: "Not Started",
          },
        ];

        const milestoneInsertPromises = defaultMilestones.map((milestone) =>
          supabase.from("milestones").insert({
            project_id,
            milestone_name: milestone.milestone_name,
            description: milestone.description,
            status: milestone.status,
            completion_percentage: 0,
            milestone_fee: 0,
            is_paid: false,
            created_at: new Date(),
            updated_at: new Date(),
          })
        );

        await Promise.all(milestoneInsertPromises);
      }
    }
    // -------- END MILESTONE INSERTION LOGIC --------

    // Notify the client
    const notificationMessage = `The status for the project "${projectData.project_name}" has been updated to "${status}".`;
    const { error: clientNotificationError } = await supabase
      .from("notifications")
      .insert([
        {
          user_id: projectData.client_id,
          type: "Project Status Updated",
          message: notificationMessage,
          is_read: false,
          created_at: new Date().toISOString(),
        },
      ]);

    if (clientNotificationError) {
      console.error(
        "Error creating client notification:",
        clientNotificationError
      );
      return res
        .status(500)
        .json({ error: "Failed to create client notification." });
    }

    // Notify the artist only if status is "Confirmed"
    if (status === "Confirmed") {
      const artistNotificationMessage = `The project "${projectData.project_name}" has been confirmed.`;
      const { error: artistNotificationError } = await supabase
        .from("notifications")
        .insert([
          {
            user_id: projectData.artist_id,
            type: "Project Confirmed",
            message: artistNotificationMessage,
            is_read: false,
            created_at: new Date().toISOString(),
          },
        ]);

      if (artistNotificationError) {
        console.error(
          "Error creating artist notification:",
          artistNotificationError
        );
        return res
          .status(500)
          .json({ error: "Failed to create artist notification." });
      }
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Error updating project status:", err);
    res.status(500).json({ error: "Failed to update project status." });
  }
});

// Endpoint to update project priority
app.post("/api/projects/update-priority", async (req, res) => {
  const { project_id, priority } = req.body;

  try {
    //  Fetch the project to get the client and artist IDs
    const { data: projectData, error: fetchError } = await supabase
      .from("projects")
      .select("client_id, artist_id, project_name")
      .eq("project_id", project_id)
      .single();

    if (fetchError || !projectData) {
      console.error("Error fetching project:", fetchError);
      return res.status(404).json({ error: "Project not found." });
    }

    //  Update the project priority
    const { error } = await supabase
      .from("projects")
      .update({ priority, updated_at: new Date() })
      .eq("project_id", project_id);

    if (error) {
      throw new Error(`Error updating project priority: ${error.message}`);
    }

    //  Create a notification for the client and artist
    const notificationMessage = `The priority for the project "${projectData.project_name}" has been updated to "${priority}".`;

    // Notify the client
    const { error: clientNotificationError } = await supabase
      .from("notifications")
      .insert([
        {
          user_id: projectData.client_id,
          type: "Project Priority Updated",
          message: notificationMessage,
          is_read: false,
          created_at: new Date().toISOString(),
        },
      ]);

    if (clientNotificationError) {
      console.error(
        "Error creating client notification:",
        clientNotificationError
      );
      return res
        .status(500)
        .json({ error: "Failed to create client notification." });
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Error updating project priority:", err);
    res.status(500).json({ error: "Failed to update project priority." });
  }
});

// Endpoint to fetch project details along with client information
app.get("/api/projects/:projectId/client_project_details", async (req, res) => {
  const { projectId } = req.params;

  try {
    const { data: projectData, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("project_id", projectId)
      .single();

    if (projectError) {
      throw new Error(`Error fetching project: ${projectError.message}`);
    }

    let budget = null;

    if (projectData.proposal_id) {
      // Budget from proposals (add ₱ prefix)
      const { data: proposalData, error: proposalError } = await supabase
        .from("proposals")
        .select("budget")
        .eq("proposal_id", projectData.proposal_id)
        .single();

      if (proposalError) {
        throw new Error(
          `Error fetching proposal details: ${proposalError.message}`
        );
      }

      budget = `₱${proposalData.budget}`;
    } else if (projectData.job_id) {
      // Budget from jobs (leave as-is, already formatted)
      const { data: jobData, error: jobError } = await supabase
        .from("jobs")
        .select("budget")
        .eq("job_id", projectData.job_id)
        .single();

      if (jobError) {
        throw new Error(`Error fetching job details: ${jobError.message}`);
      }

      budget = jobData.budget;
    }

    // Fetch client info directly from the project client_id
    const clientProfile = await fetchProfileDetails(projectData.client_id);

    const projectDetails = {
      ...projectData,
      budget,
      clientProfile,
    };

    res.json(projectDetails);
  } catch (err) {
    console.error("Error fetching project details:", err);
    res.status(500).json({ error: "Failed to fetch project details." });
  }
});

// Endpoint to fetch project details along with artist information
app.get("/api/projects/:projectId/artist_project_details", async (req, res) => {
  const { projectId } = req.params;

  try {
    const { data: projectData, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("project_id", projectId)
      .single();

    if (projectError) {
      throw new Error(`Error fetching project: ${projectError.message}`);
    }

    let budget = null;

    if (projectData.proposal_id) {
      // Case: budget from proposal, add ₱ prefix
      const { data: proposalData, error: proposalError } = await supabase
        .from("proposals")
        .select("budget")
        .eq("proposal_id", projectData.proposal_id)
        .single();

      if (proposalError) {
        throw new Error(
          `Error fetching proposal details: ${proposalError.message}`
        );
      }

      budget = `₱${proposalData.budget}`;
    } else if (projectData.job_id) {
      // Case: budget from job, return as-is (already formatted on frontend)
      const { data: jobData, error: jobError } = await supabase
        .from("jobs")
        .select("budget")
        .eq("job_id", projectData.job_id)
        .single();

      if (jobError) {
        throw new Error(`Error fetching job details: ${jobError.message}`);
      }

      budget = jobData.budget; // No prefix added
    }

    // Fetch artist info directly from the project artist_id
    const artistProfile = await fetchProfileDetails(projectData.artist_id);

    const projectDetails = {
      ...projectData,
      budget,
      artistProfile,
    };

    res.json(projectDetails);
  } catch (err) {
    console.error("Error fetching project details:", err);
    res.status(500).json({ error: "Failed to fetch project details." });
  }
});
// ****** PROJECT MANAGEMENT ENDPOINT END... ******

// ***** MESSAGE FUNCTION *****
// Get all conversations for a user
app.get("/conversations/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    // Fetch all conversations where the user is a participant
    const { data: conversations, error: conversationsError } = await supabase
      .from("conversations")
      .select("*")
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

    if (conversationsError || !conversations.length) {
      return res.status(404).json({ error: "No conversations found." });
    }

    // Fetch the other user's details for each conversation
    const formattedConversations = await Promise.all(
      conversations.map(async (conversation) => {
        const otherUserId =
          conversation.user1_id === userId
            ? conversation.user2_id
            : conversation.user1_id;

        const { data: otherUser, error: userError } = await supabase
          .from("users")
          .select("id, username")
          .eq("id", otherUserId)
          .single();

        if (userError || !otherUser) {
          return null;
        }

        return {
          conversation_id: conversation.id,
          other_user_id: otherUser.id,
          other_user_username: otherUser.username,
          created_at: conversation.created_at,
        };
      })
    );

    res.status(200).json({
      conversations: formattedConversations.filter((c) => c !== null),
    });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Get all messages in a conversation
app.get("/messages/:conversationId", async (req, res) => {
  const { conversationId } = req.params;

  try {
    // Fetch all messages in the conversation
    const { data: messages, error: messagesError } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (messagesError || !messages.length) {
      return res.status(404).json({ error: "No messages found." });
    }

    res.status(200).json({ messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});
// ***** MESSAGE FUNCTION END ******

//***** TRANSACTION FUNCTION ******/
app.get("/client-orders/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    console.log("Fetching orders for userId:", userId);
    const { data: orders, error } = await supabase
      .from("orders")
      .select(
        `
              id,
              created_at,
              amount,
              status,
              description
          `
      )
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching orders:", error);
      return res.status(400).json({ error: "Failed to fetch orders." });
    }

    console.log("Orders fetched:", orders);

    if (orders.length === 0) {
      console.warn(`No orders found for userId: ${userId}`);
    }

    // Format the orders data
    const formattedOrders = orders.map((order) => ({
      id: order.id,
      date: order.created_at,
      amount: order.amount,
      status: order.status,
      description: order.description,
    }));

    res.status(200).json(formattedOrders);
  } catch (err) {
    console.error("Unexpected error fetching orders:", err);
    res.status(500).json({ error: "Failed to fetch orders." });
  }
});

app.get("/artist-orders/:artistId", async (req, res) => {
  const { artistId } = req.params; // Use artistId from the request parameters

  try {
    console.log("Fetching orders for artistId:", artistId);
    const { data: orders, error } = await supabase
      .from("orders")
      .select(
        `
              id,
              created_at,
              amount,
              status,
              description,
              user_name
          `
      )
      .eq("artist_id", artistId); // Filter by artist_id instead of user_id

    if (error) {
      console.error("Error fetching orders:", error);
      return res.status(400).json({ error: "Failed to fetch orders." });
    }

    console.log("Orders fetched:", orders);

    if (orders.length === 0) {
      console.warn(`No orders found for artistId: ${artistId}`);
    }

    // Format the orders data
    const formattedOrders = orders.map((order) => ({
      id: order.id,
      date: order.created_at,
      amount: order.amount,
      status: order.status,
      description: order.description,
    }));

    res.status(200).json(formattedOrders);
  } catch (err) {
    console.error("Unexpected error fetching orders:", err);
    res.status(500).json({ error: "Failed to fetch orders." });
  }
});
//***** TRANSACTION FUNCTION END...******/

//***** NOTIFICATION FUNCTION ******
// Fetch notifications for a user
app.get("/notifications/:userId", async (req, res) => {
  const { userId } = req.params; // Get userId from the request parameters

  try {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({ error: "Error fetching notifications." });
    }

    res.status(200).json({ notifications: data });
  } catch (err) {
    console.error("Error fetching notifications:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Mark all notifications as read for a user
app.put("/notifications/:userId/mark-all-as-read", async (req, res) => {
  const { userId } = req.params;

  try {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId);

    if (error) {
      return res
        .status(500)
        .json({ error: "Error marking notifications as read." });
    }

    res.status(200).json({ message: "All notifications marked as read." });
  } catch (err) {
    console.error("Error marking notifications as read:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Delete a single notification
app.delete("/notifications/:id", async (req, res) => {
  const { id } = req.params;

  // Convert id to a number for an int8 column
  const notificationId = Number(id);
  if (isNaN(notificationId)) {
    return res.status(400).json({ error: "Invalid notification ID." });
  }

  try {
    // Check if the notification exists
    const { data: existingNotification, error: fetchError } = await supabase
      .from("notifications")
      .select("id")
      .eq("id", notificationId)
      .single();

    if (fetchError) {
      return res.status(500).json({ error: "Error fetching notification." });
    }

    if (!existingNotification) {
      return res.status(404).json({ error: "Notification not found." });
    }

    // Delete the notification
    const { error: deleteError } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId);

    if (deleteError) {
      return res.status(500).json({ error: "Error deleting notification." });
    }

    res.status(200).json({ message: "Notification deleted." });
  } catch (err) {
    res.status(500).json({ error: "Internal server error." });
  }
});

// Fetch the count of unread notifications for a user
app.get("/notifications/count/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    // Count unread notifications
    const { count, error } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (error) {
      return res
        .status(500)
        .json({ error: "Error fetching notifications count." });
    }

    res.status(200).json({ count: count || 0 });
  } catch (err) {
    console.error("Error fetching notifications count:", err);
    res.status(500).json({ error: "Internal server error." });
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
//***** NOTIFICATION FUNCTION END... ******

// ***** ARTIST-CLIENT VERIFICATION FUNCTION ******
const VERIFY_CDNURL =
  "https://seaczeofjlkfcwnofbny.supabase.co/storage/v1/object/public/artist-verification/";

const VERIFY_CDNURL_CLIENT =
  "https://seaczeofjlkfcwnofbny.supabase.co/storage/v1/object/public/client-verification/";

// ARTIST VERIFICATION
app.post(
  "/api/artist-verification/:userId",
  upload.fields([{ name: "document" }, { name: "valid_id" }]),
  async (req, res) => {
    const { userId } = req.params;
    const files = req.files;

    if (!userId || !files || !files.document || !files.valid_id) {
      return res
        .status(400)
        .json({ error: "User  ID, portfolio, and valid ID are required." });
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
        return res.status(500).json({ error: "Failed to upload valid ID." });
      }

      // Insert verification request and get the returned ID
      const { data: verificationData, error: verificationError } =
        await supabase
          .from("artist_verification")
          .insert({
            user_id: userId,
            document_url: `portfolio/${userId}/${documentFileName}`,
            valid_id: `valid_id/${userId}/${validIdFileName}`,
            status: "pending",
            created_at: new Date().toISOString(),
          })
          .select("verification_id");
      if (verificationError) {
        return res
          .status(500)
          .json({ error: "Failed to save verification request" });
      }

      // Add verification ID to existing artist record
      const { error: artistUpdateError } = await supabase
        .from("artist")
        .update({ verification_id: verificationData[0].verification_id })
        .eq("user_id", userId);

      if (artistUpdateError) {
        return res
          .status(500)
          .json({ error: "Failed to update artist verification ID." });
      }

      // Fetch the sender's name for the notification
      const { data: userData, error: userError } = await supabase
        .from("artist")
        .select("firstname, lastname")
        .eq("user_id", userId)
        .single();

      if (userError || !userData) {
        console.error("Error fetching user data:", userError);
        return res
          .status(500)
          .json({ error: "Failed to fetch user data for notification." });
      }

      const senderName = `${userData.firstname} ${userData.lastname}`;

      // Notify admins about the new verification request
      const { data: adminData, error: adminError } = await supabase
        .from("admin")
        .select("user_id");

      if (adminError) {
        console.error("Error fetching admin users:", adminError);
        return res.status(500).json({ error: "Failed to fetch admin users." });
      }

      // Create notifications for each admin
      const notificationPromises = adminData.map(async (admin) => {
        const notificationMessage = `New verification request submitted by ${senderName}.`;
        return supabase.from("notifications").insert([
          {
            user_id: admin.user_id,
            type: "Verification",
            message: notificationMessage,
            is_read: false,
            created_at: new Date().toISOString(),
          },
        ]);
      });

      // Wait for all notifications to be created
      await Promise.all(notificationPromises);

      res.status(200).json({
        success: true,
        message: "Verification request submitted successfully.",
      });
    } catch (err) {
      console.error("An unexpected error occurred during verification:", err);
      res
        .status(500)
        .json({ error: "An unexpected error occurred during verification." });
    }
  }
);

// CLIENT VERIFICATION
app.post(
  "/api/client-verification/:userId",
  upload.fields([{ name: "document" }, { name: "valid_id" }]),
  async (req, res) => {
    const { userId } = req.params;
    const files = req.files;

    if (!userId || !files || !files.document || !files.valid_id) {
      return res
        .status(400)
        .json({ error: "User  ID, portfolio, and valid ID are required." });
    }

    try {
      // Upload portfolio to Supabase storage
      const documentFile = files.document[0];
      const documentFileName = `${Date.now()}-${documentFile.originalname}`;
      const documentPath = `portfolio/${userId}/${documentFileName}`;

      const { error: documentUploadError } = await supabase.storage
        .from("client-verification")
        .upload(documentPath, documentFile.buffer, {
          contentType: documentFile.mimetype,
          cacheControl: "3600",
        });

      if (documentUploadError) {
        return res.status(500).json({ error: "Failed to upload portfolio." });
      }

      // Upload valid ID to Supabase storage
      const validIdFile = files.valid_id[0];
      const validIdFileName = `${Date.now()}-${validIdFile.originalname}`;
      const validIdPath = `valid_id/${userId}/${validIdFileName}`;

      const { error: validIdUploadError } = await supabase.storage
        .from("client-verification")
        .upload(validIdPath, validIdFile.buffer, {
          contentType: validIdFile.mimetype,
          cacheControl: "3600",
        });

      if (validIdUploadError) {
        return res.status(500).json({ error: "Failed to upload valid ID." });
      }

      // Insert verification request and get the returned ID
      const { data: verificationData, error: verificationError } =
        await supabase
          .from("client_verification")
          .insert({
            user_id: userId,
            document_url: `portfolio/${userId}/${documentFileName}`,
            valid_id: `valid_id/${userId}/${validIdFileName}`,
            status: "pending",
            created_at: new Date().toISOString(),
          })
          .select("verification_id");
      if (verificationError) {
        return res
          .status(500)
          .json({ error: "Failed to save verification request" });
      }

      // Add verification ID to existing client record
      const { error: clientUpdateError } = await supabase
        .from("client")
        .update({ verification_id: verificationData[0].verification_id })
        .eq("user_id", userId);

      if (clientUpdateError) {
        return res
          .status(500)
          .json({ error: "Failed to update client verification ID." });
      }

      // Fetch the sender's name for the notification
      const { data: userData, error: userError } = await supabase
        .from("client")
        .select("firstname, lastname")
        .eq("user_id", userId)
        .single();

      if (userError || !userData) {
        console.error("Error fetching user data:", userError);
        return res
          .status(500)
          .json({ error: "Failed to fetch user data for notification." });
      }

      const senderName = `${userData.firstname} ${userData.lastname}`;

      // Notify admins about the new verification request
      const { data: adminData, error: adminError } = await supabase
        .from("admin")
        .select("user_id");

      if (adminError) {
        console.error("Error fetching admin users:", adminError);
        return res.status(500).json({ error: "Failed to fetch admin users." });
      }

      // Create notifications for each admin
      const notificationPromises = adminData.map(async (admin) => {
        const notificationMessage = `New verification request submitted by ${senderName}.`;
        return supabase.from("notifications").insert([
          {
            user_id: admin.user_id,
            type: "Verification",
            message: notificationMessage,
            is_read: false,
            created_at: new Date().toISOString(),
          },
        ]);
      });

      // Wait for all notifications to be created
      await Promise.all(notificationPromises);

      res.status(200).json({
        success: true,
        message: "Verification request submitted successfully.",
      });
    } catch (err) {
      console.error("An unexpected error occurred during verification:", err);
      res
        .status(500)
        .json({ error: "An unexpected error occurred during verification." });
    }
  }
);

// **Fetch all users verifications**
app.get("/api/verifications", async (req, res) => {
  try {
    // Fetch artist verifications
    const { data: artistVerifications, error: artistError } = await supabase
      .from("artist_verification")
      .select("*")
      .order("created_at", { ascending: false });

    if (artistError) {
      console.error("Error fetching artist verifications:", artistError);
      return res.status(400).json({ error: artistError.message });
    }

    // Fetch client verifications
    const { data: clientVerifications, error: clientError } = await supabase
      .from("client_verification")
      .select("*")
      .order("created_at", { ascending: false });

    if (clientError) {
      console.error("Error fetching client verifications:", clientError);
      return res.status(400).json({ error: clientError.message });
    }

    // Enrich artist verifications
    const enrichedArtists = await Promise.all(
      artistVerifications.map(async (verification) => {
        const { data: artistData, error } = await supabase
          .from("artist")
          .select("firstname, lastname, role")
          .eq("user_id", verification.user_id)
          .single();

        return {
          ...verification,
          userType: "artist",
          userInfo: artistData || null,
          document_url: `${VERIFY_CDNURL}${verification.document_url}`,
          valid_id: `${VERIFY_CDNURL}${verification.valid_id}`,
        };
      })
    );

    // Enrich client verifications
    const enrichedClients = await Promise.all(
      clientVerifications.map(async (verification) => {
        const { data: clientData, error } = await supabase
          .from("client")
          .select("firstname, lastname, role")
          .eq("user_id", verification.user_id)
          .single();

        return {
          ...verification,
          userType: "client",
          userInfo: clientData || null,
          document_url: `${VERIFY_CDNURL_CLIENT}${verification.document_url}`,
          valid_id: `${VERIFY_CDNURL_CLIENT}${verification.valid_id}`,
        };
      })
    );

    // Combine and sort all verifications by creation date (descending)
    const combined = [...enrichedArtists, ...enrichedClients].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    res.status(200).json(combined);
  } catch (err) {
    console.error("Failed to fetch verifications:", err);
    res.status(500).json({ error: "Failed to fetch verifications." });
  }
});

// Endpoint to approve or reject verifications
app.post(
  "/api/:userType-verification/:verificationId/:action",
  async (req, res) => {
    const { userType, verificationId, action } = req.params;

    if (!["artist", "client"].includes(userType)) {
      return res.status(400).json({ error: "Invalid user type." });
    }

    if (!["approved", "rejected"].includes(action)) {
      return res
        .status(400)
        .json({ error: "Invalid action. Use 'approved' or 'rejected'." });
    }

    const tableName = `${userType}_verification`;
    const userTable = userType;

    try {
      // Fetch user ID linked to the verification
      const { data: verificationData, error: fetchError } = await supabase
        .from(tableName)
        .select("user_id")
        .eq("verification_id", verificationId)
        .single();

      if (fetchError || !verificationData) {
        return res
          .status(404)
          .json({ error: "Verification request not found." });
      }

      const userId = verificationData.user_id;

      // Update verification status
      const { error: updateError } = await supabase
        .from(tableName)
        .update({ status: action })
        .eq("verification_id", verificationId);

      if (updateError) {
        return res
          .status(500)
          .json({ error: "Failed to update verification status." });
      }

      // Fetch user details for notification
      const { data: userData, error: userFetchError } = await supabase
        .from(userTable)
        .select("firstname, lastname")
        .eq("user_id", userId)
        .single();

      if (userFetchError || !userData) {
        console.error("Error fetching user data:", userFetchError);
        return res
          .status(500)
          .json({ error: "Failed to fetch user data for notification." });
      }

      const userName = `${userData.firstname} ${userData.lastname}`;
      const notificationMessage = `Your verification request has been ${action}.`;

      const { error: notificationError } = await supabase
        .from("notifications")
        .insert([
          {
            user_id: userId,
            type: "Verification",
            message: notificationMessage,
            is_read: false,
            created_at: new Date().toISOString(),
          },
        ]);

      if (notificationError) {
        console.error("Error creating notification:", notificationError);
        return res
          .status(500)
          .json({ error: "Failed to create notification." });
      }

      return res
        .status(200)
        .json({ success: true, message: `Verification has been ${action}.` });
    } catch (err) {
      console.error("Unexpected error:", err);
      return res.status(500).json({ error: "An unexpected error occurred." });
    }
  }
);

// ****** ARTIST UPLOAD VERIFICATION END... ******

// ***** VERIFIED ARTIST FUNCTION ******

// ***** VERIFIED ARTIST FUNCTION END ******

// ***** ENHANCED RECOMMENDED ARTISTS FOR CLIENT ******
app.get("/recommend-artists/:userId", async (req, res) => {
  const { userId } = req.params;

  const ARTIST_CDN_URL =
    "https://seaczeofjlkfcwnofbny.supabase.co/storage/v1/object/public/artist-profile/";

  try {
    // 1. Fetch client preferences
    const { data: clientPrefs, error: clientError } = await supabase
      .from("client_preferences")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (clientError || !clientPrefs) {
      return res.status(404).json({ error: "Client preferences not found." });
    }

    // 2. Fetch all artists and their preferences
    const { data: artists } = await supabase.from("artist").select("*");
    const { data: artistPrefsData } = await supabase
      .from("artist_preferences")
      .select("*");

    const artistPrefsMap = artistPrefsData.reduce((acc, pref) => {
      acc[pref.user_id] = pref;
      return acc;
    }, {});

    const processedArtists = artists.map((artist) => ({
      ...artist,
      profile_image: artist.profile_image
        ? `${ARTIST_CDN_URL}${artist.user_id}/${artist.profile_image}`
        : null,
      preferences: artistPrefsMap[artist.user_id] || {},
    }));

    // 3. Generate ranked artists
    const artistRankings = processedArtists.map((artist) => {
      const score = calculateScore(clientPrefs, artist.preferences);
      return { artistId: artist.user_id, score, artist };
    });

    // Sort by match score in descending order
    artistRankings.sort((a, b) => b.score - a.score);

    // Format the response
    const formattedArtists = artistRankings.map((item) => ({
      id: item.artist.user_id,
      name: `${item.artist.firstname} ${item.artist.lastname}`,
      role: item.artist.role,
      address: item.artist.address,
      profile_image: item.artist.profile_image,
      score: item.score,
    }));

    return res.status(200).json({ recommended: formattedArtists });
  } catch (error) {
    console.error("Error fetching recommended artists:", error);
    return res.status(500).json({ error: "Recommendation failed." });
  }
});
// ***** ENHANCED RECOMMENDED ARTISTS FOR CLIENT END ******

// visit profile endpoint
app.post("/log-profile-visit/:userId", async (req, res) => {
  const { userId } = req.params;
  const { visitorId } = req.body;

  if (!visitorId) {
    return res.status(400).json({ error: "Visitor ID is required." });
  }

  try {
    // Log the profile visit
    const { error } = await supabase
      .from("profile_visits")
      .insert([
        { visitor_id: visitorId, visited_id: userId, visited_at: new Date() },
      ]);

    if (error) {
      return res.status(500).json({ error: "Failed to log profile visit." });
    }

    res.status(200).json({ message: "Profile visit logged successfully." });
  } catch (err) {
    console.error("Error logging profile visit:", err);
    res.status(500).json({ error: "An unexpected error occurred." });
  }
});
// visit profile endpoint end....

// ***** MILESTONE ENDPOINT ******
// === GET: All "In Progress" Projects with Milestones ===
app.get("/api/projects/in-progress-with-milestones", async (req, res) => {
  try {
    const { data: projects, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("status", "In Progress");

    if (projectError) throw projectError;

    const projectsWithMilestones = await Promise.all(
      projects.map(async (project) => {
        const { data: milestones, error: milestoneError } = await supabase
          .from("milestones")
          .select("*")
          .eq("project_id", project.project_id)
          .order("due_date", { ascending: true });

        if (milestoneError) throw milestoneError;

        const avg =
          milestones.reduce(
            (sum, m) => sum + (m.completion_percentage || 0),
            0
          ) / (milestones.length || 1);

        return {
          ...project,
          milestones,
          completion_percentage: Math.round(avg),
        };
      })
    );

    res.status(200).json(projectsWithMilestones);
  } catch (err) {
    console.error("Failed to fetch projects with milestones:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// === GET: Milestones for Specific Project ===
app.get("/api/projects/:projectId/milestones", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("milestones")
      .select("*")
      .eq("project_id", req.params.projectId)
      .order("due_date", { ascending: true });

    if (error) throw error;
    res.status(200).json(data);
  } catch (err) {
    console.error("Error fetching milestones:", err.message);
    res.status(500).json({ error: "Failed to fetch milestones." });
  }
});

// === POST: Create Milestone ===
app.post("/api/projects/:projectId/milestones", async (req, res) => {
  const { projectId } = req.params;
  const {
    milestone_name,
    description,
    due_date,
    status = "Not Started",
    completion_percentage = 0,
    milestone_fee = 0,
  } = req.body;

  try {
    const { data, error } = await supabase
      .from("milestones")
      .insert([
        {
          project_id: projectId,
          milestone_name,
          description,
          due_date,
          status,
          completion_percentage,
          milestone_fee,
          is_paid: false,
        },
      ])
      .select();

    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (err) {
    console.error("Error creating milestone:", err.message);
    res.status(500).json({ error: "Failed to create milestone." });
  }
});

// === PUT: Update Milestone ===
app.put("/api/milestones/:milestoneId", async (req, res) => {
  const updates = {};
  const { milestone_name, status, due_date, milestone_fee } = req.body;

  if (milestone_name !== undefined) updates.milestone_name = milestone_name;
  if (status !== undefined) {
    updates.status = status;
    updates.completion_percentage =
      status === "Completed" ? 100 : status === "In Progress" ? 50 : 0;
  }
  if (due_date !== undefined) updates.due_date = due_date;
  if (milestone_fee !== undefined) updates.milestone_fee = milestone_fee;

  updates.updated_at = new Date();

  if (Object.keys(updates).length <= 1) {
    return res
      .status(400)
      .json({ error: "No valid fields provided for update." });
  }

  try {
    const { data, error } = await supabase
      .from("milestones")
      .update(updates)
      .eq("milestone_id", req.params.milestoneId)
      .select();

    if (error) throw error;
    if (!data || data.length === 0)
      return res.status(404).json({ error: "Milestone not found." });

    res.status(200).json(data[0]);
  } catch (err) {
    console.error("Error updating milestone:", err.message);
    res.status(500).json({ error: "Failed to update milestone." });
  }
});

// === DELETE: Milestone ===
app.delete("/api/milestones/:milestoneId", async (req, res) => {
  try {
    const { error } = await supabase
      .from("milestones")
      .delete()
      .eq("milestone_id", req.params.milestoneId);

    if (error) throw error;
    res.status(200).json({ success: true, message: "Milestone deleted." });
  } catch (err) {
    console.error("Error deleting milestone:", err.message);
    res.status(500).json({ error: "Failed to delete milestone." });
  }
});

// ***** MILESTONE ENDPOINT END... ******

// ORDERS/TRANSACTIONS
//fetch artist_id from user_id
app.get("/artist/:userId", async (req, res) => {
  const { userId } = req.params;

  console.log(userId);
  try {
    const { data: artist, error } = await supabase
      .from("artist")
      .select("artist_id")
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("Error fetching artist_id:", error);
      return res.status(400).json({ error: "Failed to fetch artist_id." });
    }

    res.status(200).json({ artist_id: artist.artist_id });
  } catch (err) {
    console.error("Unexpected error fetching artist_id:", err);
    res.status(500).json({ error: "Failed to fetch artist_id." });
  }
});

// Fetch orders by user_id
app.get("/orders/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    console.log("Fetching orders for userId:", userId);

    // Query the orders table for the given user_id
    const { data: orders, error } = await supabase
      .from("orders")
      .select(
        `
        id,
        created_at,
        amount,
        status,
        description,
        payment_intent_id,
        checkout_url,
        artist_id,
        art_id
      `
      )
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching orders:", error.message);
      return res.status(400).json({ error: "Failed to fetch orders." });
    }

    if (!orders || orders.length === 0) {
      console.warn(`No orders found for userId: ${userId}`);
      return res.status(200).json([]); // Return empty array, not error
    }

    // Format the orders data
    const formattedOrders = orders.map((order) => ({
      id: order.id,
      date: order.created_at,
      amount: order.amount,
      status: order.status,
      description: order.description,
      payment_intent_id: order.payment_intent_id,
      checkout_url: order.checkout_url,
      artist_id: order.artist_id,
      art_id: order.art_id,
    }));

    res.status(200).json(formattedOrders);
  } catch (err) {
    console.error("Unexpected error fetching orders:", err);
    res.status(500).json({ error: "Failed to fetch orders." });
  }
});

// Fetch all orders - Admin Access
app.get("/admin/orders", async (req, res) => {
  try {
    const { data: orders, error } = await supabase
      .from("orders")
      .select(
        `
        id,
        created_at,
        amount,
        status,
        description,
        payment_intent_id,
        checkout_url,
        artist_id,
        art_id,
        user_id
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching all orders:", error.message);
      return res.status(400).json({ error: "Failed to fetch all orders." });
    }

    const formattedOrders = orders.map((order) => ({
      id: order.id,
      date: order.created_at,
      amount: order.amount,
      status: order.status,
      description: order.description,
      payment_intent_id: order.payment_intent_id,
      checkout_url: order.checkout_url,
      artist_id: order.artist_id,
      art_id: order.art_id,
      user_id: order.user_id,
    }));

    res.status(200).json(formattedOrders);
  } catch (err) {
    console.error("Unexpected error fetching all orders:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});
// ORDERS/TRANSACTIONS END ******

// JOBS OFFER ENDPOINT... ******
// Create a new job post
app.post("/api/jobs", async (req, res) => {
  const {
    user_id,
    title,
    description,
    budget,
    deadline,
    preferred_art_styles,
    status = "Open", // default if not provided
  } = req.body;

  if (
    !user_id ||
    !title ||
    !description ||
    !budget ||
    !deadline ||
    !preferred_art_styles ||
    !status
  ) {
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    const { data, error } = await supabase
      .from("jobs")
      .insert([
        {
          user_id,
          title,
          description,
          budget,
          deadline,
          preferred_art_styles: preferred_art_styles.join(", "),
          status,
        },
      ])
      .select();

    if (error) {
      console.error("Error inserting job:", error.message);
      return res.status(400).json({ error: "Failed to post job." });
    }

    res.status(201).json(data[0]);
  } catch (err) {
    console.error("Unexpected error posting job:", err);
    res.status(500).json({ error: "Failed to post job." });
  }
});

// Update jobs posted by the client
app.patch("/api/jobs/:jobId", async (req, res) => {
  const { jobId } = req.params;
  const { title, description, budget, deadline, preferred_art_styles, status } =
    req.body;

  try {
    const { error } = await supabase
      .from("jobs")
      .update({
        title,
        description,
        budget,
        deadline,
        preferred_art_styles: Array.isArray(preferred_art_styles)
          ? preferred_art_styles.join(", ")
          : preferred_art_styles,
        status,
      })
      .eq("job_id", jobId);

    if (error) {
      console.error("Error updating job:", error);
      return res.status(400).json({ error: "Failed to update job post." });
    }

    res.status(200).json({ message: "Job post updated successfully." });
  } catch (err) {
    console.error("Unexpected error:", err);
    res.status(500).json({ error: "Server error while updating job post." });
  }
});

// Fetch jobs posted by a client
app.get("/api/jobs/client/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const { data: jobs, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching jobs:", error.message);
      return res.status(400).json({ error: "Failed to fetch job posts." });
    }

    res.status(200).json(jobs);
  } catch (err) {
    console.error("Unexpected error fetching job posts:", err);
    res.status(500).json({ error: "Server error while fetching jobs." });
  }
});

// Delete jobs posted by the client
app.delete("/api/jobs/:jobId", async (req, res) => {
  const { jobId } = req.params;

  try {
    const { error } = await supabase.from("jobs").delete().eq("job_id", jobId);

    if (error) {
      console.error("Error deleting job:", error);
      return res.status(400).json({ error: "Failed to delete job post." });
    }

    res.status(204).send();
  } catch (err) {
    console.error("Unexpected error:", err);
    res.status(500).json({ error: "Server error while deleting job post." });
  }
});

// Fetch Jobs to Artist
app.get("/api/open-jobs", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("status", "Open")
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.status(200).json(data);
  } catch (err) {
    console.error("Error fetching open jobs:", err);
    res.status(500).json({ error: "Failed to fetch jobs." });
  }
});

// Artist Applying Jobs
app.post("/api/apply-job", async (req, res) => {
  const { job_id, user_id } = req.body;

  if (!job_id || !user_id) {
    return res.status(400).json({ error: "Job ID and User ID are required." });
  }

  try {
    // Check if already applied
    const { data: existing, error: checkError } = await supabase
      .from("job_applications")
      .select("*")
      .eq("job_id", job_id)
      .eq("user_id", user_id)
      .single();

    if (existing) {
      return res.status(409).json({ error: "Already applied to this job." });
    }

    if (checkError && checkError.code !== "PGRST116") {
      // Not found is fine (PGRST116 = no rows)
      console.error("Error checking existing application:", checkError);
      return res.status(500).json({ error: "Server error." });
    }

    // Insert application
    const { error: insertError } = await supabase
      .from("job_applications")
      .insert([
        {
          job_id,
          user_id,
          applied_at: new Date().toISOString(),
          status: "Pending",
        },
      ]);

    if (insertError) {
      console.error("Error inserting application:", insertError);
      return res.status(500).json({ error: "Failed to apply for the job." });
    }

    return res.status(201).json({ message: "Application submitted." });
  } catch (err) {
    console.error("Unexpected error:", err);
    return res.status(500).json({ error: "Unexpected server error." });
  }
});

// Already Applied Job
app.get("/api/my-applied-jobs/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const { data, error } = await supabase
      .from("job_applications")
      .select("job_id, status")
      .eq("user_id", userId);

    if (error) throw error;

    res.status(200).json(data);
  } catch (err) {
    console.error("Error fetching applied jobs:", err);
    res.status(500).json({ error: "Failed to fetch applied jobs" });
  }
});

// New endpoint: Get jobs the artist has applied to (regardless of job status)
app.get("/api/my-applied-job-details/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const { data: applications, error: appError } = await supabase
      .from("job_applications")
      .select("job_id")
      .eq("user_id", userId);

    if (appError) throw appError;

    const jobIds = applications.map((a) => a.job_id);
    if (!jobIds.length) return res.status(200).json([]);

    const { data: jobs, error: jobError } = await supabase
      .from("jobs")
      .select("*")
      .in("job_id", jobIds)
      .order("created_at", { ascending: false });

    if (jobError) throw jobError;

    res.status(200).json(jobs);
  } catch (err) {
    console.error("Error fetching applied job details:", err);
    res.status(500).json({ error: "Failed to fetch applied jobs." });
  }
});

// Unapply from a job
app.delete("/api/unapply-job", async (req, res) => {
  const { job_id, user_id } = req.body;

  if (!job_id || !user_id) {
    return res.status(400).json({ error: "Missing job_id or user_id" });
  }

  try {
    const { error } = await supabase
      .from("job_applications")
      .delete()
      .eq("job_id", job_id)
      .eq("user_id", user_id);

    if (error) throw error;

    res.status(200).json({ message: "Unapplied successfully" });
  } catch (err) {
    console.error("Error unapplying from job:", err);
    res.status(500).json({ error: "Failed to unapply from job" });
  }
});

// Get applicants for a specific job
app.get("/api/job-applicants/:jobId", async (req, res) => {
  const { jobId } = req.params;
  const CDNURL1 =
    "https://seaczeofjlkfcwnofbny.supabase.co/storage/v1/object/public/artist-profile/";

  try {
    // 1. Get job applications for the given job ID
    const { data: applications, error: appError } = await supabase
      .from("job_applications")
      .select("user_id, status")
      .eq("job_id", jobId);

    if (appError) throw appError;
    if (!applications.length) return res.status(200).json([]);

    // 2. Fetch artist profiles
    const userIds = applications.map((a) => a.user_id);

    const { data: artists, error: artistError } = await supabase
      .from("artist")
      .select("user_id, firstname, lastname, email, profile_image")
      .in("user_id", userIds);

    if (artistError) throw artistError;

    // 3. Merge application status with artist profile
    const applicants = applications.map((app) => {
      const profile = artists.find((a) => a.user_id === app.user_id);
      return {
        user_id: app.user_id,
        status: app.status,
        firstname: profile?.firstname || "",
        lastname: profile?.lastname || "",
        email: profile?.email || "",
        profile_image: profile?.profile_image
          ? `${CDNURL1}${profile.user_id}/${profile.profile_image}`
          : null,
      };
    });

    res.status(200).json(applicants);
  } catch (err) {
    console.error("Error fetching applicants:", err);
    res.status(500).json({ error: "Failed to fetch applicants." });
  }
});

// Update job application status and create project if accepted
app.patch("/api/job-applicants/status", async (req, res) => {
  const { job_id, user_id, status } = req.body;

  try {
    // Step 1: Update the job application status
    const { error: updateError } = await supabase
      .from("job_applications")
      .update({ status })
      .eq("job_id", job_id)
      .eq("user_id", user_id);

    if (updateError) throw updateError;

    // Step 2: If Accepted, update job status and create project
    if (status === "Accepted") {
      // Get job details
      const { data: job, error: jobFetchError } = await supabase
        .from("jobs")
        .select("*")
        .eq("job_id", job_id)
        .single();

      if (jobFetchError || !job) {
        throw jobFetchError || new Error("Job not found");
      }

      // Update the job's status to "In Progress"
      const { error: jobUpdateError } = await supabase
        .from("jobs")
        .update({ status: "In Progress" })
        .eq("job_id", job_id);

      if (jobUpdateError) throw jobUpdateError;

      // Create project entry
      const { data: newProject, error: projectError } = await supabase
        .from("projects")
        .insert([
          {
            job_id: job_id,
            project_name: job.title,
            description: job.description,
            client_id: job.user_id,
            artist_id: user_id,
            due_date: job.deadline,
            status: "To Do",
            priority: "Normal",
            created_at: new Date(),
            updated_at: new Date(),
          },
        ])
        .select("*")
        .single();

      if (projectError) throw projectError;

      // Send notification to artist
      const notificationMsg = `You've been accepted for the job "${job.title}". A project has been created.`;
      const { error: notificationError } = await supabase
        .from("notifications")
        .insert([
          {
            user_id,
            type: "Job Accepted",
            message: notificationMsg,
            is_read: false,
            created_at: new Date().toISOString(),
          },
        ]);

      if (notificationError) {
        console.error("Failed to send notification:", notificationError);
      }

      return res.status(200).json({
        message: "Application accepted and project created",
        project: newProject,
      });
    }

    res.status(200).json({ message: "Status updated successfully." });
  } catch (err) {
    console.error("Error updating job applicant status:", err);
    res.status(500).json({ error: "Failed to update status." });
  }
});

// Remove an accepted or rejected application from job_applications
app.delete("/api/delete-application", async (req, res) => {
  const { job_id, user_id } = req.body;

  if (!job_id || !user_id) {
    return res.status(400).json({ error: "job_id and user_id are required." });
  }

  try {
    // First, check the status of the application
    const { data: existing, error: fetchError } = await supabase
      .from("job_applications")
      .select("status")
      .eq("job_id", job_id)
      .eq("user_id", user_id)
      .single();

    if (fetchError) throw fetchError;

    if (!["Accepted", "Rejected"].includes(existing.status)) {
      return res.status(403).json({
        error: "Only accepted or rejected applications can be deleted.",
      });
    }

    // Proceed to delete
    const { error: deleteError } = await supabase
      .from("job_applications")
      .delete()
      .eq("job_id", job_id)
      .eq("user_id", user_id);

    if (deleteError) throw deleteError;

    res.status(200).json({ message: "Application successfully removed." });
  } catch (err) {
    console.error("Error deleting application:", err);
    res.status(500).json({ error: "Failed to delete application." });
  }
});
// JOBS OFFER ENDPOINT END... ******

// MILESTONE WITH PAYMONGO ENDPOINT... ******

// Pay a milestone directly via milestone ID
app.post("/milestones/:milestoneId/pay", async (req, res) => {
  const { milestoneId } = req.params;
  const { user_email, user_name } = req.body;

  try {
    const { data: milestone, error } = await supabase
      .from("milestones")
      .select("milestone_name, milestone_fee, is_paid, project_id")
      .eq("milestone_id", milestoneId)
      .single();

    if (error || !milestone) {
      return res.status(404).json({ error: "Milestone not found" });
    }

    if (milestone.is_paid) {
      return res.status(400).json({ error: "Milestone already paid" });
    }

    // Dynamically determine frontend base URL
    const frontendUrl =
      req.headers.origin || process.env.FRONTEND_URL || "https://icraftify.com";

    const response = await axios.post(
      `${process.env.VITE_PAYMONGO_URL}/checkout_sessions`,
      {
        data: {
          attributes: {
            billing: { email: user_email, name: user_name },
            line_items: [
              {
                amount: Math.round(milestone.milestone_fee * 100),
                currency: "PHP",
                description: milestone.milestone_name,
                name: `Milestone Fee (${milestone.milestone_name})`,
                quantity: 1,
              },
            ],
            payment_method_types: ["card", "gcash"],
            success_url: `${frontendUrl}/milestone/success?milestone_id=${milestoneId}`,
            cancel_url: `${frontendUrl}/milestone/cancel`,
            metadata: {
              milestone_id: milestoneId,
              project_id: milestone.project_id,
              type: "milestone",
            },
          },
        },
      },
      {
        headers: {
          Authorization: `Basic ${Buffer.from(
            process.env.VITE_PAYMONGO_SECRET_KEY + ":"
          ).toString("base64")}`,
          "Content-Type": "application/json",
        },
      }
    );

    const checkoutUrl = response?.data?.data?.attributes?.checkout_url;

    if (!checkoutUrl) {
      console.error(
        "Missing checkout_url in PayMongo response:",
        response.data
      );
      return res
        .status(500)
        .json({ error: "checkout_url not found in PayMongo response" });
    }

    await supabase.from("milestone_payments").insert({
      milestone_id: milestoneId,
      project_id: milestone.project_id,
      amount: milestone.milestone_fee,
      status: "pending",
      checkout_url: checkoutUrl,
      payment_intent_id: response?.data?.data?.id || null,
      paid_at: new Date(),
    });

    return res.status(200).json({ checkout_url: checkoutUrl });
  } catch (err) {
    console.error("Error creating milestone checkout:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// Initiate Milestone Payment via /api/milestone-payment/checkout
app.post("/api/milestone-payment/checkout", async (req, res) => {
  const {
    milestone_id,
    project_id,
    amount,
    user_name,
    user_email,
    currency = "PHP",
  } = req.body;

  if (!milestone_id || !project_id || !amount || !user_name || !user_email) {
    return res.status(400).json({ error: "Missing required payment details." });
  }

  try {
    // Use request origin as base URL fallback
    const frontendUrl =
      req.headers.origin || process.env.FRONTEND_URL || "https://icraftify.com";

    // Fetch milestone name
    const { data: milestone, error: milestoneError } = await supabase
      .from("milestones")
      .select("milestone_name")
      .eq("milestone_id", milestone_id)
      .single();

    const milestoneName = milestone?.milestone_name || "Unnamed";

    const response = await axios.post(
      `${process.env.VITE_PAYMONGO_URL}/checkout_sessions`,
      {
        data: {
          attributes: {
            billing: { name: user_name, email: user_email },
            line_items: [
              {
                name: `Milestone Fee (${milestoneName})`,
                description: `Payment for milestone ${milestone_id}`,
                amount,
                currency,
                quantity: 1,
              },
            ],
            payment_method_types: ["card", "gcash"],
            success_url: `${frontendUrl}/payment-success?milestone_id=${milestone_id}`,
            cancel_url: `${frontendUrl}/payment-cancel`,
            metadata: {
              milestone_id,
              project_id,
              type: "milestone",
            },
          },
        },
      },
      {
        headers: {
          Authorization: `Basic ${Buffer.from(
            process.env.VITE_PAYMONGO_SECRET_KEY + ":"
          ).toString("base64")}`,
          "Content-Type": "application/json",
        },
      }
    );

    const checkoutUrl = response?.data?.data?.attributes?.checkout_url;

    if (!checkoutUrl) {
      return res
        .status(500)
        .json({ error: "checkout_url not found in PayMongo response" });
    }

    await supabase.from("milestone_payments").insert({
      milestone_id,
      project_id,
      amount: amount / 100,
      status: "pending",
      checkout_url: checkoutUrl,
      payment_intent_id: response?.data?.data?.id || null,
      paid_at: new Date(),
    });

    res.status(200).json({ checkout_url: checkoutUrl });
  } catch (err) {
    console.error("PayMongo Checkout Error:", err.message);
    res.status(500).json({ error: "Failed to create checkout session." });
  }
});

// === MARK AS PAID MANUALLY AFTER SUCCESS REDIRECT ===
app.post("/milestones/:milestoneId/mark-paid", async (req, res) => {
  const { milestoneId } = req.params;

  try {
    const { error: milestoneError } = await supabase
      .from("milestones")
      .update({ is_paid: true })
      .eq("milestone_id", milestoneId);

    const { error: paymentError } = await supabase
      .from("milestone_payments")
      .update({
        status: "paid",
        paid_at: new Date(),
      })
      .eq("milestone_id", milestoneId);

    if (milestoneError || paymentError) {
      return res
        .status(500)
        .json({ error: "Failed to mark milestone as paid" });
    }

    return res
      .status(200)
      .json({ message: "Milestone successfully marked as paid" });
  } catch (err) {
    console.error("Mark-paid error:", err);
    return res.status(500).json({ error: "Unexpected server error" });
  }
});

//admin fetch transaction

app.get("/admin/milestone-transactions", async (req, res) => {
  try {
    // Fetch milestone payments with milestone name
    const { data, error } = await supabase.from("milestone_payments").select(`
        milestone_id,
        project_id,
        amount,
        status,
        checkout_url,
        payment_intent_id,
        paid_at,
        milestones (
          milestone_name
        )
      `);

    if (error) {
      console.error("Error fetching milestone transactions:", error.message);
      return res.status(500).json({ error: "Failed to fetch transactions." });
    }

    // Normalize the milestone name from the joined table
    const formatted = data.map((tx) => ({
      milestone_id: tx.milestone_id,
      project_id: tx.project_id,
      amount: tx.amount,
      status: tx.status,
      checkout_url: tx.checkout_url,
      payment_intent_id: tx.payment_intent_id,
      paid_at: tx.paid_at,
      milestone_name: tx.milestones?.milestone_name || "Unnamed",
    }));

    res.status(200).json(formatted);
  } catch (err) {
    console.error("Server error fetching milestone transactions:", err.message);
    res.status(500).json({ error: "Unexpected server error." });
  }
});
// MILESTONE WITH PAYMONGO ENDPOINT END... ******
