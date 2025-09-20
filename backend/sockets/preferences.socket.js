import User from "../models/users.js";

export default function preferencesSocket(io, socket) {
  // Set the user's palette in the database
  socket.on("set_palette", async (username, palette) => {
    console.log("Setting palette for:", username, palette);
    const user = await User.findOne({ username: username });

    if (!user) {
      console.log("set_palette: User not found:", username);
      return;
    }

    await user.updateOne({ palette: palette }); // Update the user's palette in the database
    console.log("Palette updated for:", username, palette);
  });

  // Fetch the user's palette from the database
  socket.on("fetch_palette", async (user_id) => {
    console.log("fetch_palette:", user_id);
    const user = await User.findById(user_id);
    console.log("Fetching palette for:", user);
    socket.emit("users_palette", user.palette); // Emit the user's palette to the client
  });
}
