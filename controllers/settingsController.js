import Settings from "../models/settingsModel.js";

// Get settings (used to pre-fill the form)
export const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create({});
    
    res.render("admin/settings", {
      title: "Settings",
      admin: req.admin,
      adminToken: req.session?.adminToken || null,
      currentSession: settings.session,
      currentTerm: settings.term,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update session/term
export const updateSessionTerm = async (req, res) => {
  try {
    const { session, term } = req.body;

    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({ session, term });
    } else {
      settings.session = session;
      settings.term = term;
      await settings.save();
    }

    res.json({ success: true, message: "Session/Term updated successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
