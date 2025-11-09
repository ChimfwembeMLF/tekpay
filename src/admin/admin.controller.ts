import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  ParseIntPipe,
  ParseFloatPipe,
  ParseBoolPipe,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { PaymentStatus, MNOProvider } from '@/common/enums/payment.enum';
import { CreateClientDto, UpdateClientDto, ClientStatusDto } from './dto/client.dto';
import {
  ViewerOrAbove,
  ManagerOrAbove,
  AdminOnly,
  CanManageClients,
  CanViewAnalytics,
  CanManageSystem,
} from '@/common/decorators/admin.decorators';

@ApiTags('Admin')
@Controller('admin')
@ViewerOrAbove() // All admin endpoints require at least Viewer role
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @CanViewAnalytics()
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @ApiResponse({ status: 200, description: 'Dashboard statistics retrieved' })
  async getDashboard(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const filters: any = {};

    if (dateFrom) filters.dateFrom = new Date(dateFrom);
    if (dateTo) filters.dateTo = new Date(dateTo);

    return await this.adminService.getDashboardStats(
      filters.dateFrom,
      filters.dateTo,
    );
  }

  @Get('trends')
  @CanViewAnalytics()
  @ApiOperation({ summary: 'Get payment trends' })
  @ApiQuery({ name: 'days', required: false, type: 'number' })
  @ApiResponse({ status: 200, description: 'Payment trends retrieved' })
  async getTrends(@Query('days', ParseIntPipe) days?: number) {
    return await this.adminService.getPaymentTrends(days || 30);
  }

  @Get('top-consumers')
  @CanViewAnalytics() // Changed from CanReadClients
  @ApiOperation({ summary: 'Get top consumers by volume' })
  @ApiQuery({ name: 'limit', required: false, type: 'number' })
  @ApiResponse({ status: 200, description: 'Top consumers retrieved' })
  async getTopConsumers(@Query('limit', ParseIntPipe) limit?: number) {
    return await this.adminService.getTopConsumers(limit || 10);
  }

  @Get('payments/search')
  @CanViewAnalytics() // Changed from CanReadPayments
  @ApiOperation({ summary: 'Search payments with filters' })
  @ApiQuery({ name: 'status', enum: PaymentStatus, required: false })
  @ApiQuery({ name: 'mno', enum: MNOProvider, required: false })
  @ApiQuery({ name: 'consumerId', required: false })
  @ApiQuery({ name: 'phoneNumber', required: false })
  @ApiQuery({ name: 'amountMin', type: 'number', required: false })
  @ApiQuery({ name: 'amountMax', type: 'number', required: false })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @ApiQuery({ name: 'limit', type: 'number', required: false })
  @ApiQuery({ name: 'offset', type: 'number', required: false })
  @ApiResponse({ status: 200, description: 'Payments retrieved' })
  async searchPayments(
    @Query('status') status?: PaymentStatus,
    @Query('mno') mno?: MNOProvider,
    @Query('consumerId', ParseUUIDPipe) consumerId?: string,
    @Query('phoneNumber') phoneNumber?: string,
    @Query('amountMin', ParseFloatPipe) amountMin?: number,
    @Query('amountMax', ParseFloatPipe) amountMax?: number,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('limit', ParseIntPipe) limit?: number,
    @Query('offset', ParseIntPipe) offset?: number,
  ) {
    const filters: any = {};

    if (status) filters.status = status;
    if (mno) filters.mno = mno;
    if (consumerId) filters.consumerId = consumerId;
    if (phoneNumber) filters.phoneNumber = phoneNumber;
    if (amountMin) filters.amountMin = amountMin;
    if (amountMax) filters.amountMax = amountMax;
    if (dateFrom) filters.dateFrom = new Date(dateFrom);
    if (dateTo) filters.dateTo = new Date(dateTo);
    if (limit) filters.limit = limit;
    if (offset) filters.offset = offset;

    return await this.adminService.searchPayments(filters);
  }

  // ==================== CLIENT MANAGEMENT ====================

  @Get('clients')
  @ApiOperation({ summary: 'Get all API clients with pagination' })
  @ApiQuery({ name: 'page', required: false, type: 'number' })
  @ApiQuery({ name: 'limit', required: false, type: 'number' })
  @ApiQuery({ name: 'search', required: false, type: 'string' })
  @ApiQuery({ name: 'status', required: false, type: 'boolean' })
  @ApiResponse({ status: 200, description: 'Clients retrieved successfully' })
  async getClients(
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 20,
    @Query('search') search?: string,
    @Query('status', ParseBoolPipe) status?: boolean,
  ) {
    return await this.adminService.getClients({ page, limit, search, status });
  }

  @Get('clients/:id')
  @ApiOperation({ summary: 'Get client details by ID' })
  @ApiParam({ name: 'id', description: 'Client UUID' })
  @ApiResponse({ status: 200, description: 'Client details retrieved' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async getClientById(@Param('id', ParseUUIDPipe) id: string) {
    return await this.adminService.getClientById(id);
  }

  @Post('clients')
  @ApiOperation({ summary: 'Create a new API client' })
  @ApiBody({ type: CreateClientDto })
  @ApiResponse({ status: 201, description: 'Client created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @HttpCode(HttpStatus.CREATED)
  async createClient(@Body() createClientDto: CreateClientDto) {
    return await this.adminService.createClient(createClientDto);
  }

  @Put('clients/:id')
  @ApiOperation({ summary: 'Update client information' })
  @ApiParam({ name: 'id', description: 'Client UUID' })
  @ApiBody({ type: UpdateClientDto })
  @ApiResponse({ status: 200, description: 'Client updated successfully' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async updateClient(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateClientDto: UpdateClientDto,
  ) {
    return await this.adminService.updateClient(id, updateClientDto);
  }

  @Put('clients/:id/status')
  @ApiOperation({ summary: 'Update client status (activate/deactivate)' })
  @ApiParam({ name: 'id', description: 'Client UUID' })
  @ApiBody({ type: ClientStatusDto })
  @ApiResponse({ status: 200, description: 'Client status updated' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async updateClientStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() statusDto: ClientStatusDto,
  ) {
    return await this.adminService.updateClientStatus(id, statusDto.isActive);
  }

  @Delete('clients/:id')
  @ApiOperation({ summary: 'Delete a client (soft delete)' })
  @ApiParam({ name: 'id', description: 'Client UUID' })
  @ApiResponse({ status: 200, description: 'Client deleted successfully' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async deleteClient(@Param('id', ParseUUIDPipe) id: string) {
    return await this.adminService.deleteClient(id);
  }

  @Post('clients/:id/regenerate-api-key')
  @ApiOperation({ summary: 'Regenerate API key for a client' })
  @ApiParam({ name: 'id', description: 'Client UUID' })
  @ApiResponse({ status: 200, description: 'API key regenerated successfully' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async regenerateApiKey(@Param('id', ParseUUIDPipe) id: string) {
    return await this.adminService.regenerateApiKey(id);
  }

  // ==================== CLIENT ANALYTICS ====================

  @Get('clients/:id/analytics')
  @ApiOperation({ summary: 'Get detailed analytics for a specific client' })
  @ApiParam({ name: 'id', description: 'Client UUID' })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @ApiResponse({ status: 200, description: 'Client analytics retrieved' })
  async getClientAnalytics(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const filters: any = { clientId: id };
    if (dateFrom) filters.dateFrom = new Date(dateFrom);
    if (dateTo) filters.dateTo = new Date(dateTo);

    return await this.adminService.getClientAnalytics(filters);
  }

  @Get('clients/:id/usage')
  @ApiOperation({ summary: 'Get usage statistics for a client' })
  @ApiParam({ name: 'id', description: 'Client UUID' })
  @ApiQuery({ name: 'month', required: false, description: 'Month in YYYY-MM format' })
  @ApiResponse({ status: 200, description: 'Client usage statistics retrieved' })
  async getClientUsage(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('month') month?: string,
  ) {
    return await this.adminService.getClientUsage(id, month);
  }

  @Get('clients/:id/payments')
  @ApiOperation({ summary: 'Get payments for a specific client' })
  @ApiParam({ name: 'id', description: 'Client UUID' })
  @ApiQuery({ name: 'page', required: false, type: 'number' })
  @ApiQuery({ name: 'limit', required: false, type: 'number' })
  @ApiQuery({ name: 'status', enum: PaymentStatus, required: false })
  @ApiResponse({ status: 200, description: 'Client payments retrieved' })
  async getClientPayments(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 20,
    @Query('status') status?: PaymentStatus,
  ) {
    return await this.adminService.getClientPayments(id, { page, limit, status });
  }

  // ==================== SYSTEM MONITORING ====================

  @Get('system/health')
  @ApiOperation({ summary: 'Get system health status' })
  @ApiResponse({ status: 200, description: 'System health status' })
  async getSystemHealth() {
    return await this.adminService.getSystemHealth();
  }

  @Get('system/metrics')
  @ApiOperation({ summary: 'Get system performance metrics' })
  @ApiQuery({ name: 'hours', required: false, type: 'number' })
  @ApiResponse({ status: 200, description: 'System metrics retrieved' })
  async getSystemMetrics(@Query('hours', ParseIntPipe) hours: number = 24) {
    return await this.adminService.getSystemMetrics(hours);
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Get system alerts and notifications' })
  @ApiQuery({ name: 'severity', required: false, enum: ['low', 'medium', 'high', 'critical'] })
  @ApiQuery({ name: 'limit', required: false, type: 'number' })
  @ApiResponse({ status: 200, description: 'System alerts retrieved' })
  async getAlerts(
    @Query('severity') severity?: string,
    @Query('limit', ParseIntPipe) limit: number = 50,
  ) {
    return await this.adminService.getAlerts({ severity, limit });
  }
}