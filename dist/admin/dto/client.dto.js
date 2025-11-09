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
exports.ClientAnalyticsDto = exports.ClientResponseDto = exports.ClientStatusDto = exports.UpdateClientDto = exports.CreateClientDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const payment_enum_1 = require("../../common/enums/payment.enum");
class CreateClientDto {
    constructor() {
        this.pricingPlan = payment_enum_1.PricingPlan.STANDARD;
        this.isActive = true;
    }
}
exports.CreateClientDto = CreateClientDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Client/Company name',
        example: 'Acme E-commerce Ltd',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CreateClientDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Client email address',
        example: 'admin@acme-ecommerce.com',
    }),
    (0, class_validator_1.IsEmail)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateClientDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Client description/business details',
        example: 'E-commerce platform specializing in electronics and gadgets',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MinLength)(10),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], CreateClientDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Webhook URL for payment notifications',
        example: 'https://api.acme-ecommerce.com/webhooks/tekpay',
    }),
    (0, class_validator_1.IsUrl)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateClientDto.prototype, "webhookUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Pricing plan for the client',
        enum: payment_enum_1.PricingPlan,
        default: payment_enum_1.PricingPlan.STANDARD,
    }),
    (0, class_validator_1.IsEnum)(payment_enum_1.PricingPlan),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateClientDto.prototype, "pricingPlan", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Whether the client is active',
        default: true,
    }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateClientDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Additional contact information',
        example: '+260971234567',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], CreateClientDto.prototype, "contactInfo", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Client business address',
        example: 'Plot 123, Independence Avenue, Lusaka, Zambia',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], CreateClientDto.prototype, "address", void 0);
class UpdateClientDto {
}
exports.UpdateClientDto = UpdateClientDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Client/Company name',
        example: 'Acme E-commerce Ltd',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], UpdateClientDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Client email address',
        example: 'admin@acme-ecommerce.com',
    }),
    (0, class_validator_1.IsEmail)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateClientDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Client description/business details',
        example: 'E-commerce platform specializing in electronics and gadgets',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MinLength)(10),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], UpdateClientDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Webhook URL for payment notifications',
        example: 'https://api.acme-ecommerce.com/webhooks/tekpay',
    }),
    (0, class_validator_1.IsUrl)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateClientDto.prototype, "webhookUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Pricing plan for the client',
        enum: payment_enum_1.PricingPlan,
    }),
    (0, class_validator_1.IsEnum)(payment_enum_1.PricingPlan),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateClientDto.prototype, "pricingPlan", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Additional contact information',
        example: '+260971234567',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], UpdateClientDto.prototype, "contactInfo", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Client business address',
        example: 'Plot 123, Independence Avenue, Lusaka, Zambia',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], UpdateClientDto.prototype, "address", void 0);
class ClientStatusDto {
}
exports.ClientStatusDto = ClientStatusDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Whether the client should be active or inactive',
        example: true,
    }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Boolean)
], ClientStatusDto.prototype, "isActive", void 0);
class ClientResponseDto {
}
exports.ClientResponseDto = ClientResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Client unique identifier' }),
    __metadata("design:type", String)
], ClientResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Client name' }),
    __metadata("design:type", String)
], ClientResponseDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Client email' }),
    __metadata("design:type", String)
], ClientResponseDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Client description' }),
    __metadata("design:type", String)
], ClientResponseDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Webhook URL' }),
    __metadata("design:type", String)
], ClientResponseDto.prototype, "webhookUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'API key (masked)' }),
    __metadata("design:type", String)
], ClientResponseDto.prototype, "apiKey", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Pricing plan', enum: payment_enum_1.PricingPlan }),
    __metadata("design:type", String)
], ClientResponseDto.prototype, "pricingPlan", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Whether client is active' }),
    __metadata("design:type", Boolean)
], ClientResponseDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Contact information' }),
    __metadata("design:type", String)
], ClientResponseDto.prototype, "contactInfo", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Business address' }),
    __metadata("design:type", String)
], ClientResponseDto.prototype, "address", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Creation date' }),
    __metadata("design:type", Date)
], ClientResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Last update date' }),
    __metadata("design:type", Date)
], ClientResponseDto.prototype, "updatedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Last activity date' }),
    __metadata("design:type", Date)
], ClientResponseDto.prototype, "lastActivityAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total payments count' }),
    __metadata("design:type", Number)
], ClientResponseDto.prototype, "totalPayments", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total volume processed' }),
    __metadata("design:type", Number)
], ClientResponseDto.prototype, "totalVolume", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Success rate percentage' }),
    __metadata("design:type", Number)
], ClientResponseDto.prototype, "successRate", void 0);
class ClientAnalyticsDto {
}
exports.ClientAnalyticsDto = ClientAnalyticsDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Client information' }),
    __metadata("design:type", ClientResponseDto)
], ClientAnalyticsDto.prototype, "client", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Payment statistics' }),
    __metadata("design:type", Object)
], ClientAnalyticsDto.prototype, "paymentStats", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Volume statistics' }),
    __metadata("design:type", Object)
], ClientAnalyticsDto.prototype, "volumeStats", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'MNO distribution' }),
    __metadata("design:type", Object)
], ClientAnalyticsDto.prototype, "mnoDistribution", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Daily trends' }),
    __metadata("design:type", Array)
], ClientAnalyticsDto.prototype, "dailyTrends", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Usage billing information' }),
    __metadata("design:type", Object)
], ClientAnalyticsDto.prototype, "billing", void 0);
//# sourceMappingURL=client.dto.js.map