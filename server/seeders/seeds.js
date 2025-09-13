// const faker from 'faker');
import userSeeds from './userSeed.json';
import jobSeeds from './jobSeed.json';
import db from '../config/connection.js';
import { Job, User } from '../models.js';

db.once('open', async () => {
  try {
    await Job.deleteMany({});
    await User.deleteMany({});

    await User.create(userSeeds);

    for (let i = 0; i < jobSeeds.length; i++) {
      const { _id, jobAuthor } = await Job.create(jobSeeds[i]);
      const user = await User.findOneAndUpdate(
        { username: jobAuthor },
        {
          $addToSet: {
            jobs: _id,
          },
        }
      );
    }
  } catch (err) {
    console.error(err);
    process.exit(1);
  }

  console.log('all done!');
  process.exit(0);
});