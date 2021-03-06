import * as Yup from 'yup';
import User from '../models/User';

class UserController {
  async store(req, res) {
    const schema = Yup.object().shape({
      user_name: Yup.string().required(),
      user_firstname: Yup.string().required(),
      user_lastname: Yup.string().required(),
      user_gender: Yup.string().required(),
      email: Yup.string()
        .email()
        .required(),
      password: Yup.string()
        .required()
        .min(6),
      confirmPassword: Yup.string()
        .required()
        .when('password', (password, field) =>
          password ? field.required().oneOf([Yup.ref('password')]) : field
        ),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'sign up failed.' });
    }

    const {
      user_gender,
      user_name,
      user_lastname,
      user_firstname,
      email,
      password,
    } = req.body;

    const userExists = await User.getUserByEmail(email);

    if (userExists.rowCount === 1) {
      return res.status(400).json({ error: 'User already exists.' });
    }

    const user_password = await User.hashPassword(password);

    const { rows } = await User.create(
      user_name,
      user_gender,
      user_lastname,
      user_firstname,
      email,
      user_password
    );

    const { id, admin } = rows[0];

    return res.json({
      id,
      user_name,
      email,
      user_gender,
      admin,
    });
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      user_name: Yup.string(),
      user_firstname: Yup.string(),
      user_lastname: Yup.string(),
      admin: Yup.boolean(),
      email: Yup.string().email(),
      oldPassword: Yup.string(),
      password: Yup.string()
        .min(6)
        .when('oldPassword', (oldPassword, field) =>
          oldPassword ? field.required() : field
        ),
      confirmPassword: Yup.string().when('password', (password, field) =>
        password ? field.required().oneOf([Yup.ref('password')]) : field
      ),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { email: oldEmail, oldPassword } = req.body;

    const { rows } = await User.getUserById(req.userId);

    const user = rows[0];

    if (oldEmail && oldEmail !== user.email) {
      const userExists = await User.getUserByEmail(oldEmail);

      if (userExists.rowCount === 1) {
        return res.status(400).json({ error: 'User already exists.' });
      }
    }

    if (
      oldPassword &&
      !(await User.checkPassword(oldPassword, user.user_password))
    ) {
      return res.status(401).json({ error: 'Passwords do not match.' });
    }

    const userUpdated = await User.update(req.userId, req.body);

    const {
      id,
      user_firstname,
      user_name,
      user_lastname,
      email,
      admin,
    } = userUpdated.rows[0];

    return res.json({
      id,
      user_firstname,
      user_name,
      user_lastname,
      email,
      admin,
    });
  }

  async emailVerified(req, res) {
    const schema = Yup.object().shape({
      user_email_verified: Yup.boolean(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation failed' });
    }

    const userUpdated = await User.update(req.userId, req.body);

    const {
      id,
      user_firstname,
      user_name,
      user_lastname,
      user_email_verified,
      email,
      admin,
    } = userUpdated.rows[0];

    return res.json({
      id,
      user_firstname,
      user_name,
      user_email_verified,
      user_lastname,
      email,
      admin,
    });
  }

  async adminVerified(req, res) {
    const schema = Yup.object().shape({
      admin: Yup.boolean(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation failed' });
    }

    const userUpdated = await User.update(req.userId, req.body);

    const {
      id,
      user_firstname,
      user_name,
      user_lastname,
      user_email_verified,
      email,
      admin,
    } = userUpdated.rows[0];

    return res.json({
      id,
      user_firstname,
      user_name,
      user_email_verified,
      user_lastname,
      email,
      admin,
    });
  }

  // index
  async index(req, res) {
    const { rows } = await User.getUsers();
    return res.json(rows);
  }
}

export default new UserController();
