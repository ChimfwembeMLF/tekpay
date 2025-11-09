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
exports.MnoService = void 0;
const common_1 = require("@nestjs/common");
const payment_enum_1 = require("../common/enums/payment.enum");
const mtn_service_1 = require("./providers/mtn.service");
const airtel_service_1 = require("./providers/airtel.service");
let MnoService = class MnoService {
    constructor(mtnService, airtelService) {
        this.mtnService = mtnService;
        this.airtelService = airtelService;
    }
    async initiatePayment(request) {
        switch (request.mno) {
            case payment_enum_1.MNOProvider.MTN:
                return await this.mtnService.initiatePayment(request);
            case payment_enum_1.MNOProvider.AIRTEL:
                return await this.airtelService.initiatePayment(request);
            default:
                throw new Error(`Unsupported MNO: ${request.mno}`);
        }
    }
    async checkPaymentStatus(reference, mno) {
        switch (mno) {
            case payment_enum_1.MNOProvider.MTN:
                return await this.mtnService.checkPaymentStatus(reference);
            case payment_enum_1.MNOProvider.AIRTEL:
                return await this.airtelService.checkPaymentStatus(reference);
            default:
                throw new Error(`Unsupported MNO: ${mno}`);
        }
    }
    async processRefund(paymentReference, amount, mno) {
        switch (mno) {
            case payment_enum_1.MNOProvider.MTN:
                return await this.mtnService.processRefund(paymentReference, amount);
            case payment_enum_1.MNOProvider.AIRTEL:
                return await this.airtelService.processRefund(paymentReference, amount);
            default:
                throw new Error(`Unsupported MNO: ${mno}`);
        }
    }
};
exports.MnoService = MnoService;
exports.MnoService = MnoService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [mtn_service_1.MtnService,
        airtel_service_1.AirtelService])
], MnoService);
//# sourceMappingURL=mno.service.js.map