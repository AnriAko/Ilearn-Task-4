const User = require('./../models/User');
const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');

//get all users
exports.getAllUsers = catchAsync(async (req, res) => {
	const users = await User.find().select('-password');
	res.status(200).json({
		status: 'success',
		results: users.length,
		data: {
			users
		}
	});
});

// User block function
const blockOneUser = async (email) => {
	try {
		const user = await User.findOneAndUpdate({ email: email }, { status: 'blocked' }, { new: true });
		if (user) {
			return { success: true, email: email, status: 'blocked' };
		} else {
			return { success: false, email: email, error: 'User not found' };
		}
	} catch (error) {
		next(error);
		return null;
	}
};

// User unblock function
const unblockOneUser = async (email) => {
	try {
		const user = await User.findOneAndUpdate({ email: email }, { status: 'active' }, { new: true });
		if (user) {
			return { success: true, email: email, status: 'active' };
		} else {
			return { success: false, email: email, error: 'User not found' };
		}
	} catch (error) {
		next(error);
		return null;
	}
};

// User delete function
const deleteOneUser = async (email, next) => {
	try {
		const user = await User.findOneAndDelete({ email: email });
		if (!user) {
			return { success: false, email: email, error: 'User not found' };
		}
		return { success: true, email: email, message: 'User deleted successfully' };
	} catch (error) {
		next(error);
		return null;
	}
};

exports.editUsers = catchAsync(async (req, res, next) => {
	if (!req.body.selectedUsers || !Array.isArray(req.body.selectedUsers) || req.body.selectedUsers.length === 0) {
		return next(new AppError('Empty user list', 400));
	}

	let action;
	switch (req.body.actionOnUsers) {
		case 'block':
			action = blockOneUser;
			break;
		case 'unblock':
			action = unblockOneUser;
			break;
		default:
			return next(new AppError('Unknown action', 400));
	}

	const results = await Promise.all(req.body.selectedUsers.map(email => action(email)));

	const successfulOperations = results.filter(result => result.success);
	const failedOperations = results.filter(result => !result.success);

	res.status(200).json({
		status: 'success',
		data: {
			successfulOperations,
			failedOperations
		}
	});
});

// UserS delete function
exports.deleteUsers = catchAsync(async (req, res, next) => {
	if (!req.body.selectedUsers || !Array.isArray(req.body.selectedUsers) || req.body.selectedUsers.length === 0) {
		return next(new AppError('Empty user list', 400));
	}

	const results = await Promise.all(req.body.selectedUsers.map(email => deleteOneUser(email, next)));

	const successfulOperations = results.filter(result => result.success);
	const failedOperations = results.filter(result => !result.success);

	res.status(200).json({
		status: 'success',
		data: {
			successfulOperations,
			failedOperations
		}
	});

});

