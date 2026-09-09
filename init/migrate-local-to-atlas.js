require("dotenv").config();

const mongoose = require("mongoose");

const localUrl = process.env.LOCAL_MONGODB_URL || "mongodb://127.0.0.1:27017/wanderlust";
const atlasUrl = process.env.MONGODB_ATLAS_URL;
const collections = ["users", "listings", "reviews"];

if (!atlasUrl) {
    throw new Error("MONGODB_ATLAS_URL is required");
}

if (process.env.MIGRATION_CONFIRM !== "YES") {
    throw new Error("Set MIGRATION_CONFIRM=YES before running this destructive migration");
}

async function migrate() {
    const source = await mongoose.createConnection(localUrl).asPromise();
    const target = await mongoose.createConnection(atlasUrl).asPromise();

    try {
        for (const collectionName of collections) {
            const documents = await source.collection(collectionName).find({}).toArray();
            await target.collection(collectionName).deleteMany({});

            if (documents.length > 0) {
                await target.collection(collectionName).insertMany(documents);
            }

            console.log(`${collectionName}: copied ${documents.length} documents`);
        }

        console.log("Local data successfully copied to Atlas");
    } finally {
        await source.close();
        await target.close();
    }
}

migrate().catch((error) => {
    console.error("Migration failed:", error.message);
    process.exitCode = 1;
});