import { MongoClient } from "mongodb";
const { MONGODB_URI, MONGODB_DB } = process.env;

export const connectToDatabase = async () => {
  const client = await MongoClient.connect(MONGODB_URI as string, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  return {
    client,
    db: client.db(MONGODB_DB as string),
  };
};
