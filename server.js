const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(bodyParser.json());
app.use(cors());

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

//admindefault
async function createDefaultAdmin() {
  const existingAdmin = await User.findOne({ email: "admin@pccoer.in" });
  if (!existingAdmin) {
    const admin = new User({
      username: "Admin",
      email: "admin@pccoer.in",
      password: "admin123",
      role: "admin"
    });
    await admin.save();
    console.log("✅ Default admin created: admin@pccoer.in / admin123");
  }
}

createDefaultAdmin();


// User schema
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  role: { type: String, default: "user" } // optional if you want roles (admin/user)
});

const User = mongoose.model("User", userSchema);

// Review schema
const reviewSchema = new mongoose.Schema({
  book: String,
  review: String,
});
const Review = mongoose.model("Review", reviewSchema);

// Register route
app.post("/api/register", async (req, res) => {
  try {
   const { username, email, password } = req.body;

// Check if email already exists
const existing = await User.findOne({ email });
if (existing) {
  return res.json({ success: false, message: "Email already registered" });
}

const newUser = new User({ username, email, password });
await newUser.save();
res.json({ success: true, message: "User registered successfully" });

    if (existing) {
      return res.json({ success: false, message: "Username already exists" });
    }
    const newUser = new User({ username, password });
    await newUser.save();
    res.json({ success: true, message: "User registered successfully" });
  } catch (err) {
    res.json({ success: false, message: "Error registering user" });
  }
});

// Login route
// Login route
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists in DB
    let user = await User.findOne({ email, password });

    // If not found, check for hardcoded default admin
    if (!user && email === "admin@pccoer.in" && password === "admin123") {
      user = {
        username: "Admin",
        email: "admin@pccoer.in",
        password: "admin123",
        role: "admin",
      };
    }

    if (!user) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    // Send user data (you can also add JWT here later if needed)
    res.json({
      success: true,
      message: "Login successful",
      user: {
        username: user.username,
        email: user.email,
        role: user.role || "user",
      },
    });
  } catch (err) {
    res.json({ success: false, message: "Error logging in" });
  }
});



// Add review route
app.post("/api/addReview", async (req, res) => {
  try {
    const { book, review } = req.body;
    const newReview = new Review({ book, review });
    await newReview.save();
    res.json({ success: true, message: "Review added successfully" });
  } catch (err) {
    res.json({ success: false, message: "Error adding review" });
  }
});

// Get reviews
app.get("/api/reviews", async (req, res) => {
  try {
    const reviews = await Review.find();
    res.json(reviews);
  } catch (err) {
    res.json([]);
  }
});

// Delete review
app.delete("/api/deleteReview", async (req, res) => {
  try {
    const { id } = req.query;
    await Review.findByIdAndDelete(id);
    res.json({ success: true, message: "Review deleted successfully" });
  } catch (err) {
    res.json({ success: false, message: "Error deleting review" });
  }
});
// Borrow schema
const borrowSchema = new mongoose.Schema({
  username: String,
  book: String,
  borrowDate: Date,
  returnDate: Date,
});
const Borrow = mongoose.model("Borrow", borrowSchema);

// Add borrow record
app.post("/api/borrow", async (req, res) => {
  try {
    const { username, book, borrowDate, returnDate } = req.body;
    const newBorrow = new Borrow({ username, book, borrowDate, returnDate });
    await newBorrow.save();
    res.json({ success: true, message: "Borrow record added successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error adding borrow record" });
  }
});

// Get all borrow records
app.get("/api/borrow", async (req, res) => {
  try {
    const records = await Borrow.find();
    res.json(records);
  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
});

// Delete a borrow record
app.delete("/api/borrow/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await Borrow.findByIdAndDelete(id);
    res.json({ success: true, message: "Borrow record deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error deleting borrow record" });
  }
});


// Start server
const PORT = process.env.PORT || 4000;
const path = require("path");

// Serve static files from the "public" folder
app.use(express.static(path.join(__dirname, "public")));

// Serve frontend pages for any unknown route
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

