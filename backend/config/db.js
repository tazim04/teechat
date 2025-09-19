import mongoose from "mongoose";

// Connect to MongoDB
export async function connectMongo(uri) {
  const clientOptions = {
    serverApi: { version: "1", strict: true, deprecationErrors: true },
  };

  try {
    await mongoose.connect(uri, clientOptions);
    await mongoose.connection.db.admin().command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
}
