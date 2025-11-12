import express from "express";
import cors from "cors";
import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn("⚠️  Defina STRIPE_SECRET_KEY no arquivo .env antes de iniciar o servidor Stripe.");
}

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

app.use(cors({ origin: ["http://localhost:4173", "http://127.0.0.1:4173"], credentials: false }));
app.use(express.json());

app.post("/create-checkout-session", async (req, res) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ error: "Servidor Stripe não configurado" });
    }

    const { amount, customer } = req.body;
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: "http://localhost:4173/thank-you.html",
      cancel_url: "http://localhost:4173/",
      currency: "brl",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "brl",
            product_data: {
              name: "ManifestAI + Protocolo Lei da Atração",
              description: "Acesso completo ao segredo MyOak",
            },
            unit_amount: Math.round(Number(amount || 0) * 100),
          },
        },
      ],
      metadata: {
        customerName: customer?.name || "",
        customerPhone: customer?.phone || "",
        customerEmail: customer?.email || "",
      },
    });

    return res.json({ url: session.url });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Falha ao criar sessão de checkout" });
  }
});

const PORT = process.env.PORT || 4242;
app.listen(PORT, () => {
  console.log(`🚀 Stripe checkout server rodando na porta ${PORT}`);
});
