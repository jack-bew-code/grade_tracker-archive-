// Who is signed in? Every page and action uses this.
import { auth } from "@clerk/nextjs/server";

// Returns the signed-in user's id. proxy.ts already stops signed-out visitors,
// so this only throws if something has gone wrong.
export async function getUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Not signed in");
  return userId;
}
