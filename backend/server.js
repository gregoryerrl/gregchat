// Require necessary modules
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Initialize app and body parser middleware
const app = express();
app.use(bodyParser.json());

// Connect to MongoDB
mongoose
  .connect(
    "mongodb+srv://gregoryerrl05132000:%21%23QEgreg05132000@sample-chat-app.h1s9vsy.mongodb.net/test",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

// Define User schema
const userSchema = new mongoose.Schema({
  username: {type: String, unique: true},
  password: String,
});

// Define User model
const User = mongoose.model("User", userSchema);

// POST request for registering new user
app.post("/register", async (req, res) => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(req.body.password, salt);
    const newUser = new User({username: req.body.username, password: hash});
    await newUser.save();
    res.status(201).json({message: "User created successfully"});
  } catch (err) {
    res.status(500).json({error: err.message});
  }
});

// POST request for authenticating user
app.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({username: req.body.username});
    if (!user) throw new Error("User not found");
    const validPassword = await bcrypt.compare(
      req.body.password,
      user.password
    );
    if (!validPassword) throw new Error("Incorrect password");
    res.status(200).json({message: "Login successful"});
  } catch (err) {
    res.status(401).json({error: err.message});
  }
});

// Get all users

app.get("/users", async (req, res) => {
  try {
    const users = await User.find({});
    res.status(200).json({
      message: "All registered users fetched successfully",
      users: users,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: "Server error",
    });
  }
});

// Start server
app.listen(3000, () => console.log("Server started on port 3000"));
