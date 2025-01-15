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

// User role endpoint
app.get("/user-role/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    let { data: clientData } = await supabase.from("client").select("role").eq("user_id", userId).single();
    if (clientData) return res.status(200).json({ role: clientData.role });

    let { data: artistData } = await supabase.from("artist").select("role").eq("user_id", userId).single();
    if (artistData) return res.status(200).json({ role: artistData.role });

    let { data: adminData } = await supabase.from("admin").select("role").eq("user_id", userId).single();
    if (adminData) return res.status(200).json({ role: adminData.role });

    return res.status(404).json({ error: "User role not found." });
  } catch (err) {
    return res.status(500).json({ error: "Error fetching user role." });
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

// Start the server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});