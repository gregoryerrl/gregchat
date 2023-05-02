// Require necessary modules
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const defPic = require("./defaultPic.json");
const http = require("http");
const socketIo = require("socket.io");

// Initialize app and body parser middleware
const app = express();
const server = http.createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "http://localhost:4200",
    methods: ["GET", "POST"],
  },
});
// Increase the limit of the request payload to 50MB
app.use(bodyParser.json({limit: "50mb"}));
app.use(bodyParser.urlencoded({limit: "50mb", extended: true}));

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

app.use(
  cors({
    origin: "*",
  })
);

// Define User schema
const userSchema = new mongoose.Schema({
  username: {type: String, unique: true},
  password: String,
  profilePicture: {
    type: String,
    default: defPic.profPic,
  },
  online: {type: Boolean, default: false},
});

// Define User model
const User = mongoose.model("User", userSchema);

// Socket.IO connection event
io.on("connection", (socket) => {
  console.log("New client connected");

  // Listen for user-connected event
  socket.on("user-connected", async (user) => {
    console.log(`User ${user.id} connected`);
    // Update the user's online status to true
    await User.findByIdAndUpdate(user.id, {online: true});
    // Send the updated user list to all clients
    const users = await User.find({});
    io.emit("user-list", users);
  });

  // Listen for user-disconnected event
  socket.on("user-disconnected", async (user) => {
    console.log(`User ${user.id} disconnected`);
    // Update the user's online status to false
    await User.findByIdAndUpdate(user.id, {online: false});
    // Send the updated user list to all clients
    const users = await User.find({});
    io.emit("user-list", users);
  });

  // Socket.IO event for disconnecting
  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

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
    // Get the user by ID and send it in the response
    const foundUser = await User.findById(user._id);
    res.status(200).json({
      success: true,
      message: "Login successful",
      user: foundUser,
    });
  } catch (err) {
    res.status(401).json({success: false, error: err.message});
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

// POST request for logging out user
app.get("/logout", async (req, res) => {
  // Perform any necessary cleanup or API calls when the user logs out

  // Respond with status code 200 and a success message
  res.status(200).json({success: true, message: "Logout successful"});
});

// PUT request for updating user information
app.put("/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) throw new Error("User not found");
    user.username = req.body.username || user.username;
    user.password = req.body.password
      ? await bcrypt.hash(req.body.password, 10)
      : user.password;
    user.profilePicture = req.body.profilePicture || user.profilePicture;
    await user.save();
    res.status(200).json({
      success: true,
      message: "User information updated successfully",
      user: user,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: "Server error",
    });
  }
});

// GET request for getting user information by ID
app.get("/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) throw new Error("User not found");
    res.status(200).json({
      success: true,
      message: "User information fetched successfully",
      user: user,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: "Server error",
    });
  }
});

// Start server
server.listen(3000, () => console.log("Server started on port 3000"));
