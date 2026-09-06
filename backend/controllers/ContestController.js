import Contest from '../models/contest.js';

// CREATE Contest
export const createContest = async (req, res) => {
  try {
    const contest = new Contest(req.body);
    console.log(contest);
    await contest.save();
    res.status(201).json(contest);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// READ ALL Contests
export const getContests = async (req, res) => {
  try {
    const contests = await Contest.find()
      .populate('problems')      
      .populate('participants');  
    res.json(contests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// READ ONE Contest by ID
export const getContestById = async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id)
      .populate('problems')
      .populate('participants');
    if (!contest) return res.status(404).json({ error: "Contest not found" });
    res.json(contest);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE Contest by ID
export const updateContest = async (req, res) => {
  try {
    const updated = await Contest.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "Contest not found" });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// DELETE Contest by ID
export const deleteContest = async (req, res) => {
  try {
    const deleted = await Contest.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Contest not found" });
    res.json({ message: "Contest deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// REGISTER User for Contest
export const registerUserForContest = async (req, res) => {
  const { contestId, userId } = req.body; 
  if (!contestId || !userId) {
    return res.status(400).json({ error: "contestId and userId are required" });
  }

  try {
    const contest = await Contest.findById(contestId);
    if (!contest) return res.status(404).json({ error: "Contest not found" });

    if (!contest.participants) contest.participants = [];
    if (contest.participants.includes(userId)) {
      return res.status(400).json({ error: "User already registered" });
    }

    contest.participants.push(userId);
    await contest.save();


    res.json({ message: "User registered to contest successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UNREGISTER User from Contest (optional)
export const unregisterUserFromContest = async (req, res) => {
  const { contestId, userId } = req.body;

  if (!contestId || !userId) {
    return res.status(400).json({ error: "contestId and userId are required" });
  }

  try {
    const contest = await Contest.findById(contestId);
    if (!contest) return res.status(404).json({ error: "Contest not found" });

    contest.participants = contest.participants.filter(
      participantId => participantId.toString() !== userId
    );
    await contest.save();

    res.json({ message: "User unregistered from contest successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add a problem to a contest's problems array
export const addProblemToContest = async (req, res) => {
  const { contestId, problemId } = req.body;
  console.log(contestId, problemId);
  if (!contestId || !problemId) {
    return res.status(400).json({ message: "contestId and problemId are required" });
  }

  try {
    const contest = await Contest.findById(contestId);
    if (!contest) return res.status(404).json({ message: 'Contest not found' });

    if (!contest.problems) {
      contest.problems = [];
    }
    
    if (contest.problems.includes(problemId)) {
      return res.status(400).json({ message: 'Problem already added to contest' });
    }

    contest.problems.push(problemId);
    await contest.save();

    res.status(200).json({ message: 'Problem added to contest', contest });
  } catch (error) {
    console.error('Error adding problem to contest:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Remove a problem from a contest's problems array
export const removeProblemFromContest = async (req, res) => {
  const { contestId, problemId } = req.body;

  if (!contestId || !problemId) {
    return res.status(400).json({ message: "contestId and problemId are required" });
  }

  try {
    const contest = await Contest.findById(contestId);
    if (!contest) return res.status(404).json({ message: 'Contest not found' });

    if (!contest.problems || contest.problems.length === 0) {
      return res.status(400).json({ message: 'No problems associated with this contest' });
    }

    const originalCount = contest.problems.length;
    contest.problems = contest.problems.filter(pid => pid.toString() !== problemId);

    if (contest.problems.length === originalCount) {
      return res.status(400).json({ message: 'Problem not found in contest' });
    }

    await contest.save();

    res.status(200).json({ message: 'Problem removed from contest', contest });
  } catch (error) {
    console.error('Error removing problem from contest:', error);
    res.status(500).json({ message: 'Server error' });
  }
};



// Validate contest password
export const validateContestPassword = async (req, res) => {
  const { contestId, password } = req.body;

  if (!contestId || !password) {
    return res.status(400).json({ error: "contestId and password are required" });
  }

  try {
    const contest = await Contest.findById(contestId);
    if (!contest) {
      return res.status(404).json({ error: "Contest not found" });
    }

    if (!contest.password) {
      // No password set, so consider validated
      return res.json({ valid: true });
    }

    const isValid = await contest.comparePassword(password);
    return res.json({ valid: isValid });
  } catch (error) {
    console.error("Error validating contest password:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};