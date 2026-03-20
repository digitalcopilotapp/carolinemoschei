require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const logger = require("./utils/logger");
const logRawPayload = require("./routes/debug-raw");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.set("trust proxy", true);
app.use(morgan("combined", { stream: { write: (msg) => logger.info(msg.trim()) } }));

// Debug raw payload
app.use(logRawPayload);

// Rotas
const webhookRoutes = require("./routes/webhook");
app.use("/webhook", webhookRoutes);

app.get("/health", (req, res) => res.json({ status: "ok", uptime: process.uptime() }));
app.get("/", (req, res) => res.json({ service: "hotmart-webhook", status: "online" }));

app.listen(PORT, () => {
  logger.info("Webhook server rodando na porta " + PORT);
  logger.info("Endpoint: POST /webhook/hotmart");
  logger.info("Health: GET /health");
});
