import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MnoService } from './mno.service';
import { MtnService } from './providers/mtn.service';
import { AirtelService } from './providers/airtel.service';

@Module({
  imports: [HttpModule],
  providers: [MnoService, MtnService, AirtelService],
  exports: [MnoService],
})
export class MnoModule {}