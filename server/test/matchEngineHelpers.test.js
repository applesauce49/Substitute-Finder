import test from "node:test";
import assert from "node:assert/strict";

import {
    buildScoredApplicantsForJob,
    buildVirtualMeetingForJob,
    getAssignmentTimingDecision,
    mergeMeetingsHostedCounts,
    resolveWorkloadBalanceWindow,
} from "../matchEngine/matchEngine.js";
import { buildMeetingLookupQuery } from "../matchEngine/dataLoaders.js";
import Meeting from "../models/Meeting.js";
import ConstraintGroup from "../matchEngine/Schemas/ConstraintGroup.js";
import Constraint from "../matchEngine/Schemas/Constraint.js";

test("buildMeetingLookupQuery includes eventId, gcalEventId, and gcalRecurringEventId", () => {
    const query = buildMeetingLookupQuery(["event-1"]);

    // Must include exact-match conditions on all three fields
    assert.ok(query.$or.some(c => c.eventId?.$in?.includes("event-1")), "should match by eventId");
    assert.ok(query.$or.some(c => c.gcalEventId?.$in?.includes("event-1")), "should match by gcalEventId");
    assert.ok(query.$or.some(c => c.gcalRecurringEventId?.$in?.includes("event-1")), "should match by gcalRecurringEventId");
});

test("buildMeetingLookupQuery resolves recurring instance IDs to base ID", () => {
    const query = buildMeetingLookupQuery(["abc123_R20260514T140000Z"]);

    // Should include the base ID in exact-match sets
    assert.ok(query.$or.some(c => c.gcalEventId?.$in?.includes("abc123")), "should include base ID in gcalEventId $in");
    // Should include a regex prefix condition so meetings stored with ANY instance of the series are found
    assert.ok(
        query.$or.some(c => c.gcalEventId instanceof RegExp && c.gcalEventId.test("abc123_R20250101T000000")),
        "should match gcalEventId stored as a different instance of the same series via regex"
    );
});

test("resolveWorkloadBalanceWindow prefers constraint meeting, then meeting, then default", () => {
    assert.equal(
        resolveWorkloadBalanceWindow({ workloadBalanceWindowDays: 14 }, { workloadBalanceWindowDays: 7 }, 3),
        14
    );
    assert.equal(
        resolveWorkloadBalanceWindow({ workloadBalanceWindowDays: null }, { workloadBalanceWindowDays: 7 }, 3),
        7
    );
    assert.equal(
        resolveWorkloadBalanceWindow(null, { workloadBalanceWindowDays: undefined }, 3),
        3
    );
});

test("mergeMeetingsHostedCounts combines host and cohost totals per user", () => {
    const merged = mergeMeetingsHostedCounts(
        [
            { _id: "user-a", count: 2 },
            { _id: "user-b", count: 1 },
        ],
        [
            { _id: "user-a", count: 3 },
            { _id: "user-c", count: 4 },
        ]
    );

    assert.deepEqual(merged, {
        "user-a": 5,
        "user-b": 1,
        "user-c": 4,
    });
});

test("buildVirtualMeetingForJob preserves job snapshot identity and default workload window", () => {
    const virtualMeeting = buildVirtualMeetingForJob(
        {
            _id: "job-1",
            meetingSnapshot: {
                title: "Coverage Request",
                description: "Need coverage",
                startDateTime: "2026-03-25T14:00:00.000Z",
                endDateTime: "2026-03-25T15:00:00.000Z",
                eventId: "event-1",
                gcalEventId: "gcal-1",
                gcalRecurringEventId: "series-1",
            },
        },
        21
    );

    assert.deepEqual(virtualMeeting, {
        _id: "job-1",
        summary: "Coverage Request",
        description: "Need coverage",
        start: "2026-03-25T14:00:00.000Z",
        end: "2026-03-25T15:00:00.000Z",
        eventId: "event-1",
        gcalEventId: "gcal-1",
        gcalRecurringEventId: "series-1",
        constraintGroupIds: [],
        workloadBalanceWindowDays: 21,
    });
});

test("getAssignmentTimingDecision allows assignment after minimum posted hours even when meeting is far away", () => {
    const now = new Date("2026-05-08T12:00:00.000Z");
    const decision = getAssignmentTimingDecision(
        {
            createdAt: "2026-05-07T23:00:00.000Z", // 13 hours ago
            meetingSnapshot: {
                startDateTime: "2026-05-10T12:00:00.000Z", // 48 hours away
            },
        },
        now,
        12,
        23
    );

    assert.equal(decision.meetsMinimumPostedWindow, true);
    assert.equal(decision.overrideForUrgentMeeting, false);
    assert.equal(decision.canAssignNow, true);
});

