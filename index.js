import "dotenv/config";
import express from "express";
import { ObjectId } from "mongodb";
import { initClient } from "./db/mongo.js";
import { registerMiddleware } from "./middleware/index.js";

// create an Express app
const app = express();

// set the port for the server to listen on
const port = 3002;

// register middleware
registerMiddleware(app);


// initialize MongoDB client and database
const client = await initClient();


const db = client.db("EindTaak");

// define a route to handle gebruiker login
app.post("/auth", async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  // check if gebruiker exists in the database
  let gebruiker = await db.collection("gebruikers").findOne({ email, password });

  // if not, add gebruiker to the database
  if (!gebruiker) {
    await db.collection("gebruikers").insertOne({ email, password });
    gebruiker = await db.collection("gebruikers").findOne({ email, password });
  }

  // send back the gebruiker object
  res.json(gebruiker);

});


app.post("/auth", async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  // check if gebruiker exists in the database
  const bestaandeGebruiker = await db.collection("gebruikers").findOne({ email, password });

  if (bestaandeGebruiker) {
    // If the user already exists, return an error or redirect to an appropriate page
    res.status(400).json({ error: "Gebruiker bestaat al" });
  } else {
    // Add the new user to the database
    await db.collection("gebruikers").insertOne({ email, password });

  }
  
});


const authRouter = express.Router();

// middleware for authentication
authRouter.use(async (req, res, next) => {
  // check if authorization header exists
  if (req.headers.authorization) {
    // check if user with id exists
    const user = await db
      .collection("gebruikers")
      .findOne({ _id: ObjectId(req.headers.authorization) });
    // if user exists, pass user object to the request object
    if (user) {
      req.user = user;
      return next();
    }
  }
  // if user not authenticated, send back 401 error
  res.status(401).json({
    error: "Unauthorized",
  });
});


// define a route to get all students
app.get("/panden", async (req, res) => {
  // console.log(req.gebruiker);
  const panden = await db.collection("panden").find().toArray();
  res.json(panden);
});

// define a route to get a pand by id (modified to use authRouter instead of allowedRoutes)
app.get("/panden/:id", async (req, res) => {
  const id = req.params.id;
  const pand = await db.collection("panden").findOne({
    _id: ObjectId(id),
  });

  // if pand exists, send back pand object
  if (pand) {
    res.json(pand);
  } else {
    // if pand not found, send back 404 error
    res.status(404).json({ error: "Not found" });
  }
});

// define a route to add a new student
authRouter.post("/gebruikers", async (req, res) => {
  const gebruiker = {
    image:
      "https://picsum.photos/200/300",
    ...req.body,
  };

  await db.collection("gebruikers").insertOne(gebruiker);

  // return added student
  res.json(gebruiker);
});

app.get("/berichten", async (req, res) => {
  // console.log(req.gebruiker);
  const berichten = await db.collection("berichten").find().toArray();
  res.json(berichten);
});

// define a route to get a student by id
app.get("/berichten/:id", async (req, res) => {
  const id = req.params.id;
  const bericht = await db.collection("berichten").findOne({
    _id: ObjectId(id),
  });

  // if pand exists, send back pand object
  if (bericht) {
    res.json(bericht);
  } else {
    // if pand not found, send back 404 error
    res.status(404).json({ error: "Not found" });
  }
});

// Route for adding a new bericht
app.post("/berichten", async (req, res) => {
  const berichtData = req.body;
  // Add the berichtData to the "berichten" collection in the MongoDB database
  await db.collection("berichten").insertOne(berichtData);
  res.json(berichtData);
});


// define a route to update a student by id
authRouter.patch("/gebruikers/:id", async (req, res) => {
  const id = req.params.id;

  // check if student exists
  const gebruiker = await db
    .collection("gebruikers")
    .findOne({ _id: ObjectId(id) });

  // if gebruiker exists, update gebruiker data
  if (gebruiker) {
    const { _id, ...data } = req.body;
    const newData = { ...gebruiker, ...data };
    await db.collection("gebruikers").replaceOne({ _id: ObjectId(id) }, newData);

    res.json(newData);
  } else {
    res.status(404).json({ error: "Not found" });
  }
});


app.get("/ImmoKantoren", async (req, res) => {
  // console.log(req.gebruiker);
  const ImmoKantoren = await db.collection("ImmoKantoren").find().toArray();
  res.json(ImmoKantoren);
});

// // define a route to get a student by id
// app.get("/ImmoKantoren/:id", async (req, res) => {
//   const id = req.params.id;
//   const ImmoKantoor = await db.collection("ImmoKantoren").findOne({
//     _id: ObjectId(id),
//   });

//   // if pand exists, send back pand object
//   if (ImmoKantoor) {
//     res.json(ImmoKantoor);
//   } else {
//     // if pand not found, send back 404 error
//     res.status(404).json({ error: "Not found" });
//   }
// });


app.use(async (req, res, next) => {
  if (req.headers.authorization) {
    // check if gebruiker with id exists
    const gebruiker = await db
      .collection("gebruikers")
      .findOne({ _id: ObjectId(req.headers.authorization) });
    // exists? pass gebruiker to request
    console.log('EindTaak')
    if (gebruiker) {
      req.gebruiker = gebruiker;
      return next();
    }
  }
  res.status(401).json({
    error: "Unauthorized",
  });
}, authRouter);

app.listen(port, () => {
  console.log(`App listening http://localhost:${port}`);
});

// make sure database is closed when server crashes
const closeServer = () => {
  // default
  process.exit();
};

process.on("SIGINT", () => closeServer());
process.on("SIGTERM", () => closeServer());
//https://www.geeksforgeeks.org/node-js-process-signal-events/