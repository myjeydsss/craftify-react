require("dotenv").config({ path: ".env.local" });
const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const PORT = process.env.PORT || 8081; // Use Render's assigned port or fallback to 8081 for local testing

// Middleware
const allowedOrigins = [
  "http://localhost:5173", // Local frontend for testing
  "https://craftify-react-git-main-myjeydsss-projects.vercel.app", // Deployed Vercel frontend
  "https://craftify-react.vercel.app/",
  "https://craftify-react.onrender.com",  // Render backend URL

];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS policy error: Origin not allowed."));
      }
    },
    methods: ["GET", "POST"],
    credentials: true,
  })
);

app.use(express.json());

// Supabase client setup
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_API_KEY
);

// Root endpoint
app.get("/", (req, res) => {
  res.send("Supabase API is running...");
});

// Start the server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

// Register user
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

// Login endpoint
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


// Optimized Endpoint to Fetch User Role (NavBar)
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

// Get Artist Profile
app.get("/artist-profile/:userId", async (req, res) => {
  const { userId } = req.params; // This is the authenticated user_id
  const CDNURL = "https://seaczeofjlkfcwnofbny.supabase.co/storage/v1/object/public/artist-profile/";

  try {
    // Query the artist table using the user_id
    const { data, error } = await supabase
      .from("artist")
      .select("firstname, lastname, gender, date_of_birth, email, role, address, phone, profile_image")
      .eq("user_id", userId) // Match user_id to fetch artist details
      .single(); // Ensure we only fetch one row

    if (error || !data) {
      console.log("Artist profile not found for userId:", userId); // Log if no data found
      return res.status(404).json({ error: "Artist profile not found." });
    }

    // Construct the full URL for the profile image
    if (data.profile_image) {
      data.profile_image = `${CDNURL}${userId}/${data.profile_image}`;
    }

    console.log("Fetched artist profile:", data); // Debugging: Log the artist data
    res.status(200).json(data); // Send the artist profile data as response
  } catch (err) {
    console.error("Error fetching artist profile for userId:", userId, err); // Debug unexpected errors
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
      console.error("Preferences not found for userId:", userId);
      return res.status(404).json({ error: "Preferences not found." });
    }

    res.status(200).json(data);
  } catch (err) {
    console.error("Error fetching preferences:", err);
    res.status(500).json({ error: "Failed to fetch preferences." });
  }
});

// PUT HERE THE EDIT PROFILE