import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { PaymentRequest, PaymentResponse } from '../mno.service';
export declare class AirtelService {
    private readonly httpService;
    private readonly configService;
    private readonly logger;
    private readonly baseUrl;
    private readonly clientId;
    private readonly clientSecret;
    constructor(httpService: HttpService, configService: ConfigService);
    initiatePayment(request: PaymentRequest): Promise<PaymentResponse>;
    checkPaymentStatus(reference: string): Promise<any>;
    processRefund(paymentReference: string, amount: number): Promise<any>;
    private getAccessToken;
    private formatPhoneNumber;
    private mapAirtelStatus;
}
