import{Module}from"@nestjs/common";
import{AnalyticsController}from"./analytics.controller";
import{AnalyticsService}from"./analytics.service";
import{LibraryCurationService}from"./library-curation.service";
@Module({controllers:[AnalyticsController],providers:[AnalyticsService,LibraryCurationService]})
export class AnalyticsModule{}
