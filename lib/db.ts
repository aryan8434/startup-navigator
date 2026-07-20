import fs from "fs";
import path from "path";
import { seedArticles, seedResources, seedIdeas } from "./seed";

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

export interface BillOfMaterialItem {
  item: string;
  costPerUnit: string;
  supplierType: string;
  essential: boolean;
}

export interface MachineRequirement {
  name: string;
  estimatedCost: string;
  purpose: string;
}

export interface UnitEconomics {
  rawMaterialCost: number;
  laborCostPerUnit: number;
  packagingCost: number;
  wholesalePrice: number;
  retailPrice: number;
  grossMargin: number;
}

export interface Competitor {
  name: string;
  weakness: string;
  differentiation: string;
}

export interface Idea {
  id: string;
  title: string;
  slug: string;
  tagline: string;
  category: "Manufacturing" | "Hardware / Electronics" | "GreenTech / Sustainability" | "FMCG / Consumer Goods" | "BioTech / Healthcare" | "Industrial Automation" | "Micro-Manufacturing";
  investmentTier: "< $10k" | "$10k - $50k" | "$50k - $250k" | "$250k+";
  profitMargin: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced" | "Expert";
  targetMarket: string;
  tam: string;
  sam: string;
  som: string;
  summary: string;
  problemStatement: string;
  proposedSolution: string;
  manufacturingProcess: string[];
  billOfMaterials: BillOfMaterialItem[];
  machineryNeeded: MachineRequirement[];
  unitEconomics: UnitEconomics;
  regulatoryRequirements: string[];
  competitorLandscape: Competitor[];
  growthPlaybook: string[];
  tags: string[];
  upvotes: number;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Schema {
  users: User[];
  articles: Article[];
  searchHistory: SearchLog[];
  resources: Resource[];
  ideas: Idea[];
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

    const ideasWithIds: Idea[] = seedIdeas.map((i) => ({
      ...i,
      id: Math.random().toString(36).substring(2, 11),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    const initialData: Schema = {
      users: [],
      articles: articlesWithIds,
      searchHistory: [],
      resources: resourcesWithIds,
      ideas: ideasWithIds,
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), "utf-8");
  } else {
    // If DB exists but ideas property is missing, migration patch
    try {
      const raw = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (!parsed.ideas || parsed.ideas.length === 0) {
        parsed.ideas = seedIdeas.map((i) => ({
          ...i,
          id: Math.random().toString(36).substring(2, 11),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));
        fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2), "utf-8");
      }
    } catch {
      // ignore
    }
  }
}

// Simple Promise-based lock queue to prevent race conditions during concurrent writes
let writeQueue: Promise<void> = Promise.resolve();

export async function readDb(): Promise<Schema> {
  initDb();
  try {
    const data = await fs.promises.readFile(DB_FILE, "utf-8");
    const parsed = JSON.parse(data) as Schema;
    if (!parsed.ideas) parsed.ideas = [];
    return parsed;
  } catch (error) {
    console.error("Error reading database:", error);
    return { users: [], articles: [], searchHistory: [], resources: [], ideas: [] };
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

  ideas: {
    findMany: async () => {
      const data = await readDb();
      return data.ideas || [];
    },
    findUnique: async (filter: { id?: string; slug?: string }) => {
      const data = await readDb();
      if (filter.id) {
        return data.ideas.find((i) => i.id === filter.id) || null;
      }
      if (filter.slug) {
        return data.ideas.find((i) => i.slug === filter.slug) || null;
      }
      return null;
    },
    create: async (idea: Omit<Idea, "id" | "createdAt" | "updatedAt" | "upvotes"> & { upvotes?: number }) => {
      const data = await readDb();
      const newIdea: Idea = {
        ...idea,
        id: Math.random().toString(36).substring(2, 11),
        upvotes: idea.upvotes ?? 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      if (!data.ideas) data.ideas = [];
      data.ideas.unshift(newIdea);
      await writeDb(data);
      return newIdea;
    },
    upvote: async (id: string) => {
      const data = await readDb();
      const index = data.ideas.findIndex((i) => i.id === id);
      if (index === -1) return null;
      data.ideas[index].upvotes += 1;
      data.ideas[index].updatedAt = new Date().toISOString();
      await writeDb(data);
      return data.ideas[index];
    },
    delete: async (id: string) => {
      const data = await readDb();
      const index = data.ideas.findIndex((i) => i.id === id);
      if (index === -1) return false;
      data.ideas.splice(index, 1);
      await writeDb(data);
      return true;
    },
  },
};
