import express from "express";
import { createServer } from "node:http";
import mongoose, { set } from "mongoose";
import Rooms from "../models/rooms.js";
import Users from "../models/users.js";
import dotenv from "dotenv";
import readline from "readline";

dotenv.config({ path: "../.env" });

const app = express();
const server = createServer(app);

const uri = process.env.MONGODB_URI;

const JWT_SECRET = process.env.JWT_SECRET; // get jwt secret from .env

const clientOptions = {
  serverApi: { version: "1", strict: true, deprecationErrors: true },
};

// readline interface for user input, used for confirmation
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function clearDatabase() {
  try {
    // connect to MongoDB
    await mongoose.connect(uri, clientOptions);
    console.log("Connected to MongoDB!");

    // confirmation prompt using readline
    rl.question(
      "Are you sure you want to clear the database? (y/n): ",
      (answer) => {
        if (answer.toLowerCase() === "y" || answer.toLowerCase() === "yes") {
          rl.question(
            "Last chance to turn back. Are you really sure? (y/n): ",
            async (finalAnswer) => {
              if (
                finalAnswer.toLowerCase() === "y" ||
                finalAnswer.toLowerCase() === "yes"
              ) {
                // clear the users collection
                const deletedUsers = await Users.deleteMany({});
                console.log(`Deleted ${deletedUsers.deletedCount} users.`);

                // clear the rooms collection
                const deletedRooms = await Rooms.deleteMany({});
                console.log(`Deleted ${deletedRooms.deletedCount} rooms.`);

                // close connection to db
                await mongoose.connection.close();
                console.log("Connection closed.");

                // close readline after operation
                rl.close();
              } else {
                console.log("Database clearance canceled.");

                // close connection to db
                await mongoose.connection.close();
                console.log("Connection closed.");

                rl.close();
              }
            }
          );
        } else {
          console.log("Database clearance canceled.");

          // close connection to db
          mongoose.connection.close();
          console.log("Connection closed.");

          rl.close();
        }
      }
    );
  } catch (error) {
    console.error("Error clearing the database:", error);

    // close connection to db
    await mongoose.connection.close();
    console.log("Connection closed.");
    rl.close(); // close  readline on error
  }
}

// Run the script
clearDatabase().catch(console.error);
