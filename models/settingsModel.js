import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema({
  session: { type: String, default: "2024/2025" },
  term: { type: String, default: "1st Term" },
}, { timestamps: true });

const Settings = mongoose.model("Settings", settingsSchema);
export default Settings;
