import Meeting from '../../models/Meeting.js';
import ConstraintGroup from '../../matchEngine/Schemas/ConstraintGroup.js';
import { updateMeetingSystemAttributes } from '../../services/userAttributeService.js';

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

            const linkedJobIds = Array.isArray(input.linkedJobIds)
                ? input.linkedJobIds
                : [];

            const meetingData = {
                ...input,
                constraintGroupIds,
                linkedJobIds,
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

            // Update system attributes for affected users
            await updateMeetingSystemAttributes(meetingData);

            // Populate user references before returning
            return Meeting.findById(saved._id)
                .populate('host')
                .populate('coHost')
                .populate('alternateHost');
        },

        updateMeeting: async (_, { id, input }) => {
            // Get the old meeting data first
            const oldMeeting = await Meeting.findById(id);
            
            const constraintGroupIds = Array.isArray(input.constraintGroupIds)
                ? input.constraintGroupIds
                : [];

            const linkedJobIds = Array.isArray(input.linkedJobIds)
                ? input.linkedJobIds
                : [];

            const updateData = {
                ...input,
                constraintGroupIds,
                linkedJobIds,
            };

            // Map user IDs to the correct field names
            if (input.hostId) updateData.host = input.hostId;
            if (input.coHostId) updateData.coHost = input.coHostId;
            if (input.alternateHostId) updateData.alternateHost = input.alternateHostId;

            // Remove the input field names that don't match the schema
            delete updateData.hostId;
            delete updateData.coHostId;
            delete updateData.alternateHostId;

            const updatedMeeting = await Meeting.findByIdAndUpdate(
                id,
                {
                    $set: updateData,
                },
                { new: true }
            )
            .populate('host')
            .populate('coHost')
            .populate('alternateHost');

            // Update system attributes for affected users
            await updateMeetingSystemAttributes(updateData, oldMeeting);

            return updatedMeeting;
        },
    },

    Meeting: {
        constraintGroupIds: (meeting) => {
            console.log("[Meeting.constraintGroupIds] value:", meeting.constraintGroupIds);
            return Array.isArray(meeting.constraintGroupIds)
                ? meeting.constraintGroupIds
                : [];
        },

        linkedJobIds: (meeting) => {
            return Array.isArray(meeting.linkedJobIds)
                ? meeting.linkedJobIds
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