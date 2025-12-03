import Meeting from '../../models/Meeting.js';

export default {
    Query: { 
        meetings: async () => {
            return Meeting.find({})
                .populate('owner')
                // .populate('roles.primary')
                // .populate('roles.secondary')
                .sort({ createdAt: -1 });
        }
    }
};