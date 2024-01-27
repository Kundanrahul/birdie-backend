require('dotenv').config();
const express = require('express')
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express()
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.f4pkjwp.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


async function run() {
  try {
      await client.connect();
      const postCollection = client.db("database").collection("posts"); // this collection is for team-ekt
      const userCollection = client.db("database").collection("users"); // this collection is for team-srv

      
      app.get('/loggedInUser', async (req, res) => {
          const email = req.query.email;
          const user = await userCollection.find({ email: email }).toArray();
          res.send(user);
      })

    app.get('/post', async (req, res) => {
        const post = (await postCollection.find().toArray()).reverse();
        res.send(post);
    })
    // get
      app.get('/user', async (req, res) => {
          const user = await userCollection.find().toArray();
          res.send(user);
      })

    app.post('/post', async (req, res) => {
      const post = req.body;
      const result = await postCollection.insertOne(post);
      res.send(result);
  })
  // post
      app.post('/register', async (req, res) => {
          const user = req.body;
          const result = await userCollection.insertOne(user);
          res.send(result);
    })
      app.get('/userPost', async (req, res) => {
          const email = req.query.email;
          const post = (await postCollection.find({ email: email }).toArray()).reverse();
          res.send(post);
      })
      // patch
      // patch
      app.patch('/userUpdates/:email', async (req, res) => {
        const filter = req.params;
        const profile = req.body;
        const options = { upsert: true };
        const updateDoc = { $set: profile };
        const result = await userCollection.updateOne(filter, updateDoc, options);
        res.send(result)
    })
  
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

    app.post('/create-payment-intent', async (req, res) => {
      try {
        const { payment_method, plan ,email} = req.body;
        let amount = 0;
    
        if (plan === 'Silver') {
          amount = 100;
        } else if (plan === 'Gold') {
          amount = 1000;
        } else {
          amount = 799;
        }
    
        const paymentIntent = await stripe.paymentIntents.create({
          payment_method: payment_method,
          amount: amount,
          currency: 'inr',
        });
        await postCollection.updateOne(
          { email: email },
          { $set: { subscribe: plan } }
        );
    
        res.json({
          clientSecret: paymentIntent.client_secret,
          amount: amount,
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });

  } catch (error) {
      console.log(error);
  }
} run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Hello from Birdie!')
})

app.listen(port, () => {
  console.log(`Birdie is listening on port ${port}`)
})
