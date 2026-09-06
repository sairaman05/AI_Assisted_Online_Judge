import React, { useContext } from "react";
import { AuthContext } from "../api/authuser";
import ContestRegisterPage from "../pages/ContestPage";
import CodeEditorPage from "../pages/CodeEditorPage";

export default function EditorWrapper() {
  const { dbUser } = useContext(AuthContext);
  const userContestId = dbUser?.contest || null;

  if (!userContestId) {
    return <ContestRegisterPage />;
  } else {
    return <CodeEditorPage />;
  }
}
