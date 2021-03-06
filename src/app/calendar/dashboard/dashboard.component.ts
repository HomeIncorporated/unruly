import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  OnDestroy,
} from "@angular/core";
import { Observable, Subscription } from "rxjs";
import { FormGroup, FormControl, Validators } from "@angular/forms";
import * as moment from "moment";

import { EmployeeService } from "../../shared/services/users/employee.service";
import { ShiftService } from "../../shared/services/shift/shift.service";
import { ScheduledService } from "../../shared/services/shift/scheduled.service";
import { PreferredService } from "../../shared/services/shift/preferred.service";
import { CalendarService } from "../calendar.service";
import { AlertService } from "../../components/alert/alert.service";
import { Employee } from "../../shared/models/users/employee.model";
import { Shift } from "../../shared/models/shift/shift.model";
import {
  CalendarItem,
  CalendarItemEmit,
  EmployeeOptions,
} from "../../shared/models/custom-types";
import { ShiftProperties } from "../../shared/tools/custom-classes";
import { ScheduledData } from "../../shared/models/shift/scheduled.model";
import { PreferredData } from "../../shared/models/shift/preferred.model";
import { HttpErrorResponse } from "@angular/common/http";

//FROM dashboard TO [calendar-item | week-item | day-item]
@Component({
  selector: "app-dashboard",
  templateUrl: "./dashboard.component.html",
  styleUrls: ["./dashboard.component.scss"],
})
export class DashboardComponent implements OnInit, OnDestroy {
  private employeeSub: Subscription;
  private calendarItemSub: Subscription;
  private employeeOptionsSub: Subscription;

  @Input() employeeIsAuth;
  @Input() schedulerIsAuth;
  @Input() calendarItemObs: Observable<any>;
  @Input() employeeOptionsObs: Observable<any>;

  @Output() employeeEmitter = new EventEmitter<
    [string, [CalendarItem, EmployeeOptions]]
  >();
  @Output() schedulerEmitter = new EventEmitter<[string, CalendarItem]>();
  @Output() formSubmitEmitter = new EventEmitter<string>();

  employees: Employee[];
  calendarItem: CalendarItem;
  calendarItemId: string;
  calendarItemDay: moment.Moment;
  employeeOptions: EmployeeOptions;
  addPreferredForm: FormGroup;
  updateShiftForm: FormGroup;
  createScheduledForm: FormGroup;

  employeeOptionsMenu = false;
  schedulerOptionsMenu = false;
  addPreferredFormToggle = false;
  updateShiftFormToggle = false;
  createScheduledFormToggle = false;
  daysInWords = ShiftProperties.daysInWords;

  //UPDATE SHIFT FORM
  positions = ShiftProperties.positions;
  slots = ShiftProperties.slots;
  locations = ShiftProperties.locations;
  days = ShiftProperties.days;
  shiftHours = ShiftProperties.shiftHours;

  //ADD PREFERRED FORM
  ranks = [1, 2, 3];

  constructor(
    private employeeService: EmployeeService,
    private shiftService: ShiftService,
    private scheduledService: ScheduledService,
    private preferredService: PreferredService,
    private calendarService: CalendarService,
    private alertService: AlertService
  ) {}

  ngOnInit() {
    //1. GRAB CALENDAR ITEM INFO FROM PARENT [calendar | week | day] OBS
    this.calendarItemSub = this.calendarItemObs.subscribe(
      (emittedData: CalendarItemEmit) => {
        this.calendarItem = [emittedData[0], emittedData[1]];
        this.calendarItemId = emittedData[0].id;
        this.calendarItemDay = emittedData[2];

        //2. OPEN CORRESPONDING MENU
        if (this.employeeIsAuth) this.onToggleEmployeeOptionsMenu(`open`);
        if (this.schedulerIsAuth) this.onToggleSchedulerOptionsMenu(`open`);

        //3. UPDATE ANY FORMS
        this.initUpdateShiftForm();
        this.initCreateScheduledForm();
      }
    );

    //4. GRAB EMPLOYEE OPTIONS IF EMPLOYEE IS AUTH AND UPDATE ANY FORM
    if (this.employeeIsAuth) {
      this.employeeOptionsSub = this.employeeOptionsObs.subscribe(
        (emittedData: EmployeeOptions) => {
          this.employeeOptions = emittedData;
          this.initAddPreferredForm();
        }
      );
    }

    //5. GRAB EMPLOYEES FOR CREATE SCHEDULED FORM
    this.getEmployees();
  }

