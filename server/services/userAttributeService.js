import { User } from '../models/index.js';
import Meeting from '../models/Meeting.js';

/**
 * Updates system attributes for a user
 * @param {string|ObjectId} userId - The user ID to update
 */
export async function updateUserSystemAttributes(userId) {
    try {
        const user = await User.findById(userId);
        if (!user) return;

        // Calculate totalMeetingsHosted
        const totalMeetingsHosted = await Meeting.countDocuments({
            $or: [
                { host: userId },
                { coHost: userId }
            ]
        });

        // Update or add the attribute
        const existingAttrIndex = user.attributes.findIndex(attr => attr.key === 'totalMeetingsHosted');
        
        if (existingAttrIndex >= 0) {
            user.attributes[existingAttrIndex].value = totalMeetingsHosted;
        } else {
            user.attributes.push({
                key: 'totalMeetingsHosted',
                value: totalMeetingsHosted
            });
        }

        await user.save();
        
        return totalMeetingsHosted;
    } catch (error) {
        console.error('Error updating user system attributes:', error);
        throw error;
    }
}

/**
 * Updates meeting-related system attributes for all affected users when a meeting changes
 * @param {Object} meetingData - Meeting data containing host and coHost fields
 * @param {Object} oldMeetingData - Previous meeting data (for updates/deletes)
 */
export async function updateMeetingSystemAttributes(meetingData, oldMeetingData = null) {
    try {
        const userIds = new Set();

        // Add current host and coHost if they exist
        if (meetingData?.host) userIds.add(meetingData.host.toString());
        if (meetingData?.coHost) userIds.add(meetingData.coHost.toString());

        // Add previous host and coHost if this is an update/delete
        if (oldMeetingData?.host) userIds.add(oldMeetingData.host.toString());
        if (oldMeetingData?.coHost) userIds.add(oldMeetingData.coHost.toString());

        // Update all affected users
        const updatePromises = Array.from(userIds).map(userId => 
            updateUserSystemAttributes(userId)
        );

        await Promise.all(updatePromises);
    } catch (error) {
        console.error('Error updating meeting system attributes:', error);
        throw error;
    }
}

/**
 * Recalculates system attributes for all users (maintenance function)
 */
export async function recalculateAllUserSystemAttributes() {
    try {
        const users = await User.find({}, '_id');
        
        const updatePromises = users.map(user => 
            updateUserSystemAttributes(user._id)
        );

        await Promise.all(updatePromises);
        
        return users.length;
    } catch (error) {
        console.error('Error recalculating all user system attributes:', error);
        throw error;
    }
}