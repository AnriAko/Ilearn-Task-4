const express = require('express');
const bodyParser = require('body-parser');
const connectBD = require('./database');
const userRoutes = require('./routes/userRoutes');
const dotenv = require('dotenv');
const mongoSanitize = require('express-mongo-sanitize');

dotenv.config({ path: "./config.env" });

const app = express();

app.use(express.urlencoded({ extended: true }));

app.use(bodyParser.json());
app.use(userRoutes);
//for 
app.use(mongoSanitize());
app.use(express.static(`${__dirname}/public`));

const PORT = process.env.PORT || 3000;


app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
connectBD();