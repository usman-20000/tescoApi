require('./conn');
const express = require('express');
const mongoose = require('mongoose');
const Register = require('../components/register');
const app = express();
const http = require('http');
const server = http.createServer(app);
const bcrypt = require('bcryptjs');
const cors = require('cors');
const Add = require('./add');
const Bill = require('./bill');
const Notification = require('./Notification');
const listing = require('./listing');
const Chat = require('./chat');

const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(cors());


const generateUniqueId = async () => {
  try {
    const date = new Date();
    const dateString = date.toISOString().slice(2, 10).replace(/-/g, ''); 

    let count = 1; // Start with count 1
    let uniqueId = `${dateString}${count}`; // Initial generated ID

    // Use a loop to check if the generatedId already exists
    while (await Register.findOne({ generatedId: uniqueId })) {
      count++; // Increment the count
      uniqueId = `${dateString}${count}`; // Generate a new ID with the updated count
    }

    return uniqueId;

  } catch (error) {
    console.error("Error generating unique ID:", error);
    throw error;
  }
};


app.post("/register", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    console.log("Received request body:", req.body);

    const { name, email, password, referalCode } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ msg: "Required fields are mandatory" });
    }

    const existingUser = await Register.findOne({ email }).session(session);
    if (existingUser) {
      return res.status(400).json({ msg: "Email already exists" });
    }

    const generatedId = await generateUniqueId();

    // Hash the password securely
    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(password, 10);
    } catch (error) {
      return res.status(500).json({ msg: "Error hashing password" });
    }

    const user = new Register({
      name,
      email,
      password: hashedPassword,
      generatedId: generatedId.toString(),
      referalCode,
    });

    await user.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      id: user._id,
      name: user.name,
      email: user.email,
      generatedId: user.generatedId,
      referalCode: user.referalCode,
    });

    console.log("User registered successfully:", user);
  } catch (e) {
    await session.abortTransaction();
    console.error("Error during registration:", e);
    res.status(500).json({ msg: "Server error. Please try again later." });
  } finally {
    session.endSession(); 
  }
});

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate user input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user by email
    const user = await Register.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Login successful, return user data
    res.json({
      success: true,
      message: 'Login successful',
      data: { id: user._id, name: user.name, email: user.email }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.delete("/login/:id", async (req, res) => {
  try {
    const user = await Register.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).send("Data not found");
    }
    if (!req.params.id) {
      res.status(201).send();
    }
  } catch (e) {
    res.status(400).send(e);
  }
})

app.post('/bill', async (req, res) => {
  try {
    const { email, name, address, house, city, postalCode, phone, status, cart } = req.body;
    const newBill = new Bill({ email, name, address, house, city, postalCode, phone, status, cart });
    await newBill.save();
    res.status(201).json(newBill);
  } catch (error) {
    console.error('Error creating register', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/bill', async (req, res) => {
  try {
    const bill = await Bill.find();
    res.json(bill);
  } catch (error) {
    console.error('Error fetching register', error);
    res.status(500).send('Internal Server Error');
  }
});

app.put('/bill/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updatedBill = await Bill.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );
    if (!updatedBill) {
      return res.status(404).send('Add not found');
    }
    res.status(200).json(updatedBill);
  } catch (error) {
    console.error('Error updating add', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/add', async (req, res) => {
  try {
    const { image, heading, detail, price, category } = req.body;
    const newAdd = new Add({ image, heading, detail, price, category });
    await newAdd.save();
    res.status(201).json(newAdd);
  } catch (error) {
    console.error('Error creating register', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/add/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const add = await Add.findById(id);
    if (!add) {
      return res.status(404).json({ error: 'Add not found' });
    }
    res.json(add);
  } catch (error) {
    console.error('Error fetching add:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/add', async (req, res) => {
  try {
    const add = await Add.find();
    res.json(add);
  } catch (error) {
    console.error('Error fetching register', error);
    res.status(500).send('Internal Server Error');
  }
});

app.put('/add/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { image, heading, detail, price } = req.body;
    const updatedAdd = await Add.findByIdAndUpdate(
      id,
      { image, heading, detail, price },
      { new: true, runValidators: true }
    );
    if (!updatedAdd) {
      return res.status(404).send('Add not found');
    }
    res.status(200).json(updatedAdd);
  } catch (error) {
    console.error('Error updating add', error);
    res.status(500).send('Internal Server Error');
  }
});

app.delete('/add/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedAdd = await Add.findByIdAndDelete(id);
    if (!deletedAdd) {
      return res.status(404).send('Add not found');
    }
    res.status(200).send('Add deleted successfully');
  } catch (error) {
    console.error('Error deleting add', error);
    res.status(500).send('Internal Server Error');
  }
});



app.patch("/register/:id", async (req, res) => {
  try {
    const id = req.params.id;
    let updateData = req.body;

    const updatedUser = await Register.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedUser) {
      return res.status(404).send({ message: "User not found" });
    }

    res.send(updatedUser);
  } catch (e) {
    res.status(400).send({ message: "Error updating user", error: e.message });
  }
});


app.get('/register', async (req, res) => {
  try {
    const register = await Register.find();
    res.json(register);
  } catch (error) {
    console.error('Error fetching register', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/register/:id', async (req, res) => {
  try {

    const id = req.params.id;
    const register = await Register.findById(id);
    res.json(register);
  } catch (error) {
    console.error('Error fetching register', error);
    res.status(500).send('Internal Server Error');
  }
});

app.delete('/register/:id', async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ message: 'ID is required' });
    }
    const deleteUser = await Register.findByIdAndDelete(id);
    if (!deleteUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(deleteUser);
  } catch (error) {
    console.error('Error fetching register', error);
    res.status(500).send('Internal Server Error');
  }
});


