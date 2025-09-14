const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const cron = require("node-cron");
const path = require("path");
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// --- MongoDB Connection ---
const mongoose = require("mongoose");

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB connected"))
.catch(err => console.error("❌ MongoDB connection error:", err));


// --- Schemas & Models ---
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  role: { type: String, default: "user" }
});
const User = mongoose.model("User", userSchema);

const reviewSchema = new mongoose.Schema({
  title: String,
  author: String,
  review: String,
  rating: Number
});
const Review = mongoose.model("Review", reviewSchema);

const borrowSchema = new mongoose.Schema({
  username: String,   // links to user who borrowed
  book: String,
  borrowDate: String,
  returnDate: String
});
const Borrow = mongoose.model("Borrow", borrowSchema);

// --- Middleware ---
const auth = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token" });
  jwt.verify(token, "secret123", (err, decoded) => {
    if (err) return res.status(401).json({ error: "Invalid token" });
    req.user = decoded;
    next();
  });
};

const admin = (req, res, next) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
  next();
};

// --- Auth Routes ---
app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  if (!email.endsWith("@pccoer.in")) return res.status(400).json({ error: "Use college email" });
  const hashed = await bcrypt.hash(password, 10);
  const user = new User({ username, email, password: hashed });
  await user.save();
  res.json({ success: true });
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ error: "Invalid credentials" });
  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).json({ error: "Invalid credentials" });
  const token = jwt.sign(
    { id: user._id, role: user.role, username: user.username, email: user.email },
    "secret123"
  );
  res.json({ token, user: { username: user.username, role: user.role, email: user.email } });
});

// --- Review Routes ---
// Anyone logged in can view reviews
app.get("/reviews", async (req, res) => {
  const reviews = await Review.find().sort({ _id: -1 });
  res.json(reviews);
});

// Users can add reviews
app.post("/reviews", auth, async (req, res) => {
  const { title, author, review, rating } = req.body;
  const r = new Review({ title, author, review, rating });
  await r.save();
  res.json(r);
});

// Only admin can delete reviews
app.delete("/reviews/:id", auth, admin, async (req, res) => {
  await Review.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// --- Borrow Routes ---
// Anyone logged in can view borrow list
app.get("/borrow", auth, async (req, res) => {
  const records = await Borrow.find().sort({ returnDate: 1 });
  res.json(records);
});

// Only admin can add borrow record
app.post("/borrow", auth, admin, async (req, res) => {
  try {
    const record = new Borrow(req.body);
    await record.save();
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: "Failed to add borrow record" });
  }
});

// Only admin can delete borrow record
app.delete("/borrow/:id", auth, admin, async (req, res) => {
  await Borrow.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// --- Email Reminder Job ---
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "yourmail@gmail.com",  // replace with real email
    pass: "yourpassword"         // replace with app password
  }
});

// Runs every day at 9am
cron.schedule("0 9 * * *", async () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yyyy = tomorrow.getFullYear();
  const mm = String(tomorrow.getMonth() + 1).padStart(2, "0");
  const dd = String(tomorrow.getDate()).padStart(2, "0");
  const tomorrowStr = `${yyyy}-${mm}-${dd}`;

  const records = await Borrow.find({ returnDate: tomorrowStr });
  for (const r of records) {
    const user = await User.findOne({ username: r.username });
    if (user) {
      await transporter.sendMail({
        from: "yourmail@gmail.com",
        to: user.email,
        subject: "Book Return Reminder",
        text: `Reminder: Please return "${r.book}" by ${r.returnDate}.`
      });
    }
  }
});

// --- Fallback to index.html ---
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// --- Server Start ---
app.listen(4000, () => console.log("Server running at http://localhost:4000"));
