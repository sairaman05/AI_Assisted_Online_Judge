
const API_BASE = `${import.meta.env.VITE_BACKEND_IP}/api/submissions`;

// Create a new submission
export function addSubmission(submissionData) {
    return fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submissionData),
    })
        .then((res) => {
            if (!res.ok) throw new Error("Failed to submit solution");
            return res.json();
        })
        .catch((err) => {
            console.error("Error adding submission:", err);
        });
}

//Get a specific submission by ID
export function readSubmission(submissionId) {
    return fetch(`${API_BASE}/${submissionId}`)
        .then((res) => {
            if (!res.ok) throw new Error("Submission not found");
            return res.json();
        })
        .catch((err) => {
            console.error("Error reading submission:", err);
        });
}

// Get all submissions
export function readSubmissions() {

    return fetch(API_BASE)
        .then(async (res) => {
            if (!res.ok) throw new Error("Failed to fetch submissions");
            const data =  await res.json();
            return data;
        })
        .catch((err) => {
            console.error("Error fetching submissions:", err);
        });
}

//Update a submission by ID
export function updateSubmission(submissionId, updatedData) {
    return fetch(`${API_BASE}/${submissionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
    })
        .then((res) => {
            if (!res.ok) throw new Error("Failed to update submission");
            return res.json();
        })
        .catch((err) => {
            console.error("Error updating submission:", err);
        });
}

// Delete a submission by ID
export function deleteSubmission(submissionId) {
    return fetch(`${API_BASE}/${submissionId}`, {
        method: "DELETE",
    })
        .then((res) => {
            if (!res.ok) throw new Error("Failed to delete submission");
            return res.json();
        })
        .catch((err) => {
            console.error("Error deleting submission:", err);
        });
}
