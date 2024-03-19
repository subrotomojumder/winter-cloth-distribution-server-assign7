const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const { MongoClient } = require("mongodb");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const { ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: [
      "https://aesthetic-gecko-fdb9e9.netlify.app",
      "http://localhost:5173",
    ],
  })
);
app.use(express.json());

// MongoDB Connection URL
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function run() {
  try {
    // Connect to MongoDB
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("distribute-winter-clothes");
    const userCollection = db.collection("users");
    const clotheCollection = db.collection("clothes");
    const donationCollection = db.collection("donations");

    // User Registration
    app.post("/api/v1/register", async (req, res) => {
      const { name, email, password } = req.body;

      // Check if email already exists
      const existingUser = await userCollection.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User already exists",
        });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert user into the database
      await userCollection.insertOne({ name, email, password: hashedPassword });

      res.status(201).json({
        success: true,
        message: "User registered successfully",
      });
    });

    // User Login
    app.post("/api/v1/login", async (req, res) => {
      const { email, password } = req.body;

      // Find user by email
      const user = await userCollection.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Compare hashed password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Generate JWT token
      const token = jwt.sign(
        { email: user.email, id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.EXPIRES_IN }
      );

      res.json({
        success: true,
        message: "Login successful",
        token,
      });
    });
    app.get("/api/v1/users/:id", async (req, res) => {
      const { id } = req.params;
      const query = { _id: id };
      const data = await userCollection.findOne(new ObjectId(id));
      res.json({
        success: true,
        message: "successfully retrieve user!",
        data,
      });
    });
    // ==============================================================
    // won api
    app.post("/api/v1/clothes", async (req, res) => {
      const { image, title, category, size, des } = req.body;
      const result = await clotheCollection.insertOne({
        image,
        title,
        category,
        size,
        des,
      });
      res.json({
        success: true,
        message: "Successfully clothes create!",
        result,
      });
    });
    app.get("/api/v1/clothes", async (req, res) => {
      const data = await clotheCollection.find({}).toArray();
      res.json({
        success: true,
        message: "successfully retrieve clothes!",
        data,
      });
    });
    app.get("/api/v1/clothes/:id", async (req, res) => {
      const { id } = req.params;
      const data = await clotheCollection.findOne(new ObjectId(id));
      res.json({
        success: true,
        message: "successfully retrieve clothe!",
        data,
      });
    });
    app.delete("/api/v1/clothes/:id", async (req, res) => {
      const { id } = req.params;
      const data = await clotheCollection.deleteOne({ _id: new ObjectId(id) });
      res.json({
        success: true,
        message: "successfully delete clothe!",
        data,
      });
    });
    app.patch("/api/v1/clothes/:id", async (req, res) => {
      const { id } = req.params;
      const data = await clotheCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { ...req.body } }
      );
      res.json({
        success: true,
        message: "successfully update clothe!",
        data,
      });
    });
    //donation
    app.post("/api/v1/donations", async (req, res) => {
      const { clotheId, clotheTitle, userId } = req.body;
      const isExists = await donationCollection.findOne({ clotheId });
      let result;
      if (isExists) {
        result = await donationCollection.updateOne(
          { clotheId },
          { $inc: { quantity: 1 } }
        );
      } else {
        result = await donationCollection.insertOne({
          clotheId,
          clotheTitle,
          userId,
          quantity: 1,
        });
      }
      res.json({
        success: true,
        message: "successfully create donations!",
        data: result,
      });
    });
    app.get("/api/v1/donations", async (req, res) => {
      const data = await donationCollection.find({}).toArray();
      res.json({
        success: true,
        message: "successfully retrieve donations!",
        data,
      });
    });
    // ==============================================================

    // Start the server
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } finally {
  }
}

run().catch(console.dir);

// Test route
app.get("/", (req, res) => {
  const serverStatus = {
    message: "Server is running smoothly",
    timestamp: new Date(),
  };
  res.json(serverStatus);
});
