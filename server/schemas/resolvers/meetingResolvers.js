import Meeting from '../../models/Meeting.js';
import ConstraintGroup from '../../matchEngine/Schemas/ConstraintGroup.js';

export default {
    Query: {
        meetings: async () => {
            return Meeting.find({})
                .populate('owner')
                .populate('host')
                .populate('coHost')
                .populate('alternateHost')
                .sort({ createdAt: -1 });
        }
    },

    Mutation: {
        createMeeting: async (_, { input }) => {
            const constraintGroupIds = Array.isArray(input.constraintGroupIds)
                ? input.constraintGroupIds
                : [];

            const meetingData = {
                ...input,
                constraintGroupIds,
            };

            // Map user IDs to the correct field names
            if (input.hostId) meetingData.host = input.hostId;
            if (input.coHostId) meetingData.coHost = input.coHostId;
            if (input.alternateHostId) meetingData.alternateHost = input.alternateHostId;

            // Remove the input field names that don't match the schema
            delete meetingData.hostId;
            delete meetingData.coHostId;
            delete meetingData.alternateHostId;

            const meeting = new Meeting(meetingData);
            const saved = await meeting.save();

            // Populate user references before returning
            return Meeting.findById(saved._id)
                .populate('host')
                .populate('coHost')
                .populate('alternateHost');
        },

        updateMeeting: async (_, { id, input }) => {
            const constraintGroupIds = Array.isArray(input.constraintGroupIds)
                ? input.constraintGroupIds
                : [];

            const updateData = {
                ...input,
                constraintGroupIds,
            };

            // Map user IDs to the correct field names
            if (input.hostId) updateData.host = input.hostId;
            if (input.coHostId) updateData.coHost = input.coHostId;
            if (input.alternateHostId) updateData.alternateHost = input.alternateHostId;

            // Remove the input field names that don't match the schema
            delete updateData.hostId;
            delete updateData.coHostId;
            delete updateData.alternateHostId;

            return Meeting.findByIdAndUpdate(
                id,
                {
                    $set: updateData,
                },
                { new: true }
            )
            .populate('host')
            .populate('coHost')
            .populate('alternateHost');
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