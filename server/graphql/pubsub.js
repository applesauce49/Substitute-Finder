// import { PubSub } from 'graphql-subscriptions';
import pkg from 'graphql-subscriptions';
const { PubSub } = pkg;

export const pubsub = new PubSub();

console.log('PubSub constructor name:', PubSub.name);
console.log('asyncIterableIterator type:', typeof pubsub.asyncIterableIterator);