import mongoose, { Schema } from "mongoose";

import IScheduled from "../../types/shift/scheduledInterface";

//MOST CREATED DATA
const scheduledSchema: Schema = new mongoose.Schema(
  {
    shift: {
      type: mongoose.Schema.Types.ObjectId,
      ref: `Shift`,
      required: [true, `Scheduled shift must be a valid shift.`],
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: `Employee`,
      required: [true, `Scheduled shift must belong to an employee.`],
    },
    scheduler: {
      type: mongoose.Schema.Types.ObjectId,
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
      select: false, //HIDDEN
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

//COMPOUND INDEX TO FIND IF SCHEDULED SHIFT AND EMPLOYEE IS UNIQUE
scheduledSchema.index(
  { shift: 1, employee: 1, scheduler: 1 },
  { unique: true }
);

//SHOW IN FIND EMPLOYEE & FIND SCHEDULER
scheduledSchema.pre(/^find/, function (this: any, next) {
  this.populate(`employee`).populate(`scheduler`);
  next();
});

const Scheduled = mongoose.model<IScheduled>(`Scheduled`, scheduledSchema);
export default Scheduled;
