
const API_BASE = `${import.meta.env.VITE_BACKEND_IP}/api/users`;

// CREATE a new user
export function addUser(userData) {
    return fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
    });
}

// READ one user by ID
export function readUser(userId) {
    return fetch(`${API_BASE}/${userId}`)
        .then((res) => {
            if (res.ok) return res.json();
            throw new Error("User not found");
        })
        .catch((err) => {
            console.error("Error reading user:", err);
        });
}

// READ all users
export function readUsers() {
    return fetch(API_BASE, {credentials: "include"})
        .then((res) => {
            if (res.ok) return res.json();
            throw new Error("Failed to fetch users");
        });
}

// UPDATE user by ID
export function updateUser(userId, updatedData) {
    return fetch(`${API_BASE}/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updatedData),
    })
        .then((res) => {
            if (res.ok) return res.json();
            throw new Error("Failed to update");
        })
        .catch((err) => {
            console.error("Error updating user:", err);
        });
}

// DELETE user by ID
export function deleteUser(userId) {
    return fetch(`${API_BASE}/${userId}`, {
        method: "DELETE",
        credentials: "include",
    })
        .then((res) => {
            if (res.ok) return res.json();
            throw new Error("Failed to delete");
        })
        .catch((err) => {
            console.error("Error deleting user:", err);
        });
}

// PATCH update user's contest field
export function updateUserContest(userId, contestId) {
  return fetch(`${API_BASE}/${userId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ contest: contestId}),
  })
    .then((res) => {
      if (!res.ok) throw new Error("Failed to update user contest");
      return res.json();
    })
    .catch((err) => {
      console.error("Error updating user contest:", err);
      throw err;
    });
}
