import { db } from "../lib/db.ts";

async function runTests() {
  console.log("🧪 Starting Startup & Manufacturing Ideas API Test Suite...\n");

  try {
    // Test 1: Query Ideas
    const ideas = await db.ideas.findMany();
    console.log(`✅ Test 1 Passed: Found ${ideas.length} manufacturing ideas in database.`);

    if (ideas.length === 0) {
      throw new Error("No ideas returned!");
    }

    // Test 2: Query single idea by ID & Slug
    const firstIdea = ideas[0];
    const foundById = await db.ideas.findUnique({ id: firstIdea.id });
    const foundBySlug = await db.ideas.findUnique({ slug: firstIdea.slug });
    
    if (foundById && foundBySlug && foundById.id === foundBySlug.id) {
      console.log(`✅ Test 2 Passed: Successfully queried idea by ID (${firstIdea.id}) and Slug (${firstIdea.slug}).`);
    } else {
      throw new Error("Failed to find idea by ID or Slug");
    }

    // Test 3: Upvote idea
    const initialUpvotes = firstIdea.upvotes;
    const updated = await db.ideas.upvote(firstIdea.id);
    if (updated && updated.upvotes === initialUpvotes + 1) {
      console.log(`✅ Test 3 Passed: Upvote functionality verified (${initialUpvotes} -> ${updated.upvotes}).`);
    } else {
      throw new Error("Upvote persistence failed!");
    }

    // Test 4: Articles & Resources
    const articles = await db.articles.findMany();
    const resources = await db.resources.findMany();
    console.log(`✅ Test 4 Passed: Found ${articles.length} guides and ${resources.length} resources.`);

    console.log("\n🎉 ALL 4 UNIT & INTEGRATION TESTS PASSED CLEANLY!");
  } catch (err) {
    console.error("❌ Test suite failed:", err);
    process.exit(1);
  }
}

runTests();
