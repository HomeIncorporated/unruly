"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
const express_1 = __importDefault(require("express"));
const employeeController = __importStar(require("../../controllers/users/employeeController"));
const employeeAuthController = __importStar(require("../../controllers/auth/employeeAuthController"));
const schedulerAuthController = __importStar(require("../../controllers/auth/employeeAuthController"));
const router = express_1.default.Router();
//ROOT - /employee
//PROTECTED----------------------------------------------------------
//PROTECT ALL ROUTES FOR EMPLOYEE FROM HERE
router.get(`/me`, employeeAuthController.protect, employeeController.getMe, employeeController.getEmployee);
router.patch(`/updateMe`, employeeAuthController.protect, employeeController.updateMe);
router.patch(`/updateMyPassword`, employeeAuthController.protect, employeeAuthController.updatePassword);
//PROTECT ALL ROUTES FOR SCHEDULER FROM HERE
//CREATE ONE
router.post(`/`, schedulerAuthController.protect, employeeController.createEmployee);
//UPDATE ONE AND DELETE ONE
router
    .route(`/:id`)
    .patch(schedulerAuthController.protect, employeeController.updateEmployee)
    .delete(schedulerAuthController.protect, employeeController.deleteEmployee);
//PUBLIC----------------------------------------------------------
//GETTERS
router.get(`/`, employeeController.getAllEmployees);
router.get(`/:id`, employeeController.getEmployee);
//AUTH IN AND OUT
router.post(`/register`, employeeAuthController.register);
router.post(`/login`, employeeAuthController.login);
router.get(`/logout`, employeeAuthController.logout);
//PASSWORD FORGOT AND RESET
router.post(`/forgotPassword`, employeeAuthController.forgotPassword);
router.patch(`/resetPassword/:token`, employeeAuthController.resetPassword);
module.exports = router;
