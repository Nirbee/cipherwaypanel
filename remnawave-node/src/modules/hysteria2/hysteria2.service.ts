import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Заглушка под будущую интеграцию Hysteria 2 (отдельный процесс / sing-box).
 * При HYSTERIA2_ENABLED=true пока только логируем — бинарь не запускается.
 */
@Injectable()
export class Hysteria2Service implements OnModuleInit {
    private readonly logger = new Logger(Hysteria2Service.name);

    constructor(private readonly configService: ConfigService) {}

    onModuleInit(): void {
        const enabled = this.configService.getOrThrow<boolean>('HYSTERIA2_ENABLED');

        if (enabled) {
            this.logger.log(
                'HYSTERIA2_ENABLED is true — integration stub loaded (no hysteria2 process yet).',
            );
        }
    }

    isEnabled(): boolean {
        return this.configService.getOrThrow<boolean>('HYSTERIA2_ENABLED');
    }
}
