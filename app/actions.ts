'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { kv } from '@vercel/kv'

import { auth } from '@/auth'
import { type Chat } from '@/lib/types'

// Store a new user's details
export async function storeUser(user: { id: string } & Record<string, any>) {
  // Assuming user has an 'id' field
  const userKey = `user:details:${user.id}`;

  // Save user details
  await kv.hmset(userKey, user);

  // Add user's ID to the list of all users
  await kv.sadd('users:list', user.id);
}

export async function storeEmail(email: string) {
  // Add email to the list of all emails
  await kv.sadd('emails:list', email)
  // if user is logged in, set email_subscribed to true
  const session = await auth()
  if (session?.user?.id) {
    await kv.hmset(`user:details:${session.user.id}`, {
      email_subscribed: true
    })
  }

}

export async function getChats(userId?: string | null) {
  if (!userId) {
    return []
  }

  try {
    const pipeline = kv.pipeline()
    const chats: string[] = await kv.zrange(`user:chat:${userId}`, 0, -1, {
      rev: true
    })

    for (const chat of chats) {
      pipeline.hgetall(chat)
    }

    const results = await pipeline.exec()

    return results as Chat[]
  } catch (error) {
    return []
  }
}

export async function getChat(id: string, userId: string) {
  const chat = await kv.hgetall<Chat>(`chat:${id}`)

  if (!chat || (userId && chat.userId !== userId)) {
    return null
  }

  return chat
}

export async function removeChat({ id, path }: { id: string; path: string }) {
  const session = await auth()

  if (!session) {
    return {
      error: 'Unauthorized'
    }
  }

  const uid = await kv.hget<string>(`chat:${id}`, 'userId')

  if (uid !== session?.user?.id) {
    return {
      error: 'Unauthorized'
    }
  }

  await kv.del(`chat:${id}`)
  await kv.zrem(`user:chat:${session.user.id}`, `chat:${id}`)

  revalidatePath('/')
  return revalidatePath(path)
}

export async function clearChats() {
  const session = await auth()

  if (!session?.user?.id) {
    return {
      error: 'Unauthorized'
    }
  }

  const chats: string[] = await kv.zrange(`user:chat:${session.user.id}`, 0, -1)
  if (!chats.length) {
    return redirect('/')
  }
  const pipeline = kv.pipeline()

  for (const chat of chats) {
    pipeline.del(chat)
    pipeline.zrem(`user:chat:${session.user.id}`, chat)
  }

  await pipeline.exec()

  revalidatePath('/')
  return redirect('/')
}

export async function getSharedChat(id: string) {
  const chat = await kv.hgetall<Chat>(`chat:${id}`)

  if (!chat || !chat.sharePath) {
    return null
  }

  return chat
}

export async function shareChat(chat: Chat) {
  const session = await auth()

  if (!session?.user?.id || session.user.id !== chat.userId) {
    return {
      error: 'Unauthorized'
    }
  }

  const avatarUrl = session.user.picture

  const payload = {
    ...chat,
    sharePath: `/share/${chat.id}`,
    ...(avatarUrl &&
      { avatarUrl: avatarUrl }
    )

  }

  await kv.hmset(`chat:${chat.id}`, payload)

  return payload
}


export async function getUserField(fieldName: string): Promise<any> {
  try {
    // Fetch the user's session
    const session = await auth();

    if (!session?.user?.id) {
      throw new Error("User not logged in");
    }

    // Fetch the user's details from KV using their ID
    const userKey = `user:details:${session.user.id}`;
    const userDetails = await kv.hgetall(userKey);

    // Return the value of the specified field name
    return userDetails?.[fieldName];
  } catch (error: any) {
    console.error(error.message);
    return null;  // or throw error or return undefined, based on your preference
  }
}