  //TOOLS----------------------------------------------------------

  onFormSubmitEmitter(type: `shift` | `scheduled` | `preferred`) {
    this.formSubmitEmitter.emit(type);
  }

  getFormattedHour(hour: number) {
    return this.calendarService.getFormattedHour(hour);
  }

  //----------------------FOR EMPLOYEE USE

  onEmployeeEmitter(
    type: `deletePreferred` | `requestVacation` | `deleteVacation`
  ) {
    const data: [CalendarItem, EmployeeOptions] = [
      this.calendarItem as CalendarItem,
      this.employeeOptions as EmployeeOptions,
    ];

    this.employeeEmitter.emit([type, data]);

    if (this.employeeOptionsMenu) this.onToggleEmployeeOptionsMenu(`close`);
  }

  onToggleEmployeeOptionsMenu(type: `open` | `close`) {
    if (type === `open`) {
      this.employeeOptionsMenu = true;
    } else {
      this.employeeOptionsMenu = false;
      this.addPreferredFormToggle = false;
    }
  }

  onToggleAddPreferredForm(type: `open` | `close`) {
    if (type === `open`) {
      this.addPreferredFormToggle = true;
    } else {
      this.addPreferredFormToggle = false;
    }
  }

  //----------------------FOR SCHEDULER USE

  onSchedulerEmitter(
    type:
      | `populateAllToScheduled`
      | `populateSteadyExtra`
      | `deleteLastScheduled`
      | `deleteShift`
      | `deleteScheduled`
  ) {
    const data = this.calendarItem;

    this.schedulerEmitter.emit([type, data]);

    if (this.schedulerOptionsMenu) this.onToggleSchedulerOptionsMenu(`close`);
  }

  onToggleSchedulerOptionsMenu(type: `open` | `close`) {
    if (type === `open`) {
      this.schedulerOptionsMenu = true;
    } else {
      this.schedulerOptionsMenu = false;
      this.updateShiftFormToggle = false;
      this.createScheduledFormToggle = false;
    }
  }

  onToggleUpdateShiftForm(type: `open` | `close`) {
    if (type === `open`) {
      this.updateShiftFormToggle = true;
      this.createScheduledFormToggle = false;
    } else {
      this.updateShiftFormToggle = false;
    }
  }

  onToggleCreateScheduledForm(type: `open` | `close`) {
    if (type === `open`) {
      this.createScheduledFormToggle = true;
      this.updateShiftFormToggle = false;
    } else {
      this.createScheduledFormToggle = false;
    }
  }

  //FORMS----------------------------------------------------------

  //----------------------FOR EMPLOYEE USE
  //ADD PREFERRED FORM----------------------------------------------------------

  initAddPreferredForm() {
    //1. INITIALIZE PREFERRED FORM
    this.addPreferredForm = new FormGroup({
      rankControl: new FormControl(null, Validators.required),
    });

    //2. EXPOSE PREFERRED DATA IF ANY FOR DISPLAY AND PLUG IN
    //   EXISTING VALUES FOR FORM
    if (this.employeeOptions[0] !== null)
      this.addPreferredForm.controls["rankControl"].setValue(
        this.employeeOptions[0].rank
      );
  }

  onAddPreferred() {
    if (this.addPreferredForm.invalid) return;

    const preferred: PreferredData = {
      shift: this.calendarItem[0].id,
      rank: this.addPreferredForm.value.rankControl,
    };

    if (this.employeeOptions[0]) {
      this.preferredService
        .updateMyPreferred(this.employeeOptions[0].id, preferred)
        .subscribe(
          () => {
            this.alertService.success(`Successful save preferred`, {
              autoClose: true,
              keepAfterRouteChange: true,
            });

            this.onFormSubmitEmitter(`preferred`);
          },
          (err: HttpErrorResponse) => {
            this.alertService.error(`Preferred shift is a duplicate`, {
              autoClose: true,
              keepAfterRouteChange: true,
            });
          }
        );
    } else {
      this.preferredService.saveMyPreferred(preferred).subscribe(
        () => {
          this.alertService.success(`Successful save preferred`, {
            autoClose: true,
            keepAfterRouteChange: true,
          });

          this.onFormSubmitEmitter(`preferred`);
        },
        (err) => {
          this.alertService.error(`Preferred rank is a duplicate`, {
            autoClose: true,
            keepAfterRouteChange: true,
          });
        }
      );
    }
  }

