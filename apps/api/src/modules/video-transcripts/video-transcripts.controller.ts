import { Body, Controller, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CreateVideoTranscriptDto } from "./video-transcripts.dto";
import { VideoTranscriptsService } from "./video-transcripts.service";

@ApiTags("video-transcripts")
@ApiBearerAuth()
@Controller("video-transcripts")
export class VideoTranscriptsController {
  constructor(private readonly service:VideoTranscriptsService) {}
  @Post() create(@Body() input:CreateVideoTranscriptDto){return this.service.create(input);}
}
