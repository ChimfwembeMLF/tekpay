"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminUser = exports.AdminRole = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/entities/base.entity");
var AdminRole;
(function (AdminRole) {
    AdminRole["ADMIN"] = "admin";
    AdminRole["MANAGER"] = "manager";
    AdminRole["VIEWER"] = "viewer";
})(AdminRole || (exports.AdminRole = AdminRole = {}));
let AdminUser = class AdminUser extends base_entity_1.BaseEntity {
    get fullName() {
        return `${this.firstName} ${this.lastName}`;
    }
    get isAdmin() {
        return this.role === AdminRole.ADMIN;
    }
    get isManager() {
        return this.role === AdminRole.MANAGER || this.isAdmin;
    }
    get isViewer() {
        return this.role === AdminRole.VIEWER || this.isManager;
    }
    canManageClients() {
        return this.isManager;
    }
    canManageSystem() {
        return this.isAdmin;
    }
    canViewAnalytics() {
        return this.isViewer;
    }
    canManageUsers() {
        return this.isAdmin;
    }
};
exports.AdminUser = AdminUser;
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], AdminUser.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], AdminUser.prototype, "firstName", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], AdminUser.prototype, "lastName", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], AdminUser.prototype, "passwordHash", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: AdminRole,
        default: AdminRole.VIEWER,
    }),
    __metadata("design:type", String)
], AdminUser.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], AdminUser.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], AdminUser.prototype, "lastLoginAt", void 0);
exports.AdminUser = AdminUser = __decorate([
    (0, typeorm_1.Entity)('admin_users')
], AdminUser);
//# sourceMappingURL=admin-user.entity.js.map