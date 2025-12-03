import { userTypeDefs } from "./TypeDefs/userTypeDefs.js";
import { meeetingTypeDefs } from "./TypeDefs/meetingTypeDefs.js";
import { gcalTypeDefs } from "./TypeDefs/gcalTypeDefs.js";
import { jobTypeDefs } from "./TypeDefs/jobTypeDefs.js";
import { matchEngineTypeDefs } from "./TypeDefs/matchEngineTypeDefs.js";

import resolvers from "./resolvers/index.js";

const typeDefs = [
  userTypeDefs,
  jobTypeDefs,
  meeetingTypeDefs,
  gcalTypeDefs,
  matchEngineTypeDefs,
];

export { typeDefs, resolvers };
