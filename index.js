const express = require('express')
const app = express()
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId
require('dotenv').config()
const port = process.env.PORT || 5000;
const cors = require('cors')

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.avgpb.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
console.log(uri)
async function run() {
    try {
        await client.connect();
        const database = client.db("scic-travel-booking");
        const serviceCollection = database.collection("serviceDetail")
        const usersCollection = database.collection("users");
        const addOrderCollection = database.collection("addOrder");
        // const user = { name: 'mahiya mahi', email: 'mahi@gmail.com', descriptio: 'lorem20' }
        // serviceCollection.insertOne(user)

        //Get API
        app.get('/services', async (req, res) => {
            console.log(req.query)
            const cursor = serviceCollection.find({});
            const page = req.query.page;
            const size = parseInt(req.query.size);
            let users;
            const count = await cursor.count();
            if (page) {
                users = await cursor.skip(page * size).limit(size).toArray();
            }
            else {
                users = await cursor.toArray();
            }


            res.send({
                count,
                users
            });
        })

        // update post status
        app.put('/services/:id', async (req, res) => {
            const id = req.params.id;
            const updatedUser = req.body;
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    status: 'Activate'
                },

            }
            const result = await serviceCollection.updateOne(filter, updateDoc, options)
            console.log('updating user', req)
            res.json(result)
        })

        //Add Blogs
        app.post('/services', async (req, res) => {
            const newServices = req.body;
            const result = await serviceCollection.insertOne(newServices)
            res.send(result)
        })

        // Showing single detail order
        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const user = await serviceCollection.findOne(query)
            console.log('load user id', id);
            res.send(user);
        })
        //Add selected user in database
        app.post('/addOrders', async (req, res) => {
            //REQ.BODY WE GOT FROM CLIENT SIDE
            const addOrder = req.body;
            //DATABASE PUSH 
            const result = await addOrderCollection.insertOne(addOrder)

            console.log('Got new user', req.body)
            console.log('added user', result)
            res.send(result)
        });

        //GET ALL ADD ORDER FROM DATABASE AND SHOWED IN MANAGE ALL ORDER
        app.get('/addOrders', async (req, res) => {
            const cursor = addOrderCollection.find({});
            const users = await cursor.toArray();
            res.send(users)
        })
        //DELETE API FROM ADD ORDERS
        app.delete('/addOrders/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await addOrderCollection.deleteOne(query)
            console.log('deleting user with id', result);
            res.json(result)
        })
        //DELETE API FROM Manage ALL CARS//DELETE SERVICE
        app.delete('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await serviceCollection.deleteOne(query)
            console.log('deleting user with id', result);
            res.json(result)
        })
        //firebase register data in put into database
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user)
            console.log(result)
            res.json(result)
        });
        //upsert/update existing data or add new data in mongo database//Review section
        // update order rating
        app.put('/addOrders', async (req, res) => {
            const data = req.body;
            console.log(data)
            const searchingId = data.selectedId;
            console.log(searchingId)
            const filter = { _id: ObjectId(searchingId) };
            const options = { upsert: true };

            // update
            const updateRating = { $set: data }
            const result = await addOrderCollection.updateOne(filter, updateRating, options);
            console.log(result)
            res.json(result);
        })

        // update order status
        app.put('/addOrders/:id', async (req, res) => {
            const id = req.params.id;
            const updatedUser = req.body;
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    status: 'approved'
                },

            }
            const result = await addOrderCollection.updateOne(filter, updateDoc, options)
            console.log('updating user', req)
            res.json(result)
        })


        //MAKE ADMIN
        app.put('/users/admin', async (req, res) => {
            const user = req.body;
            ////////////////////JWT///////////////////////////
            // const requester = req.decodedEmail;
            // if (requester) {
            //     const requesterAccount = usersCollection.findOne({ email: requester });
            //     if (requesterAccount.role == 'admin') {
            ////////////////////////////////////////////////
            const filter = { email: user.email };
            const updateDoc = { $set: { role: 'admin' } };
            const result = await usersCollection.updateOne(filter, updateDoc);
            res.json(result)
        }
            // }
            //     else {
            //         res.status(403).json({ message: 'you do not have access to make admin' })
            //     }


            // }
        )
        //finding admin role/Check admin
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            console.log('email ::::', email)
            const query = { email: email };
            console.log('query:::', query)
            const user = await usersCollection.findOne(query)
            console.log('user', user)
            let isAdmin = false;
            if (user?.role === 'admin') {
                isAdmin = true;
            }
            res.json({ admin: isAdmin });
        })
    }
    finally {

    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})