import { Module } from "@nestjs/common";
import { VideoTranscriptsController } from "./video-transcripts.controller";
import { VideoTranscriptsService } from "./video-transcripts.service";

@Module({controllers:[VideoTranscriptsController],providers:[VideoTranscriptsService]})
export class VideoTranscriptsModule {}
