import test from "node:test";
import assert from "node:assert/strict";

import {
    buildScoredApplicantsForJob,
    buildVirtualMeetingForJob,
    mergeMeetingsHostedCounts,
    resolveWorkloadBalanceWindow,
} from "../matchEngine/matchEngine.js";
import { buildMeetingLookupQuery } from "../matchEngine/dataLoaders.js";
import Meeting from "../models/Meeting.js";
import ConstraintGroup from "../matchEngine/Schemas/ConstraintGroup.js";
import Constraint from "../matchEngine/Schemas/Constraint.js";

test("buildMeetingLookupQuery includes eventId, gcalEventId, and gcalRecurringEventId", () => {
    const query = buildMeetingLookupQuery(["event-1"]);

    assert.deepEqual(query, {
        $or: [
            { eventId: { $in: ["event-1"] } },
            { gcalEventId: { $in: ["event-1"] } },
            { gcalRecurringEventId: { $in: ["event-1"] } },
        ],
    });
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