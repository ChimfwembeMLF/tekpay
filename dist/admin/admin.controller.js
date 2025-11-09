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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const admin_service_1 = require("./admin.service");
const payment_enum_1 = require("../common/enums/payment.enum");
const client_dto_1 = require("./dto/client.dto");
const admin_decorators_1 = require("../common/decorators/admin.decorators");
let AdminController = class AdminController {
    constructor(adminService) {
        this.adminService = adminService;
    }
    async getDashboard(dateFrom, dateTo) {
        const filters = {};
        if (dateFrom)
            filters.dateFrom = new Date(dateFrom);
        if (dateTo)
            filters.dateTo = new Date(dateTo);
        return await this.adminService.getDashboardStats(filters.dateFrom, filters.dateTo);
    }
    async getTrends(days) {
        return await this.adminService.getPaymentTrends(days || 30);
    }
    async getTopConsumers(limit) {
        return await this.adminService.getTopConsumers(limit || 10);
    }
    async searchPayments(status, mno, consumerId, phoneNumber, amountMin, amountMax, dateFrom, dateTo, limit, offset) {
        const filters = {};
        if (status)
            filters.status = status;
        if (mno)
            filters.mno = mno;
        if (consumerId)
            filters.consumerId = consumerId;
        if (phoneNumber)
            filters.phoneNumber = phoneNumber;
        if (amountMin)
            filters.amountMin = amountMin;
        if (amountMax)
            filters.amountMax = amountMax;
        if (dateFrom)
            filters.dateFrom = new Date(dateFrom);
        if (dateTo)
            filters.dateTo = new Date(dateTo);
        if (limit)
            filters.limit = limit;
        if (offset)
            filters.offset = offset;
        return await this.adminService.searchPayments(filters);
    }
    async getClients(page = 1, limit = 20, search, status) {
        return await this.adminService.getClients({ page, limit, search, status });
    }
    async getClientById(id) {
        return await this.adminService.getClientById(id);
    }
    async createClient(createClientDto) {
        return await this.adminService.createClient(createClientDto);
    }
    async updateClient(id, updateClientDto) {
        return await this.adminService.updateClient(id, updateClientDto);
    }
    async updateClientStatus(id, statusDto) {
        return await this.adminService.updateClientStatus(id, statusDto.isActive);
    }
    async deleteClient(id) {
        return await this.adminService.deleteClient(id);
    }
    async regenerateApiKey(id) {
        return await this.adminService.regenerateApiKey(id);
    }
    async getClientAnalytics(id, dateFrom, dateTo) {
        const filters = { clientId: id };
        if (dateFrom)
            filters.dateFrom = new Date(dateFrom);
        if (dateTo)
            filters.dateTo = new Date(dateTo);
        return await this.adminService.getClientAnalytics(filters);
    }
    async getClientUsage(id, month) {
        return await this.adminService.getClientUsage(id, month);
    }
    async getClientPayments(id, page = 1, limit = 20, status) {
        return await this.adminService.getClientPayments(id, { page, limit, status });
    }
    async getSystemHealth() {
        return await this.adminService.getSystemHealth();
    }
    async getSystemMetrics(hours = 24) {
        return await this.adminService.getSystemMetrics(hours);
    }
    async getAlerts(severity, limit = 50) {
        return await this.adminService.getAlerts({ severity, limit });
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, admin_decorators_1.CanViewAnalytics)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get dashboard statistics' }),
    (0, swagger_1.ApiQuery)({ name: 'dateFrom', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'dateTo', required: false }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Dashboard statistics retrieved' }),
    __param(0, (0, common_1.Query)('dateFrom')),
    __param(1, (0, common_1.Query)('dateTo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)('trends'),
    (0, admin_decorators_1.CanViewAnalytics)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get payment trends' }),
    (0, swagger_1.ApiQuery)({ name: 'days', required: false, type: 'number' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Payment trends retrieved' }),
    __param(0, (0, common_1.Query)('days', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getTrends", null);
__decorate([
    (0, common_1.Get)('top-consumers'),
    (0, admin_decorators_1.CanViewAnalytics)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get top consumers by volume' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: 'number' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Top consumers retrieved' }),
    __param(0, (0, common_1.Query)('limit', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getTopConsumers", null);
__decorate([
    (0, common_1.Get)('payments/search'),
    (0, admin_decorators_1.CanViewAnalytics)(),
    (0, swagger_1.ApiOperation)({ summary: 'Search payments with filters' }),
    (0, swagger_1.ApiQuery)({ name: 'status', enum: payment_enum_1.PaymentStatus, required: false }),
    (0, swagger_1.ApiQuery)({ name: 'mno', enum: payment_enum_1.MNOProvider, required: false }),
    (0, swagger_1.ApiQuery)({ name: 'consumerId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'phoneNumber', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'amountMin', type: 'number', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'amountMax', type: 'number', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'dateFrom', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'dateTo', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'limit', type: 'number', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'offset', type: 'number', required: false }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Payments retrieved' }),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('mno')),
    __param(2, (0, common_1.Query)('consumerId', common_1.ParseUUIDPipe)),
    __param(3, (0, common_1.Query)('phoneNumber')),
    __param(4, (0, common_1.Query)('amountMin', common_1.ParseFloatPipe)),
    __param(5, (0, common_1.Query)('amountMax', common_1.ParseFloatPipe)),
    __param(6, (0, common_1.Query)('dateFrom')),
    __param(7, (0, common_1.Query)('dateTo')),
    __param(8, (0, common_1.Query)('limit', common_1.ParseIntPipe)),
    __param(9, (0, common_1.Query)('offset', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, Number, Number, String, String, Number, Number]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "searchPayments", null);
__decorate([
    (0, common_1.Get)('clients'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all API clients with pagination' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: 'number' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: 'number' }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false, type: 'string' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, type: 'boolean' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Clients retrieved successfully' }),
    __param(0, (0, common_1.Query)('page', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)('limit', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Query)('search')),
    __param(3, (0, common_1.Query)('status', common_1.ParseBoolPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String, Boolean]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getClients", null);
__decorate([
    (0, common_1.Get)('clients/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get client details by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Client UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Client details retrieved' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Client not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getClientById", null);
__decorate([
    (0, common_1.Post)('clients'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new API client' }),
    (0, swagger_1.ApiBody)({ type: client_dto_1.CreateClientDto }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Client created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid input data' }),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [client_dto_1.CreateClientDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createClient", null);
__decorate([
    (0, common_1.Put)('clients/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update client information' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Client UUID' }),
    (0, swagger_1.ApiBody)({ type: client_dto_1.UpdateClientDto }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Client updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Client not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, client_dto_1.UpdateClientDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateClient", null);
__decorate([
    (0, common_1.Put)('clients/:id/status'),
    (0, swagger_1.ApiOperation)({ summary: 'Update client status (activate/deactivate)' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Client UUID' }),
    (0, swagger_1.ApiBody)({ type: client_dto_1.ClientStatusDto }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Client status updated' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Client not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, client_dto_1.ClientStatusDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateClientStatus", null);
__decorate([
    (0, common_1.Delete)('clients/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a client (soft delete)' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Client UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Client deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Client not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteClient", null);
__decorate([
    (0, common_1.Post)('clients/:id/regenerate-api-key'),
    (0, swagger_1.ApiOperation)({ summary: 'Regenerate API key for a client' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Client UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'API key regenerated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Client not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "regenerateApiKey", null);
__decorate([
    (0, common_1.Get)('clients/:id/analytics'),
    (0, swagger_1.ApiOperation)({ summary: 'Get detailed analytics for a specific client' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Client UUID' }),
    (0, swagger_1.ApiQuery)({ name: 'dateFrom', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'dateTo', required: false }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Client analytics retrieved' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Query)('dateFrom')),
    __param(2, (0, common_1.Query)('dateTo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getClientAnalytics", null);
__decorate([
    (0, common_1.Get)('clients/:id/usage'),
    (0, swagger_1.ApiOperation)({ summary: 'Get usage statistics for a client' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Client UUID' }),
    (0, swagger_1.ApiQuery)({ name: 'month', required: false, description: 'Month in YYYY-MM format' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Client usage statistics retrieved' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Query)('month')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getClientUsage", null);
__decorate([
    (0, common_1.Get)('clients/:id/payments'),
    (0, swagger_1.ApiOperation)({ summary: 'Get payments for a specific client' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Client UUID' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: 'number' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: 'number' }),
    (0, swagger_1.ApiQuery)({ name: 'status', enum: payment_enum_1.PaymentStatus, required: false }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Client payments retrieved' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Query)('page', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Query)('limit', common_1.ParseIntPipe)),
    __param(3, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getClientPayments", null);
__decorate([
    (0, common_1.Get)('system/health'),
    (0, swagger_1.ApiOperation)({ summary: 'Get system health status' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'System health status' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getSystemHealth", null);
__decorate([
    (0, common_1.Get)('system/metrics'),
    (0, swagger_1.ApiOperation)({ summary: 'Get system performance metrics' }),
    (0, swagger_1.ApiQuery)({ name: 'hours', required: false, type: 'number' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'System metrics retrieved' }),
    __param(0, (0, common_1.Query)('hours', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getSystemMetrics", null);
__decorate([
    (0, common_1.Get)('alerts'),
    (0, swagger_1.ApiOperation)({ summary: 'Get system alerts and notifications' }),
    (0, swagger_1.ApiQuery)({ name: 'severity', required: false, enum: ['low', 'medium', 'high', 'critical'] }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: 'number' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'System alerts retrieved' }),
    __param(0, (0, common_1.Query)('severity')),
    __param(1, (0, common_1.Query)('limit', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAlerts", null);
exports.AdminController = AdminController = __decorate([
    (0, swagger_1.ApiTags)('Admin'),
    (0, common_1.Controller)('admin'),
    (0, admin_decorators_1.ViewerOrAbove)(),
    __metadata("design:paramtypes", [admin_service_1.AdminService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map