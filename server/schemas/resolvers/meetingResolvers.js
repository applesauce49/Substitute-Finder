import Meeting from '../../models/Meeting.js';
import ConstraintGroup from '../../matchEngine/Schemas/ConstraintGroup.js';

export default {
    Query: {
        meetings: async () => {
            return Meeting.find({})
                .populate('owner')
                .sort({ createdAt: -1 });
        }
    },

    Mutation: {
        createMeeting: async (_, { input }) => {
            const constraintGroupIds = Array.isArray(input.constraintGroupIds)
                ? input.constraintGroupIds
                : [];

            const meeting = new Meeting({
                ...input,
                constraintGroupIds,
            });

            return meeting.save();
        },

        updateMeeting: async (_, { id, input }) => {
            const constraintGroupIds = Array.isArray(input.constraintGroupIds)
                ? input.constraintGroupIds
                : [];

            return Meeting.findByIdAndUpdate(
                id,
                {
                    $set: {
                        ...input,
                        constraintGroupIds,
                    },
                },
                { new: true }
            );
        },
    },

    Meeting: {
        constraintGroupIds: (meeting) => {
            console.log("[Meeting.constraintGroupIds] value:", meeting.constraintGroupIds);
            return Array.isArray(meeting.constraintGroupIds)
                ? meeting.constraintGroupIds
                : [];
        },

        constraintGroups: async (meeting) => {
            console.log("[Meeting.constraintGroups] called with ids:", meeting.constraintGroupIds);
            const ids = Array.isArray(meeting.constraintGroupIds)
                ? meeting.constraintGroupIds
                : [];

            if (!ids.length) return [];

            return ConstraintGroup.find({ _id: { $in: ids } }).sort({ name: 1 });
        },
    },
};