import fs from "fs";
import path from "path";
import { seedArticles, seedResources } from "./seed";

// Types
export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: "admin" | "user";
  createdAt: string;
}

export interface Article {
  id: string;
  title: string;
  content: string;
  category: string;
  summary: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SearchLog {
  id: string;
  userId: string | null;
  query: string;
  answer: string;
  sources: string[];
  timestamp: string;
}

export interface Resource {
  id: string;
  title: string;
  description: string;
  type: string; // e.g. "Template", "Checklist", "Guide"
  fileUrl: string;
  category: string;
  createdAt: string;
}

export interface Schema {
  users: User[];
  articles: Article[];
  searchHistory: SearchLog[];
  resources: Resource[];
}

const DB_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DB_DIR, "db.json");

// Ensure data folder and db.json exist
function initDb() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    const articlesWithIds: Article[] = seedArticles.map((a) => ({
      ...a,
      id: Math.random().toString(36).substring(2, 11),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    const resourcesWithIds: Resource[] = seedResources.map((r) => ({
      ...r,
      id: Math.random().toString(36).substring(2, 11),
      createdAt: new Date().toISOString(),
    }));

    const initialData: Schema = {
      users: [],
      articles: articlesWithIds,
      searchHistory: [],
      resources: resourcesWithIds,
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), "utf-8");
  }
}

// Simple Promise-based lock queue to prevent race conditions during concurrent writes
let writeQueue: Promise<void> = Promise.resolve();

export async function readDb(): Promise<Schema> {
  initDb();
  try {
    const data = await fs.promises.readFile(DB_FILE, "utf-8");
    return JSON.parse(data) as Schema;
  } catch (error) {
    console.error("Error reading database:", error);
    return { users: [], articles: [], searchHistory: [], resources: [] };
  }
}

export async function writeDb(data: Schema): Promise<void> {
  initDb();
  // Queue up the write operation
  const nextWrite = new Promise<void>((resolve, reject) => {
    writeQueue = writeQueue.then(async () => {
      try {
        // Write to a temporary file first, then rename (atomic write)
        const tempFile = `${DB_FILE}.tmp`;
        await fs.promises.writeFile(tempFile, JSON.stringify(data, null, 2), "utf-8");
        await fs.promises.rename(tempFile, DB_FILE);
        resolve();
      } catch (error) {
        console.error("Error writing database:", error);
        reject(error);
      }
    });
  });
  return nextWrite;
}

// Helper CRUD operations
export const db = {
  users: {
    findMany: async () => {
      const data = await readDb();
      return data.users;
    },
    findUnique: async (filter: { email?: string; id?: string }) => {
      const data = await readDb();
      if (filter.email) {
        return data.users.find((u) => u.email.toLowerCase() === filter.email!.toLowerCase());
      }
      if (filter.id) {
        return data.users.find((u) => u.id === filter.id);
      }
      return null;
    },
    create: async (user: Omit<User, "id" | "createdAt">) => {
      const data = await readDb();
      const newUser: User = {
        ...user,
        id: Math.random().toString(36).substring(2, 11),
        createdAt: new Date().toISOString(),
      };
      data.users.push(newUser);
      await writeDb(data);
      return newUser;
    },
  },

  articles: {
    findMany: async () => {
      const data = await readDb();
      return data.articles;
    },
    findUnique: async (filter: { id: string }) => {
      const data = await readDb();
      return data.articles.find((a) => a.id === filter.id) || null;
    },
    create: async (article: Omit<Article, "id" | "createdAt" | "updatedAt">) => {
      const data = await readDb();
      const newArticle: Article = {
        ...article,
        id: Math.random().toString(36).substring(2, 11),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      data.articles.push(newArticle);
      await writeDb(data);
      return newArticle;
    },
    update: async (id: string, updates: Partial<Omit<Article, "id" | "createdAt" | "updatedAt">>) => {
      const data = await readDb();
      const index = data.articles.findIndex((a) => a.id === id);
      if (index === -1) return null;

      const updatedArticle: Article = {
        ...data.articles[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      data.articles[index] = updatedArticle;
      await writeDb(data);
      return updatedArticle;
    },
    delete: async (id: string) => {
      const data = await readDb();
      const index = data.articles.findIndex((a) => a.id === id);
      if (index === -1) return false;

      data.articles.splice(index, 1);
      await writeDb(data);
      return true;
    },
  },

  searchHistory: {
    findMany: async () => {
      const data = await readDb();
      return data.searchHistory;
    },
    create: async (log: Omit<SearchLog, "id" | "timestamp">) => {
      const data = await readDb();
      const newLog: SearchLog = {
        ...log,
        id: Math.random().toString(36).substring(2, 11),
        timestamp: new Date().toISOString(),
      };
      data.searchHistory.push(newLog);
      await writeDb(data);
      return newLog;
    },
  },

  resources: {
    findMany: async () => {
      const data = await readDb();
      return data.resources;
    },
    findUnique: async (filter: { id: string }) => {
      const data = await readDb();
      return data.resources.find((r) => r.id === filter.id) || null;
    },
    create: async (resource: Omit<Resource, "id" | "createdAt">) => {
      const data = await readDb();
      const newResource: Resource = {
        ...resource,
        id: Math.random().toString(36).substring(2, 11),
        createdAt: new Date().toISOString(),
      };
      data.resources.push(newResource);
      await writeDb(data);
      return newResource;
    },
    update: async (id: string, updates: Partial<Omit<Resource, "id" | "createdAt">>) => {
      const data = await readDb();
      const index = data.resources.findIndex((r) => r.id === id);
      if (index === -1) return null;

      const updatedResource: Resource = {
        ...data.resources[index],
        ...updates,
      };
      data.resources[index] = updatedResource;
      await writeDb(data);
      return updatedResource;
    },
    delete: async (id: string) => {
      const data = await readDb();
      const index = data.resources.findIndex((r) => r.id === id);
      if (index === -1) return false;

      data.resources.splice(index, 1);
      await writeDb(data);
      return true;
    },
  },
};