app.post('/notifications', async (req, res) => {
  try {
    const notification = new Notification(req.body);
    await notification.save();
    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Error creating notification' });
  }
});

app.patch('/notifications/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const notification = await Notification.findByIdAndUpdate(id, req.body, { new: true });
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Error updating notification' });
  }
});

app.get('/notifications/receiver/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const notifications = await Notification.find({ receiver: id });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notifications' });
  }
});

app.delete('/notifications/:id', async (req, res) => {
  try {
    const id = req.params.id;
    await Notification.findByIdAndRemove(id);
    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting notification' });
  }
});

app.post('/listing', async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await Register.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.status !== "Active") {
      return res.status(403).json({ message: 'User not approved' });
    }

    const account = new listing(req.body);
    await account.save();
    res.status(201).json(account);

  } catch (error) {
    console.error("Error in /listing:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});


app.get('/listing', async (req, res) => {
  try {
    const account = await listing.find();
    res.json(account);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/listing/edit/:id', async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ message: 'ID is required' });
    }

    const account = await listing.findById(id);
    if (!account) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    res.json(account);
  } catch (error) {
    console.error("Error fetching listing:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});


app.get('/listing/:userId', async (req, res) => {
  try {
    const account = await listing.find({ userId: req.params.userId });
    res.json(account);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/singleListing/:id', async (req, res) => {
  try {
    const account = await listing.findById(req.params.id);
    if (!account) {
      return res.status(404).json({ message: "Listing not found" });
    }
    res.json(account);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});




app.patch('/listing/:id', async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) {
      return res.status(400).send("ID is required");
    }
    const account = await listing.findByIdAndUpdate(id, req.body, { new: true });
    if (!account) {
      return res.status(404).send("Data not found");
    }
    res.send(account);
  } catch (e) {
    console.error(e);
    res.status(500).send("Internal Server Error");
  }
});

app.delete('/listing/:id', async (req, res) => {
  try {
    const account = await listing.findByIdAndDelete(req.params.id);
    if (!account) {
      return res.status(404).send("Data not found");
    }
    if (!req.params.id) {
      res.status(201).send();
    }
  } catch (e) {
    res.status(400).send(e);
  }
});


app.post('/chat', async (req, res) => {
  try {
    const { senderId, receiverId, listId, senderName, receiverName, text } = req.body;

    if (!senderId || !receiverId || !senderName || !receiverName || !text) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const newChat = new Chat({
      senderId,
      receiverId,
      listId,
      senderName,
      receiverName,
      text
    });

    await newChat.save();
    res.status(201).json(newChat);

  } catch (error) {
    console.error("Error in Chat:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});



app.post('/singlechat/:receiverId', async (req, res) => {
  try {

    const receiverId = req.params.receiverId;
    const senderId = req.body.senderId;

    const findChat = await Chat.find({
      $or: [
        { senderId: senderId, receiverId: receiverId },
        { senderId: receiverId, receiverId: senderId }
      ]
    })
    res.status(200).json(findChat);

  } catch (error) {
    console.error("Error in Chat:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get('/chatList/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const chatList = await Chat.aggregate([
      {
        $match: {
          $or: [
            { senderId: userId },
            { receiverId: userId }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$senderId", userId] },
              "$receiverId",
              "$senderId"
            ]
          },
          latestChat: { $first: "$$ROOT" }
        }
      },
      {
        $replaceRoot: { newRoot: "$latestChat" }
      },
      {
        $sort: { createdAt: -1 }
      }
    ]);

    res.status(200).json(chatList);
  } catch (error) {
    console.error("Error in getting Chat:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.delete('/chat/:id', async (req, res) => {
  try {
    const account = await Chat.findById(req.params.id);
    if (!account) {
      return res.status(404).send("Chat not found");
    }
    if (!req.params.id) {
      res.status(201).send();
    }
  } catch (e) {
    res.status(400).send(e);
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
