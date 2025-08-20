import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('health')
  health(): { ok: boolean; ts: number } {
    return { ok: true, ts: Date.now() };
  }
}
