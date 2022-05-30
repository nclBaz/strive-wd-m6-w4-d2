import express from "express"
import listEndpoints from "express-list-endpoints"
import mongoose from "mongoose"
import createError from "http-errors"
import cors from "cors"
import passport from "passport"
import usersRouter from "./services/users/index.js"
import booksRouter from "./services/books/index.js"
import authorsRouter from "./services/authors/index.js"
import filesRouter from "./services/files/index.js"
import { badRequestHandler, unauthorizedHandler, forbiddenHandler, notFoundHandler, genericErrorHandler } from "./errorsHandlers.js"
import googleStrategy from "./lib/auth/googleOAuth.js"

const server = express()

const port = process.env.PORT || 3001

passport.use("google", googleStrategy)

// *************************** MIDDLEWARES **************************************************

const loggerMiddleware = (req, res, next) => {
  console.log(`Incoming request --> ${req.method} -- ${new Date()}`)
  // req.name = "Renan"
  next()
}

const policeOfficerMiddleware = (req, res, next) => {
  console.log("Current user name: ", req.name)
  if (req.name === "Renan") {
    next()
  } else {
    next(createError(401, "Only Renans allowed!"))
  }
}
// ** GLOBAL LEVEL MIDDLEWARES **

// *********************************** CORS ********************************

// CROSS-ORIGIN RESOURCE SHARING

/*
EXAMPLES OF DIFFERENT ORIGINS:

1. FE=http://localhost:3000 & BE=http://localhost:3001 <-- 2 different port numbers, they represent different origins
2. FE=https://mywonderfulfe.com & BE=https://mywonderfulbe.com <-- 2 different domains, they represent different origins
3. FE=https://domain.com & BE=http://domain.com <-- 2 different protocols, they represent different origins

*/

const whitelist = [process.env.FE_DEV_URL, process.env.FE_PROD_URL]

server.use(
  cors({
    origin: (origin, next) => {
      // YOU NEED THIS TO CONNECT YOUR FE TO THIS BE
      console.log("CURRENT ORIGIN: ", origin)

      if (whitelist.indexOf(origin) !== -1) {
        // if origin is in the whitelist --> next
        next(null, true)
      } else {
        // if origin is NOT in the whitelist --> trigger an error
        next(createError(400, `CORS ERROR! Your origin: ${origin} is not in the whitelist!`))
      }
    },
  })
)
// *************************************************************************

server.use(loggerMiddleware)
// server.use(policeOfficerMiddleware)
server.use(express.json()) // if you don't add this line BEFORE the endpoints, all requests' bodies will be UNDEFINED
server.use(passport.initialize())

// ************************ ENDPOINTS *******************

server.use("/users", usersRouter) // in this case loggerMiddleware is used as a ROUTER LEVEL MIDDLEWARE
server.use("/books", booksRouter)
server.use("/authors", authorsRouter)
server.use("/files", filesRouter)

// *********************** ERROR HANDLERS ********************************
server.use(badRequestHandler)
server.use(unauthorizedHandler)
server.use(forbiddenHandler)
server.use(notFoundHandler)
server.use(genericErrorHandler)

// ********************** DATABASE CONNECTION ************************

mongoose.connect(process.env.MONGO_CONNECTION_URL)

mongoose.connection.on("connected", () => {
  console.log(`Connected to MongoDB!`)
  server.listen(port, () => {
    console.table(listEndpoints(server))
    console.log(`Server is running on port ${port}`)
  })
})
