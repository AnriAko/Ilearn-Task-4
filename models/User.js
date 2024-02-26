const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
	name: {
		type: String,
		required: [true, 'Please fill field with your name'],
		trim: true,
	},
	email: {
		type: String,
		required: [true, 'Please fill email field with your email'],
		unique: [true, 'This email is used already, please choose different one or log in'],
		lowercase: true,
		validate: [validator.isEmail, 'Please provide valid email'],
	},
	password: {
		type: String,
		required: [true, 'Please fill password field with your password'],
		minlength: 1,
		select: false
	},
	passwordConfirm: {
		type: String,
		required: [true, 'Please confirm your password'],
		validate: {
			validator: function (el) {
				return el === this.password;
			},
			message: 'Passwords are not the same!'
		}
	},
	lastLogIn: {
		type: Date,
		default: Date.now
	},
	registrationDate: {
		type: Date,
		default: Date.now,
	},
	status: {
		type: String,
		enum: ['active', 'blocked'],
		default: 'active'
	}
});

userSchema.pre('save', async function (next) {
	// Only run this function if password was actually modified
	if (!this.isModified('password')) return next();

	// Hash the password with cost of 12
	this.password = await bcrypt.hash(this.password, 12);

	// Delete passwordConfirm field
	this.passwordConfirm = undefined;
	next();
});

userSchema.methods.correctPassword = async function (
	candidatePassword,
	userPassword
) {
	return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.correctStatus = async function (
	candidateStatus,
	userStatus
) {
	return candidateStatus === userStatus;
}
module.exports = mongoose.model('User', userSchema);