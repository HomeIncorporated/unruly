import { Component, OnInit, OnDestroy } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { Subscription, Observable, forkJoin } from "rxjs";
import * as moment from "moment";

import { AuthService } from "../../auth/auth.service";
import { UserType } from "../../shared/models/custom-types";
import { ShiftService } from "../../shared/services/shift/shift.service";
import { ScheduledService } from "../../shared/services/shift/scheduled.service";
import { WeeklyScheduledService } from "../../shared/services/shift/weekly-scheduled.service";
import { Shift } from "../../shared/models/shift/shift.model";
import { Scheduled } from "../../shared/models/shift/scheduled.model";

@Component({
  selector: "app-day",
  templateUrl: "./day.component.html",
  styleUrls: ["./day.component.scss"],
})
export class DayComponent implements OnInit, OnDestroy {
  private employeeAuthListenerSub: Subscription;
  private schedulerAuthListenerSub: Subscription;

  userType: UserType;
  day: moment.Moment; //LIKE daysArr FROM OTHER COMPONENTS
  getAllShifts: Observable<Shift[]>;
  getAllScheduled: Observable<Scheduled[]>;
  allShifts: Shift[];
  allScheduled: Scheduled[];

  employeeIsAuth = false;
  schedulerIsAuth = false;
  date = moment();
  today = moment(); //FOR USE WITH URL - DO NOT ALTER
  isLoaded = false;

  constructor(
    private authService: AuthService,
    private shiftService: ShiftService,
    private scheduledService: ScheduledService,
    private weeklyScheduledService: WeeklyScheduledService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.route.params.subscribe((param) => {
      if (param) {
        return (this.date = moment(param["date"]));
      }

      return this.date;
    });
  }

  ngOnInit() {
    //1. INITIALIZE DAY
    this.day = this.date;

    //2. CHECK IF USER
    this.userFeature();

    //3. GRAB DATA
    this.getAllShifts = this.shiftService.getRawAllShifts();
    this.getAllScheduled = this.scheduledService.getRawAllScheduled();

    forkJoin([this.getAllShifts, this.getAllScheduled]).subscribe((result) => {
      this.allShifts = result[0];
      this.allScheduled = result[1];
      this.isLoaded = true;
    });
  }

  //TOOLS----------------------------------------------------------

  currentDay() {
    this.date = moment();
    this.router.navigate(["/day", this.date.toISOString()]);
    this.resetData();
  }

  previousDay() {
    this.date.subtract(1, "d");
    this.router.navigate(["/day", this.date.toISOString()]);
    this.resetData();
  }

  nextDay() {
    this.date.add(1, "d");
    this.router.navigate(["/day", this.date.toISOString()]);
    this.resetData();
  }

  isToday(day) {
    if (!day) {
      return false;
    }

    return moment().format("L") === day.format("L");
  }

  resetData() {
    this.allShifts = [];
    this.allScheduled = [];
    this.isLoaded = false;
    this.ngOnInit();
  }

  //MAIN----------------------------------------------------------

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
      this.resetData();
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
    this.employeeAuthListenerSub.unsubscribe();
    this.schedulerAuthListenerSub.unsubscribe();
  }
}
