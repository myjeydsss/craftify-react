require("dotenv").config({ path: ".env.local" });
const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const axios = require("axios");
const { galeShapley } = require("./utils/galeShapley");


const app = express();
const PORT = process.env.PORT || 8081;

 const allowedOrigins = [
  "http://localhost:5173",
  "https://craftify-react-git-main-myjeydsss-projects.vercel.app",
  "https://craftify-react.vercel.app",
  "https://craftify-react.onrender.com",
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

 const Paymongo = require('paymongo');
const paymongo = new Paymongo(process.env.VITE_PAYMONGO_SECRET_KEY);

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
    res.status(500).json({ error: "An unexpected error occurred. Please try again." });
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
app.get("/user-role/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    
    const { data: artistData } = await supabase
      .from("artist")
      .select("role")
      .eq("user_id", userId)
      .single();

    if (artistData) {
      return res.status(200).json({ role: artistData.role });
    }

    const { data: clientData } = await supabase
      .from("client")
      .select("role")
      .eq("user_id", userId)
      .single();

    if (clientData) {
      return res.status(200).json({ role: clientData.role });
    }

    const { data: adminData } = await supabase
      .from("admin")
      .select("role")
      .eq("user_id", userId)
      .single();

    if (adminData) {
      return res.status(200).json({ role: adminData.role });
    }

    
    console.error(`User ID ${userId} does not exist in artist, client, or admin tables.`);
    return res.status(404).json({ error: "User role not found." });

  } catch (err) {
    console.error("Error fetching user role:", err);
    res.status(500).json({ error: "Server error fetching user role." });
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
    res.status(500).json({ error: "An unexpected error occurred during file upload." });
  }
});
// ****** ARTIST UPLOAD PROFILE IMAGE END... ******


// ****** CLIENT UPLOAD PROFILE IMAGE ******
 const CLIENT_UPLOADS_DIR = path.join(__dirname, "uploads/client-profile");
if (!fs.existsSync(CLIENT_UPLOADS_DIR)) {
  fs.mkdirSync(CLIENT_UPLOADS_DIR, { recursive: true });
}

 app.use("/uploads/client-profile", express.static(CLIENT_UPLOADS_DIR));

 app.post("/upload-client-profile-image/:userId", upload.single("file"), async (req, res) => {
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
      return res.status(500).json({ error: "Failed to upload image to Supabase." });
    }

    console.log("File uploaded to Supabase successfully:", `${userId}/${storageFilePath}`);

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
    res.status(500).json({ error: "An unexpected error occurred during file upload." });
  }
});
// ****** CLIENT UPLOAD PROFILE IMAGE END... ******


