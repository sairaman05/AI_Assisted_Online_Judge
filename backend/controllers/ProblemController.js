import Problem from '../models/problem.js';

// CREATE Problem
export const createProblem = async (req, res) => {
  try {
    const problem = new Problem(req.body);
    await problem.save();
    res.status(201).json(problem);
  } catch (error) {
    console.error('Error creating problem:', error);
    res.status(400).json({ error: error.message });
  }
};

// READ ALL Problems
export const getProblems = async (req, res) => {
  try {
    const problems = await Problem.find();
    res.json(problems);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// READ ONE by Custom `id` Field
export const getProblemById = async (req, res) => {
  try {
    const problem = await Problem.findOne({ id: req.params.id });
    if (!problem) return res.status(404).json({ error: "Problem not found" });
    res.json(problem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE Problem by Custom `id`
export const updateProblem = async (req, res) => {
  try {
    const updated = await Problem.findOneAndUpdate(
      { id: req.params.id },   
      req.body,
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: "Problem not found" });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// DELETE Problem by Custom `id`
export const deleteProblem = async (req, res) => {
  try {
    const deleted = await Problem.findOneAndDelete({ id: req.params.id });
    if (!deleted) return res.status(404).json({ error: "Problem not found" });
    res.json({ message: "Problem deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
