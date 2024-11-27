const bcrypt = require("bcrypt");
const userModel = require("../models/user.model.js");
const jwt = require("jsonwebtoken");
const Stripe = require('stripe');
const stripe = Stripe('sk_test_51NxyGyL0Iy592SMhn2hxhyASVSFdNgIYcPSqzZAxyzJ4RzupTmzhEbHMM1EVUIMJOb8yKj08ufA5hffArdQdwvhW00P2aEyQL3');

const register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !password || !email)
    return res
      .status(404)
      .json({ status: "fail", msg: "All fields are required" });

  const salt = bcrypt.genSaltSync(10);
  const hashPassword = bcrypt.hashSync(password, salt);

  const user = await userModel.findOne({ email });

  if (user)
    return res
      .status(401)
      .json({ status: "fail", msg: "This Email Is Already Exist!" });

  const createUser = await userModel.create({
    name,
    email,
    password: hashPassword,
  });

  const token = jwt.sign({ id: createUser._id }, 'KHAMIS');

  res
    .status(200)
    .json({ status: "success", token, data: { name: createUser.name } });
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!password || !email)
    return res
      .status(404)
      .json({ status: "fail", msg: "All fields are required" });

  const user = await userModel.findOne({ email });

  if (!user)
    return res
      .status(401)
      .json({ status: "fail", msg: "This Email Is Not Exist, Create One!" });

  const isMatch = bcrypt.compareSync(password, user.password);

  if (isMatch) {
    const token = jwt.sign({ id: user._id }, 'KHAMIS');
    res
      .status(200)
      .json({ status: "success", token, data: { name: user.name } });
  } else {
    return res
      .status(401)
      .json({ status: "fail", msg: "Email or Password Is Incorrect!" });
  }
};

const credits = async (req, res) => {
  const userId = req.userId;

  const user = await userModel.findById(userId);
  if (!user) {
    return res
      .status(401)
      .json({ status: "fail", msg: "Unauthorized, log in again!" });
  }

  res.status(200).json({
    status: "success",
    data: { name: user.name, credits: user.creditBalance },
  });
};

const createSession = async (req, res) => {
  const userId = req.userId;
  const { planId } = req.body;
  const user = await userModel.findById(userId);

  let amount, credits, desc;

  switch (planId) {
    case "Basic":
      amount = 10;
      credits = 100;
      desc = "Best for personal use.";
      break;
    case "Advanced":
      amount = 50;
      credits = 500;
      desc = "Best for business use.";
      break;
    case "Business":
      amount = 250;
      credits = 5000;
      desc = "Best for enterprise use.";
      break;
    default:
      return res
        .status(404)
        .json({ status: "fail", msg: "Please choose a valid plan" });
  }

  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        price_data: {
          currency: "USD",
          unit_amount: amount * 100,
          product_data: {
            name: user.name,
            description: desc,
            // images: ['https://example.com/t-shirt.png'],
          },
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${req.protocol}://${req.get("host")}/plans?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${req.protocol}://${req.get("host")}/plans`,
    customer_email: user.email,
    metadata: { credits },
  });

  res.status(200).json({
    status: "success",
    session: session.url,
  });
};

const verifySession = async (req, res) => {
  const { session_id } = req.body
  const session = await stripe.checkout.sessions.retrieve(session_id)

  if (session.status === "complete") {
    const user = await userModel.findOne({ email: session.customer_email })
    if (!user.payments.includes(session_id)) {
      await userModel.findByIdAndUpdate(user._id, {
        $push: { payments: session_id },
        creditBalance: user.creditBalance + parseInt(session.metadata.credits)
      })
      return res.status(201).json({ received: true, session, msg: 'Paid Successfully' });
    } else {
      return res.status(401).json({ received: false, msg: 'Is Already Payed!' });
    }
  }
};


module.exports = { register, login, credits, createSession, verifySession };