  //----------------------FOR SCHEDULER USE
  //UPDATE SHIFT FORM----------------------------------------------------------

  initUpdateShiftForm() {
    //1. INITIALIZE SHIFT FORM
    this.updateShiftForm = new FormGroup({
      positionControl: new FormControl(null, Validators.required),
      slotControl: new FormControl(null, Validators.required),
      locationControl: new FormControl(null, Validators.required),
      dayControl: new FormControl(null, Validators.required),
      shiftStartControl: new FormControl(null, Validators.required),
      shiftEndControl: new FormControl(null, Validators.required),
    });

    //2. EXPOSE SHIFT DATA FOR DISPLAY AND PLUG IN
    //   EXISTING VALUES FOR FORM
    this.updateShiftForm.controls["positionControl"].setValue(
      this.calendarItem[0].position
    );
    this.updateShiftForm.controls["slotControl"].setValue(
      this.calendarItem[0].slot
    );
    this.updateShiftForm.controls["locationControl"].setValue(
      this.calendarItem[0].location
    );
    this.updateShiftForm.controls["dayControl"].setValue(
      this.calendarItem[0].day
    );
    this.updateShiftForm.controls["shiftStartControl"].setValue(
      this.calendarItem[0].shiftStart[0]
    );
    this.updateShiftForm.controls["shiftEndControl"].setValue(
      this.calendarItem[0].shiftEnd[0]
    );
  }

  onUpdateShift() {
    if (this.updateShiftForm.invalid) return;

    const shiftData: Shift = {
      position: this.updateShiftForm.value.positionControl,
      slot: this.updateShiftForm.value.slotControl,
      location: this.updateShiftForm.value.locationControl,
      day: this.updateShiftForm.value.dayControl,
      shiftStart: [this.updateShiftForm.value.shiftStartControl, 0],
      shiftEnd: [this.updateShiftForm.value.shiftEndControl, 0],
    };

    this.shiftService.updateShift(this.calendarItemId, shiftData).subscribe(
      () => {
        this.alertService.success(`Successful update shift`, {
          autoClose: true,
          keepAfterRouteChange: true,
        });

        this.onFormSubmitEmitter(`shift`);
      },
      (err) => {
        this.alertService.error(`Cannot update shift, something went wrong`, {
          autoClose: true,
          keepAfterRouteChange: true,
        });
      }
    );
  }

  //----------------------FOR SCHEDULER USE
  //CREATE SCHEDULED FORM----------------------------------------------------------

  getEmployees() {
    this.employeeSub = this.employeeService
      .getAllEmployees()
      .subscribe((employees: Employee[]) => (this.employees = employees));
  }

  initCreateScheduledForm() {
    //1. INITIALIZE SCHEDULED FORM
    this.createScheduledForm = new FormGroup({
      employeeControl: new FormControl(null, Validators.required),
    });

    //2. EXPOSE SCHEDULED DATA IF ANY FOR DISPLAY AND PLUG IN
    //   EXISTING VALUES FOR FORM
    if (this.calendarItem[1] !== null)
      this.createScheduledForm.controls["employeeControl"].setValue(
        this.calendarItem[1].employee.id
      );
  }

  onCreateScheduled() {
    if (this.createScheduledForm.invalid) return;

    const parsedDate = this.calendarItemDay.startOf("d").toISOString();

    const scheduledData: ScheduledData = {
      shift: this.calendarItemId,
      employee: this.createScheduledForm.value.employeeControl,
      date: parsedDate,
    };

    this.scheduledService.createScheduled(scheduledData).subscribe(
      () => {
        this.alertService.success(`Successful create scheduled`, {
          autoClose: true,
          keepAfterRouteChange: true,
        });

        this.onFormSubmitEmitter(`scheduled`);
      },
      (err) => {
        this.alertService.error(
          `Either employee chosen is already scheduled/on vacation or date for scheduled is in the past or this coming week`,
          {
            autoClose: true,
            keepAfterRouteChange: true,
          }
        );
      }
    );
  }

  ngOnDestroy() {
    if (this.employeeSub) this.employeeSub.unsubscribe();
    if (this.calendarItemSub) this.calendarItemSub.unsubscribe();
    if (this.employeeOptionsSub) this.employeeOptionsSub.unsubscribe();
  }
}
