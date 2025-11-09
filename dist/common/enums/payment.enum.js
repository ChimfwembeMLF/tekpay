"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PricingPlan = exports.Currency = exports.MNOProvider = exports.TransactionType = exports.PaymentStatus = void 0;
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["CREATED"] = "created";
    PaymentStatus["INITIATED"] = "initiated";
    PaymentStatus["PENDING"] = "pending";
    PaymentStatus["COMPLETED"] = "completed";
    PaymentStatus["SETTLED"] = "settled";
    PaymentStatus["FAILED"] = "failed";
    PaymentStatus["REFUNDED"] = "refunded";
    PaymentStatus["EXPIRED"] = "expired";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var TransactionType;
(function (TransactionType) {
    TransactionType["PAYMENT"] = "payment";
    TransactionType["REFUND"] = "refund";
    TransactionType["FEE"] = "fee";
    TransactionType["SETTLEMENT"] = "settlement";
})(TransactionType || (exports.TransactionType = TransactionType = {}));
var MNOProvider;
(function (MNOProvider) {
    MNOProvider["MTN"] = "MTN";
    MNOProvider["AIRTEL"] = "AIRTEL";
})(MNOProvider || (exports.MNOProvider = MNOProvider = {}));
var Currency;
(function (Currency) {
    Currency["ZMW"] = "ZMW";
})(Currency || (exports.Currency = Currency = {}));
var PricingPlan;
(function (PricingPlan) {
    PricingPlan["BASIC"] = "basic";
    PricingPlan["STANDARD"] = "standard";
    PricingPlan["PREMIUM"] = "premium";
    PricingPlan["ENTERPRISE"] = "enterprise";
})(PricingPlan || (exports.PricingPlan = PricingPlan = {}));
//# sourceMappingURL=payment.enum.js.map