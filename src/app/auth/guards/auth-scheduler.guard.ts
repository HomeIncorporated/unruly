import { Injectable } from "@angular/core";
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  Router,
} from "@angular/router";
import { Observable } from "rxjs";

import { AuthService } from "../auth.service";

@Injectable({
  providedIn: "root",
})
export class AuthSchedulerGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ):
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree>
    | boolean
    | UrlTree {
    const schedulerIsAuth = this.authService.getSchedulerIsAuth();

    if (!schedulerIsAuth) {
      this.router.navigate(["/"]);
      return false;
    } else if (schedulerIsAuth) {
      return true;
    }
  }
}
