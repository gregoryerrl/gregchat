// Require necessary modules
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const defPic = require("./defaultPic.json");
const http = require("http");
const socketIo = require("socket.io");
const {v4: uuidv4} = require("uuid");

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

const chatroomSchema = new mongoose.Schema({
  chatId: {type: String, default: () => uuidv4()},
  messages: [
    {
      to: {type: String},
      from: {type: String},
      message: {type: String},
      timestamp: {type: Date, default: Date.now},
    },
  ],
  members: [
    {
      id: {type: String, required: true},
      username: {type: String, required: true},
    },
  ],
});

const Chatroom = mongoose.model("Chatroom", chatroomSchema);

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

  // Listen for create-chatroom event
  socket.on("create-chatroom", async ({from, to}) => {
    try {
      console.log(`Creating chatroom between ${from} and ${to}...`);
      // Check if a chatroom already exists between the two users
      const existingChatroom = await Chatroom.findOne({
        members: {$all: [from, to]},
      });
      if (existingChatroom) {
        // If a chatroom already exists, emit a "chatroom-created" event with the chatroom ID
        socket.emit("chatroom-created", existingChatroom.chatId);
      } else {
        // If a chatroom does not exist, create a new chatroom and save it to the database
        const chatroom = new Chatroom({
          members: [from, to],
        });
        await chatroom.save();
        console.log(`Chatroom created with ID ${chatroom.chatId}`);
        // Emit a "chatroom-created" event with the new chatroom ID
        socket.emit("chatroom-created", chatroom.chatId);
      }
    } catch (err) {
      console.log(err);
    }
  });

  // Listen for send-message event
  socket.on("send-message", async ({chatId, from, to, message}) => {
    try {
      console.log(
        `Sending message from ${from} to ${to} in chatroom ${chatId}...`
      );
      // Find the chatroom by ID
      const chatroom = await Chatroom.findById(chatId);
      if (!chatroom) throw new Error("Chatroom not found");
      // Add the message to the chatroom's messages array
      chatroom.messages.push({from, to, message});
      await chatroom.save();
      // Emit a "message-sent" event with the new message object
      io.to(chatId).emit(
        "message-sent",
        chatroom.messages[chatroom.messages.length - 1]
      );
    } catch (err) {
      console.log(err);
    }
  });

  // Listen for get-message event
  socket.on("get-message", async (chatId) => {
    try {
      console.log(`Getting messages for chatroom ${chatId}...`);
      // Find the chatroom by ID and populate the members and messages fields
      const chatroom = await Chatroom.findById(chatId)
        .populate("members.id", "username")
        .populate("messages.from", "username")
        .populate("messages.to", "username");
      if (!chatroom) throw new Error("Chatroom not found");
      // Emit a "message-list" event with the chatroom's messages array
      socket.emit("message-list", chatroom.messages);
    } catch (err) {
      console.log(err);
    }
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

// Get all active users
app.get("/activeusers", async (req, res) => {
  try {
    const activeUsers = await User.find(
      {online: true},
      {_id: 1, username: 1, online: 1}
    );
    res.json({message: "Active users", users: activeUsers});
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: "Server error",
    });
  }
});

// GET request for getting chatlists of current user by ID
app.get("/chatrooms/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const chatrooms = await Chatroom.find({"members.id": userId})
      .populate("members.id", "username")
      .populate("messages.from", "username")
      .populate("messages.to", "username");
    res.status(200).json({
      message: "Chatrooms fetched successfully",
      chatrooms: chatrooms,
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
