import jwt from 'jsonwebtoken';

const secret = process.env.JWT_SECRET || 'supersecretkey';
const expiration = '2h';

export function signToken({ username, email, _id }) {
  const payload = { username, email, _id };

  return jwt.sign({ data: payload }, secret, { expiresIn: expiration });
}
