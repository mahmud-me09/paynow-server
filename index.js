const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require("mongodb");

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
	res.send("Hello World.");
});

const uri = `mongodb+srv://${process.env.MONGODB_ID}:${process.env.MONGODB_PASS}@cluster0.jzshikh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
	serverApi: {
		version: ServerApiVersion.v1,
		strict: true,
		deprecationErrors: true,
	},
});
const userCollection = client.db("PayNowDB").collection("users");

async function run() {
	try {
		// Connect the client to the server	(optional starting in v4.7)
		await client.connect();
		// Send a ping to confirm a successful connection
		await client.db("admin").command({ ping: 1 });
		console.log(
			"Pinged your deployment. You successfully connected to MongoDB!"
		);

		// jwt related

		app.post("/jwt", async (req, res) => {
			const user = req.body;
			const token = jwt.sign(user, process.env.Secret, {
				expiresIn: "7d",
			});
		});

		const verifyToken = (req, res, next) => {
			if (!req.headers.authorization) {
				return res.status(401).send({ message: "unauthorized access" });
			}
			const token = req.headers.authorization.split(" ")[1];
			jwt.verify(token, process.env.Secret, (err, decoded) => {
				if (err) {
					return res
						.status(401)
						.send({ message: "unauthorized access" });
				}
				req.decoded = decoded;
				next();
			});
		};

		// use verify admin after verifyToken
		const verifyAdmin = async (req, res, next) => {
			const email = req.decoded.email; //need to fix
			const query = { email: email }; //need to fix
			const user = await userCollection.findOne(query);
			const isAdmin = user?.role === "admin";
			if (!isAdmin) {
				return res.status(403).send({ message: "forbidden access" });
			}
			next();
		};

		// User Login Section

		app.post("/login", async (req, res) => {
			try {
				const credentials = req.body;
				const user = await userCollection.findOne({
					$or: [
						{ email: credentials.id },
						{ number: credentials.id },
					],
				});

				if (!user) {
					res.send({
						message: "email or number is not Found",
						status: 401,
					});
				}
				const isPinMatch = await bcrypt.compare(req.body.pin, user.pin);
				console.log(isPinMatch);

				if (!isPinMatch) {
					res.send({
						message: "Wrong Credentials",
						status: 401,
					});
				}

				res.send({
					message: "User Login Granted",
					status: 200,
				});
			} catch (error) {
				console.log(error);
				res.send({ message: "error happened", status: 401 });
			}
		});
		// User Registration Section

		app.post("/registration", async (req, res) => {
			try {
				const credentials = {
					name: req.body.name,
					email: req.body.email,
					number: req.body.number,
					pin: req.body.pin,
					isAgent: false,
					isAdmin: false,
					balance: 0,
					transactionHistory: [],
				};
				const existingUser = await userCollection.findOne({
					$or: [
						{ email: credentials.email },
						{ number: credentials.number },
					],
				});
				if (existingUser) {
					res.send({
						message: "User already registered",
						status: 409,
					});
				} else {
					// bcrypt for hashing pin
					const saltRounds = 10;
					const hashedPin = await bcrypt.hash(
						credentials.pin,
						saltRounds
					);

					credentials.pin = hashedPin;

					const result = await userCollection.insertOne(credentials);
					res.send(result);
				}
			} catch {
				res.send({ message: "error happened", status: 403 });
			}
		});
	} finally {
	}
}
run().catch(console.dir);

app.listen(port, () => {
	console.log(`Payapp_server running on  http://localhost:${port}`);
});