// ****** ARTIST PROFILE ENDPOINT ****** 
// Get Artist Profile
 app.get("/artist-profile/:userId", async (req, res) => {
  const { userId } = req.params;
  const CDNURL = "https://seaczeofjlkfcwnofbny.supabase.co/storage/v1/object/public/artist-profile/";

  try {
    const { data: artistData, error: artistError } = await supabase
      .from("artist")
      .select("user_id, firstname, lastname, bio, gender, date_of_birth, email, role, address, phone, profile_image, verification_id")
      .eq("user_id", userId)
      .single();

    if (artistError || !artistData) {
      console.error("Error fetching artist profile:", artistError);
      return res.status(404).json({ error: "Artist profile not found." });
    }

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
      return res.status(500).json({ error: "Failed to create default preferences." });
    }

    res.status(201).json({ message: "Default preferences created successfully." });
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
      .select("firstname, lastname, bio, gender, date_of_birth, email, role, address, phone, profile_image")
      .eq("user_id", userId)
      .single();

    if (fetchProfileError || !existingProfile) {
      console.error("Error fetching existing profile:", fetchProfileError);
      return res.status(404).json({ error: "Artist profile not found." });
    }

    // Determine the updated profile image
    const updatedProfileImage = profile.profile_image && !profile.profile_image.includes("http")
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
      return res.status(500).json({ error: "Failed to update artist profile." });
    }

    // Handle preferences if provided
    if (preferences && Object.keys(preferences).length > 0) {
      const { data: existingPreferences, error: fetchPreferencesError } = await supabase
        .from("artist_preferences")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (fetchPreferencesError && fetchPreferencesError.code !== "PGRST116") {
        console.error("Error fetching existing preferences:", fetchPreferencesError);
        return res.status(500).json({ error: "Failed to fetch existing preferences." });
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
          return res.status(500).json({ error: "Failed to update preferences." });
        }
      } else {
        const { error: insertError } = await supabase
          .from("artist_preferences")
          .insert({ user_id: userId, ...updatedPreferences });

        if (insertError) {
          console.error("Error inserting preferences:", insertError);
          return res.status(500).json({ error: "Failed to insert preferences." });
        }
      }
    }

    // Successful response
    res.status(200).json({ message: "Profile and preferences updated successfully." });
  } catch (err) {
    console.error("Unexpected error updating profile/preferences:", err);
    res.status(500).json({ error: "An unexpected error occurred." });
  }
});
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
        return res.status(400).json({ error: "Invalid tags format. Must be a JSON array." });
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
    res.status(500).json({ error: "An unexpected error occurred while updating the art." });
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
      return res.status(500).json({ error: "Failed to upload image to Supabase." });
    }

    console.log("File uploaded to Supabase successfully:", storageFilePath);

     const { data: publicUrlData, error: publicUrlError } = supabase.storage
      .from("artist-arts")
      .getPublicUrl(storageFilePath);

    if (publicUrlError) {
      console.error("Error generating public URL:", publicUrlError);
      return res.status(500).json({ error: "Failed to generate public URL for image." });
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
  const CDNURL = "https://seaczeofjlkfcwnofbny.supabase.co/storage/v1/object/public/client-profile/";

  try {
    const { data: clientData, error } = await supabase
      .from("client")
      .select("user_id, firstname, lastname, bio, gender, date_of_birth, email, role, address, phone, profile_image")
      .eq("user_id", userId)
      .single();

    if (error || !clientData) {
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
      .select("firstname, lastname, bio, gender, date_of_birth, email, role, address, phone, profile_image")
      .eq("user_id", userId)
      .single();

    if (fetchProfileError || !existingProfile) {
      console.error("Error fetching existing profile:", fetchProfileError);
      return res.status(500).json({ error: "Failed to fetch existing profile." });
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
      return res.status(500).json({ error: "Failed to update client profile." });
    }

     if (preferences && Object.keys(preferences).length > 0) {
      const { data: existingPreferences, error: fetchPreferencesError } = await supabase
        .from("client_preferences")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (fetchPreferencesError && fetchPreferencesError.code !== "PGRST116") {
        console.error("Error fetching existing preferences:", fetchPreferencesError);
        return res.status(500).json({ error: "Failed to fetch existing preferences." });
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
          return res.status(500).json({ error: "Failed to update preferences." });
        }
      } else {
        const { error: insertError } = await supabase
          .from("client_preferences")
          .insert({ user_id: userId, ...updatedPreferences });

        if (insertError) {
          console.error("Error inserting preferences:", insertError);
          return res.status(500).json({ error: "Failed to insert preferences." });
        }
      }
    }

    res.status(200).json({ message: "Profile and preferences updated successfully." });
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
      project_requirements: "",
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
      return res.status(500).json({ error: "Failed to create default preferences." });
    }

    res.status(201).json({ message: "Default preferences created successfully." });
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
     const { data: existingTags } = await supabase
      .from("tags")
      .select("*")
      .eq("name", name);

    if (existingTags.length > 0) {
      return res.status(409).json({ error: "Tag already exists" });
    }

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


// ****** BROWSE ARTIST ****** CURRENTLY WORKING
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
  const CDNURL = "https://seaczeofjlkfcwnofbny.supabase.co/storage/v1/object/public/client-profile/";

  try {
    const { data: clientsData, error: clientsError } = await supabase
      .from("client")
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
        profile_image
      `);

    if (clientsError) {
      console.error("Error fetching clients:", clientsError);
      return res.status(500).json({ error: "Failed to fetch clients." });
    }

     const formattedClients = clientsData.map(client => {
      if (client.profile_image) {
        client.profile_image = `${CDNURL}${client.user_id}/${client.profile_image}`;
      }
      return client;
    });

    res.status(200).json(formattedClients);
  } catch (err) {
    console.error("Unexpected error fetching clients:", err);
    res.status(500).json({ error: "Unexpected server error." });
  }
});
// ****** BROWSE CLIENT END ******


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
        quantity,
        art_style,
        medium,
        subject,
        created_at,
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
      .eq('user_id', userId);  

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

   if (!userId || !artId || !action) {
    return res.status(400).json({ error: 'User ID, Art ID, and action are required.' });
  }

  try {
    if (action === 'add') {
       const { error } = await supabase
        .from('wishlist')
        .insert([{ user_id: userId, art_id: artId }]);

      if (error) {
        console.error("Error adding to wishlist:", error);
        return res.status(500).json({ error: 'Failed to add to wishlist.' });
      }

      return res.status(200).json({ message: 'Added to wishlist.' });
    } else if (action === 'remove') {
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


// ARTs DETAIL FUNCTION - FINAL CLEAN VERSION
app.get('/art/:artId', async (req, res) => {
  const { artId } = req.params;
  const CDN_URL = "https://seaczeofjlkfcwnofbny.supabase.co/storage/v1/object/public/artist-profile/";

  try {
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
      .single();  

    if (error || !data) {
      return res.status(404).json({ error: 'Art not found.' });
    }

     if (data.artist?.profile_image) {
      data.artist.profile_image = `${CDN_URL}${data.artist.user_id}/${data.artist.profile_image}`;
    }

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
                        payment_method_types: ['card', 'gcash'],
                        success_url: 'http://localhost:5173/success', // Update this for actual success URL
                        cancel_url: 'http://localhost:5173/checkout' // Update this for actual cancel URL
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

//Put the order in the database table orders
app.post("/order", async (req, res) => {
    const { user_id, status, user_email, user_name, amount, description, payment_intent_id, checkout_url } = req.body;

    try {
        const { data, error } = await supabase.from("orders").insert([
            {
                user_id,
                status,
                user_email,
                user_name,
                amount,
                description,
                payment_intent_id,
                checkout_url,
            },
        ]).single();

        if (error) {
            console.error("Error inserting order:", error.message);
            return res.status(500).json({ error: "Failed to place order." });
        }

        res.status(201).json({ message: "Order placed successfully.", order: data });
    } catch (error) {
        console.error("Error processing order:", error);
        res.status(500).json({ error: "Failed to process order." });
    }
});
// ****** PAYMENT ORDER (PHOEBE START HERE) END... ****** CURRENTLY WORKING


// ***** BROWSE ARTIST MATCHING ALGORITHM ******
app.get("/match-artists/:userId", async (req, res) => {
  const { userId } = req.params;

  const ARTIST_CDN_URL = "https://seaczeofjlkfcwnofbny.supabase.co/storage/v1/object/public/artist-profile/";
  const CLIENT_CDN_URL = "https://seaczeofjlkfcwnofbny.supabase.co/storage/v1/object/public/client-profile/";

  try {
    // Fetch client details
    const { data: client, error: clientError } = await supabase
      .from("client")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (clientError || !client) {
      return res.status(404).json({ error: "Client not found." });
    }

     const processedClient = {
      ...client,
      profile_image: client.profile_image
        ? `${CLIENT_CDN_URL}${client.user_id}/${client.profile_image}`
        : null,
    };

    // Fetch all artists
    const { data: artists, error: artistError } = await supabase
      .from("artist")
      .select("*");

    if (artistError || !artists.length) {
      return res.status(400).json({ error: "No artists available for matching." });
    }

     const processedArtists = artists.map((artist) => ({
      ...artist,
      profile_image: artist.profile_image
        ? `${ARTIST_CDN_URL}${artist.user_id}/${artist.profile_image}`
        : null,
    }));

    // Match data preparation
    const clientData = {
      user_id: processedClient.user_id,
      preferences: processedArtists.map((artist) => artist.user_id), // Match with all artists
    };

    const artistData = processedArtists.map((artist) => ({
      user_id: artist.user_id,
      preferences: [processedClient.user_id], // Match with the client
    }));

     if (!clientData.preferences.length || !artistData.length) {
      return res.status(400).json({ error: "No valid matches found." });
    }

     const matches = galeShapley([clientData], artistData);

     const formattedMatches = Object.entries(matches).map(([artistId, clientId]) => {
      const artist = processedArtists.find((a) => a.user_id === artistId);
      const clientMatch = processedClient.user_id === clientId ? processedClient : null;

      return {
        artist: {
          id: artist?.user_id || "Unknown",
          name: artist ? `${artist.firstname} ${artist.lastname}` : "Unknown Artist",
          role: artist?.role || "Unknown Role",
          address: artist?.address || "Unknown Address",
          profile_image: artist?.profile_image || null,
        },
        client: {
          id: clientMatch?.user_id || "Unknown",
          name: clientMatch ? `${clientMatch.firstname} ${clientMatch.lastname}` : "Unknown Client",
          role: clientMatch?.role || "Unknown Role",
          address: clientMatch?.address || "Unknown Address",
          profile_image: clientMatch?.profile_image || null,
        },
      };
    });

    console.log("Formatted Matches:", formattedMatches);  

    res.status(200).json({ matches: formattedMatches });
  } catch (error) {
    console.error("Error running Gale-Shapley:", error);
    res.status(500).json({ error: "Matchmaking failed." });
  }
});
// ***** BROWSE ARTIST MATCHING ALGORITHM END... ******



// ***** BROWSE CLIENT MATCHING ALGORITHM ******
app.get("/match-clients/:userId", async (req, res) => {
  const { userId } = req.params;

  const ARTIST_CDN_URL = "https://seaczeofjlkfcwnofbny.supabase.co/storage/v1/object/public/artist-profile/";
  const CLIENT_CDN_URL = "https://seaczeofjlkfcwnofbny.supabase.co/storage/v1/object/public/client-profile/";

  try {
    // Fetch artist details
    const { data: artist, error: artistError } = await supabase
      .from("artist")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (artistError || !artist) {
      return res.status(404).json({ error: "Artist not found." });
    }

     const processedArtist = {
      ...artist,
      profile_image: artist.profile_image
        ? `${ARTIST_CDN_URL}${artist.user_id}/${artist.profile_image}`
        : null,
    };

    // Fetch all clients
    const { data: clients, error: clientError } = await supabase
      .from("client")
      .select("*");

    if (clientError || !clients || !clients.length) {
      return res.status(400).json({ error: "No clients available for matching." });
    }

     const processedClients = clients.map((client) => ({
      ...client,
      profile_image: client.profile_image
        ? `${CLIENT_CDN_URL}${client.user_id}/${client.profile_image}`
        : null,
    }));

    // Match data preparation
    const artistData = {
      user_id: processedArtist.user_id,
      preferences: processedClients.map((client) => client.user_id), // Match with all clients
    };

    const clientData = processedClients.map((client) => ({
      user_id: client.user_id,
      preferences: [processedArtist.user_id], // Match with the artist
    }));

     if (!artistData.preferences.length || !clientData.length) {
      return res.status(400).json({ error: "No valid matches found." });
    }

     const matches = galeShapley([artistData], clientData);

     const formattedMatches = Object.entries(matches).map(([clientId, artistId]) => {
      const client = processedClients.find((c) => c.user_id === clientId);
      const artistMatch = processedArtist.user_id === artistId ? processedArtist : null;

      return {
        client: {
          id: client?.user_id || "Unknown",
          name: client ? `${client.firstname} ${client.lastname}` : "Unknown Client",
          role: client?.role || "Unknown Role",
          address: client?.address || "Unknown Address",
          profile_image: client?.profile_image || null,
        },
        artist: {
          id: artistMatch?.user_id || "Unknown",
          name: artistMatch ? `${artistMatch.firstname} ${artistMatch.lastname}` : "Unknown Artist",
          role: artistMatch?.role || "Unknown Role",
          address: artistMatch?.address || "Unknown Address",
          profile_image: artistMatch?.profile_image || null,
        },
      };
    });

    console.log("Formatted Matches:", formattedMatches); 

    res.status(200).json({ matches: formattedMatches });
  } catch (error) {
    console.error("Error running Gale-Shapley:", error);
    res.status(500).json({ error: "Matchmaking failed." });
  }
});
// ***** BROWSE CLIENT MATCHING ALGORITHM END... ******


// ****** SEND PROPOSAL ENDPOINT ******
// Proposal Endpoint
app.post("/send-proposal", async (req, res) => {
  const { sender_id, recipient_id, project_name, project_description, budget, due_date, status } = req.body;

  if (!sender_id || !recipient_id || !project_name || !project_description || !budget || !due_date) {
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
      { sender_id, recipient_id, project_name, project_description, budget, due_date, status }
    ]);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

     const notificationMessage = `You have received a new proposal from ${senderName}.`;
    const { error: notificationError } = await supabase.from("notifications").insert([
      {
        user_id: recipient_id,
        type: "Proposal",
        message: notificationMessage,
        is_read: false,  
        created_at: new Date().toISOString(),
      }
    ]);

    if (notificationError) {
      console.error("Error creating notification:", notificationError);
      return res.status(500).json({ error: "Failed to create notification." });
    }

     const { data: proposalsData, error: proposalsError } = await supabase
      .from('proposals')
      .select('*')
      .eq('recipient_id', recipient_id);

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

    res.status(201).json({ message: "Proposal sent successfully!", data: proposalsWithProfiles });
  } catch (err) {
    console.error("Internal server error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});
// ****** SEND PROPOSAL ENDPOINT END... ******


// ****** COMMUNITY ENDPOINT ******
 const ARTIST_CDNURL = "https://seaczeofjlkfcwnofbny.supabase.co/storage/v1/object/public/artist-profile/";
const CLIENT_CDNURL = "https://seaczeofjlkfcwnofbny.supabase.co/storage/v1/object/public/client-profile/";
const POST_CDNURL = "https://seaczeofjlkfcwnofbny.supabase.co/storage/v1/object/public/community_post_photos/";

// **GET Community Posts with User Details & Comments**
app.get("/community-posts", async (req, res) => {
  const { page = 1, limit = 5 } = req.query;  
  const offset = (page - 1) * limit;  

  try {
    // Fetch posts with pagination
    const { data: postsData, error: postsError } = await supabase
      .from("community_posts")
      .select(`
        id, content, images, created_at, user_id,
        community_comments (id, content, user_id, created_at),
        community_likes (user_id)
      `)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);  

    if (postsError) {
      console.error("Error fetching posts:", postsError);
      return res.status(500).json({ error: "Failed to fetch posts" });
    }

     const { count: totalCount } = await supabase
      .from("community_posts")
      .select("id", { count: "exact", head: true });

     const userIds = [
      ...new Set(
        postsData.flatMap((post) => [
          post.user_id,
          ...post.community_comments.map((comment) => comment.user_id),
        ])
      ),
    ];

    // Fetch user details (artists, clients, and admins)
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

     const userMap = [...(artistData || []), ...(clientData || []), ...(adminData || [])].reduce((acc, user) => {
      const isArtist = artistData?.some((artist) => artist.user_id === user.user_id);
      acc[user.user_id] = {
        firstname: user.firstname,
        lastname: user.lastname,
        profile_image: user.profile_image
          ? `${isArtist ? ARTIST_CDNURL : CLIENT_CDNURL}${user.user_id}/${user.profile_image}`
          : null,
      };
      return acc;
    }, {});

    // Format posts with user details, images, and comments
    const postsWithDetails = postsData.map((post) => ({
      ...post,
      images: post.images ? (Array.isArray(post.images) ? post.images : JSON.parse(post.images)) : [],
      likes: post.community_likes ? post.community_likes.map((like) => like.user_id) : [],
      user: userMap[post.user_id] || { firstname: "Unknown", lastname: "User ", profile_image: null },
      comments: post.community_comments
        ? post.community_comments.map((comment) => ({
            ...comment,
            user: userMap[comment.user_id] || { firstname: "Unknown", lastname: "User ", profile_image: null },
          }))
        : [],
    }));

     res.status(200).json({ posts: postsWithDetails, total: totalCount });
  } catch (err) {
    console.error("Error fetching posts:", err);
    res.status(500).json({ error: "Failed to fetch community posts" });
  }
});

// **GET User Details for Posting**
app.get("/user/:user_id", async (req, res) => {
  const { user_id } = req.params;

  try {
    const { data: artistData } = await supabase
      .from("artist")
      .select("user_id, firstname, lastname, profile_image")
      .eq("user_id", user_id)
      .single();

    const { data: clientData } = await supabase
      .from("client")
      .select("user_id, firstname, lastname, profile_image")
      .eq("user_id", user_id)
      .single();

      const { data: adminData } = await supabase
      .from("admin")
      .select("user_id, firstname, lastname, profile_image")
      .eq("user_id", user_id)
      .single();

    const userData = artistData || clientData || adminData;
    if (!userData) {
      return res.status(404).json({ error: "User not found" });
    }

    const isArtist = !!artistData;
    userData.profile_image = userData.profile_image
      ? `${isArtist ? ARTIST_CDNURL : CLIENT_CDNURL}${userData.user_id}/${userData.profile_image}`
      : null;

    res.status(200).json(userData);
  } catch (err) {
    console.error("Error fetching user data:", err);
    res.status(500).json({ error: "Failed to fetch user data" });
  }
});

// **POST Community Post with Image Uploads**
app.post("/community-posts", upload.array("images"), async (req, res) => {
  try {
    const { user_id, content } = req.body;
    if (!user_id) return res.status(400).json({ error: "User  ID is required" });

    let imageUrls = [];

     if (req.files.length > 0) {
      for (const file of req.files) {
        const fileName = `${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`;
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
      return res.status(404).json({ error: "User  not found in artist, client, or admin table" });
    }

     const isArtist = !!artistData;
    userData.profile_image = userData.profile_image
      ? `${isArtist ? ARTIST_CDNURL : CLIENT_CDNURL}${user_id}/${userData.profile_image}`
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
        const { error: notificationError } = await supabase.from("notifications").insert([
          {
            user_id: postOwnerId,  
            type: "Post Liked",
            message: notificationMessage,
            is_read: false, 
            created_at: new Date().toISOString(),
          }
        ]);

        if (notificationError) {
          console.error("Error creating notification:", notificationError);
          return res.status(500).json({ error: "Failed to create notification." });
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
      const { error: notificationError } = await supabase.from("notifications").insert([
        {
          user_id: postOwnerId,  
          type: "Post Commented",
          message: notificationMessage,
          is_read: false,  
          created_at: new Date().toISOString(),
        }
      ]);

      if (notificationError) {
        console.error("Error creating notification:", notificationError);
        return res.status(500).json({ error: "Failed to create notification." });
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
  const { content } = req.body;

  try {
    const { data, error } = await supabase
      .from("community_posts")
      .update({ content })
      .eq("id", id)
      .select("id, content, images, created_at, user_id")
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
 const CDNURL_ARTIST = "https://seaczeofjlkfcwnofbny.supabase.co/storage/v1/object/public/artist-profile/";
const CDNURL_CLIENT = "https://seaczeofjlkfcwnofbny.supabase.co/storage/v1/object/public/client-profile/";

// Endpoint to fetch projects for a specific artist
app.get('/api/artist-projects/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
     const { data: projectsData, error } = await supabase
      .from('projects')
      .select('*')
      .eq('artist_id', userId);

    if (error) {
      throw error;
    }

    res.json(projectsData || []);
  } catch (err) {
    console.error("Unexpected error fetching projects:", err);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Endpoint to fetch projects for a specific artist
app.get('/api/client-projects/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
     const { data: projectsData, error } = await supabase
      .from('projects')
      .select('*')
      .eq('client_id', userId);

    if (error) {
      throw error;
    }

    res.json(projectsData || []);
  } catch (err) {
    console.error("Unexpected error fetching projects:", err);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});


// Endpoint to fetch proposals for a specific user
app.get('/api/proposals/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
     const { data: proposalsData, error } = await supabase
      .from('proposals')
      .select('*')
      .eq('recipient_id', userId)
      .eq('status', 'Pending');

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
    res.status(500).json({ error: 'Failed to fetch proposals' });
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
          : null 
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
          : null 
      };
    }

    return null;
  } catch (err) {
    console.error("Error fetching profile details:", err);
    return null;
  }
};

// Endpoint to accept a proposal and create a project (artist to client)
app.post('/artist/proposals/accept', async (req, res) => {
  const { proposal } = req.body;

  try {
    // nsert into the `projects` table and get the new project ID
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
    const { error: notificationError } = await supabase.from("notifications").insert([
      {
        user_id: proposal.sender_id,  
        type: "Proposal Accepted",
        message: notificationMessage,
        is_read: false,  
        created_at: new Date().toISOString(),
      }
    ]);

    if (notificationError) {
      console.error("Error creating notification:", notificationError);
      return res.status(500).json({ error: "Failed to create notification." });
    }

    res.status(200).json({ newProject });
  } catch (err) {
    console.error("Error accepting proposal:", err);
    res.status(500).json({ error: 'Failed to accept proposal.' });
  }
});

// Endpoint to accept a proposal and create a project
app.post('/client/proposals/accept', async (req, res) => {
  const { proposal } = req.body;

  try {
    // nsert into the `projects` table and get the new project ID
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
    const { error: notificationError } = await supabase.from("notifications").insert([
      {
        user_id: proposal.sender_id,  
        type: "Proposal Accepted",
        message: notificationMessage,
        is_read: false,  
        created_at: new Date().toISOString(),
      }
    ]);

    if (notificationError) {
      console.error("Error creating notification:", notificationError);
      return res.status(500).json({ error: "Failed to create notification." });
    }

    res.status(200).json({ newProject });
  } catch (err) {
    console.error("Error accepting proposal:", err);
    res.status(500).json({ error: 'Failed to accept proposal.' });
  }
});

// Endpoint to reject a proposal
app.post('/api/proposals/reject', async (req, res) => {
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
    const { error: notificationError } = await supabase.from("notifications").insert([
      {
        user_id: proposalData.sender_id, 
        type: "Proposal Rejected",
        message: notificationMessage,
        is_read: false,  
        created_at: new Date().toISOString(),
      }
    ]);

    if (notificationError) {
      console.error("Error creating notification:", notificationError);
      return res.status(500).json({ error: "Failed to create notification." });
    }

    res.status(200).json({ message: 'Proposal rejected.' });
  } catch (err) {
    console.error("Error rejecting proposal:", err);
    res.status(500).json({ error: 'Failed to reject proposal.' });
  }
});

// Endpoint to update project status
app.post('/api/projects/update-status', async (req, res) => {
  const { project_id, status } = req.body;

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

    // Update the project status
    const { error } = await supabase
      .from("projects")
      .update({ status, updated_at: new Date() })
      .eq("project_id", project_id);

    if (error) {
      throw new Error(`Error updating project status: ${error.message}`);
    }

    // Create a notification for the client
    const notificationMessage = `The status for the project "${projectData.project_name}" has been updated to "${status}".`;
    
    // Notify the client
    const { error: clientNotificationError } = await supabase.from("notifications").insert([
      {
        user_id: projectData.client_id,  
        type: "Project Status Updated",
        message: notificationMessage,
        is_read: false,  
        created_at: new Date().toISOString(),
      }
    ]);

    if (clientNotificationError) {
      console.error("Error creating client notification:", clientNotificationError);
      return res.status(500).json({ error: "Failed to create client notification." });
    }

    //  Notify the artist only if the status is "Confirmed"
    if (status === "Confirmed") {
      const artistNotificationMessage = `The project "${projectData.project_name}" has been confirmed.`;
      const { error: artistNotificationError } = await supabase.from("notifications").insert([
        {
          user_id: projectData.artist_id,  
          type: "Project Confirmed",
          message: artistNotificationMessage,
          is_read: false,  
          created_at: new Date().toISOString(),
        }
      ]);

      if (artistNotificationError) {
        console.error("Error creating artist notification:", artistNotificationError);
        return res.status(500).json({ error: "Failed to create artist notification." });
      }
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Error updating project status:", err);
    res.status(500).json({ error: 'Failed to update project status.' });
  }
});

// Endpoint to update project priority
app.post('/api/projects/update-priority', async (req, res) => {
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
    const { error: clientNotificationError } = await supabase.from("notifications").insert([
      {
        user_id: projectData.client_id,  
        type: "Project Priority Updated",
        message: notificationMessage,
        is_read: false,
        created_at: new Date().toISOString(),
      }
    ]);

    if (clientNotificationError) {
      console.error("Error creating client notification:", clientNotificationError);
      return res.status(500).json({ error: "Failed to create client notification." });
    }


    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Error updating project priority:", err);
    res.status(500).json({ error: 'Failed to update project priority.' });
  }
});

// Endpoint to fetch project details along with sender information
app.get('/api/projects/:projectId/details', async (req, res) => {
  const { projectId } = req.params;

  try {
     const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('project_id', projectId)
      .single();

    if (projectError) {
      throw new Error(`Error fetching project: ${projectError.message}`);
    }

     const { data: proposalData, error: proposalError } = await supabase
      .from('proposals')
      .select('budget, sender_id')
      .eq('proposal_id', projectData.proposal_id)
      .single();

    if (proposalError) {
      throw new Error(`Error fetching proposal details: ${proposalError.message}`);
    }

     const senderProfile = await fetchProfileDetails(proposalData.sender_id);

     const projectDetails = {
      ...projectData,
      budget: proposalData.budget,
      senderProfile: senderProfile,
    };

    res.json(projectDetails);
  } catch (err) {
    console.error("Error fetching project details:", err);
    res.status(500).json({ error: 'Failed to fetch project details.' });
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
              const otherUserId = conversation.user1_id === userId ? conversation.user2_id : conversation.user1_id;

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

      res.status(200).json({ conversations: formattedConversations.filter((c) => c !== null) });
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
app.get("/orders/:userId", async (req, res) => {
    const { userId } = req.params;

    try {
        console.log("Fetching orders for userId:", userId);  
        const { data: orders, error } = await supabase
            .from("orders")
            .select(`
                id,
                created_at,
                amount,
                status,
                description
            `)
            .eq("user_id", userId);

        if (error) {
            console.error("Error fetching orders:", error);
            return res.status(400).json({ error: "Failed to fetch orders." });
        }

        console.log("Orders fetched:", orders); 

        // Check if orders are empty and log a message
        if (orders.length === 0) {
            console.warn(`No orders found for userId: ${userId}`);
        }

        // Format the orders data
        const formattedOrders = orders.map(order => ({
            id: order.id,
            date: order.created_at,
            amount: order.amount / 100,  
            status: order.status,
            description: order.description,
        }));

        res.status(200).json(formattedOrders);
    } catch (err) {
        console.error("Unexpected error fetching orders:", err);
        res.status(500).json({ error: "Failed to fetch orders." });
    }
});

// ****** COLLABORATIVE FILTERING ENDPOINT ******
app.get("/recommend-clients/:userId", async (req, res) => {
  const { userId } = req.params;  
  const visitorId = req.query.visitorId;  

  const CLIENT_CDN_URL = "https://seaczeofjlkfcwnofbny.supabase.co/storage/v1/object/public/client-profile/";

  try {
    // Fetch the user's likes, comments, and visits
    const [likes, comments, visits] = await Promise.all([
      supabase.from("community_likes").select("post_id").eq("user_id", userId),
      supabase.from("community_comments").select("post_id").eq("user_id", userId),
      supabase.from("profile_visits").select("visited_id").eq("visitor_id", visitorId)  
    ]);

    // Check if visits.data is null or undefined
    if (!visits.data) {
      return res.status(200).json([]);  
    }

     const postIds = [...new Set([
      ...likes.data.map(item => item.post_id),
      ...comments.data.map(item => item.post_id),
    ])];

     const visitedClientIds = visits.data.map(item => item.visited_id);

 
     if (postIds.length === 0 && visitedClientIds.length === 0) {
      return res.status(200).json([]);
    }

     const { data: recommendedClientsLikes, error: likesError } = await supabase
      .from("community_likes")
      .select("user_id")
      .in("post_id", postIds)
      .neq("user_id", userId); 

    const { data: recommendedClientsComments, error: commentsError } = await supabase
      .from("community_comments")
      .select("user_id")
      .in("post_id", postIds)
      .neq("user_id", userId);  

    if (likesError || commentsError) {
      console.error("Error fetching recommended clients:", likesError || commentsError);
      return res.status(500).json({ error: "Failed to fetch recommendations." });
    }

    // Combine the results from likes, comments, and visits
    const allRecommendedClients = [
      ...recommendedClientsLikes,
      ...recommendedClientsComments,
      ...visitedClientIds.map(visitedId => ({ user_id: visitedId }))  
    ];

    // Get unique user IDs from the recommendations
    const uniqueClientIds = [...new Set(allRecommendedClients.map(client => client.user_id))];

    // Fetch client details for the recommended clients
    const { data: clientsDetails, error: clientsError } = await supabase
      .from("client")
      .select("*")
      .in("user_id", uniqueClientIds);

    if (clientsError) {
      console.error("Error fetching client details:", clientsError);
      return res.status(500).json({ error: "Failed to fetch client details." });
    }

    // If no recommendations found, return an empty array
    if (clientsDetails.length === 0) {
      return res.status(200).json([]);
    }

     const processedClientsDetails = clientsDetails.map(client => ({
      ...client,
      profile_image: client.profile_image
        ? `${CLIENT_CDN_URL}${client.user_id}/${client.profile_image}`
        : null,
    }));

    // Count visit frequencies for each client
    const visitCounts = visits.data.reduce((acc, visit) => {
      acc[visit.visited_id] = (acc[visit.visited_id] || 0) + 1; // Increment the count for each visited client
      return acc;
    }, {});

    // Add visit counts to processed clients
    const clientsWithCounts = processedClientsDetails.map(client => ({
      ...client,
      visit_count: visitCounts[client.user_id] || 0 // Add visit count
    }));

    // Filter out the currently visited client from the recommendations
    const filteredClientsDetails = clientsWithCounts.filter(client => 
      client.user_id !== userId // Exclude the currently visited client
    );

    // Sort clients by visit count in descending order
    filteredClientsDetails.sort((a, b) => b.visit_count - a.visit_count);

    // Return the filtered and sorted recommended clients directly
    res.status(200).json(filteredClientsDetails);
  } catch (err) {
    console.error("Unexpected error in recommendations:", err);
    res.status(500).json({ error: "An unexpected error occurred." });
  }
});

// visit profile endpoint
app.post("/log-profile-visit/:userId", async (req, res) => {
  const { userId } = req.params;  
  const { visitorId } = req.body;  

  console.log("Logging visit for userId:", userId, "by visitorId:", visitorId);  
  if (!visitorId) {
      return res.status(400).json({ error: "Visitor ID is required." });
  }

  try {
      // Log the profile visit
      const { error } = await supabase
          .from("profile_visits")
          .insert([{ visitor_id: visitorId, visited_id: userId, visited_at: new Date() }]);  

      if (error) {
          return res.status(500).json({ error: "Failed to log profile visit." });
      }

      res.status(200).json({ message: "Profile visit logged successfully." });
  } catch (err) {
      console.error("Error logging profile visit:", err);
      res.status(500).json({ error: "An unexpected error occurred." });
  }
});
// ****** COLLABORATIVE FILTERING ENDPOINT END ******


// ****** COLLABORATIVE FILTERING ENDPOINT ARTIST ******
app.get("/recommend-artists/:userId", async (req, res) => {
  const { userId } = req.params;  
  const visitorId = req.query.visitorId; 

  const CDNURL_ARTIST = "https://seaczeofjlkfcwnofbny.supabase.co/storage/v1/object/public/artist-profile/";

  
  try {
    // Fetch the user's likes, comments, and visits
    const [likes, comments, visits] = await Promise.all([
      supabase.from("community_likes").select("post_id").eq("user_id", userId),
      supabase.from("community_comments").select("post_id").eq("user_id", userId),
      supabase.from("profile_visits").select("visited_id").eq("visitor_id", visitorId)  
    ]);

   
     if (!visits.data) {
      console.warn("No visits found for visitorId:", visitorId);
      return res.status(200).json([]);  
    }

     const postIds = [...new Set([
      ...likes.data.map(item => item.post_id),
      ...comments.data.map(item => item.post_id),
    ])];

     const visitedArtistIds = visits.data.map(item => item.visited_id);
 
    // If no interactions, return an empty array
    if (postIds.length === 0 && visitedArtistIds.length === 0) {
      return res.status(200).json([]);
    }

    // Fetch artists who have liked or commented on the same posts
    const { data: recommendedArtistsLikes, error: likesError } = await supabase
      .from("community_likes")
      .select("user_id")
      .in("post_id", postIds)
      .neq("user_id", userId);  
    const { data: recommendedArtistsComments, error: commentsError } = await supabase
      .from("community_comments")
      .select("user_id")
      .in("post_id", postIds)
      .neq("user_id", userId);  

    if (likesError || commentsError) {
      console.error("Error fetching recommended artists:", likesError || commentsError);
      return res.status(500).json({ error: "Failed to fetch recommendations." });
    }

    // Combine the results from likes, comments, and visits
    const allRecommendedArtists = [
      ...recommendedArtistsLikes,
      ...recommendedArtistsComments,
      ...visitedArtistIds.map(visitedId => ({ user_id: visitedId }))  
    ];

    // Get unique user IDs from the recommendations
    const uniqueArtistIds = [...new Set(allRecommendedArtists.map(artist => artist.user_id))];

    // Fetch artist details for the recommended artists
    const { data: artistsDetails, error: artistsError } = await supabase
      .from("artist")
      .select("*")
      .in("user_id", uniqueArtistIds);

    if (artistsError) {
      console.error("Error fetching artist details:", artistsError);
      return res.status(500).json({ error: "Failed to fetch artist details." });
    }

    // If no recommendations found, return an empty array
    if (artistsDetails.length === 0) {
      return res.status(200).json([]);
    }

     const processedArtistsDetails = artistsDetails.map(artist => ({
      ...artist,
      profile_image: artist.profile_image
        ? `${CDNURL_ARTIST}${artist.user_id}/${artist.profile_image}`
        : null,
    }));

    // Count visit frequencies for each artist
    const visitCounts = visits.data.reduce((acc, visit) => {
      acc[visit.visited_id] = (acc[visit.visited_id] || 0) + 1; // Increment the count for each visited artist
      return acc;
    }, {});

    // Add visit counts to processed artists
    const artistsWithCounts = processedArtistsDetails.map(artist => ({
      ...artist,
      visit_count: visitCounts[artist.user_id] || 0  
    }));

    // Filter out the currently visited artist from the recommendations
    const filteredArtistsDetails = artistsWithCounts.filter(artist => 
      artist.user_id !== userId // Exclude the currently visited artist
    );

    // Sort artists by visit count in descending order
    filteredArtistsDetails.sort((a, b) => b.visit_count - a.visit_count);

    // Return the filtered and sorted recommended artists directly
    res.status(200).json(filteredArtistsDetails);
  } catch (err) {
    console.error("Unexpected error in recommendations:", err);
    res.status(500).json({ error: "An unexpected error occurred." });
  }
});
// ****** COLLABORATIVE FILTERING ENDPOINT ARTIST END ******

//***** TRANSACTION FUNCTION ******/
app.get("/orders/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
      console.log("Fetching orders for userId:", userId);  
      const { data: orders, error } = await supabase
          .from("orders")
          .select(`
              id,
              created_at,
              amount,
              status,
              description
          `)
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
      const formattedOrders = orders.map(order => ({
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
          return res.status(500).json({ error: "Error marking notifications as read." });
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
      .select("id", { count: 'exact', head: true }) 
      .eq("user_id", userId)
      .eq("is_read", false);  

    if (error) {
      return res.status(500).json({ error: "Error fetching notifications count." });
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


// ***** ARTIST VERIFICATION FUNCTION ******
const VERIFY_CDNURL = "https://seaczeofjlkfcwnofbny.supabase.co/storage/v1/object/public/artist-verification/";

app.post(
  "/api/artist-verification/:userId",
  upload.fields([{ name: "document" }, { name: "valid_id" }]),
  async (req, res) => {
    const { userId } = req.params;
    const files = req.files;

    if (!userId || !files || !files.document || !files.valid_id) {
      return res.status(400).json({ error: "User  ID, portfolio, and valid ID are required." });
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
      const { data: verificationData, error: verificationError } = await supabase
        .from('artist_verification')
        .insert({
          user_id: userId,
          document_url: `portfolio/${userId}/${documentFileName}`,
          valid_id: `valid_id/${userId}/${validIdFileName}`,
          status: 'pending',
          created_at: new Date().toISOString()
        })
        .select('verification_id');  
      if (verificationError) {
        return res.status(500).json({ error: 'Failed to save verification request' });
      }

      // Add verification ID to existing artist record
      const { error: artistUpdateError } = await supabase
        .from('artist')
        .update({ verification_id: verificationData[0].verification_id })
        .eq('user_id', userId);

      if (artistUpdateError) {
        return res.status(500).json({ error: "Failed to update artist verification ID." });
      }

      // Fetch the sender's name for the notification
      const { data: userData, error: userError } = await supabase
        .from('artist')
        .select('firstname, lastname')
        .eq('user_id', userId)
        .single();

      if (userError || !userData) {
        console.error("Error fetching user data:", userError);
        return res.status(500).json({ error: "Failed to fetch user data for notification." });
      }

      const senderName = `${userData.firstname} ${userData.lastname}`;

      // Notify admins about the new verification request
      const { data: adminData, error: adminError } = await supabase
        .from('admin')
        .select('user_id');  

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
          }
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
      res.status(500).json({ error: "An unexpected error occurred during verification." });
    }
  }
);

// **Fetch all artist verifications**
app.get("/api/artist-verifications", async (req, res) => {
  try {
    const { data: verifications, error } = await supabase
      .from("artist_verification")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return res.status(400).json({ error: error.message });

    // Enrich verifications with artist details
    const enrichedVerifications = await Promise.all(
      verifications.map(async (verification) => {
        const { data: artistData, error: artistError } = await supabase
          .from("artist")
          .select("firstname, lastname, role")
          .eq("user_id", verification.user_id)
          .single();

        if (artistError) {
          console.error(`Error fetching artist data for verification ${verification.verification_id}:`, artistError);
          return { ...verification, artist: null };
        }

        // Construct full URLs for document and valid ID
        const documentUrl = `${VERIFY_CDNURL}${verification.document_url}`;
        const validIdUrl = `${VERIFY_CDNURL}${verification.valid_id}`;

        return { 
          ...verification, 
          artist: artistData,
          document_url: documentUrl,
          valid_id: validIdUrl
        };
      })
    );

    res.status(200).json(enrichedVerifications);
  } catch (err) {
    console.error("Failed to fetch artist verifications:", err);
    res.status(500).json({ error: "Failed to fetch artist verifications." });
  }
});

// Endpoint to approve or reject artist verification
app.post("/api/artist-verification/:verificationId/:action", async (req, res) => {
  const { verificationId, action } = req.params;

  if (!['approved', 'rejected'].includes(action)) {
    return res.status(400).json({ error: "Invalid action. Use 'approved' or 'rejected'." });
  }

  try {
    // Fetch the user ID associated with the verification request
    const { data: verificationData, error: fetchError } = await supabase
      .from('artist_verification')
      .select('user_id')
      .eq('verification_id', verificationId)
      .single();

    if (fetchError || !verificationData) {
      return res.status(404).json({ error: "Verification request not found." });
    }

    const userId = verificationData.user_id;

    // Update the verification status
    const { error } = await supabase
      .from('artist_verification')
      .update({ status: action })
      .eq('verification_id', verificationId);

    if (error) {
      return res.status(500).json({ error: "Failed to update verification status." });
    }

    // Notify the user about the status change
    const { data: userData, error: userFetchError } = await supabase
      .from('artist')
      .select('firstname, lastname')
      .eq('user_id', userId)
      .single();

    if (userFetchError || !userData) {
      console.error("Error fetching user data:", userFetchError);
      return res.status(500).json({ error: "Failed to fetch user data for notification." });
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
          is_read: false, // Set to false initially
          created_at: new Date().toISOString(),
        }
      ]);

    if (notificationError) {
      console.error("Error creating notification:", notificationError);
      return res.status(500).json({ error: "Failed to create notification." });
    }

    res.status(200).json({ success: true, message: `Verification has been ${action}.` });
  } catch (err) {
    console.error("Unexpected error:", err);
    res.status(500).json({ error: "An unexpected error occurred." });
  }
});

// ****** ARTIST UPLOAD VERIFICATION END... ******
