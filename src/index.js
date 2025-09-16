import express from "express";
import cors from "cors"; // import cors
import routes from "./routes/routes.js";

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for all origins
app.use(cors({ origin: '*' }));

app.use(express.json());
app.use("/", routes);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
});
