require('dotenv').config();
const express = require("express");
const app = express();
const cors = require("cors");
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const BASE_URL = process.env.BASE_URL;
const PORT = process.env.PORT || 7000;

app.use(express.json());
app.use(cors());

app.post("/api/create-checkout-session", async (req, res) => {
  const { products } = req.body;

  const response = await fetch(
    "https://api.exchangerate-api.com/v4/latest/USD"
  );
  const data = await response.json();

  const inrExchangeRate = data.rates.INR;

  const lineItems = products.map((product) => ({
    price_data: {
      currency: "inr",
      product_data: {
        name: product.name,
        images: [product.image],
      },
      unit_amount: Math.ceil(product.price * inrExchangeRate * 100),
    },
    quantity: product.productCount,
  }));

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: lineItems,
    mode: "payment",
    success_url: `${BASE_URL}/success`,
    cancel_url: `${BASE_URL}/cancel`,
  });

  res.json({ id: session.id });
});

app.listen(PORT, () => {
  console.log(`server start at port no ${PORT}`);
});
