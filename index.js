const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const jwt = require("jsonwebtoken");
const bycript = require("bcryptjs");
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

		// User Login Section
		

		// User Registration Section

		app.post("/registration", async (req, res) => {
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
				res.send({message:"User already registered", status:409});
			} else {
				const result = await userCollection.insertOne(credentials);
				res.send(result);
			}
		});


	} finally {
	}
}
run().catch(console.dir);

app.listen(port, () => {
	console.log(`Payapp_server running on  http://localhost:${port}`);
});
