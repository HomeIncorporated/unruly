import { Document } from "mongoose";

import IShift from "./shiftInterface";
import IEmployee from "../users/employeeInterface";
import IScheduler from "../users/schedulerInterface";

interface IScheduled extends Document {
  shift: IShift;
  employee: IEmployee;
  scheduler: IScheduler;
  date: Date;
  createdAt: Date;
}

export default IScheduled;