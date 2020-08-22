const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
  try {
    let { username, email, password, passwordCheck } = req.body;

    //===========================Validation===========================

    if (!username || !email || !password || !passwordCheck)
      return res
        .status(400)
        .json({ message: 'Not all fields have been entered.' });

    const existingEmail = await User.findOne({ email: email });
    if (existingEmail)
      return res
        .status(400)
        .json({ message: 'An account with this email already exists.' });

    const existingUsername = await User.findOne({ username: username });
    if (existingUsername)
      return res
        .status(400)
        .json({ message: 'This username is not available.' });

    if (password.length < 6)
      return res
        .status(400)
        .json({ message: 'The password needs to be atleast 6 characters.' });
    if (password !== passwordCheck)
      return res
        .status(400)
        .json({ message: 'Please enter the same password twice' });

    //========================SAVING-USER=======================================

    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = new User({
      username,
      email,
      password: passwordHash
    });
    const savedUser = await newUser.save();
    res.status(200).json(savedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;

    if (!emailOrUsername || !password)
      return res
        .status(400)
        .json({ message: 'Not all fields have been entered.' });

    //Checking for registered email or username and assigning it to "user"
    let user;
    const usernameCheck = await User.findOne({ username: emailOrUsername });

    if (usernameCheck) {
      user = usernameCheck;
    } else {
      const emailCheck = await User.findOne({ email: emailOrUsername });
      if (emailCheck) {
        user = emailCheck;
      } else {
        return res.status(400).json({
          message: 'No account with this email or username is registered.'
        });
      }
    }

    //Checking password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: 'Invalid Credentials' });

    //Assigning Json Web Token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    res.status(200).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.register = register;
exports.login = login;
