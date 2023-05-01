const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const socketio = require("socket.io");

const app = express();

// Set up body-parser middleware
app.use(bodyParser.json());

// Connect to MongoDB
mongoose
  .connect(
    "mongodb+srv://gregoryerrl05132000:%21%23QEgreg05132000@sample-chat-app.h1s9vsy.mongodb.net/test",
    {useNewUrlParser: true}
  )
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

// Set up Socket.io
const server = app.listen(3000, () =>
  console.log("Server running on port 3000")
);
const io = socketio(server);

// Define the data model
const messageSchema = new mongoose.Schema({
  text: String,
  user: String,
  timestamp: {type: Date, default: Date.now},
});
const Message = mongoose.model("Message", messageSchema);

// Create API endpoints
app.get("/messages", (req, res) => {
  Message.find({}, (err, messages) => {
    if (err) return res.status(500).send(err);
    res.send(messages);
  });
});

app.post("/messages", (req, res) => {
  const message = new Message(req.body);
  message.save((err) => {
    if (err) return res.status(500).send(err);
    io.emit("message", req.body);
    res.sendStatus(200);
  });
});
