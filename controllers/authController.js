const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

const signToken = id => {
	return jwt.sign({ id }, process.env.JWT_KEY, {
		expiresIn: process.env.JWT_EXPIRES_IN
	});
};

const createSendToken = (user, statusCode, res) => {
	const token = signToken(user._id);
	const cookieOptions = {
		expires: new Date(
			Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
		),
		httpOnly: true
	};
	if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

	res.cookie('jwt', token, cookieOptions);

	// Remove password from output
	user.password = undefined;

	res.status(statusCode).json({
		status: 'success',
		token,
		data: {
			user
		}
	});
};

exports.signup = catchAsync(async (req, res, next) => {
	const { name, email, password, passwordConfirm } = req.body;
	const newUser = await User.create({ name, email, password, passwordConfirm });
	res.status(201).send('User created successful');
	createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
	const { email, password } = req.body;

	// Check if email and password exist
	if (!email || !password) {
		return next(new AppError('Please provide email and password!', 400));
	}
	// Check if user exists && password is correct
	const user = await User.findOne({ email }).select('+password');

	if (!user || !(await user.correctPassword(password, user.password))) {
		return next(new AppError('Incorrect email or password', 401));
	}
	if (user.status === 'blocked') {
		return next(
			new AppError('User is blocked. Ask for permission and try again later.', 403)
		);
	}
	// If everything ok, send token to client
	await User.updateOne({ email: user.email }, { $set: { lastLogIn: Date.now() } });
	createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
	// Getting token and check of it's there
	let token;
	if (
		req.headers.authorization &&
		req.headers.authorization.startsWith('Bearer')
	) {
		token = req.headers.authorization.split(' ')[1];
	}

	if (!token) {
		return next(
			new AppError('You are not logged in! Please log in to get access.', 401)
		);
	}
	// Verification token
	const decoded = await promisify(jwt.verify)(token, process.env.JWT_KEY);

	// Check if user still exists
	const currentUser = await User.findById(decoded.id);
	if (!currentUser) {
		return next(
			new AppError(
				'The user belonging to this token does no longer exist.',
				401
			)
		);
	}
	// Check if user status still active
	if (currentUser.status === 'blocked') {
		return next(
			new AppError('User is blocked. Ask for permission and try again later.', 403)
		);
	}
	req.user = currentUser;
	next();
});