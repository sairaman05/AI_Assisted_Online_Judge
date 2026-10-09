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

// READ USER PROFILE WITH SOLVED STATS & SUBMISSIONS
export const getUserProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    let user = await User.findOne({
      $or: [
        { id: userId },
        { email: userId },
        ...(userId.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: userId }] : [])
      ]
    });

    if (!user) {
      // Return default telemetry for guest or new user instead of 404
      const Problem = (await import('../models/problem.js')).default;
      const recs = await Problem.find().limit(5);
      return res.json({
        user: { id: userId, name: 'Competitor', email: userId },
        solvedCount: 0,
        attemptedCount: 0,
        streak: 1,
        rating: 1200,
        contestParticipationCount: 0,
        solvedProblemIds: [],
        easySolved: 0,
        mediumSolved: 0,
        hardSolved: 0,
        totalSubmissions: 0,
        topicProgress: {},
        weakTopics: ['Dynamic Programming', 'Graph Traversal', 'Two Pointers'],
        recommendedProblems: recs,
        submissions: []
      });
    }

    // Fetch user submissions
    const Submission = (await import('../models/submission.js')).default;
    const Problem = (await import('../models/problem.js')).default;

    const submissions = await Submission.find({ 
      $or: [{ user: user.id }, { username: user.name }, { user: user._id.toString() }]
    }).sort({ createdAt: -1 }).limit(50);

    const acceptedSubmissions = await Submission.find({
      $or: [{ user: user.id }, { username: user.name }, { user: user._id.toString() }],
      result: 'Accepted'
    });

    const solvedProblemIds = Array.from(new Set([
      ...(user.solvedProblems || []),
      ...acceptedSubmissions.map(s => s.problem)
    ]));

    // Fetch details for solved problems to calculate difficulty breakdown
    const solvedProblems = await Problem.find({ id: { $in: solvedProblemIds } });

    let easySolved = 0;
    let mediumSolved = 0;
    let hardSolved = 0;

    solvedProblems.forEach(p => {
      const diff = (p.difficulty || 'Medium').toLowerCase();
      if (diff === 'easy') easySolved++;
      else if (diff === 'hard') hardSolved++;
      else mediumSolved++;
    });

    // Calculate attempted problems & topic stats
    const allUserSubmissions = await Submission.find({
      $or: [{ user: user.id }, { username: user.name }, { user: user._id.toString() }]
    });

    const attemptedProblemIds = Array.from(new Set(allUserSubmissions.map(s => s.problem)));
    const failedSubmissions = allUserSubmissions.filter(s => s.result !== 'Accepted');
    
    // Fetch all problems involved
    const allInvolvedProblems = await Problem.find({
      id: { $in: Array.from(new Set([...solvedProblemIds, ...attemptedProblemIds])) }
    });

    const topicProgressMap = {};
    const tagFailureCounts = {};

    allInvolvedProblems.forEach(p => {
      const isSolved = solvedProblemIds.includes(p.id) || solvedProblemIds.includes(p._id.toString());
      if (p.tags && Array.isArray(p.tags)) {
        p.tags.forEach(tag => {
          if (!topicProgressMap[tag]) topicProgressMap[tag] = { total: 0, solved: 0 };
          topicProgressMap[tag].total += 1;
          if (isSolved) topicProgressMap[tag].solved += 1;
        });
      }
    });

    failedSubmissions.forEach(sub => {
      const prob = allInvolvedProblems.find(p => p.id === sub.problem || p._id.toString() === sub.problem);
      if (prob && prob.tags) {
        prob.tags.forEach(tag => {
          tagFailureCounts[tag] = (tagFailureCounts[tag] || 0) + 1;
        });
      }
    });

    const weakTopics = Object.entries(tagFailureCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([tag]) => tag);

    if (weakTopics.length === 0) {
      weakTopics.push('Dynamic Programming', 'Graph Traversal', 'Two Pointers');
    }

    // Recommended problems matching weak topics that user hasn't solved yet
    const recommendedProblems = await Problem.find({
      id: { $nin: solvedProblemIds },
      tags: { $in: weakTopics }
    }).limit(5);

    // Contest participation count
    const Contest = (await import('../models/contest.js')).default;
    const contestCount = await Contest.countDocuments({
      participants: { $in: [user.id, user.email, user._id.toString()] }
    });

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        type: user.type,
        createdAt: user.createdAt
      },
      solvedCount: solvedProblemIds.length,
      attemptedCount: attemptedProblemIds.length,
      streak: user.streak || 1,
      rating: user.rating || 1200,
      contestParticipationCount: contestCount,
      solvedProblemIds,
      easySolved,
      mediumSolved,
      hardSolved,
      totalSubmissions: submissions.length,
      topicProgress: topicProgressMap,
      weakTopics,
      recommendedProblems,
      submissions
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
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
