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
exports.CreateConsumerDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const payment_enum_1 = require("../../common/enums/payment.enum");
class CreateConsumerDto {
}
exports.CreateConsumerDto = CreateConsumerDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Acme Corporation' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateConsumerDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'contact@acme.com' }),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], CreateConsumerDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: payment_enum_1.PricingPlan, default: payment_enum_1.PricingPlan.STANDARD }),
    (0, class_validator_1.IsEnum)(payment_enum_1.PricingPlan),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateConsumerDto.prototype, "pricingPlan", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 10000, default: 10000 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateConsumerDto.prototype, "monthlyQuota", void 0);
//# sourceMappingURL=create-consumer.dto.js.map