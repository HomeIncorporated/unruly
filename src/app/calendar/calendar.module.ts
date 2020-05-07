import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";

import { CalendarComponent } from "./calendar.component";
import { CalendarRoutingModule } from "./calendar-routing.module";
import { DayComponent } from "./day/day.component";
import { MonthComponent } from "./month/month.component";
import { WeekComponent } from "./week/week.component";

@NgModule({
  declarations: [
    CalendarComponent,
    DayComponent,
    MonthComponent,
    WeekComponent,
  ],
  imports: [CalendarRoutingModule, RouterModule, CommonModule],
})
export class CalendarModule {}