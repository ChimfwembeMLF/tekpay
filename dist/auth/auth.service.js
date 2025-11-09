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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const jwt_1 = require("@nestjs/jwt");
const uuid_1 = require("uuid");
const api_consumer_entity_1 = require("./entities/api-consumer.entity");
let AuthService = class AuthService {
    constructor(apiConsumerRepository, jwtService) {
        this.apiConsumerRepository = apiConsumerRepository;
        this.jwtService = jwtService;
    }
    async createConsumer(createConsumerDto) {
        const apiKey = `tek_${(0, uuid_1.v4)().replace(/-/g, '')}`;
        const consumer = this.apiConsumerRepository.create({
            ...createConsumerDto,
            apiKey,
        });
        return await this.apiConsumerRepository.save(consumer);
    }
    async login(loginDto) {
        const { email, apiKey } = loginDto;
        const consumer = await this.apiConsumerRepository.findOne({
            where: { email, apiKey, isActive: true },
        });
        if (!consumer) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const payload = { sub: consumer.id, email: consumer.email };
        const access_token = this.jwtService.sign(payload);
        return {
            access_token,
            consumer,
        };
    }
    async findById(id) {
        return await this.apiConsumerRepository.findOne({
            where: { id, isActive: true },
        });
    }
    async findByApiKey(apiKey) {
        return await this.apiConsumerRepository.findOne({
            where: { apiKey, isActive: true },
        });
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(api_consumer_entity_1.ApiConsumer)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map