const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });

const connectBD = async () => {
	try {
		const mongoURL = process.env.DATABASE_URL.replace('<PASSWORD>', process.env.DATABASE_PASSWORD)
		await mongoose.connect(mongoURL);
		console.log('Database connection successful');
	} catch (err) {
		console.error('Database connection error:', err);
		process.exit(1);
	}
}

module.exports = connectBD;