test("getAssignmentTimingDecision blocks assignment before minimum posted hours when meeting is not urgent", () => {
    const now = new Date("2026-05-08T12:00:00.000Z");
    const decision = getAssignmentTimingDecision(
        {
            createdAt: "2026-05-08T04:00:00.000Z", // 8 hours ago
            meetingSnapshot: {
                startDateTime: "2026-05-10T12:00:00.000Z", // 48 hours away
            },
        },
        now,
        12,
        23
    );

    assert.equal(decision.meetsMinimumPostedWindow, false);
    assert.equal(decision.overrideForUrgentMeeting, false);
    assert.equal(decision.canAssignNow, false);
});

test("getAssignmentTimingDecision allows urgent override before minimum posted hours", () => {
    const now = new Date("2026-05-08T12:00:00.000Z");
    const decision = getAssignmentTimingDecision(
        {
            createdAt: "2026-05-08T06:00:00.000Z", // 6 hours ago
            meetingSnapshot: {
                startDateTime: "2026-05-09T08:00:00.000Z", // 20 hours away
            },
        },
        now,
        12,
        23
    );

    assert.equal(decision.meetsMinimumPostedWindow, false);
    assert.equal(decision.overrideForUrgentMeeting, true);
    assert.equal(decision.canAssignNow, true);
});

test("getAssignmentTimingDecision treats the urgent window boundary as eligible", () => {
    const now = new Date("2026-05-08T12:00:00.000Z");
    const decision = getAssignmentTimingDecision(
        {
            createdAt: "2026-05-08T10:00:00.000Z", // 2 hours ago
            meetingSnapshot: {
                startDateTime: "2026-05-09T11:00:00.000Z", // 23 hours away
            },
        },
        now,
        12,
        23
    );

    assert.equal(decision.meetsMinimumPostedWindow, false);
    assert.equal(decision.overrideForUrgentMeeting, true);
    assert.equal(decision.canAssignNow, true);
});

test("buildScoredApplicantsForJob uses shared meeting lookup, constraints, and workload inputs", async () => {
    const originalFindOne = Meeting.findOne;
    const originalAggregate = Meeting.aggregate;
    const originalConstraintGroupFind = ConstraintGroup.find;
    const originalConstraintFind = Constraint.find;

    Meeting.findOne = () => ({
        lean: async () => ({
            _id: "meeting-1",
            eventId: "event-1",
            constraintGroupIds: ["group-1"],
            workloadBalanceWindowDays: 14,
        }),
    });
    Meeting.aggregate = async (pipeline) => {
        const matchField = Object.keys(pipeline[0].$match)[0];

        if (matchField === "host") {
            return [{ _id: "user-1", count: 5 }];
        }

        return [{ _id: "user-2", count: 2 }];
    };
    ConstraintGroup.find = () => ({
        lean: async () => ([{ _id: "group-1", constraintIds: ["constraint-1"] }]),
    });
    Constraint.find = () => ({
        lean: async () => ([{
            _id: "constraint-1",
            name: "Needs Math",
            fieldSource: "user",
            fieldKey: "subject",
            operator: "equals",
            value: "math",
            required: true,
        }]),
    });

    try {
        const result = await buildScoredApplicantsForJob(
            {
                _id: "job-1",
                createdAt: "2026-03-01T10:00:00.000Z",
                meetingSnapshot: {
                    eventId: "event-1",
                    title: "Math Coverage",
                    startDateTime: "2026-03-25T14:00:00.000Z",
                    endDateTime: "2026-03-25T15:00:00.000Z",
                },
                applications: [
                    {
                        _id: "application-1",
                        user: { _id: "user-1" },
                        appliedAt: "2026-03-01T11:00:00.000Z",
                    },
                    {
                        _id: "application-2",
                        user: { _id: "user-2" },
                        appliedAt: "2026-03-01T12:00:00.000Z",
                    },
                ],
            },
            [
                {
                    _id: "user-1",
                    username: "Alex",
                    attributes: [{ key: "subject", value: "math" }],
                    assignedJobs: [
                        { assignedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
                    ],
                },
                {
                    _id: "user-2",
                    username: "Blair",
                    attributes: [{ key: "subject", value: "science" }],
                    assignedJobs: [],
                },
            ],
            new Map([["subject", { key: "subject", type: "string" }]]),
            "job",
            null,
            14
        );

        assert.equal(result.meeting._id, "meeting-1");
        assert.equal(result.constraints.length, 1);
        assert.equal(result.workloadBalanceWindow, 14);
        assert.equal(result.applicantScores.length, 2);
        assert.equal(result.applicantScores[0].userName, "Alex");
        assert.equal(result.applicantScores[0].meetingsHosted, 5);
        assert.equal(result.applicantScores[1].eligible, false);
        assert.equal(result.applicantScores[1].constraintScore, 0);
    } finally {
        Meeting.findOne = originalFindOne;
        Meeting.aggregate = originalAggregate;
        ConstraintGroup.find = originalConstraintGroupFind;
        Constraint.find = originalConstraintFind;
    }
});