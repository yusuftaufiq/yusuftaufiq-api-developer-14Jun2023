import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
  UploadedFile,
  ParseFilePipe,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { ResumesService } from './resumes.service';
import { CreateResumeDto } from './dto/create-resume.dto';
import { UpdateResumeDto } from './dto/update-resume.dto';
import { ResponseInterceptor } from '../common/response/response.interceptor';
import { AuthGuard } from '../auth/auth.guard';
import { AuthorizedRequest } from '../auth/interface/authorized-request.interface';
import { ResumesGuard } from './resumes.guard';
import { ResumeAction } from './enums/resume-action.enum';
import { CheckResumePolicy } from './decorators/check-resume-policy.decorator';
import { ResolvedResume } from './decorators/resolved-resume.decorator';
import { Resume } from './entities/resumes.entity';
import fileValidators from '../common/constants/file-validators.constant';
import { UploadProfilePicture } from './decorators/upload-profile-picture.decorator';

@UseInterceptors(ResponseInterceptor, ClassSerializerInterceptor)
@Controller({ version: '1', path: 'resumes' })
@UseGuards(AuthGuard, ResumesGuard)
export class ResumesController {
  constructor(private readonly resumesService: ResumesService) {}

  @HttpCode(HttpStatus.CREATED)
  @Post()
  @UploadProfilePicture()
  create(
    @Request() req: AuthorizedRequest,
    @Body() createResumeDto: CreateResumeDto,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: false,
        validators: fileValidators,
      }),
    )
    file: Express.Multer.File | undefined,
  ) {
    return this.resumesService.create({
      ...createResumeDto,
      userId: req.user.sub,
      profilePicture: file?.path ?? null,
    });
  }

  @HttpCode(HttpStatus.OK)
  @Get()
  findAll(@Request() req: AuthorizedRequest) {
    return this.resumesService.findAllByUserId(req.user.sub);
  }

  @HttpCode(HttpStatus.OK)
  @Get(':resumeId')
  @CheckResumePolicy(ResumeAction.Manage)
  findOne(@ResolvedResume() resume: Resume) {
    return resume;
  }

  @HttpCode(HttpStatus.OK)
  @Patch(':resumeId')
  @CheckResumePolicy(ResumeAction.Manage)
  @UploadProfilePicture()
  update(
    @ResolvedResume() resume: Resume,
    @Body() updateResumeDto: UpdateResumeDto,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: false,
        validators: fileValidators,
      }),
    )
    file: Express.Multer.File | undefined,
  ) {
    return this.resumesService.save(
      Object.assign(resume, {
        ...updateResumeDto,
        profilePicture: file?.path ?? null,
      }),
    );
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':resumeId')
  @CheckResumePolicy(ResumeAction.Manage)
  remove(@Param('resumeId') resumeId: string) {
    return this.resumesService.remove(Number(resumeId));
  }
}
