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

// User schema
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
});
const User = mongoose.model("User", userSchema);

// Review schema
const reviewSchema = new mongoose.Schema({
  book: String,
  review: String,
});
const Review = mongoose.model("Review", reviewSchema);

// Register route
app.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    const existing = await User.findOne({ username });
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
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username, password });
    if (!user) {
      return res.json({ success: false, message: "Invalid credentials" });
    }
    res.json({ success: true, message: "Login successful" });
  } catch (err) {
    res.json({ success: false, message: "Error logging in" });
  }
});

// Add review route
app.post("/addReview", async (req, res) => {
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
app.get("/reviews", async (req, res) => {
  try {
    const reviews = await Review.find();
    res.json(reviews);
  } catch (err) {
    res.json([]);
  }
});

// Delete review
app.delete("/deleteReview", async (req, res) => {
  try {
    const { id } = req.query;
    await Review.findByIdAndDelete(id);
    res.json({ success: true, message: "Review deleted successfully" });
  } catch (err) {
    res.json({ success: false, message: "Error deleting review" });
  }
});

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

