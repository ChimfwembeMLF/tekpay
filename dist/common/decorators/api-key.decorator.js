"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiKey = void 0;
const common_1 = require("@nestjs/common");
exports.ApiKey = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    return request.apiKey;
});
//# sourceMappingURL=api-key.decorator.js.map