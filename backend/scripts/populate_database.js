import mongoose from "mongoose";
import dotenv from "dotenv";
import readline from "readline";
import bcrypt from "bcrypt";
import { faker } from "@faker-js/faker";
import User from "../models/users.js";

dotenv.config({ path: "../.env" });

const uri = process.env.MONGODB_URI;
const clientOptions = {
  serverApi: { version: "1", strict: true, deprecationErrors: true },
};

// Readline interface for user input, used for confirmation
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Function to generate a single user using faker
function generateUser() {
  return {
    email: faker.internet.email(),
    username: faker.internet.userName(),
    password: "Password123!", // Default password; consider randomizing for security
    birthday: faker.date.past(30, new Date(2002, 0, 1)), // Users between 2002 and 1992
    interests: faker.helpers.arrayElements([
      "Blogging",
      "Skating",
      "3D Modeling",
      "Crafts",
      "Calligraphy",
      "Card Games",
    ]),
    socials: {
      facebook: faker.internet.url(),
      instagram: faker.internet.url(),
      linkedin: faker.internet.url(),
    },
  };
}

// Function to generate multiple users
function generateUsers(count) {
  const users = [];
  for (let i = 0; i < count; i++) {
    users.push(generateUser());
  }
  return users;
}

// Function to hash passwords
async function hashPasswords(users) {
  const SALT_WORK_FACTOR = 10;
  return Promise.all(
    users.map(async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(SALT_WORK_FACTOR);
        const hash = await bcrypt.hash(user.password, salt);
        return { ...user, password: hash };
      }
      return user;
    })
  );
}

async function populateDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(uri, clientOptions);
    console.log("Connected to MongoDB!");

    // Prompt user for the number of users to add
    rl.question("How many users would you like to add? ", async (count) => {
      const numUsers = parseInt(count, 10);
      if (isNaN(numUsers) || numUsers <= 0) {
        console.log("Invalid number of users. Exiting.");
        await mongoose.connection.close();
        rl.close();
        return;
      }

      // Confirmation prompt
      rl.question(
        `Are you sure you want to add ${numUsers} users to the database? (y/n): `,
        async (answer) => {
          if (answer.toLowerCase() === "y" || answer.toLowerCase() === "yes") {
            try {
              // Generate users
              const generatedUsers = generateUsers(numUsers);

              // Hash passwords
              const usersWithHashedPasswords = await hashPasswords(
                generatedUsers
              );

              // Insert users into the database
              const insertedUsers = await User.insertMany(
                usersWithHashedPasswords
              );
              console.log(
                `Successfully inserted ${insertedUsers.length} users.`
              );
            } catch (insertError) {
              console.error("Error inserting users:", insertError);
            } finally {
              // Close database connection and readline
              await mongoose.connection.close();
              console.log("Connection closed.");
              rl.close();
            }
          } else {
            console.log("User population canceled.");
            await mongoose.connection.close();
            console.log("Connection closed.");
            rl.close();
          }
        }
      );
    });
  } catch (error) {
    console.error("Error populating the database:", error);

    // Close connection to db if open
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log("Connection closed.");
    }

    rl.close(); // Close readline on error
  }
}

// Run the script
populateDatabase().catch(console.error);
