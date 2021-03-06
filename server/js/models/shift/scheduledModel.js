"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
//MOST CREATED DATA
const scheduledSchema = new mongoose_1.default.Schema({
    shift: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: `Shift`,
        required: [true, `Scheduled shift must be a valid shift.`],
    },
    employee: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: `Employee`,
        required: [true, `Scheduled shift must belong to an employee.`],
    },
    scheduler: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: `Scheduler`,
        required: [true, `Scheduled shift must have a scheduler.`],
    },
    date: {
        type: Date,
        required: [true, `Scheduled shift date required.`],
    },
    createdAt: {
        type: Date,
        default: Date.now(),
    },
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
//COMPOUND INDEX TO FIND IF SCHEDULED EMPLOYEE AND DATE IS UNIQUE (ONLY ONE SHIFT PER DAY PER EMPLOYEE)
scheduledSchema.index({ employee: 1, date: 1 }, { unique: true });
//SHOW IN FIND: SHIFT, EMPLOYEE, AND SCHEDULER
scheduledSchema.pre(/^find/, function (next) {
    this.populate(`shift`).populate(`employee`).populate(`scheduler`);
    next();
});
const Scheduled = mongoose_1.default.model(`Scheduled`, scheduledSchema);
exports.default = Scheduled;
