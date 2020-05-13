import { Component, OnInit, OnDestroy } from "@angular/core";
import { Subscription } from "rxjs";
import * as moment from "moment";

import { AuthService } from "../../auth/auth.service";
import { UserType } from "../../shared/models/custom-types";
import { ShiftService } from "../../shared/services/shift/shift.service";
import { ScheduledService } from "../../shared/services/shift/scheduled.service";
import { WeeklyScheduledService } from "../../shared/services/shift/weekly-scheduled.service";
import { Shift } from "../../shared/models/shift/shift.model";
import { Scheduled } from "../../shared/models/shift/scheduled.model";

@Component({
  selector: "app-week",
  templateUrl: "./week.component.html",
  styleUrls: ["./week.component.scss"],
})
export class WeekComponent implements OnInit, OnDestroy {
  private employeeAuthListenerSub: Subscription;
  private schedulerAuthListenerSub: Subscription;
  private shiftSub: Subscription;
  private scheduledSub: Subscription;

  userType: UserType;
  daysArr: moment.Moment[];
  day: moment.Moment;
  allShifts: Shift[];
  allScheduled: Scheduled[];

  employeeIsAuth = false;
  schedulerIsAuth = false;
  date = moment();
  isLoaded = [false, false];

  constructor(
    private authService: AuthService,
    private shiftService: ShiftService,
    private scheduledService: ScheduledService,
    private weeklyScheduledService: WeeklyScheduledService
  ) {}

  ngOnInit() {
    //1. INITIALIZE WEEK
    this.daysArr = this.createCalendarWeek(this.date);

    //2. CHECK IF USER
    this.userFeature();

    //3. GRAB DATA
    this.shiftSub = this.shiftService
      .getRawAllShifts()
      .subscribe((shift: any) => {
        this.allShifts = shift;
        this.isLoaded[0] = true;
      });

    this.scheduledSub = this.scheduledService
      .getRawAllScheduled()
      .subscribe((scheduled: any) => {
        this.allScheduled = scheduled;
        this.isLoaded[1] = true;
      });
  }
  //TOOLS----------------------------------------------------------

  currentWeek() {
    this.date = moment();
    this.daysArr = this.createCalendarWeek(this.date);
  }

  previousWeek() {
    this.date.subtract(1, "w");
    this.daysArr = this.createCalendarWeek(this.date);
  }

  nextWeek() {
    this.date.add(1, "w");
    this.daysArr = this.createCalendarWeek(this.date);
  }

  isToday(day) {
    if (!day) {
      return false;
    }

    return moment().format("L") === day.format("L");
  }

  //MAIN----------------------------------------------------------

  createCalendarWeek(week) {
    //1. SETUP VARS
    let firstDay = moment(week).startOf("w");

    //2. CREATE ARR OF DAYS
    let days = Array.apply(null, { length: 7 })
      //COUNT UP NUMBERS
      .map(Number.call, Number)
      //START FROM WEEK'S FIRST DAY
      .map((el) => moment(firstDay).add(el, "d"));

    //3. RETURN FINISHED ARR OF DAYS
    return days;
  }

  userFeature() {
    this.employeeIsAuth = this.authService.getEmployeeIsAuth();
    this.employeeAuthListenerSub = this.authService
      .getEmployeeAuthStatusListener()
      .subscribe((isAuth) => {
        this.employeeIsAuth = isAuth;
        this.userType = `employee`;
      });

    this.schedulerIsAuth = this.authService.getSchedulerIsAuth();
    this.schedulerAuthListenerSub = this.authService
      .getSchedulerAuthStatusListener()
      .subscribe((isAuth) => {
        this.schedulerIsAuth = isAuth;
        this.userType = `scheduler`;
      });
  }

  //DASHBOARD----------------------------------------------------------

  schedulerControl(type) {
    const reloadCalendar = () => {
      this.isLoaded = [false, false];
      this.ngOnInit();
    };

    switch (type) {
      case `populateAllToScheduled`:
        this.weeklyScheduledService.populateAllToScheduled().subscribe(() => {
          reloadCalendar();
        });

      case `deleteLastScheduled`:
        this.scheduledService.deleteLastScheduled().subscribe(() => {
          reloadCalendar();
        });
    }
  }

  ngOnDestroy() {
    this.shiftSub.unsubscribe();
    this.scheduledSub.unsubscribe();
    this.employeeAuthListenerSub.unsubscribe();
    this.schedulerAuthListenerSub.unsubscribe();
  }
}
