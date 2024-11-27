const express = require("express");
const ExpressMongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const helmet = require("helmet");
const cors = require("cors");
const compression = require("compression");
const dotenv = require("dotenv/config.js");

const database = require("./config/database");
const routesMount = require("./routes");
const ApiError = require("./utils/apiError");

const app = express();

// Parse Str as Json Middleware
app.use(express.json());
// To remove data using Data Sanitize:
app.use(ExpressMongoSanitize());
app.use(xss());

// Use Helmet!
app.use(helmet());

// Enable other domains to access myApp
app.use(cors({ path: "*" }));
app.options("*", cors());

// Compress all response
app.use(compression());

// Mongoose DB
database();

// Routes
routesMount(app);

// Error Handles
app.all("*", (req, res, next) => {
    const err = new Error(`Can't find ${req.originalUrl}`);
    next(new ApiError(err), 400);
});
app.use((err, req, res, next) => {
    res.status(400).json(
        process.env.NODE_ENV === "development"
            ? {
                status: err.status || "error",
                message: err.message,
                stack: err.stack,
            }
            : {
                status: err.status || "error",
                message: err.message,
            }
    );
});

app.listen(8000, () => {
    console.log("Working....");
});

process.on("unhandledRejection", (err) => {
    console.log(`Rejection Error: ${err}`);
});
