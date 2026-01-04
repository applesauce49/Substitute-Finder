import { TypeInputRegistry } from "./TypeInputRegistry";

export const OperatorRegistry = {

    /* ------------------------------
     *  Equality Operators
     * ------------------------------ */

    EQUALS: {
        label: "is",
        inputCount: 1,

        renderInput: {
            STRING: TypeInputRegistry.STRING,
            NUMBER: TypeInputRegistry.NUMBER,
            BOOLEAN: TypeInputRegistry.BOOLEAN,
            DATE: TypeInputRegistry.DATE,
            TIME: TypeInputRegistry.TIME,
            ENUM: TypeInputRegistry.ENUM,
        },

        normalize: {
            STRING: () => "",
            NUMBER: () => "",
            BOOLEAN: () => "true",
            DATE: () => "",
            TIME: () => "",
            ENUM: (attribute) => attribute?.options?.[0] ?? "",
        },
    },


    NOT_EQUALS: {
        label: "is not",
        inputCount: 1,
        renderInput: {
            STRING: TypeInputRegistry.STRING,
            NUMBER: TypeInputRegistry.NUMBER,
            BOOLEAN: TypeInputRegistry.BOOLEAN,
            DATE: TypeInputRegistry.DATE,
            TIME: TypeInputRegistry.TIME,
            ENUM: TypeInputRegistry.ENUM,
        },

        normalize: {
            STRING: () => "",
            NUMBER: () => "",
            BOOLEAN: () => "true",
            DATE: () => "",
            TIME: () => "",
            ENUM: (attribute) => attribute?.options?.[0] ?? "",
        },    },


    /* ------------------------------
     *  Comparison Operators
     * ------------------------------ */

    GT: {
        label: "greater than",
        inputCount: 1,

        renderInput: {
            NUMBER: TypeInputRegistry.NUMBER,
            DATE: TypeInputRegistry.DATE,
            TIME: TypeInputRegistry.TIME,
        },

        normalize: {
            NUMBER: () => "",
            DATE: () => "",
            TIME: () => "",
        }
    },

    LT: {
        label: "less than",
        inputCount: 1,
        renderInput: { 
            NUMBER: TypeInputRegistry.NUMBER, 
            DATE: TypeInputRegistry.DATE, 
            TIME: TypeInputRegistry.TIME 
        },
        normalize: { NUMBER: () => "", DATE: () => "", TIME: () => "" }
    },

    GTE: {
        label: "greater than or equal",
        inputCount: 1,
        renderInput: { 
            NUMBER: TypeInputRegistry.NUMBER, DATE: TypeInputRegistry.DATE, TIME: TypeInputRegistry.TIME },
        normalize: { NUMBER: () => "", DATE: () => "", TIME: () => "" }
    },

    LTE: {
        label: "less than or equal",
        inputCount: 1,
        renderInput: { NUMBER: TypeInputRegistry.NUMBER, DATE: TypeInputRegistry.DATE, TIME: TypeInputRegistry.TIME },
        normalize: { NUMBER: () => "", DATE: () => "", TIME: () => "" }
    },


    /* ------------------------------
     *  String Operators
     * ------------------------------ */

    CONTAINS: {
        label: "contains",
        inputCount: 1,

        renderInput: {
            STRING: TypeInputRegistry.STRING
        },

        normalize: {
            STRING: () => ""
        }
    },

    NOT_CONTAINS: {
        label: "does not contain",
        inputCount: 1,
        renderInput: { STRING: TypeInputRegistry.STRING },
        normalize: { STRING: () => "" }
    },


    /* ------------------------------
     *  List Operators (ENUM, STRING)
     * ------------------------------ */

    IN: {
        label: "is one of",
        inputCount: "multi",

        renderInput: {
            ENUM: TypeInputRegistry.MULTI_ENUM,

            STRING: TypeInputRegistry.MULTI_STRING,
        },

        normalize: {
            ENUM: () => [],
            STRING: () => [],
        }
    },

    NOT_IN: {
        label: "is not one of",
        inputCount: "multi",
        renderInput: {
            ENUM: TypeInputRegistry.MULTI_ENUM,

            STRING: TypeInputRegistry.MULTI_STRING,
        },
       normalize: {
            ENUM: () => [],
            STRING: () => [],
        }
    },


    /* ------------------------------
     *  Range Operator
     * ------------------------------ */

    BETWEEN: {
        label: "is between",
        inputCount: 2,

        renderInput: {
            NUMBER: TypeInputRegistry.RANGE_NUMBER,

            DATE: TypeInputRegistry.RANGE_DATE,

            TIME: TypeInputRegistry.RANGE_TIME,
        },

        normalize: {
            NUMBER: () => ["", ""],
            DATE: () => ["", ""],
            TIME: () => ["", ""],
        }
    }
};