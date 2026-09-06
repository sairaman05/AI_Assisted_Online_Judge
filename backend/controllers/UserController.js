import User from '../models/user.js';

// CREATE
export const createUser = async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// READ ALL USERS
export const getUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// READ ONE USER BY CUSTOM ID (e.g. Auth0 ID)
export const getUserById = async (req, res) => {
  try {
    const user = await User.findOne({ id: req.params.id });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE USER BY CUSTOM ID
export const updateUser = async (req, res) => {
  try {
    const updated = await User.findOneAndUpdate(
      { id: req.params.id },       
      req.body,
      { new: true }                 
    );

    if (!updated) return res.status(404).json({ error: 'User not found' });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// DELETE USER BY CUSTOM ID
export const deleteUser = async (req, res) => {
  try {
    const deleted = await User.findOneAndDelete({ id: req.params.id }); 
    if (!deleted) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
export const logoutUser = (req, res) => {
  res.json({ message: 'Logged out successfully' });
};

// PARTIAL UPDATE USER BY CUSTOM ID (PATCH)
export const partialUpdateUser = async (req, res) => {
  try {
    const updated = await User.findOneAndUpdate(
      { id: req.params.id },
      { $set: req.body },   
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: 'User not found' });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
