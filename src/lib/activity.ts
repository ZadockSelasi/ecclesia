import { collection, addDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType, auth } from "./firebase";

export type ActivityType =
  | "system"
  | "user"
  | "task"
  | "communication"
  | "finance";

export async function logActivity(
  action: string,
  type: ActivityType,
  target?: string,
) {
  const currentUser = auth.currentUser;
  if (!currentUser) return; // Prevent logging if not signed in (or failed)

  try {
    const activitiesRef = collection(db, "activities");
    await addDoc(activitiesRef, {
      userId: currentUser.uid,
      userName: currentUser.displayName || "Unknown",
      action,
      type,
      target: target || "",
      createdAt: Date.now(),
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("permission")) {
      handleFirestoreError(error, OperationType.CREATE, "activities");
      return;
    }
    // Swallow non-critical errors so app continues working
    console.warn("Failed to log activity", error);
  }
}
