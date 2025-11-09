import { Job } from 'bull';
import { PaymentsService } from '@/payments/payments.service';
import { HttpService } from '@nestjs/axios';
export declare class PaymentProcessor {
    private readonly paymentsService;
    private readonly httpService;
    private readonly logger;
    constructor(paymentsService: PaymentsService, httpService: HttpService);
    handlePaymentInitiation(job: Job): Promise<void>;
    handleRefundProcessing(job: Job): Promise<void>;
    handleCallbackNotification(job: Job): Promise<void>;
}
