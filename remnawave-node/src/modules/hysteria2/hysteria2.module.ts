import { Module } from '@nestjs/common';

import { Hysteria2Service } from './hysteria2.service';

@Module({
    providers: [Hysteria2Service],
    exports: [Hysteria2Service],
})
export class Hysteria2Module {}
