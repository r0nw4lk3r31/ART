const express = require('express');
const app = express();
const port = 3001;

app.use(express.json());

// Routes for user registration, login, profile management, post creation, and discussion threads
// Example route:
app.get('/', (req, res) => {
  res.send('Hello from the Forum Server!');
});

app.listen(port, () => {
  console.log(`Forum server running on port ${port}`);
});