// server/schemas/resolvers/constraintResolvers.js
import UserAttributeDefinition from "../../matchEngine/Schemas/UserAttributeDefinition.js";
import Constraint from "../../matchEngine/Schemas/Constraint.js";
import ConstraintGroup from "../../matchEngine/Schemas/ConstraintGroup.js";
import { GraphQLError } from "graphql";

const typeMap = {
    STRING: "string",
    NUMBER: "number",
    BOOLEAN: "boolean",
    DATE: "date",
    ENUM: "enum"
};

const reverseTypeMap = Object.fromEntries(
    Object.entries(typeMap).map(([gql, mongo]) => [mongo, gql])
);

const operatorMap = {
    EQUALS: "equals",
    NOT_EQUALS: "notEquals",
    GT: "gt",
    LT: "lt",
    GTE: "gte",
    LTE: "lte",
    CONTAINS: "contains",
    NOT_CONTAINS: "notContains",
    IN: "in",
    NOT_IN: "notIn",
    BETWEEN: "between"
};

const reverseOperatorMap = Object.fromEntries(
    Object.entries(operatorMap).map(([gql, mongo]) => [mongo, gql])
);

export default {
    Query: {
        userAttributeDefinitions: async () => {
            return UserAttributeDefinition.find({}).sort({ label: 1 });
        },
        constraints: async () => {
            return Constraint.find({}).sort({ name: 1 });
        },
        constraintGroups: async () => {
            return ConstraintGroup.find({}).sort({ name: 1 });
        },
    },

    Mutation: {
        // --- Attribute Definitions ---
        createUserAttributeDefinition: async (_, { input }) => {
            try {
                const attr = new UserAttributeDefinition({
                    ...input,
                    type: typeMap[input.type],
                    userEditable: input.userEditable ?? false,  // default admin-only
                    active: input.active ?? true,
                });
                return await attr.save();

            } catch (err) {
                if (err.code === 11000) {
                    throw new GraphQLError("A user attribute with that key already exists.", {
                        extensions: {
                            code: "ATTRIBUTE_KEY_EXISTS"
                        }
                    });
                }

                console.error("Error creating UserAttributeDefinition:", err);
                throw err;
            }

        },

        updateUserAttributeDefinition: async (_, { id, input }) => {
            return UserAttributeDefinition.findByIdAndUpdate(
                id,
                { $set: { ...input, type: typeMap[input.type] } },
                { new: true }
            );
        },

        deleteUserAttributeDefinition: async (_, { id }) => {
            await UserAttributeDefinition.findByIdAndDelete(id);
            // you *might* later want to enforce referential checks here
            return true;
        },

        // --- Constraints ---

        createConstraint: async (_, { input }) => {
            const attrExists = await UserAttributeDefinition.exists({ key: input.fieldKey });
            if (!attrExists) {
                throw new GraphQLError("No UserAttributeDefinition found with the specified fieldKey.", {
                    extensions: {
                        code: "INVALID_FIELD_KEY"
                    }
                });
            }

            const constraint = new Constraint({
                ...input,
                operator: operatorMap[input.operator],
                active: input.active ?? true,
            });
            return constraint.save();
        },

        updateConstraint: async (_, { id, input }) => {
            return Constraint.findByIdAndUpdate(
                id,
                { $set: { ...input, operator: operatorMap[input.operator] } },
                { new: true }
            );
        },

        deleteConstraint: async (_, { id }) => {
            await Constraint.findByIdAndDelete(id);
            // TODO: optionally pull from any groups referencing it
            return true;
        },

        // --- Constraint Groups ---

        createConstraintGroup: async (_, { input }) => {
            const group = new ConstraintGroup({
                name: input.name,
                constraintIds: input.constraintIds,
            });
            return group.save();
        },

        updateConstraintGroup: async (_, { id, input }) => {
            return ConstraintGroup.findByIdAndUpdate(
                id,
                {
                    $set: {
                        name: input.name,
                        constraintIds: input.constraintIds,
                    },
                },
                { new: true }
            );
        },

        deleteConstraintGroup: async (_, { id }) => {
            await ConstraintGroup.findByIdAndDelete(id);
            return true;
        },
    },

    UserAttributeDefinition: {
        type: (attr) => reverseTypeMap[attr.type]
    },

    Constraint: {
        operator: (obj) => reverseOperatorMap[obj.operator]
    },

    ConstraintGroup: {
        // resolve `constraints` from `constraintIds`
        constraints: async (group) => {
            if (!group.constraintIds?.length) return [];
            return Constraint.find({ _id: { $in: group.constraintIds } }).sort({ name: 1 });
        },
    },
};