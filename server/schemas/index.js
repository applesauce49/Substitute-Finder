import { userTypeDefs } from "./TypeDefs/userTypeDefs.js";
import { meeetingTypeDefs } from "./TypeDefs/meetingTypeDefs.js";
import { gcalTypeDefs } from "./TypeDefs/gcalTypeDefs.js";
import { jobTypeDefs } from "./TypeDefs/jobTypeDefs.js";
import { matchEngineTypeDefs } from "./TypeDefs/matchEngineTypeDefs.js";
import { systemSettingsTypeDefs } from "./TypeDefs/systemSettingsTypeDefs.js";
import meetingResolvers from "./resolvers/meetingResolvers.js";

import resolvers from "./resolvers/index.js";

const typeDefs = [
  userTypeDefs,
  jobTypeDefs,
  meeetingTypeDefs,
  gcalTypeDefs,
  matchEngineTypeDefs,
  systemSettingsTypeDefs,
];

export { typeDefs, resolvers };
