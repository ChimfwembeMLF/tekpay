import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth(): any {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'TekPay Gateway',
      version: '1.0.0',
    };
  }

  getVersion(): any {
    return {
      version: '1.0.0',
      name: 'TekPay Gateway',
      description: 'Mobile Money Payment Gateway for MTN & Airtel (Zambia)',
      author: 'Tekrem Innovation Solutions',
    };
  }
}